/**
 * reEscalationService.js
 * Phase F - D-4 Deadline Escalation and Automatic RE Blocked Sync.
 *
 * Runs twice daily (10:00 AM & 6:00 PM IST via cron: 0 10,18 * * *).
 *
 * Rules:
 *  - status != 'completed'
 *  - department strict_deadline_tracking = TRUE (SEO, DM, Sales etc. non-strict departments are skipped)
 *  - deadline is within the next 4 days (deadline <= CURDATE() + 4 days AND deadline >= CURDATE())
 *  - Deduplication: Each task is escalated at most once for a given deadline
 *    (tracked in task_escalation_logs table)
 *  - Dispatches WhatsApp + Email to 5 recipients:
 *    1. Task Owner (task_users)
 *    2. Project Owner (project_owners + task_users)
 *    3. Department Team Lead (departments.tl_employee_id + task_users)
 *    4. MD (admin_users where role = 'admin')
 *    5. GM (admin_users where role = 'gm')
 *  - Checks all active RE projects: if deriveProjectStatus() returns 'blocked',
 *    automatically calls sendStatusUpdateToRE() to push the Blocked status to RE calendar.
 */

const moment = require("moment-timezone");
const { db } = require("../config/db");
const { sendMetaTemplate, formatWhatsAppNumber } = require("./reAssignmentWhatsAppService");
const { isStrictDepartment, deriveProjectStatus, matchesCategoryAndDepartment } = require("../utils/projectStatusHelper");
const { getEmailTransporter } = require("./reDailyDigestService");
const { sendStatusUpdateToRE } = require("./reWebhookSender");

