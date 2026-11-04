/**
 * reAssignmentWhatsAppService.js
 * Handles automated WhatsApp notifications for all RE project & task assignment lifecycle events:
 * 1. Project arrives from RE to SF -> Notifies MD/GM and Department Team Lead
 * 2. TL assigns Project Owner -> Notifies the assigned Project Owner
 * 3. PO assigns Task Owner -> Notifies the assigned Task Owner (Employee)
 *
 * Designed with dual-mode dispatch:
 * - Primary: Dedicated assignment templates (sf_project_synced_alert, sf_po_assigned_alert, sf_task_assigned_alert)
 * - Fallback: Existing approved template 'sf_work_reminder' if dedicated templates are pending Meta approval.
 */

const axios = require("axios");
const moment = require("moment");
const { db } = require("../config/db");
const { matchesCategoryAndDepartment } = require("../utils/projectStatusHelper");

function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  if (!cleaned) return null;
  if (cleaned.length === 10) return "91" + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned;
  return cleaned;
}

/**
 * Low-level sender to Meta WhatsApp Cloud API
 */
async function sendMetaTemplate({ to, templateName, languageCode = "en", parameters, fallbackData = null }) {
  const phone = formatWhatsAppNumber(to);
  if (!phone) {
    console.warn("[WhatsApp Assignment] Skipping dispatch: invalid or missing phone number:", to);
    return { success: false, reason: "invalid_phone" };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.warn("[WhatsApp Assignment] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID in env.");
    return { success: false, reason: "missing_env" };
  }

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: parameters.map((p) => ({
            type: "text",
            text: String(p || "N/A").substring(0, 1024),
          })),
        },
      ],
    },
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    console.log(`[WhatsApp Assignment] ✅ Sent template '${templateName}' to ${phone}: message_id=${res.data?.messages?.[0]?.id}`);
    return { success: true, data: res.data };
  } catch (err) {
    const errorData = err.response?.data?.error;
    const errorCode = errorData?.code;
    const errorMsg = errorData?.message || err.message;

    console.warn(`[WhatsApp Assignment] ⚠️ Template '${templateName}' dispatch error (code ${errorCode}): ${errorMsg}`);

    // If template does not exist / pending approval, try approved fallback 'sf_work_reminder'
    if (fallbackData && (errorCode === 132001 || errorCode === 100)) {
      console.log(`[WhatsApp Assignment] 🔄 Attempting fallback to approved template 'sf_work_reminder' for ${phone}...`);
      try {
        const fallbackPayload = {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: "sf_work_reminder",
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: String(fallbackData.name || "User").substring(0, 60) },
                  { type: "text", text: String(fallbackData.title || "Project Assignment").substring(0, 60) },
                  { type: "text", text: moment().format("DD-MM-YYYY") },
                  { type: "text", text: moment().format("hh:mm A") },
                  { type: "text", text: String(fallbackData.message || "Please check Smart Factory").substring(0, 1024) },
                ],
              },
            ],
          },
        };

        const fbRes = await axios.post(url, fallbackPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });
        console.log(`[WhatsApp Assignment] ✅ Fallback 'sf_work_reminder' sent successfully to ${phone}`);
        return { success: true, fallback: true, data: fbRes.data };
      } catch (fbErr) {
        console.error(`[WhatsApp Assignment] ❌ Fallback also failed:`, fbErr.response?.data?.error?.message || fbErr.message);
      }
    }

    return { success: false, error: errorData || err.message };
  }
}

/**
 * 1. Project Inbound from RE:
 * Notifies MD/GM and the department Team Lead(s).
 * If a department has no Team Lead assigned (tl_employee_id is NULL),
 * it gracefully skips TL dispatch and sends an extra alert to MD/GM.
 */
