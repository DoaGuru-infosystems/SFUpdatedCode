// Scheduler - Notification Controller (CommonJS)
const { schedulerQuery } = require('../../config/schedulerDb');
const { mockNotifications, mockSFEmployees, mockReminders } = require('./mockDb');

const getNotifications = async (req, res, next) => {
  try {
    const { employee_id, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
      let countSql = `
        SELECT COUNT(DISTINCT n.id) as total
        FROM scheduler_notifications n
        JOIN task_users u ON n.employee_id = u.id
        JOIN scheduler_reminders r ON n.reminder_id = r.id
      `;
      let sql = `
        SELECT n.*, u.full_name AS employee_name, r.title AS reminder_title
        FROM scheduler_notifications n
        JOIN task_users u ON n.employee_id = u.id
        JOIN scheduler_reminders r ON n.reminder_id = r.id
      `;
      const params = [], conditions = [];
      if (employee_id) {
        conditions.push(`n.employee_id = ?`);
        params.push(employee_id);
      }
      if (conditions.length > 0) {
        const whereClause = ` WHERE ` + conditions.join(' AND ');
        countSql += whereClause;
        sql += whereClause;
      }
      sql += ` ORDER BY n.created_at DESC`;

      const paginated = !!(page || limit);
      let totalCount = 0;

      if (paginated) {
        const countResult = await schedulerQuery(countSql, params);
        totalCount = countResult[0].total || 0;
        sql += ` LIMIT ${limitNum} OFFSET ${offset}`;
      }

      const notifications = await schedulerQuery(sql, params);
      global.schedulerUseMockDb = false;

      if (paginated) {
        return res.json({
          data: notifications,
          pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            limit: limitNum
          }
        });
      } else {
        return res.json(notifications);
      }
    } catch (dbError) { 
      console.warn('[Scheduler] Notif DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }

    let list = mockNotifications.map(n => ({
      ...n,
      employee_name: mockSFEmployees.find(e => e.id === n.employee_id)?.name || 'Unknown',
      reminder_title: mockReminders.find(r => r.id === n.reminder_id)?.title || 'Notification'
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (employee_id) {
      list = list.filter(n => n.employee_id === parseInt(employee_id));
    }

    const totalCount = list.length;
    if (page || limit) {
      const paginatedList = list.slice(offset, offset + limitNum);
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
      return res.json(list);
    }
  } catch (error) { next(error); }
};

const getUnreadNotifications = async (req, res, next) => {
  try {
    const { employee_id, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
      let countSql = `
        SELECT COUNT(DISTINCT n.id) as total
        FROM scheduler_notifications n
        JOIN task_users u ON n.employee_id = u.id
        JOIN scheduler_reminders r ON n.reminder_id = r.id
        WHERE n.is_read = 0
      `;
      let sql = `
        SELECT n.*, u.full_name AS employee_name, r.title AS reminder_title
        FROM scheduler_notifications n
        JOIN task_users u ON n.employee_id = u.id
        JOIN scheduler_reminders r ON n.reminder_id = r.id
        WHERE n.is_read = 0
      `;
      const params = [];
      if (employee_id) {
        sql += ` AND n.employee_id = ?`;
        countSql += ` AND n.employee_id = ?`;
        params.push(employee_id);
      }
      sql += ` ORDER BY n.created_at DESC`;

      const paginated = !!(page || limit);
      let totalCount = 0;

      if (paginated) {
        const countResult = await schedulerQuery(countSql, params);
        totalCount = countResult[0].total || 0;
        sql += ` LIMIT ${limitNum} OFFSET ${offset}`;
      }

      const notifications = await schedulerQuery(sql, params);
      global.schedulerUseMockDb = false;

      if (paginated) {
        return res.json({
          data: notifications,
          pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            limit: limitNum
          }
        });
      } else {
        return res.json(notifications);
      }
    } catch (dbError) { 
      console.warn('[Scheduler] Unread DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }

    let list = mockNotifications.filter(n => n.is_read === 0);
    if (employee_id) {
      list = list.filter(n => n.employee_id === parseInt(employee_id));
    }

    const totalCount = list.length;
    if (page || limit) {
      const paginatedList = list.slice(offset, offset + limitNum);
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
      return res.json(list);
    }
  } catch (error) { next(error); }
};

const getNotificationHistory = async (req, res, next) => {
  try {
    const { status, search, employee_id, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
      let countSql = `
        SELECT COUNT(DISTINCT n.id) as total
        FROM scheduler_notifications n
        JOIN task_users u ON n.employee_id = u.id
        JOIN scheduler_reminders r ON n.reminder_id = r.id
      `;
      let sql = `
        SELECT n.*, u.full_name AS employee_name, r.title AS reminder_title
        FROM scheduler_notifications n
        JOIN task_users u ON n.employee_id = u.id
        JOIN scheduler_reminders r ON n.reminder_id = r.id
      `;
      const params = [], conditions = [];
      if (employee_id) {
        conditions.push(`n.employee_id = ?`);
        params.push(employee_id);
      }
      if (status && status !== 'all') { conditions.push(`n.delivery_status = ?`); params.push(status); }
      if (search) { conditions.push(`(u.full_name LIKE ? OR r.title LIKE ? OR n.message_body LIKE ?)`); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      if (conditions.length > 0) {
        const whereClause = ` WHERE ` + conditions.join(' AND ');
        countSql += whereClause;
        sql += whereClause;
      }
      sql += ` ORDER BY n.created_at DESC`;

      const paginated = !!(page || limit);
      let totalCount = 0;

      if (paginated) {
        const countResult = await schedulerQuery(countSql, params);
        totalCount = countResult[0].total || 0;
        sql += ` LIMIT ${limitNum} OFFSET ${offset}`;
      }

      const history = await schedulerQuery(sql, params);
      global.schedulerUseMockDb = false;

      if (paginated) {
        return res.json({
          data: history,
          pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            limit: limitNum
          }
        });
      } else {
        return res.json(history);
      }
    } catch (dbError) { 
      console.warn('[Scheduler] History DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }

    let list = mockNotifications.map(n => ({
      ...n,
      employee_name: mockSFEmployees.find(e => e.id === n.employee_id)?.name || 'Unknown',
      reminder_title: mockReminders.find(r => r.id === n.reminder_id)?.title || 'Notification'
    }));
    if (employee_id) list = list.filter(n => n.employee_id === parseInt(employee_id));
    if (status && status !== 'all') list = list.filter(n => n.delivery_status === status);
    if (search) { const q = search.toLowerCase(); list = list.filter(n => n.employee_name.toLowerCase().includes(q) || n.reminder_title.toLowerCase().includes(q) || n.message_body.toLowerCase().includes(q)); }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalCount = list.length;
    if (page || limit) {
      const paginatedList = list.slice(offset, offset + limitNum);
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
      return res.json(list);
    }
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await schedulerQuery(`UPDATE scheduler_notifications SET is_read = 1 WHERE id = ?`, [id]);
      global.schedulerUseMockDb = false;
      return res.json({ success: true, message: 'Marked as read' });
    } catch (dbError) { 
      console.warn('[Scheduler] MarkRead DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }
    const notif = mockNotifications.find(n => n.id === parseInt(id));
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    notif.is_read = 1;
    return res.json({ success: true, message: 'Marked as read (Mock)' });
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const { employee_id } = req.query;
    try {
      if (employee_id) {
        await schedulerQuery(`UPDATE scheduler_notifications SET is_read = 1 WHERE is_read = 0 AND employee_id = ?`, [employee_id]);
      } else {
        await schedulerQuery(`UPDATE scheduler_notifications SET is_read = 1 WHERE is_read = 0`);
      }
      global.schedulerUseMockDb = false;
      return res.json({ success: true, message: 'All marked as read' });
    } catch (dbError) { 
      console.warn('[Scheduler] MarkAllRead DB failed, using mock fallback:', dbError.message); 
      global.schedulerUseMockDb = true; 
    }
    mockNotifications.forEach(n => {
      if (!employee_id || n.employee_id === parseInt(employee_id)) {
        n.is_read = 1;
      }
    });
    return res.json({ success: true, message: 'All marked as read (Mock)' });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, getUnreadNotifications, getNotificationHistory, markAsRead, markAllAsRead };