// Helper to run promisified db queries
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// ── Ensure task_escalation_logs table exists ──────────────────────────────────
async function initEscalationTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS task_escalation_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_owners_id INT NOT NULL,
      escalation_type VARCHAR(50) NOT NULL DEFAULT 'd4_deadline',
      task_deadline DATE NOT NULL,
      escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_task_escalation (task_owners_id, escalation_type, task_deadline)
    )
  `;
  await query(sql);
}

// Ensure table is ready on module load
initEscalationTable().catch((err) => {
  console.error("[RE Escalation] Table init error:", err.message);
});

/**
 * Builds email HTML for D-4 Escalation alert
 */
function buildEscalationEmailHtml({ recipientName, recipientRole, taskName, clientName, deadlineStr, daysRemaining }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8f9fa;margin:0;padding:20px;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #e9ecef;">
    <div style="background:#e74c3c;color:#fff;padding:18px 24px;">
      <h2 style="margin:0;font-size:18px;">⚠️ D-4 Deadline Escalation Alert</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Smart Factory Operations Monitoring</p>
    </div>
    <div style="padding:24px;">
      <p style="margin-top:0;">Hello <strong>${recipientName}</strong> (${recipientRole}),</p>
      <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px 16px;margin:16px 0;border-radius:4px;">
        <p style="margin:0;color:#856404;font-size:15px;font-weight:bold;">
          ⚠️ [${taskName}] ki deadline sirf ${daysRemaining} din me hai aur abhi complete nahi hua hai.
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#666;width:120px;"><strong>Task:</strong></td>
          <td style="padding:8px 0;color:#222;">${taskName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;"><strong>Client:</strong></td>
          <td style="padding:8px 0;color:#222;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;"><strong>Target Deadline:</strong></td>
          <td style="padding:8px 0;color:#c0392b;font-weight:bold;">${deadlineStr}</td>
        </tr>
      </table>
      <p style="color:#444;font-size:14px;margin-top:20px;">Kripya jald se jald pura karein taaki project delay na ho.</p>
    </div>
    <div style="background:#f1f3f5;padding:12px 24px;font-size:12px;color:#868e96;text-align:center;">
      Automated Smart Factory Escalation System.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Main function: Runs D-4 Deadline Escalation & RE Blocked Status Synchronization.
 */
async function runDeadlineEscalations() {
  console.log("[RE Escalation] 🚀 Starting D-4 Deadline Escalation & RE Sync run...");
  await initEscalationTable();

  // 1. Fetch all departments for strict_deadline_tracking lookup
  const departments = await query("SELECT id, name, tl_employee_id, strict_deadline_tracking FROM departments");

  // 2. Fetch active RE projects
  const activeProjects = await query(
    "SELECT project_id, re_proforma_id, client_name FROM re_synced_projects WHERE is_active = 1"
  );

  if (activeProjects.length === 0) {
    console.log("[RE Escalation] No active RE projects found.");
    return { escalatedTasksCount: 0, blockedProjectsPushed: 0, details: [] };
  }

  const projectIds = activeProjects.map((p) => p.project_id);

  // 3. Fetch all tasks for active RE projects that are not completed and have a deadline
  const tasksSql = `
    SELECT 
      t.id AS task_owners_id,
      t.project_id,
      t.re_item_name AS task_name,
      t.category,
      t.status,
      t.deadline,
      t.employee_id AS task_owner_id,
      u.full_name AS task_owner_name,
      u.mobile_number AS task_owner_phone,
      u.email_id AS task_owner_email,
      COALESCE(rsp.client_name, p.name) AS client_name,
      DATEDIFF(t.deadline, CURDATE()) AS days_until_deadline
    FROM task_owners t
    JOIN re_synced_projects rsp ON t.project_id = rsp.project_id
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN task_users u ON t.employee_id = u.id
    WHERE t.project_id IN (?)
      AND t.status != 'completed'
      AND t.deadline IS NOT NULL
      AND rsp.is_active = 1
      AND (t.is_hidden = 0 OR t.is_hidden IS NULL)
    ORDER BY t.deadline ASC
  `;

  const allPendingTasks = await query(tasksSql, [projectIds]);

  // 4. Fetch all active Project Owners for these projects
  const poRows = await query(
    `SELECT po.project_id, po.employee_id, u.full_name, u.mobile_number, u.email_id
     FROM project_owners po
     JOIN task_users u ON po.employee_id = u.id
     WHERE po.project_id IN (?) AND po.status = 'active'`,
    [projectIds]
  );
  const poByProject = new Map();
  poRows.forEach((r) => {
    if (!poByProject.has(r.project_id)) poByProject.set(r.project_id, []);
    poByProject.get(r.project_id).push(r);
  });

  // 5. Fetch all MD and GM admins
  const adminUsers = await query(
    `SELECT id, full_name, email_id, admin_number, role
     FROM admin_users
     WHERE role IN ('admin', 'gm')`
  );

  // 6. Fetch existing escalation logs for deduplication
  const existingEscalations = await query(
    "SELECT task_owners_id, task_deadline FROM task_escalation_logs WHERE escalation_type = 'd4_deadline'"
  );
  const escalatedKeySet = new Set(
    existingEscalations.map((e) => `${e.task_owners_id}_${moment(e.task_deadline).format("YYYY-MM-DD")}`)
  );

  // 7. Filter tasks that qualify for D-4 Escalation:
  //    - Strict department only (isStrictDepartment === true)
  //    - days_until_deadline between 0 and 4 (i.e. due in <= 4 days and not yet past/due today)
  //    - Not already escalated for this deadline
  const qualifyingTasks = allPendingTasks.filter((t) => {
    const isStrict = isStrictDepartment({ category: t.category }, departments);
    if (!isStrict) return false; // SEO, DM, Sales etc. skip

    const days = Number(t.days_until_deadline);
    if (isNaN(days) || days < 0 || days > 4) return false;

    const deadlineFormatted = moment(t.deadline).format("YYYY-MM-DD");
    const key = `${t.task_owners_id}_${deadlineFormatted}`;
    if (escalatedKeySet.has(key)) return false; // Duplicate skip

    return true;
  });

  console.log(`[RE Escalation] Found ${qualifyingTasks.length} qualifying task(s) for D-4 escalation.`);

  const emailConfig = getEmailTransporter();
  const escalationDetails = [];

  // 8. Process each qualifying task and notify all 5 roles
  for (const task of qualifyingTasks) {
    const deadlineFormatted = moment(task.deadline).format("YYYY-MM-DD");
    const deadlineDisplay = moment(task.deadline).format("DD-MM-YYYY");
    const daysRemaining = task.days_until_deadline;

    const taskName = task.task_name || "Assigned Task";
    const clientName = task.client_name || "Client Project";

    // Standard notification message
    const alertMessage = `⚠️ [${taskName}] ki deadline sirf ${daysRemaining} din me hai aur abhi complete nahi hua hai. Kripya jald pura karein.`;

    // Identify the 5 recipient roles:
    const recipients = [];

    // Role 1: Task Owner
    if (task.task_owner_id && (task.task_owner_phone || task.task_owner_email)) {
      recipients.push({
        role: "Task Owner",
        name: (task.task_owner_name || "Task Owner").trim(),
        phone: task.task_owner_phone,
        email: task.task_owner_email,
      });
    }

    // Role 2: Project Owner(s)
    const pos = poByProject.get(task.project_id) || [];
    pos.forEach((po) => {
      recipients.push({
        role: "Project Owner",
        name: (po.full_name || "Project Owner").trim(),
        phone: po.mobile_number,
        email: po.email_id,
      });
    });

    // Role 3: Department Team Lead
    let deptTl = null;
    for (const d of departments) {
      if (matchesCategoryAndDepartment(task.category, d.name) && d.tl_employee_id) {
        const tlUserRows = await query(
          "SELECT full_name, mobile_number, email_id FROM task_users WHERE id = ?",
          [d.tl_employee_id]
        );
        if (tlUserRows.length > 0) {
          deptTl = tlUserRows[0];
          break;
        }
      }
    }
    if (deptTl) {
      recipients.push({
        role: "Department TL",
        name: (deptTl.full_name || "Team Lead").trim(),
        phone: deptTl.mobile_number,
        email: deptTl.email_id,
      });
    }

    // Role 4 & 5: MD and GM
    adminUsers.forEach((admin) => {
      const roleLabel = admin.role === "admin" ? "MD (Admin)" : "GM";
      recipients.push({
        role: roleLabel,
        name: (admin.full_name || "Admin").trim(),
        phone: admin.admin_number,
        email: admin.email_id,
      });
    });

    // Deduplicate recipients by phone & email to avoid sending duplicate alerts to a user with multiple roles
    const uniqueRecipients = [];
    const seenIdentifier = new Set();
    recipients.forEach((r) => {
      const idKey = `${r.phone || ""}_${r.email || ""}`;
      if (!seenIdentifier.has(idKey)) {
        seenIdentifier.add(idKey);
        uniqueRecipients.push(r);
      }
    });

    console.log(
      `[RE Escalation] Escalating task #${task.task_owners_id} '${taskName}' to ${uniqueRecipients.length} recipients.`
    );

    const taskLog = {
      task_owners_id: task.task_owners_id,
      task_name: taskName,
      category: task.category,
      deadline: deadlineDisplay,
      days_remaining: daysRemaining,
      recipients_notified: [],
    };

    // Dispatch WhatsApp + Email to each recipient
    for (const rec of uniqueRecipients) {
      const recLog = {
        role: rec.role,
        name: rec.name,
        whatsapp_sent: false,
        email_sent: false,
      };

      // ── WhatsApp dispatch ──────────────────────────────────────────────────
      if (rec.phone && formatWhatsAppNumber(rec.phone)) {
        try {
          const waRes = await sendMetaTemplate({
            to: rec.phone,
            templateName: "sf_work_reminder", // Use approved template
            languageCode: "en_US",
            parameters: [
              rec.name,
              `⚠️ Deadline Alert: ${taskName}`,
              moment().format("DD-MM-YYYY"),
              moment().format("hh:mm A"),
              alertMessage,
            ],
            fallbackData: {
              name: rec.name,
              title: `⚠️ Deadline Alert: ${taskName}`,
              message: alertMessage,
            },
          });
          if (waRes && waRes.success) {
            recLog.whatsapp_sent = true;
          }
        } catch (e) {
          console.warn(`[RE Escalation] WA error for ${rec.name}:`, e.message);
        }
      }

      // ── Email dispatch ─────────────────────────────────────────────────────
      if (rec.email && rec.email.includes("@")) {
        try {
          const html = buildEscalationEmailHtml({
            recipientName: rec.name,
            recipientRole: rec.role,
            taskName,
            clientName,
            deadlineStr: deadlineDisplay,
            daysRemaining,
          });

          await new Promise((resolve, reject) => {
            emailConfig.transporter.sendMail(
              {
                from: emailConfig.fromEmail,
                to: rec.email,
                subject: `⚠️ Deadline Escalation: [${taskName}] — 4 Din Baki Hain`,
                text: alertMessage,
                html,
              },
              (err, info) => (err ? reject(err) : resolve(info))
            );
          });
          recLog.email_sent = true;
        } catch (e) {
          console.warn(`[RE Escalation] Email error for ${rec.name}:`, e.message);
        }
      }

      taskLog.recipients_notified.push(recLog);
    }

    // Log escalation in task_escalation_logs for deduplication
    try {
      await query(
        `INSERT IGNORE INTO task_escalation_logs (task_owners_id, escalation_type, task_deadline)
         VALUES (?, 'd4_deadline', ?)`,
        [task.task_owners_id, deadlineFormatted]
      );
    } catch (insertErr) {
      console.error("[RE Escalation] Log insert error:", insertErr.message);
    }

    escalationDetails.push(taskLog);
  }

  // ── TASK 2: Automatic Sync of "Blocked" Status to RE ─────────────────────────
  console.log("[RE Escalation] Checking active RE projects for automatic Blocked status push...");
  let blockedProjectsPushed = 0;

  for (const proj of activeProjects) {
    try {
      // Fetch all tasks for this project
      const pTasks = await query(
        `SELECT id, category, deadline, status
         FROM task_owners
         WHERE project_id = ? AND (is_hidden = 0 OR is_hidden IS NULL)`,
        [proj.project_id]
      );

      // Compute derived status using Phase D department-aware logic
      const status = deriveProjectStatus(pTasks, departments);

      if (status === "blocked") {
        console.log(
          `[RE Escalation] ⚠️ Project #${proj.project_id} ('${proj.client_name}') is BLOCKED. Pushing status update to RE...`
        );
        const syncRes = await sendStatusUpdateToRE(proj.project_id, null);
        if (syncRes && syncRes.success) {
          blockedProjectsPushed++;
          console.log(`[RE Escalation] ✅ Successfully pushed 'blocked' status to RE for project #${proj.project_id}`);
        } else {
          console.warn(`[RE Escalation] ⚠️ RE push returned:`, syncRes?.error || syncRes?.reason || "unknown");
        }
      }
    } catch (pErr) {
      console.error(`[RE Escalation] Error checking project #${proj.project_id}:`, pErr.message);
    }
  }

  console.log(
    `[RE Escalation] Finished. Escalated tasks: ${qualifyingTasks.length}, Blocked projects pushed to RE: ${blockedProjectsPushed}`
  );

  return {
    success: true,
    escalatedTasksCount: qualifyingTasks.length,
    blockedProjectsPushed,
    details: escalationDetails,
  };
}

module.exports = {
  runDeadlineEscalations,
  buildEscalationEmailHtml,
  initEscalationTable,
};

