// Scheduler - Reminder Controller (CommonJS, SF-integrated)
const { schedulerPool, schedulerQuery } = require('../../config/schedulerDb');
const { mockReminders, mockReminderEmployees, mockSFEmployees, mockNotifications } = require('./mockDb');
const { processAndSendNotification } = require('../../services/scheduler/notificationService');

const calculateNextTrigger = (dateStr, timeStr, remindBefore, customMins) => {
  try {
    const scheduledDateTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(scheduledDateTime.getTime())) return null;
    let offsetMinutes = 0;
    switch (remindBefore) {
      case '2_minutes': offsetMinutes = 2; break;
      case '10_minutes': offsetMinutes = 10; break;
      case '30_minutes': offsetMinutes = 30; break;
      case '1_hour': offsetMinutes = 60; break;
      case '2_hours': offsetMinutes = 120; break;
      case 'custom': offsetMinutes = parseInt(customMins) || 0; break;
    }
    const triggerTime = new Date(scheduledDateTime.getTime() - offsetMinutes * 60 * 1000);
    const pad = n => String(n).padStart(2, '0');
    return `${triggerTime.getFullYear()}-${pad(triggerTime.getMonth() + 1)}-${pad(triggerTime.getDate())} ${pad(triggerTime.getHours())}:${pad(triggerTime.getMinutes())}:${pad(triggerTime.getSeconds())}`;
  } catch (err) { return null; }
};