async function notifyReProjectSynced({ projectId, clientName, proformaNumber, department }) {
  try {
    const displayProforma = proformaNumber || `SF #${projectId}`;
    const displayClient = clientName || "Client Project";
    const displayDept = department || "All Departments";

    // 1. Fetch MD & GM (admin_users)
    const adminSql = `
      SELECT full_name, admin_number, role, designation 
      FROM admin_users 
      WHERE role IN ('admin', 'gm') AND admin_number IS NOT NULL AND TRIM(admin_number) != ''
    `;

    db.query(adminSql, (aErr, adminRows) => {
      if (aErr) {
        console.error("[WhatsApp Assignment] Error querying admin_users:", aErr.message);
        return;
      }

      // A. Standard Alert: Notify MD & GM of the new RE project arrival
      adminRows.forEach((admin) => {
        const adminName = admin.full_name ? admin.full_name.trim() : "Admin";
        sendMetaTemplate({
          to: admin.admin_number,
          templateName: "sf_project_synced_alert",
          languageCode: "en",
          parameters: [adminName, displayClient, displayProforma, displayDept],
          fallbackData: {
            name: adminName,
            title: `New RE Project: ${displayClient}`,
            message: `A new project for client '${displayClient}' (Proforma: ${displayProforma}) has arrived from Revenue Engine for ${displayDept} department.`,
          },
        }).catch((e) => console.error("[WhatsApp Assignment] Admin alert error:", e.message));
      });

      // 2. Fetch all departments joined with TL (if assigned)
      const deptSql = `
        SELECT 
          d.id, 
          d.name, 
          d.tl_employee_id, 
          u.full_name AS tl_name, 
          u.mobile_number AS tl_phone, 
          u.employment_status
        FROM departments d
        LEFT JOIN task_users u ON d.tl_employee_id = u.id
      `;

      db.query(deptSql, (dErr, allDepts) => {
        if (dErr) {
          console.error("[WhatsApp Assignment] Error querying departments:", dErr.message);
          return;
        }

        // 3. Collect all categories from task_owners for this project
        const tasksCatSql = `
          SELECT DISTINCT category FROM task_owners 
          WHERE project_id = ? AND category IS NOT NULL AND TRIM(category) != ''
        `;

        db.query(tasksCatSql, [projectId], (cErr, catRows) => {
          if (cErr) {
            console.error("[WhatsApp Assignment] Error querying task categories:", cErr.message);
            catRows = [];
          }

          // Determine all involved departments
          const involvedDeptMap = new Map();

          // Check if explicit department matches any dept
          if (department && department.trim()) {
            const matched = allDepts.find((d) => matchesCategoryAndDepartment(department.trim(), d.name));
            if (matched) {
              involvedDeptMap.set(matched.id, matched);
            }
          }

          // Check all task categories
          (catRows || []).forEach((r) => {
            if (r.category) {
              const matched = allDepts.find((d) => matchesCategoryAndDepartment(r.category, d.name));
              if (matched) {
                involvedDeptMap.set(matched.id, matched);
              }
            }
          });

          // If no specific department was mapped but department string was given, try case-insensitive name match
          if (involvedDeptMap.size === 0 && department && department.trim()) {
            const matched = allDepts.find((d) => d.name.toLowerCase() === department.trim().toLowerCase());
            if (matched) {
              involvedDeptMap.set(matched.id, matched);
            }
          }

          // Now process each involved department
          involvedDeptMap.forEach((dept) => {
            const deptName = dept.name;
            const hasActiveTL =
              dept.tl_employee_id &&
              dept.tl_phone &&
              dept.employment_status === "active";

            if (hasActiveTL) {
              // Department HAS an active Team Lead -> send WhatsApp alert to TL
              const tlName = dept.tl_name ? dept.tl_name.trim() : "Team Lead";
              sendMetaTemplate({
                to: dept.tl_phone,
                templateName: "sf_project_synced_alert",
                languageCode: "en",
                parameters: [tlName, displayClient, displayProforma, deptName],
                fallbackData: {
                  name: tlName,
                  title: `New Project in ${deptName}`,
                  message: `Hello ${tlName}, project '${displayClient}' (${displayProforma}) has been assigned to your department. Please assign a Project Owner on Smart Factory.`,
                },
              }).catch((e) => console.error(`[WhatsApp Assignment] TL alert error for ${deptName}:`, e.message));
            } else {
              // NO TEAM LEAD ASSIGNED (or inactive TL)
              console.log(
                `[WhatsApp Assignment] ℹ️ Department '${deptName}' has no active TL assigned (tl_employee_id: ${dept.tl_employee_id}). Skipping TL dispatch gracefully.`
              );

              // Extra Alert to MD/GM as required by Task 2
              adminRows.forEach((admin) => {
                const adminName = admin.full_name ? admin.full_name.trim() : "Admin";
                sendMetaTemplate({
                  to: admin.admin_number,
                  templateName: "sf_missing_tl_alert",
                  languageCode: "en",
                  parameters: [adminName, deptName, displayClient, displayProforma],
                  fallbackData: {
                    name: adminName,
                    title: `⚠️ No TL Assigned: ${deptName}`,
                    message: `⚠️ '${deptName}' department ke liye project '${displayClient}' (${displayProforma}) aaya hai lekin iska koi Team Lead assigned nahi hai. Kripya pehle TL assign karein.`,
                  },
                }).catch((e) => console.error(`[WhatsApp Assignment] Extra No-TL Admin alert error for ${deptName}:`, e.message));
              });
            }
          });
        });
      });
    });
  } catch (err) {
    console.error("[WhatsApp Assignment] notifyReProjectSynced error:", err.message);
  }
}

