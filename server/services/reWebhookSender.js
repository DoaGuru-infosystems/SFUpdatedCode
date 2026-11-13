/**
 * reWebhookSender.js
 * Outbound webhook sender service for Revenue Engine (RE) synchronization.
 *
 * Fixed External Contract:
 * Sends project and task status updates to RE whenever:
 * 1. Task status is updated (PATCH /api/employee/task-status/:task_owners_id)
 * 2. Task owner is reassigned (POST /api/employee/reassign-task)
 * 3. Task owner is first assigned (POST /api/employee/assign-task-owner)
 * 4. Project is marked inactive/archived (POST /api/admin/re-project/:project_id/mark-inactive)
 */

const axios = require("axios");
const { db } = require("../config/db");
const { deriveProjectStatus } = require("../utils/projectStatusHelper");
const socketUtil = require("../utils/socket");

/**
 * Sends a full status update for the given project to RE.
 * Fire-and-forget: does NOT throw errors or block callers.
 *
 * @param {number|string} projectId
 * @param {number|string} [updatedByEmployeeId]
 * @returns {Promise<{ success: boolean, payload?: object, error?: string }>}
 */
async function sendStatusUpdateToRE(projectId, updatedByEmployeeId) {
  try {
    if (!projectId) {
      console.warn("[RE Webhook Sender] Missing projectId for outbound status update.");
      return { success: false, error: "Missing projectId" };
    }

    // 1. Look up re_synced_projects for this project_id
    const rspRows = await new Promise((resolve, reject) => {
      const sql = "SELECT re_proforma_id, re_proforma_number, client_name, is_active FROM re_synced_projects WHERE project_id = ?";
      db.query(sql, [projectId], (err, rows) => (err ? reject(err) : resolve(rows)));
    });

    if (!rspRows || rspRows.length === 0) {
      console.log(`[RE Webhook Sender] Project ${projectId} is not an RE-synced project. Skipping outbound sync.`);
      return { success: false, skipped: true };
    }

    const { re_proforma_id, re_proforma_number, client_name, is_active } = rspRows[0];

    // 2. Look up updater employee/admin full_name
    let updatedByName = "System / Automated";
    if (updatedByEmployeeId) {
      // Check admin_users first (admin / gm)
      const adminRows = await new Promise((resolve) => {
        const sql = "SELECT full_name FROM admin_users WHERE id = ?";
        db.query(sql, [updatedByEmployeeId], (err, rows) => resolve(rows || []));
      });

      if (adminRows && adminRows.length > 0 && adminRows[0].full_name) {
        updatedByName = adminRows[0].full_name.trim();
      } else {
        // Fallback to task_users (employees / TLs)
        const userRows = await new Promise((resolve) => {
          const sql = "SELECT full_name FROM task_users WHERE id = ?";
          db.query(sql, [updatedByEmployeeId], (err, rows) => resolve(rows || []));
        });
        if (userRows && userRows.length > 0 && userRows[0].full_name) {
          updatedByName = userRows[0].full_name.trim();
        }
      }
    }

    // 3. Fetch all task_owners rows joined with task_users
    const taskRows = await new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          t.id,
          t.sf_task_id,
          t.category,
          t.re_item_name AS task_name,
          t.description AS task_description,
          t.deadline,
          t.status,
          u.full_name AS assigned_to_name,
          u.designation AS assigned_to_role
        FROM task_owners t
        LEFT JOIN task_users u ON t.employee_id = u.id
        WHERE t.project_id = ?
          AND (t.is_hidden = 0 OR t.is_hidden IS NULL)
        ORDER BY t.id ASC
      `;
      db.query(sql, [projectId], (err, rows) => (err ? reject(err) : resolve(rows)));
    });

    // 4. Compute overall project status using existing Phase 3 logic
    const currentStatus = deriveProjectStatus(taskRows);

    // 5. Construct EXACT contract payload
    const payload = {
      idempotency_key: `${re_proforma_id}-status-${Date.now()}`,
      proforma_id: String(re_proforma_id),
      proforma_number: re_proforma_number || null,
      client_name: client_name || null,
      current_status: currentStatus,
      is_active: Boolean(is_active !== 0 && is_active !== false),
      tasks: taskRows.map((t) => ({
        sf_task_id: t.sf_task_id || t.id,
        task_name: t.task_name || "",
        task_description: t.task_description || "",
        assigned_to_name: t.assigned_to_name ? t.assigned_to_name.trim() : null,
        assigned_to_role: t.assigned_to_role ? t.assigned_to_role.trim() : null,
        deadline: t.deadline
          ? (typeof t.deadline === "string" ? t.deadline.substring(0, 10) : new Date(t.deadline).toISOString().split("T")[0])
          : null,
        status: t.status || "pending",
      })),
      updated_by: updatedByName,
      updated_at: new Date().toISOString(),
    };

    // 3e: Emit live socket event to admin_room so executive dashboard updates live
    try {
      const io = socketUtil.getIO();
      io.to("admin_room").emit("re:task_status_changed", {
        project_id: Number(projectId),
        proforma_id: re_proforma_id,
        current_status: currentStatus,
        is_active: Boolean(is_active !== 0 && is_active !== false),
      });
    } catch (sockErr) {
      console.warn("[RE Webhook Sender] Socket emit warning:", sockErr.message);
    }

    // 6. Check destination URL
    const webhookUrl = process.env.RE_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("[RE Webhook Sender] RE_WEBHOOK_URL not configured in environment. Skipping delivery.");
      return { success: false, skipped: true, payload };
    }

    // 7. Deliver with manual 3-attempt exponential backoff retry
    const maxAttempts = 3;
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        console.log(`[RE Webhook Sender] Sending status update to RE (${attempt}/${maxAttempts}) for project ${projectId}...`);
        const res = await axios.post(webhookUrl, payload, {
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.RE_WEBHOOK_SECRET || "",
          },
          timeout: 5000,
        });

        console.log(`[RE Webhook Sender] ✅ Delivered status update to RE (HTTP ${res.status}) for project ${projectId} (proforma #${re_proforma_id}, status: ${currentStatus})`);
        return { success: true, status: res.status, payload };
      } catch (err) {
        console.error(`[RE Webhook Sender] ⚠️ Delivery attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt - 1) * 500; // 500ms, 1000ms
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error(`[RE Webhook Sender] ❌ Final failure: Unable to deliver status update to RE after ${maxAttempts} attempts for project ${projectId}. Error: ${err.message}`);
          return { success: false, error: err.message, payload };
        }
      }
    }
  } catch (outerErr) {
    console.error("[RE Webhook Sender] Unexpected error:", outerErr.message);
    return { success: false, error: outerErr.message };
  }
}

module.exports = {
  sendStatusUpdateToRE,
};