// GET /api/scheduler/reminders
const getReminders = async (req, res, next) => {
  try {
    const { status, search, page, limit, startDate, endDate } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
      let countSql = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM scheduler_reminders r
        LEFT JOIN task_users u ON r.employee_id = u.id
      `;
      let sql = `
        SELECT r.*, u.full_name AS employee_name, u.email_id AS employee_email, u.mobile_number AS employee_phone
        FROM scheduler_reminders r
        LEFT JOIN task_users u ON r.employee_id = u.id
      `;
      const params = [], conditions = [];
      if (status) {
        const today = new Date().toISOString().split('T')[0];
        const nowTime = new Date().toTimeString().split(' ')[0];
        if (status === 'today') { conditions.push(`r.reminder_date = ?`); params.push(today); }
        else if (status === 'upcoming') { conditions.push(`(r.reminder_date > ? OR (r.reminder_date = ? AND r.reminder_time >= ?)) AND r.status = 'pending'`); params.push(today, today, nowTime); }
        else if (status === 'completed') { conditions.push(`r.status = 'completed'`); }
        else if (status === 'overdue') { conditions.push(`(r.reminder_date < ? OR (r.reminder_date = ? AND r.reminder_time < ?)) AND r.status = 'pending'`); params.push(today, today, nowTime); }
        else if (status === 'cancelled') { conditions.push(`r.status = 'cancelled'`); }
        else if (status !== 'all') { conditions.push(`r.status = ?`); params.push(status); }
      }
      if (search) { conditions.push(`(r.title LIKE ? OR u.full_name LIKE ?)`); params.push(`%${search}%`, `%${search}%`); }
      if (startDate) { conditions.push(`r.reminder_date >= ?`); params.push(startDate); }
      if (endDate) { conditions.push(`r.reminder_date <= ?`); params.push(endDate); }
      
      if (conditions.length > 0) {
        const whereClause = ` WHERE ` + conditions.join(' AND ');
        countSql += whereClause;
        sql += whereClause;
      }
      
      sql += ` ORDER BY r.created_at DESC, r.id DESC`;

      let totalCount = 0;
      let paginated = false;
      if (page || limit) {
        paginated = true;
        const countResult = await schedulerQuery(countSql, params);
        totalCount = countResult[0].total || 0;
        sql += ` LIMIT ${limitNum} OFFSET ${offset}`;
      }

      const remindersList = await schedulerQuery(sql, params);
      const enriched = await Promise.all(remindersList.map(async (rem) => {
        const assigned = await schedulerQuery(
          `SELECT u.id, u.full_name AS name, u.email_id AS email, u.mobile_number AS phone_number
           FROM scheduler_reminder_employees sre JOIN task_users u ON sre.employee_id = u.id WHERE sre.reminder_id = ?`,
          [rem.id]
        );
        return {
          ...rem,
          employee_name: rem.assignment_type === 'self' ? 'Admin (Myself)' : (rem.employee_name || 'Unassigned'),
          employee_email: rem.assignment_type === 'self' ? (process.env.EMAIL_USER || 'hr@doaguru.com') : rem.employee_email,
          assigned_employees: assigned
        };
      }));
      
      global.schedulerUseMockDb = false;

      if (paginated) {
        return res.json({
          data: enriched,
          pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            limit: limitNum
          }
        });
      } else {
        return res.json(enriched);
      }
    } catch (dbError) {
      console.warn('[Scheduler] DB failed, using mock fallback:', dbError.message);
      global.schedulerUseMockDb = true;
    }

    // Mock fallback
    let list = [...mockReminders];
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];
    if (status === 'today') list = list.filter(r => r.reminder_date === today);
    else if (status === 'upcoming') list = list.filter(r => (r.reminder_date > today || (r.reminder_date === today && r.reminder_time >= nowTime)) && r.status === 'pending');
    else if (status === 'completed') list = list.filter(r => r.status === 'completed');
    else if (status === 'overdue') list = list.filter(r => (r.reminder_date < today || (r.reminder_date === today && r.reminder_time < nowTime)) && r.status === 'pending');
    else if (status === 'cancelled') list = list.filter(r => r.status === 'cancelled');
    if (search) { const q = search.toLowerCase(); list = list.filter(r => r.title.toLowerCase().includes(q)); }
    if (startDate) list = list.filter(r => r.reminder_date >= startDate);
    if (endDate) list = list.filter(r => r.reminder_date <= endDate);
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || b.id - a.id);
    
    const totalCount = list.length;
    const items = list.map(rem => ({
      ...rem,
      employee_name: rem.assignment_type === 'self' ? 'Admin (Myself)' : 'Unassigned',
      assigned_employees: []
    }));

    if (page || limit) {
      const paginatedList = items.slice(offset, offset + limitNum);
      return res.json({
        data: paginatedList,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
          currentPage: pageNum,
          limit: limitNum
        }
      });
    } else {
      return res.json(items);
    }
  } catch (error) { next(error); }
};

// GET /api/scheduler/reminders/stats
const getReminderStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];
    
    try {
      const stats = await schedulerQuery(
        `SELECT COUNT(*) as total,
          SUM(CASE WHEN (reminder_date > ? OR (reminder_date = ? AND reminder_time >= ?)) AND status = 'pending' THEN 1 ELSE 0 END) as upcoming,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN (reminder_date < ? OR (reminder_date = ? AND reminder_time < ?)) AND status = 'pending' THEN 1 ELSE 0 END) as overdue
         FROM scheduler_reminders`,
        [today, today, nowTime, today, today, nowTime]
      );
      global.schedulerUseMockDb = false;
      return res.json({ total: stats[0].total || 0, upcoming: parseInt(stats[0].upcoming) || 0, completed: parseInt(stats[0].completed) || 0, overdue: parseInt(stats[0].overdue) || 0 });
    } catch (dbError) { 
      console.warn('[Scheduler] Stats DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }
    
    const total = mockReminders.length;
    const upcoming = mockReminders.filter(r => (r.reminder_date > today || (r.reminder_date === today && r.reminder_time >= nowTime)) && r.status === 'pending').length;
    const completed = mockReminders.filter(r => r.status === 'completed').length;
    const overdue = mockReminders.filter(r => (r.reminder_date < today || (r.reminder_date === today && r.reminder_time < nowTime)) && r.status === 'pending').length;
    return res.json({ total, upcoming, completed, overdue });
  } catch (error) { next(error); }
};

// GET /api/scheduler/reminders/:id
const getReminderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      const rows = await schedulerQuery(
        `SELECT r.*, u.full_name AS employee_name, u.email_id AS employee_email, u.mobile_number AS employee_phone
         FROM scheduler_reminders r LEFT JOIN task_users u ON r.employee_id = u.id WHERE r.id = ?`, [id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Reminder not found' });
      const assigned = await schedulerQuery(
        `SELECT u.id, u.full_name AS name, u.email_id AS email, u.mobile_number AS phone_number
         FROM scheduler_reminder_employees sre JOIN task_users u ON sre.employee_id = u.id WHERE sre.reminder_id = ?`, [id]
      );
      global.schedulerUseMockDb = false;
      return res.json({ ...rows[0], assigned_employees: assigned });
    } catch (dbError) { 
      console.warn('[Scheduler] GetById DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }
    const rem = mockReminders.find(r => r.id === parseInt(id));
    if (!rem) return res.status(404).json({ success: false, message: 'Reminder not found' });
    return res.json({ ...rem, assigned_employees: [] });
  } catch (error) { next(error); }
};

// POST /api/scheduler/reminders
const createReminder = async (req, res, next) => {
  try {
    const { assignment_type, employee_id, employee_ids, title, note, reminder_date, reminder_time,
      repeat_type, custom_repeat_data, remind_before, custom_remind_minutes,
      delivery_method, message_template, dnd_enabled, dnd_start_time, dnd_end_time } = req.body;

    if (!title || !reminder_date || !reminder_time) {
      return res.status(400).json({ success: false, message: 'Title, date, and time are required' });
    }

    let connection;
    try {
      connection = await schedulerPool.getConnection();
      await connection.beginTransaction();
      let primaryEmployeeId = null, targetEmployeeIds = [];
      if (assignment_type === 'self' || assignment_type === 'single') {
        primaryEmployeeId = employee_id || null;
        if (primaryEmployeeId) targetEmployeeIds = [primaryEmployeeId];
      } else if (assignment_type === 'multiple') {
        targetEmployeeIds = Array.isArray(employee_ids) ? employee_ids : [];
        if (targetEmployeeIds.length > 0) primaryEmployeeId = targetEmployeeIds[0];
      } else if (assignment_type === 'team') {
        const [allEmps] = await connection.query(`SELECT id FROM task_users WHERE employment_status = 'active' OR employment_status IS NULL`);
        targetEmployeeIds = allEmps.map(e => e.id);
        if (targetEmployeeIds.length > 0) primaryEmployeeId = targetEmployeeIds[0];
      }
      const nextTriggerAt = calculateNextTrigger(reminder_date, reminder_time, remind_before, custom_remind_minutes);
      const [insertResult] = await connection.query(
        `INSERT INTO scheduler_reminders
          (employee_id, assignment_type, title, note, reminder_date, reminder_time, repeat_type,
           custom_repeat_data, remind_before, custom_remind_minutes, delivery_method, message_template,
           dnd_enabled, dnd_start_time, dnd_end_time, status, next_trigger_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [primaryEmployeeId, assignment_type, title, note || null, reminder_date, reminder_time,
         repeat_type || 'none', custom_repeat_data ? JSON.stringify(custom_repeat_data) : null,
         remind_before || '10_minutes', custom_remind_minutes || null, delivery_method || 'inapp_only',
         message_template || null, dnd_enabled ? 1 : 0, dnd_start_time || null, dnd_end_time || null, nextTriggerAt]
      );
      const reminderId = insertResult.insertId;
      if (targetEmployeeIds.length > 0) {
        const junctionValues = targetEmployeeIds.map(eid => [reminderId, eid]);
        await connection.query('INSERT INTO scheduler_reminder_employees (reminder_id, employee_id) VALUES ?', [junctionValues]);
      }
      await connection.commit(); 
      connection.release();
      
      global.schedulerUseMockDb = false;
      return res.status(201).json({ success: true, message: 'Reminder created successfully', reminderId });
    } catch (dbError) {
      if (connection) { try { await connection.rollback(); } catch (e) {} connection.release(); }
      console.warn('[Scheduler] Create DB failed, using mock fallback:', dbError.message);
      global.schedulerUseMockDb = true;
    }

    // Mock fallback
    const reminderId = mockReminders.length > 0 ? Math.max(...mockReminders.map(r => r.id)) + 1 : 1;
    mockReminders.push({
      id: reminderId, employee_id: employee_id ? parseInt(employee_id) : null,
      assignment_type, title, note: note || null, reminder_date, reminder_time,
      repeat_type: repeat_type || 'none', custom_repeat_data: custom_repeat_data || null,
      remind_before: remind_before || '10_minutes', custom_remind_minutes: custom_remind_minutes || null,
      delivery_method: delivery_method || 'inapp_only', message_template: message_template || null,
      dnd_enabled: dnd_enabled ? 1 : 0, dnd_start_time: dnd_start_time || null, dnd_end_time: dnd_end_time || null,
      status: 'pending', next_trigger_at: calculateNextTrigger(reminder_date, reminder_time, remind_before, custom_remind_minutes),
      created_at: new Date().toISOString()
    });
    return res.status(201).json({ success: true, message: 'Reminder created (Mock)', reminderId });
  } catch (error) { next(error); }
};