/**
 * 2. Team Lead assigns Project Owner:
 * Notifies the assigned Project Owner employee.
 */
async function notifyProjectOwnerAssigned({ projectId, employeeId, tlUserId }) {
  try {
    const querySql = `
      SELECT 
        u.full_name AS po_name,
        u.mobile_number AS po_phone,
        COALESCE(rsp.client_name, p.name) AS client_name,
        COALESCE(rsp.re_proforma_number, CONCAT('ID #', rsp.re_proforma_id), CONCAT('SF #', p.id)) AS proforma_display,
        (SELECT full_name FROM task_users WHERE id = ?) AS tl_name
      FROM task_users u
      JOIN projects p ON p.id = ?
      LEFT JOIN re_synced_projects rsp ON p.id = rsp.project_id
      WHERE u.id = ?
    `;

    db.query(querySql, [tlUserId, projectId, employeeId], (err, rows) => {
      if (err) {
        console.error("[WhatsApp Assignment] Error fetching PO assignment details:", err.message);
        return;
      }

      if (rows.length === 0) return;
      const data = rows[0];
      const poName = data.po_name ? data.po_name.trim() : "Employee";
      const clientName = data.client_name || "Client Project";
      const proforma = data.proforma_display;
      const tlName = data.tl_name ? data.tl_name.trim() : "Team Lead";

      sendMetaTemplate({
        to: data.po_phone,
        templateName: "sf_po_assigned_alert",
        languageCode: "en",
        parameters: [poName, clientName, proforma, tlName],
        fallbackData: {
          name: poName,
          title: `Project Owner: ${clientName}`,
          message: `Hello ${poName}, you have been assigned as Project Owner for project '${clientName}' (${proforma}) by ${tlName}. Please log in to Smart Factory and assign Task Owners.`,
        },
      }).catch((e) => console.error("[WhatsApp Assignment] PO alert error:", e.message));
    });
  } catch (err) {
    console.error("[WhatsApp Assignment] notifyProjectOwnerAssigned error:", err.message);
  }
}

/**
 * 3. Project Owner assigns Task Owner:
 * Notifies the assigned Task Owner (Employee).
 */
async function notifyTaskOwnerAssigned({ taskOwnersId, employeeId, poUserId, deadline }) {
  try {
    const querySql = `
      SELECT 
        u.full_name AS employee_name,
        u.mobile_number AS employee_phone,
        t.re_item_name AS task_name,
        COALESCE(rsp.client_name, p.name) AS client_name,
        COALESCE(rsp.re_proforma_number, CONCAT('ID #', rsp.re_proforma_id), CONCAT('SF #', p.id)) AS proforma_display,
        (SELECT full_name FROM task_users WHERE id = ?) AS po_name
      FROM task_owners t
      JOIN task_users u ON u.id = ?
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN re_synced_projects rsp ON p.id = rsp.project_id
      WHERE t.id = ?
    `;

    db.query(querySql, [poUserId, employeeId, taskOwnersId], (err, rows) => {
      if (err) {
        console.error("[WhatsApp Assignment] Error fetching Task assignment details:", err.message);
        return;
      }

      if (rows.length === 0) return;
      const data = rows[0];
      const empName = data.employee_name ? data.employee_name.trim() : "Employee";
      const taskName = data.task_name || "Assigned Task";
      const clientName = data.client_name || "Client Project";
      const proforma = data.proforma_display;
      const deadlineStr = deadline ? moment(deadline).format("DD-MM-YYYY") : "Scheduled as per project";

      sendMetaTemplate({
        to: data.employee_phone,
        templateName: "sf_task_assigned_alert",
        languageCode: "en",
        parameters: [empName, taskName, clientName, proforma, deadlineStr],
        fallbackData: {
          name: empName,
          title: `Task Assigned: ${taskName}`,
          message: `Hello ${empName}, you have been assigned to task '${taskName}' for client '${clientName}' (${proforma}). Target deadline: ${deadlineStr}. Please review in Smart Factory.`,
        },
      }).catch((e) => console.error("[WhatsApp Assignment] Task Owner alert error:", e.message));
    });
  } catch (err) {
    console.error("[WhatsApp Assignment] notifyTaskOwnerAssigned error:", err.message);
  }
}

module.exports = {
  notifyReProjectSynced,
  notifyProjectOwnerAssigned,
  notifyTaskOwnerAssigned,
  sendMetaTemplate,
  formatWhatsAppNumber,
};

