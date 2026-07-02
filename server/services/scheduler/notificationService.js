// Scheduler - Notification Delivery Service (CommonJS)
const nodemailer = require('nodemailer');
const { schedulerQuery } = require('../../config/schedulerDb');
const { mockNotifications } = require('../../controller/scheduler/mockDb');
const socketUtil = require('../../utils/socket');
const {
  sendLogoutReminderWhatsApp,
  sendLoginReminderWhatsApp,
  sendSchedulerReminderWhatsApp
} = require('../../utils/whatsappUtils');

const replacePlaceholders = (template, variables) => {
  if (!template) {
    return `Hello ${variables.employee_name}, you have a reminder: "${variables.title}" scheduled for ${variables.date} at ${variables.time}.`;
  }
  return template
    .replace(/\{\{employee_name\}\}/g, variables.employee_name || '')
    .replace(/\{\{title\}\}/g, variables.title || '')
    .replace(/\{\{note\}\}/g, variables.note || '')
    .replace(/\{\{date\}\}/g, variables.date || '')
    .replace(/\{\{time\}\}/g, variables.time || '');
};

const isDndActive = (dndStart, dndEnd) => {
  if (!dndStart || !dndEnd) return false;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const nowStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return dndStart <= dndEnd
    ? nowStr >= dndStart && nowStr <= dndEnd
    : nowStr >= dndStart || nowStr <= dndEnd;
};

const sendEmail = async (recipient, message) => {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 465;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const fromEmail = smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[Scheduler Email] SMTP not configured. Skipping email to ${recipient.email}`);
    return { success: true, messageId: `skipped_${Date.now()}` };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });

  const info = await transporter.sendMail({
    from: `"SF Reminder" <${fromEmail}>`,
    to: recipient.email,
    subject: 'Reminder Alert',
    text: message,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="color:#4f46e5">SF Reminder Alert</h2>
      <p>Dear <strong>${recipient.name || 'User'}</strong>,</p>
      <div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:16px;margin:16px 0;border-radius:4px">
        <p style="margin:0;color:#334155">${message}</p>
      </div>
      <p style="color:#64748b;font-size:13px">This is an automated reminder from your SF Scheduler.</p>
    </div>`
  });
  return { success: true, messageId: info.messageId };
};