// PUT /api/scheduler/reminders/:id
const updateReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignment_type, employee_id, employee_ids, title, note, reminder_date, reminder_time,
      repeat_type, custom_repeat_data, remind_before, custom_remind_minutes,
      delivery_method, message_template, dnd_enabled, dnd_start_time, dnd_end_time, status } = req.body;

    let connection;
    try {
      connection = await schedulerPool.getConnection();
      await connection.beginTransaction();
      const [existing] = await connection.query('SELECT * FROM scheduler_reminders WHERE id = ?', [id]);
      if (existing.length === 0) { 
        connection.release(); 
        return res.status(404).json({ success: false, message: 'Reminder not found' }); 
      }
      let primaryEmployeeId = null, targetEmployeeIds = [];
      if (assignment_type === 'self' || assignment_type === 'single') {
        primaryEmployeeId = employee_id || null;
        if (primaryEmployeeId) targetEmployeeIds = [primaryEmployeeId];
      } else if (assignment_type === 'multiple') {
        targetEmployeeIds = Array.isArray(employee_ids) ? employee_ids : [];
        if (targetEmployeeIds.length > 0) primaryEmployeeId = targetEmployeeIds[0];
      } else if (assignment_type === 'team') {
        const [allEmps] = await connection.query(`SELECT id FROM task_users WHERE employment_status = 'active' OR employment_status IS NULL`);
        targetEmployeeIds = allEmps.map(e => e.id);
        if (targetEmployeeIds.length > 0) primaryEmployeeId = targetEmployeeIds[0];
      }
      const nextTriggerAt = calculateNextTrigger(reminder_date, reminder_time, remind_before, custom_remind_minutes);
      await connection.query(
        `UPDATE scheduler_reminders SET employee_id=?, assignment_type=?, title=?, note=?, reminder_date=?, reminder_time=?,
         repeat_type=?, custom_repeat_data=?, remind_before=?, custom_remind_minutes=?, delivery_method=?,
         message_template=?, dnd_enabled=?, dnd_start_time=?, dnd_end_time=?, status=?, next_trigger_at=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [primaryEmployeeId, assignment_type, title, note || null, reminder_date, reminder_time,
         repeat_type || 'none', custom_repeat_data ? JSON.stringify(custom_repeat_data) : null,
         remind_before || '10_minutes', custom_remind_minutes || null, delivery_method || 'inapp_only',
         message_template || null, dnd_enabled ? 1 : 0, dnd_start_time || null, dnd_end_time || null,
         status || 'pending', nextTriggerAt, id]
      );
      await connection.query('DELETE FROM scheduler_reminder_employees WHERE reminder_id = ?', [id]);
      if (targetEmployeeIds.length > 0) {
        const junctionValues = targetEmployeeIds.map(eid => [id, eid]);
        await connection.query('INSERT INTO scheduler_reminder_employees (reminder_id, employee_id) VALUES ?', [junctionValues]);
      }
      await connection.commit(); 
      connection.release();
      
      global.schedulerUseMockDb = false;
      return res.json({ success: true, message: 'Reminder updated successfully' });
    } catch (dbError) {
      if (connection) { try { await connection.rollback(); } catch (e) {} connection.release(); }
      console.warn('[Scheduler] Update DB failed, using mock fallback:', dbError.message);
      global.schedulerUseMockDb = true;
    }

    const idx = mockReminders.findIndex(r => r.id === parseInt(id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });
    mockReminders[idx] = { ...mockReminders[idx], assignment_type, title, note: note || null, reminder_date, reminder_time,
      repeat_type: repeat_type || 'none', remind_before: remind_before || '10_minutes',
      delivery_method: delivery_method || 'inapp_only', dnd_enabled: dnd_enabled ? 1 : 0,
      status: status || 'pending', updated_at: new Date().toISOString() };
    return res.json({ success: true, message: 'Reminder updated (Mock)' });
  } catch (error) { next(error); }
};

// DELETE /api/scheduler/reminders/:id
const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await schedulerQuery('DELETE FROM scheduler_reminders WHERE id = ?', [id]);
      global.schedulerUseMockDb = false;
      return res.json({ success: true, message: 'Reminder deleted' });
    } catch (dbError) { 
      console.warn('[Scheduler] Delete DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }
    const index = mockReminders.findIndex(r => r.id === parseInt(id));
    if (index === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });
    mockReminders.splice(index, 1);
    for (let i = mockReminderEmployees.length - 1; i >= 0; i--) {
      if (mockReminderEmployees[i].reminder_id === parseInt(id)) mockReminderEmployees.splice(i, 1);
    }
    return res.json({ success: true, message: 'Reminder deleted (Mock)' });
  } catch (error) { next(error); }
};

// PATCH /api/scheduler/reminders/:id/complete
const completeReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await schedulerQuery(
        `UPDATE scheduler_reminders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]
      );
      global.schedulerUseMockDb = false;
      return res.json({ success: true, message: 'Marked as completed' });
    } catch (dbError) { 
      console.warn('[Scheduler] Complete DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }
    const rem = mockReminders.find(r => r.id === parseInt(id));
    if (!rem) return res.status(404).json({ success: false, message: 'Reminder not found' });
    rem.status = 'completed';
    return res.json({ success: true, message: 'Marked as completed (Mock)' });
  } catch (error) { next(error); }
};

