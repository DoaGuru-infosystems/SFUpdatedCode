// Scheduler - Cron Service (CommonJS)
const cron = require('node-cron');
const moment = require('moment-timezone');
const { schedulerPool, schedulerQuery } = require('../../config/schedulerDb');
const { processAndSendNotification } = require('./notificationService');
const { mockReminders, mockReminderEmployees, mockSFEmployees } = require('../../controller/scheduler/mockDb');
const { sendSchedulerReminderWhatsApp } = require('../../utils/whatsappUtils');

const getNextRecurrence = (currentDateVal, currentTimeStr, repeatType) => {
  let dateStr = currentDateVal;
  if (currentDateVal instanceof Date) {
    const pad = n => String(n).padStart(2, '0');
    dateStr = `${currentDateVal.getFullYear()}-${pad(currentDateVal.getMonth() + 1)}-${pad(currentDateVal.getDate())}`;
  } else if (typeof currentDateVal === 'string') {
    dateStr = currentDateVal.split('T')[0];
  }
  const current = new Date(`${dateStr}T${currentTimeStr}`);
  if (isNaN(current.getTime())) return null;
  const next = new Date(current.getTime());
  switch (repeatType) {
    case 'hourly': next.setHours(next.getHours() + 1); break;
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'alternate_days': next.setDate(next.getDate() + 2); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'never_ends': next.setDate(next.getDate() + 1); break;
    default: return null;
  }
  const pad = n => String(n).padStart(2, '0');
  return {
    date: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`,
    time: `${pad(next.getHours())}:${pad(next.getMinutes())}:${pad(next.getSeconds())}`
  };
};

const getOffsetMinutes = (remindBefore, customMins) => {
  switch (remindBefore) {
    case '2_minutes': return 2;
    case '10_minutes': return 10;
    case '30_minutes': return 30;
    case '1_hour': return 60;
    case '2_hours': return 120;
    case 'custom': return parseInt(customMins) || 0;
    default: return 0;
  }
};

const calculateTriggerTime = (dateStr, timeStr, offsetMins) => {
  const sched = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(sched.getTime())) return null;
  const trigger = new Date(sched.getTime() - offsetMins * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${trigger.getFullYear()}-${pad(trigger.getMonth() + 1)}-${pad(trigger.getDate())} ${pad(trigger.getHours())}:${pad(trigger.getMinutes())}:${pad(trigger.getSeconds())}`;
};


const processReminders = async () => {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  console.log(`[Scheduler CRON] Checking at ${nowStr}...`);

  try {
    // Fetch pending reminders without locking to prevent DB lock contention/timeouts
    const reminders = await schedulerQuery(
      `SELECT * FROM scheduler_reminders WHERE status = 'pending' AND next_trigger_at <= NOW()`
    );
    
    // Clear the mock override flag since DB is functioning
    global.schedulerUseMockDb = false;

    if (reminders.length === 0) { 
      return; 
    }

    console.log(`[Scheduler CRON] ${reminders.length} reminder(s) to process.`);

    for (const rem of reminders) {
      let dateStr = rem.reminder_date;
      if (rem.reminder_date instanceof Date) {
        const pad = n => String(n).padStart(2, '0');
        dateStr = `${rem.reminder_date.getFullYear()}-${pad(rem.reminder_date.getMonth() + 1)}-${pad(rem.reminder_date.getDate())}`;
      } else if (typeof rem.reminder_date === 'string') {
        dateStr = rem.reminder_date.split('T')[0];
      }

      const scheduledDateTime = new Date(`${dateStr}T${rem.reminder_time}Z`);
      const triggerDateTime = rem.next_trigger_at instanceof Date ? rem.next_trigger_at : new Date(String(rem.next_trigger_at).replace(' ', 'T') + 'Z');
      const offsetMins = getOffsetMinutes(rem.remind_before, rem.custom_remind_minutes);
      const isPreReminder = offsetMins > 0 && (scheduledDateTime - triggerDateTime) > 30000;

      // Perform atomic state update FIRST to lock the row for this process execution
      let affectedRows = 0;
      if (isPreReminder) {
        const nextTime = `${dateStr} ${rem.reminder_time}`;
        const [updateResult] = await schedulerPool.execute(
          `UPDATE scheduler_reminders 
           SET next_trigger_at = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ? AND next_trigger_at = ? AND status = 'pending'`,
          [nextTime, rem.id, rem.next_trigger_at]
        );
        affectedRows = updateResult.affectedRows;
      } else if (rem.repeat_type === 'none') {
        const [updateResult] = await schedulerPool.execute(
          `UPDATE scheduler_reminders 
           SET status = 'completed', next_trigger_at = NULL, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ? AND status = 'pending'`,
          [rem.id]
        );
        affectedRows = updateResult.affectedRows;
      } else {
        const nextSched = getNextRecurrence(dateStr, rem.reminder_time, rem.repeat_type);
        if (nextSched) {
          const nextTrigger = calculateTriggerTime(nextSched.date, nextSched.time, offsetMins);
          const [updateResult] = await schedulerPool.execute(
            `UPDATE scheduler_reminders 
             SET reminder_date = ?, reminder_time = ?, next_trigger_at = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND status = 'pending'`,
            [nextSched.date, nextSched.time, nextTrigger, rem.id]
          );
          affectedRows = updateResult.affectedRows;
        } else {
          const [updateResult] = await schedulerPool.execute(
            `UPDATE scheduler_reminders 
             SET status = 'completed', next_trigger_at = NULL, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND status = 'pending'`,
            [rem.id]
          );
          affectedRows = updateResult.affectedRows;
        }
      }

      // If another process updated it in the split second, affectedRows will be 0. Skip to prevent duplicate sending.
      if (affectedRows === 0) {
        console.log(`[Scheduler CRON] Reminder ${rem.id} already acquired/processed by another process. Skipping.`);
        continue;
      }

      // Fetch employees and send notifications
      let employees = [];
      if (rem.assignment_type === 'self') {
        employees.push({ id: 0, name: 'Admin', email: process.env.EMAIL_USER || 'hr@doaguru.com', phone_number: '' });
      } else if (rem.assignment_type === 'single' && rem.employee_id) {
        const [empRows] = await schedulerPool.execute(
          'SELECT id, full_name AS name, email_id AS email, mobile_number AS phone_number FROM task_users WHERE id = ?',
          [rem.employee_id]
        );
        if (empRows.length > 0) employees.push(empRows[0]);
      } else {
        const [empRows] = await schedulerPool.execute(
          `SELECT u.id, u.full_name AS name, u.email_id AS email, u.mobile_number AS phone_number
           FROM scheduler_reminder_employees sre
           JOIN task_users u ON sre.employee_id = u.id
           WHERE sre.reminder_id = ?`,
          [rem.id]
        );
        employees = empRows;
      }

      if (employees.length === 0) {
        continue;
      }

      const notifyReminder = { ...rem };
      if (isPreReminder) notifyReminder.title = `[Reminder] ${rem.title}`;

      for (const emp of employees) {
        await processAndSendNotification(notifyReminder, emp);
      }
    }
  } catch (error) {
    console.warn('[Scheduler CRON] DB failed, running Mock fallback for this tick:', error.message);
    
    global.schedulerUseMockDb = true;

    const nowUtc = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
    const pendingDue = mockReminders.filter(r => {
      if (r.status !== 'pending' || !r.next_trigger_at) return false;
      return new Date(r.next_trigger_at.replace(' ', 'T') + 'Z') <= nowUtc;
    });
    if (pendingDue.length === 0) return;

    for (const rem of pendingDue) {
      let employees = [];
      if (rem.assignment_type === 'self') {
        employees.push({ id: 0, name: 'Admin', email: process.env.EMAIL_USER || 'hr@doaguru.com', phone_number: '' });
      } else {
        const assignedIds = mockReminderEmployees.filter(re => re.reminder_id === rem.id).map(re => re.employee_id);
        employees = mockSFEmployees.filter(e => assignedIds.includes(e.id));
      }
      for (const emp of employees) {
        await processAndSendNotification(rem, emp);
      }
      if (rem.repeat_type === 'none') {
        rem.status = 'completed'; rem.next_trigger_at = null;
      } else {
        const nextSched = getNextRecurrence(rem.reminder_date, rem.reminder_time, rem.repeat_type);
        if (nextSched) {
          const offsetMins = getOffsetMinutes(rem.remind_before, rem.custom_remind_minutes);
          rem.next_trigger_at = calculateTriggerTime(nextSched.date, nextSched.time, offsetMins);
          rem.reminder_date = nextSched.date; rem.reminder_time = nextSched.time;
        } else {
          rem.status = 'completed'; rem.next_trigger_at = null;
        }
      }
    }
  }
};

const sendDailyAdminSummary = async (type) => {
  const adminPhone = '917000102121'; // Admin phone number (Abhinav Pandey)
  
  // Calculate target date
  let targetDate;
  if (type === 'tonight') {
    // Tomorrow
    targetDate = moment().tz('Asia/Kolkata').add(1, 'day');
  } else {
    // Today
    targetDate = moment().tz('Asia/Kolkata');
  }
  
  const targetDateStr = targetDate.format('YYYY-MM-DD');
  const displayDateStr = targetDate.format('D MMMM YYYY');
  
  console.log(`[Scheduler Summary] Fetching schedule summary for date: ${targetDateStr} (${type === 'tonight' ? 'tomorrow' : 'today'})...`);
  
  let reminders = [];
  if (global.schedulerUseMockDb) {
    const list = mockReminders.filter(r => {
      const rDateStr = r.reminder_date instanceof Date 
        ? r.reminder_date.toISOString().split('T')[0]
        : String(r.reminder_date).split('T')[0];
      return rDateStr === targetDateStr && r.status !== 'cancelled';
    });
    reminders = list.map(r => {
      let assigned_names = 'Unassigned';
      if (r.assignment_type === 'self') {
        assigned_names = 'Admin';
      } else if (r.assignment_type === 'single' && r.employee_id) {
        const emp = mockSFEmployees.find(e => e.id === r.employee_id);
        assigned_names = emp ? emp.full_name : 'Unassigned';
      } else {
        const empIds = mockReminderEmployees.filter(re => re.reminder_id === r.id).map(re => re.employee_id);
        const emps = mockSFEmployees.filter(e => empIds.includes(e.id));
        assigned_names = emps.length > 0 ? emps.map(e => e.full_name).join(', ') : 'Unassigned';
      }
      return {
        id: r.id,
        title: r.title,
        reminder_time: r.reminder_time,
        assigned_names
      };
    });
    reminders.sort((a, b) => String(a.reminder_time).localeCompare(String(b.reminder_time)));
  } else {
    try {
      reminders = await schedulerQuery(
        `SELECT r.id, r.title, r.reminder_time, r.assignment_type, r.employee_id,
                COALESCE(
                  CASE 
                    WHEN r.assignment_type = 'self' THEN 'Admin'
                    WHEN r.assignment_type = 'single' THEN (SELECT full_name FROM task_users WHERE id = r.employee_id)
                    ELSE GROUP_CONCAT(u.full_name SEPARATOR ', ')
                  END,
                  'Unassigned'
                ) AS assigned_names
         FROM scheduler_reminders r
         LEFT JOIN scheduler_reminder_employees re ON r.id = re.reminder_id
         LEFT JOIN task_users u ON re.employee_id = u.id
         WHERE r.reminder_date = ? AND r.status != 'cancelled'
         GROUP BY r.id
         ORDER BY r.reminder_time ASC`,
        [targetDateStr]
      );
    } catch (dbErr) {
      console.error('[Scheduler Summary] DB error, skipping summary run:', dbErr.message);
      return;
    }
  }
  
  // Format the message
  let customMessage = '';
  if (reminders.length === 0) {
    customMessage = `No tasks scheduled for ${type === 'tonight' ? 'tomorrow' : 'today'}.`;
  } else {
    const listItems = reminders.map((r) => {
      let timeStr = r.reminder_time;
      try {
        const parsedTime = moment(r.reminder_time, ['HH:mm:ss', 'HH:mm', 'hh:mm A']);
        if (parsedTime.isValid()) {
          timeStr = parsedTime.format('hh:mm A');
        }
      } catch (e) {
        // Fallback
      }
      
      const cleanTitle = r.title.replace(/[|*▫️🔹🔸▪️]/g, '');
      const cleanAssignees = r.assigned_names.replace(/[|*▫️🔹🔸▪️]/g, '');
      
      return `🔹 *${timeStr}* - ${cleanTitle} (${cleanAssignees})`;
    });
    
    const count = reminders.length;
    customMessage = `Total: *${count} tasks* scheduled:   ${listItems.join('   ')}`;
  }
  
  // Truncate customMessage to fit 1024 chars of WhatsApp param limit
  if (customMessage.length > 1000) {
    customMessage = customMessage.substring(0, 997) + '...';
  }
  
  const title = `${type === 'tonight' ? 'Tomorrow\'s' : 'Today\'s'} Schedule Summary`;
  const time = type === 'tonight' ? '08:00 PM' : '08:00 AM';
  
  console.log(`[Scheduler Summary] Sending summary to Admin via WhatsApp: ${customMessage}`);
  try {
    const result = await sendSchedulerReminderWhatsApp(
      adminPhone,
      'Abhinav Pandey',
      title,
      displayDateStr,
      time,
      customMessage
    );
    if (result && result.error) {
      console.error('[Scheduler Summary] Failed to send admin summary via WhatsApp:', result.error);
    } else {
      console.log(`✅ [Scheduler Summary] Admin summary (${type}) successfully sent via WhatsApp.`);
    }
  } catch (err) {
    console.error('[Scheduler Summary] Error during dispatch:', err.message);
  }
};

let isProcessing = false;

const startSchedulerCron = () => {
  // Prevent duplicate crons in clustered production environments (e.g. PM2 cluster mode, Passenger)
  const instanceId = process.env.NODE_APP_INSTANCE || '0';
  if (instanceId !== '0') {
    console.log(`⏰ [Scheduler] Clustered instance ${instanceId} detected. Skipping cron registration on this instance.`);
    return;
  }

  console.log('⏰ [Scheduler] Starting cron engine (1 min interval)...');
  cron.schedule('* * * * *', async () => {
    if (isProcessing) {
      console.log('[Scheduler CRON] Previous execution is still active. Skipping this tick to prevent resource saturation.');
      return;
    }
    isProcessing = true;
    try { 
      await processReminders(); 
    } catch (err) { 
      console.error('[Scheduler CRON] Error:', err.message); 
    } finally {
      isProcessing = false;
    }
  });

  // Tonight summary at 8:00 PM (20:00)
  console.log('⏰ [Scheduler] Scheduling tomorrow\'s admin summary cron (Daily at 8:00 PM)...');
  cron.schedule('0 20 * * *', async () => {
    try {
      await sendDailyAdminSummary('tonight');
    } catch (err) {
      console.error('[Scheduler Summary] Error sending tonight summary:', err.message);
    }
  });

  // Morning summary at 8:00 AM (08:00)
  console.log('⏰ [Scheduler] Scheduling today\'s admin summary cron (Daily at 8:00 AM)...');
  cron.schedule('0 8 * * *', async () => {
    try {
      await sendDailyAdminSummary('morning');
    } catch (err) {
      console.error('[Scheduler Summary] Error sending morning summary:', err.message);
    }
  });

  // Run immediately on start (using isProcessing lock)
  (async () => {
    isProcessing = true;
    try {
      await processReminders();
    } catch (err) {
      console.error('[Scheduler CRON] Error on immediate run:', err.message);
    } finally {
      isProcessing = false;
    }
  })();
};

module.exports = { startSchedulerCron, processReminders, sendDailyAdminSummary };