const sendAdminNotificationAlert = async (reminder, employee, originalMessageBody) => {
  const adminPhone = '917000102121'; // Admin phone number (Abhinav Pandey)
  
  // Format the recipient phone number to compare
  const empPhoneClean = employee.phone_number ? employee.phone_number.replace(/\D/g, '') : '';
  if (empPhoneClean === '7000102121' || empPhoneClean === '917000102121') {
    // If the recipient is already the admin, skip the duplicate alert
    return;
  }

  const isPreReminder = reminder.title && reminder.title.startsWith('[Reminder]');
  const alertType = isPreReminder ? 'Upcoming Alert' : 'Reminder Dispatched';
  
  let dateFormatted = reminder.reminder_date;
  if (reminder.reminder_date instanceof Date) {
    const pad = n => String(n).padStart(2, '0');
    dateFormatted = `${reminder.reminder_date.getFullYear()}-${pad(reminder.reminder_date.getMonth() + 1)}-${pad(reminder.reminder_date.getDate())}`;
  } else if (typeof reminder.reminder_date === 'string') {
    dateFormatted = reminder.reminder_date.split('T')[0];
  }

  const customMessage = `Scheduler Alert [${alertType}]:
Reminder "${reminder.title}" was dispatched to employee ${employee.name} (${employee.phone_number || 'No Phone'}).
Recurrence: ${reminder.repeat_type || 'none'}.`;

  if (global.schedulerUseMockDb) {
    console.log(`[Scheduler Mock Admin Alert] Alert to Admin 7000102121: ${customMessage}`);
    return;
  }

  console.log(`[Scheduler Admin Alert] Dispatching alert to Admin 7000102121 for employee ${employee.name}...`);
  try {
    const result = await sendSchedulerReminderWhatsApp(
      adminPhone,
      'Abhinav Pandey',
      `Scheduler Alert: ${alertType}`,
      dateFormatted,
      reminder.reminder_time,
      customMessage
    );
    if (result && result.error) {
      console.error(`❌ Failed to send WhatsApp alert to admin for employee ${employee.name}:`, result.error);
    } else {
      console.log(`[Scheduler Admin Alert] Admin successfully notified via WhatsApp.`);
    }
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp alert to admin for employee ${employee.name}:`, err.message);
  }
};

const processAndSendNotification = async (reminder, employee) => {
  try {
    const { id: reminderId, title, note, reminder_date, reminder_time, delivery_method, dnd_enabled, dnd_start_time, dnd_end_time, message_template } = reminder;
    const { id: employeeId, name: employeeName, email, phone_number } = employee;

    const dateFormatted = new Date(reminder_date).toLocaleDateString();
    const variables = { employee_name: employeeName, title, note: note || '', date: dateFormatted, time: reminder_time };
    const messageBody = replacePlaceholders(message_template, variables);

    const channels = [];
    switch (delivery_method) {
      case 'email_only':
        channels.push('email');
        break;
      case 'whatsapp_only':
        channels.push('whatsapp');
        break;
      case 'inapp_email':
        channels.push('inapp', 'email');
        break;
      case 'inapp_whatsapp':
        channels.push('inapp', 'whatsapp');
        break;
      case 'whatsapp_email':
        channels.push('whatsapp', 'email');
        break;
      case 'all_channels':
        channels.push('inapp', 'email', 'whatsapp');
        break;
      default:
        channels.push('inapp');
    }

    // Force WhatsApp channel for admin self-reminders with a configured "Trigger Alert Before"
    if (reminder.assignment_type === 'self' && reminder.remind_before && reminder.remind_before !== 'none') {
      if (!channels.includes('whatsapp')) {
        channels.push('whatsapp');
      }
    }

    const dndBlocked = dnd_enabled && isDndActive(dnd_start_time, dnd_end_time);

    if (global.schedulerUseMockDb) {
      for (const channel of channels) {
        const notifId = mockNotifications.length > 0 ? Math.max(...mockNotifications.map(n => n.id)) + 1 : 1;
        const newNotif = {
          id: notifId, reminder_id: reminderId, employee_id: employeeId,
          channel_type: channel, message_body: messageBody,
          delivery_status: dndBlocked ? 'failed' : 'delivered',
          is_read: 0, sent_at: new Date().toISOString(),
          failure_reason: dndBlocked ? `DND active: ${dnd_start_time}-${dnd_end_time}` : null,
          created_at: new Date().toISOString(),
          employee_name: employeeName,
          reminder_title: title
        };
        mockNotifications.push(newNotif);
        if (dndBlocked) console.warn(`[Scheduler] DND blocked: ${employeeName} via ${channel}`);
        else {
          console.log(`[Scheduler Mock] ${channel} Notification for ${employeeName}: ${messageBody}`);
          if (channel === 'inapp') {
            try {
              socketUtil.getIO().emit("new-scheduler-notification", newNotif);
            } catch (sockErr) {
              console.error("❌ Failed to emit mock scheduler notification socket:", sockErr.message);
            }
          }
        }
      }
      try {
        await sendAdminNotificationAlert(reminder, employee, messageBody);
      } catch (err) {
        console.error('[Scheduler Mock] Error sending admin alert:', err.message);
      }
      return true;
    }

    for (const channel of channels) {
      if (dndBlocked) {
        await schedulerQuery(
          `INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status, failure_reason) VALUES (?, ?, ?, ?, 'failed', ?)`,
          [reminderId, employeeId, channel, messageBody, `DND: ${dnd_start_time}-${dnd_end_time}`]
        );
        continue;
      }

      const insertResult = await schedulerQuery(
        `INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status) VALUES (?, ?, ?, ?, 'pending')`,
        [reminderId, employeeId, channel, messageBody]
      );
      const notifLogId = insertResult.insertId;

      let status = 'delivered';
      let failureReason = null;
      try {
        if (channel === 'email') {
          await sendEmail(employee, messageBody);
        } else if (channel === 'whatsapp') {
          const cleanPhone = phone_number ? phone_number.replace(/\D/g, '') : '';
          
          let targetPhone = cleanPhone;
          if (!targetPhone && employeeId === 0) {
            targetPhone = '917000102121'; // Fallback to Admin number
          }
          if (targetPhone && targetPhone.length === 10) {
            targetPhone = '91' + targetPhone;
          }
          
          if (!targetPhone) {
            throw new Error('Employee has no phone number configured.');
          }
          
          const formattedDate = new Date(reminder_date).toLocaleDateString('en-GB'); // DD/MM/YYYY
          
          let result;
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes('logout')) {
            result = await sendLogoutReminderWhatsApp(targetPhone, employeeName, formattedDate);
          } else if (lowerTitle.includes('login')) {
            result = await sendLoginReminderWhatsApp(targetPhone, employeeName, formattedDate);
          } else {
            // Resolve custom message (details parameter {{5}} in sf_work_reminder)
            let customMessage = note || '';
            const defaultTemplate = 'Hello {{employee_name}}, this is a reminder for {{title}} scheduled on {{date}} at {{time}}.';
            if (message_template && message_template.trim() !== defaultTemplate) {
              customMessage = messageBody;
            }
            if (!customMessage || !customMessage.trim()) {
              customMessage = 'Please complete the task as scheduled.';
            }

            result = await sendSchedulerReminderWhatsApp(targetPhone, employeeName, title, formattedDate, reminder_time, customMessage);
          }
          
          if (result && result.error) {
            throw new Error(typeof result.error === 'object' ? JSON.stringify(result.error) : result.error);
          }
        } else {
          console.log(`[Scheduler InApp] → ${employeeName}: ${messageBody}`);
        }
      } catch (err) {
        status = 'failed';
        failureReason = err.message;
      }

      await schedulerQuery(
        `UPDATE scheduler_notifications SET delivery_status = ?, sent_at = CURRENT_TIMESTAMP, failure_reason = ? WHERE id = ?`,
        [status, failureReason, notifLogId]
      );

      if (channel === 'inapp' && status === 'delivered') {
        const notifData = {
          id: notifLogId,
          reminder_id: reminderId,
          employee_id: employeeId,
          channel_type: channel,
          message_body: messageBody,
          delivery_status: status,
          is_read: 0,
          sent_at: new Date().toISOString(),
          failure_reason: failureReason,
          created_at: new Date().toISOString(),
          employee_name: employeeName,
          reminder_title: title
        };
        try {
          socketUtil.getIO().emit("new-scheduler-notification", notifData);
        } catch (sockErr) {
          console.error("❌ Failed to emit scheduler notification socket:", sockErr.message);
        }
      }
    }
    try {
      await sendAdminNotificationAlert(reminder, employee, messageBody);
    } catch (err) {
      console.error('[Scheduler] Error sending admin alert:', err.message);
    }
    return true;
  } catch (error) {
    console.error(`[Scheduler] Notification error for ${employee?.id}:`, error.message);
    return false;
  }
};

module.exports = { processAndSendNotification, replacePlaceholders, isDndActive };