// POST /api/scheduler/reminders/:id/trigger
const triggerReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      const remindersList = await schedulerQuery('SELECT * FROM scheduler_reminders WHERE id = ?', [id]);
      if (remindersList.length > 0) {
        const reminder = remindersList[0];
        let targetEmployees = [];
        if (reminder.assignment_type === 'self') {
          targetEmployees.push({ id: 0, name: 'Admin', email: process.env.EMAIL_USER || 'hr@doaguru.com', phone_number: '' });
        } else if (reminder.assignment_type === 'single') {
          const emps = await schedulerQuery('SELECT id, full_name AS name, email_id AS email, mobile_number AS phone_number FROM task_users WHERE id = ?', [reminder.employee_id]);
          if (emps.length > 0) targetEmployees.push(emps[0]);
        } else {
          targetEmployees = await schedulerQuery(
            `SELECT u.id, u.full_name AS name, u.email_id AS email, u.mobile_number AS phone_number
             FROM scheduler_reminder_employees sre JOIN task_users u ON sre.employee_id = u.id WHERE sre.reminder_id = ?`, [id]
          );
        }
        if (targetEmployees.length === 0) return res.status(400).json({ success: false, message: 'No employees assigned' });
        for (const emp of targetEmployees) await processAndSendNotification({ ...reminder, dnd_enabled: 0 }, emp);
        global.schedulerUseMockDb = false;
        return res.json({ success: true, message: `Triggered for ${targetEmployees.length} recipients` });
      }
    } catch (dbError) { 
      console.warn('[Scheduler] Trigger DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }
    const reminder = mockReminders.find(r => r.id === parseInt(id));
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    console.log(`[Scheduler] Test trigger for: ${reminder.title}`);
    return res.json({ success: true, message: 'Test trigger simulated (Mock)' });
  } catch (error) { next(error); }
};

// POST /api/scheduler/test-whatsapp
const testWhatsApp = async (req, res, next) => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const { sendSchedulerReminderWhatsApp } = require('../../utils/whatsappUtils');
    const cleanPhone = phone_number.replace(/\D/g, '');
    const dateFormatted = new Date().toLocaleDateString('en-GB');
    const timeFormatted = new Date().toLocaleTimeString('en-US', { hour12: false });

    console.log(`[Scheduler Test] Sending test WhatsApp to ${cleanPhone}...`);
    const result = await sendSchedulerReminderWhatsApp(
      cleanPhone,
      'Test User',
      'Scheduler Test Alert',
      dateFormatted,
      timeFormatted,
      'This is a test notification from the SF Scheduler system.'
    );

    if (result && result.error) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.json({ success: true, message: 'Test message sent successfully!', result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReminders, getReminderById, getReminderStats, createReminder, updateReminder, deleteReminder, completeReminder, triggerReminder, testWhatsApp, calculateNextTrigger };
