/**
 * reDailyDigestService.js
 * Daily Digest: sends WhatsApp + Email to each employee listing their pending RE tasks.
 * Scheduled daily at 10:00 AM IST via startSchedulerCron() in cronService.js.
 *
 * Rules:
 *  - Only tasks where task_owners.status != 'completed'
 *  - Only from active (non-archived) RE projects (re_synced_projects.is_active = 1)
 *  - Only tasks with an employee_id assigned (skip unassigned tasks)
 *  - Deadline display: show actual deadline if department.strict_deadline_tracking = TRUE;
 *    show "No fixed deadline" if strict_deadline_tracking = FALSE (e.g. SEO)
 *  - Skip employees with zero pending tasks
 */

const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const { db } = require("../config/db");
const { sendMetaTemplate, formatWhatsAppNumber } = require("./reAssignmentWhatsAppService");
const { matchesCategoryAndDepartment, isStrictDepartment } = require("../utils/projectStatusHelper");

// ── SMTP transporter helper ──────────────────────────────────────────────────
function getEmailTransporter() {
  if (process.env.EMAILSENDER && process.env.EMAILPASSWORD) {
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAILSENDER,
          pass: process.env.EMAILPASSWORD,
        },
      }),
      fromEmail: process.env.EMAILSENDER,
    };
  }
  return {
    transporter: nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "doaguru.com",
      port: parseInt(process.env.EMAIL_PORT, 10) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    }),
    fromEmail: process.env.EMAIL_USER || "hr@doaguru.com",
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a deadline for display.
 * If department is non-strict (strict_deadline_tracking = FALSE) → "No fixed deadline"
 * Otherwise → "DD-MM-YYYY"
 */
function formatDeadline(deadlineVal, isStrict) {
  if (!isStrict) return "No fixed deadline";
  if (!deadlineVal) return "No deadline set";
  try {
    return moment(deadlineVal).format("DD-MM-YYYY");
  } catch {
    return String(deadlineVal).substring(0, 10);
  }
}

/**
 * Builds plain-text task list for WhatsApp message body.
 */
function buildWhatsAppBody(employeeName, tasks) {
  const lines = tasks.map((t, i) => {
    const dl = formatDeadline(t.deadline, t.isStrict);
    return `${i + 1}. ${t.task_name} | Client: ${t.client_name} | Deadline: ${dl}`;
  });
  return (
    `Hello ${employeeName},\n\n` +
    `Aapke pending RE tasks (${moment().tz("Asia/Kolkata").format("DD-MM-YYYY")}):\n\n` +
    lines.join("\n") +
    `\n\nKripya jald se jald pura karein.`
  );
}

/**
 * Builds HTML email body for the digest.
 */
function buildEmailHtml(employeeName, tasks) {
  const rows = tasks
    .map((t) => {
      const dl = formatDeadline(t.deadline, t.isStrict);
      const statusBadge =
        t.status === "in_progress"
          ? `<span style="color:#e67e22;font-weight:600;">In Progress</span>`
          : t.status === "review"
          ? `<span style="color:#8e44ad;font-weight:600;">Review</span>`
          : `<span style="color:#c0392b;font-weight:600;">Pending</span>`;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#333;">${t.task_name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#333;">${t.client_name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#555;">${t.category || "-"}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#333;font-weight:500;">${dl}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${statusBadge}</td>
        </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
  <div style="max-width:700px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#2c3e50;color:#fff;padding:20px 24px;">
      <h2 style="margin:0;font-size:18px;">📋 Aapke Pending Tasks — Daily Reminder</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.8;">${moment().tz("Asia/Kolkata").format("dddd, D MMMM YYYY")}</p>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin-top:0;">Hello <strong>${employeeName}</strong>,</p>
      <p>Neeche aapke sabhi pending Revenue Engine tasks ki list hai. Kripya inhe jald se jald complete karein.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
        <thead>
          <tr style="background:#f0f3f7;">
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #ddd;color:#333;">Task</th>
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #ddd;color:#333;">Client</th>
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #ddd;color:#333;">Department</th>
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #ddd;color:#333;">Deadline</th>
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #ddd;color:#333;">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:24px;color:#555;font-size:14px;">Kripya jald se jald pura karein.</p>
    </div>
    <div style="background:#f9f9f9;padding:14px 24px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;">
      Yeh ek automated daily digest hai — Smart Factory RE System.
    </div>
  </div>
</body>
</html>`;
}

// ── Core digest runner ────────────────────────────────────────────────────────

/**
 * Fetches pending tasks, groups by employee, and dispatches WhatsApp + Email.
 * Returns { success: boolean, recipientsCount: number, sent: number, skipped: number, errors: string[], details: array }
 */
async function runDailyDigest() {
  console.log("[RE Daily Digest] Starting daily digest run...");

  // 1. Fetch all departments with strict_deadline_tracking
  const depts = await new Promise((resolve, reject) => {
    db.query(
      "SELECT name, strict_deadline_tracking FROM departments",
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

  // 2. Fetch all pending tasks from active RE projects with employee assigned
  const taskRows = await new Promise((resolve, reject) => {
    const sql = `
      SELECT
        t.id              AS task_owners_id,
        t.employee_id,
        t.re_item_name    AS task_name,
        t.category,
        t.status,
        t.deadline,
        COALESCE(rsp.client_name, p.name) AS client_name,
        u.full_name       AS employee_name,
        u.mobile_number   AS mobile_number,
        u.email_id        AS email_id
      FROM task_owners t
      JOIN re_synced_projects rsp ON t.project_id = rsp.project_id
      JOIN projects p ON p.id = t.project_id
      JOIN task_users u ON u.id = t.employee_id
      WHERE
        t.status        != 'completed'
        AND t.employee_id IS NOT NULL
        AND rsp.is_active  = 1
        AND (t.is_hidden = 0 OR t.is_hidden IS NULL)
      ORDER BY t.employee_id ASC, t.id ASC
    `;
    db.query(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

  if (taskRows.length === 0) {
    console.log("[RE Daily Digest] No pending tasks found. Nothing to send.");
    return {
      success: true,
      recipientsCount: 0,
      sent: 0,
      skipped: 0,
      errors: [],
      details: [],
    };
  }

  // 3. Group by employee_id
  const byEmployee = new Map();
  taskRows.forEach((row) => {
    const empId = row.employee_id;
    if (!byEmployee.has(empId)) {
      byEmployee.set(empId, {
        employee_id: empId,
        employee_name: (row.employee_name || "Employee").trim(),
        mobile_number: row.mobile_number || null,
        email_id: row.email_id || null,
        tasks: [],
      });
    }
    const isStrict = isStrictDepartment({ category: row.category }, depts);
    byEmployee.get(empId).tasks.push({
      task_name: row.task_name || "Task",
      client_name: row.client_name || "Client",
      category: row.category || "",
      status: row.status || "pending",
      deadline: row.deadline || null,
      isStrict,
    });
  });

  let sent = 0;
  let skipped = 0;
  const errors = [];
  const details = [];

  // 4. Send WhatsApp + Email to each employee
  for (const [empId, emp] of byEmployee) {
    if (emp.tasks.length === 0) {
      skipped++;
      continue;
    }

    const empName = emp.employee_name;
    const dateStr = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");
    const taskCount = emp.tasks.length;

    console.log(
      `[RE Daily Digest] Processing digest for ${empName} (id=${empId}) — ${taskCount} pending task(s)`
    );

    const empDetail = {
      employee_id: empId,
      employee_name: empName,
      mobile_number: emp.mobile_number,
      email_id: emp.email_id,
      tasks_count: taskCount,
      tasks: emp.tasks,
      whatsapp: { sent: false, error: null, content: null },
      email: { sent: false, error: null, subject: "Aapke Pending Tasks — Daily Reminder", content: null },
    };

    // ── WhatsApp ──────────────────────────────────────────────────────────
    const waBody = buildWhatsAppBody(empName, emp.tasks);
    const waTruncated = waBody.length > 1000 ? waBody.substring(0, 997) + "..." : waBody;
    empDetail.whatsapp.content = waTruncated;

    if (emp.mobile_number && formatWhatsAppNumber(emp.mobile_number)) {
      try {
        const waResult = await sendMetaTemplate({
          to: emp.mobile_number,
          templateName: "sf_daily_digest",
          languageCode: "en",
          parameters: [empName, String(taskCount), dateStr, waTruncated],
          fallbackData: {
            name: empName,
            title: `Pending Tasks Reminder — ${dateStr}`,
            message: waTruncated,
          },
        });

        if (waResult && waResult.success) {
          empDetail.whatsapp.sent = true;
          empDetail.whatsapp.fallbackUsed = Boolean(waResult.fallback);
          console.log(
            `[RE Daily Digest] ✅ WhatsApp sent to ${empName} (${emp.mobile_number})${waResult.fallback ? ' [via fallback]' : ''}`
          );
        } else {
          const reason = waResult?.reason || waResult?.error?.message || "WhatsApp delivery failed";
          empDetail.whatsapp.error = reason;
          console.warn(`[RE Daily Digest] ⚠️ WhatsApp not delivered to ${empName}: ${reason}`);
        }
      } catch (waErr) {
        const msg = `WhatsApp error for ${empName}: ${waErr.message}`;
        empDetail.whatsapp.error = msg;
        console.error(`[RE Daily Digest] ❌ ${msg}`);
        errors.push(msg);
      }
    } else {
      empDetail.whatsapp.error = "No valid phone number";
      console.warn(
        `[RE Daily Digest] ℹ️ No valid phone for ${empName} (id=${empId}), skipping WhatsApp.`
      );
    }

    // ── Email ─────────────────────────────────────────────────────────────
    const htmlBody = buildEmailHtml(empName, emp.tasks);
    const textBody = buildWhatsAppBody(empName, emp.tasks);
    empDetail.email.content = textBody;

    if (emp.email_id && emp.email_id.includes("@")) {
      try {
        const emailConfig = getEmailTransporter();
        const info = await new Promise((resolve, reject) => {
          emailConfig.transporter.sendMail(
            {
              from: emailConfig.fromEmail,
              to: emp.email_id,
              subject: "Aapke Pending Tasks — Daily Reminder",
              text: textBody,
              html: htmlBody,
            },
            (err, resultInfo) => {
              if (err) return reject(err);
              resolve(resultInfo);
            }
          );
        });

        empDetail.email.sent = true;
        empDetail.email.messageId = info?.messageId || null;
        empDetail.email.response = info?.response || null;
        console.log(
          `[RE Daily Digest] ✅ Email sent to ${empName} <${emp.email_id}> (messageId: ${info?.messageId}, response: ${info?.response})`
        );
      } catch (emailErr) {
        const msg = `Email error for ${empName} <${emp.email_id}>: ${emailErr.message}`;
        empDetail.email.error = msg;
        console.error(`[RE Daily Digest] ❌ ${msg}`);
        errors.push(msg);
      }
    } else {
      empDetail.email.error = "No valid email address";
      console.warn(
        `[RE Daily Digest] ℹ️ No valid email for ${empName} (id=${empId}), skipping Email.`
      );
    }

    if (empDetail.whatsapp.sent || empDetail.email.sent) {
      sent++;
    }

    details.push(empDetail);
  }

  console.log(
    `[RE Daily Digest] Finished. Processed=${byEmployee.size}, deliveredTo=${sent}, skipped=${skipped}, errors=${errors.length}`
  );
  return {
    success: true,
    recipientsCount: byEmployee.size,
    sent,
    skipped,
    errors,
    details,
  };
}

module.exports = {
  runDailyDigest,
  buildWhatsAppBody,
  buildEmailHtml,
  formatDeadline,
  getEmailTransporter,
};
