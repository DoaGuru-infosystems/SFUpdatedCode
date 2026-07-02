// Scheduler - Employee Controller (CommonJS, uses SF's user table)
const { schedulerPool, schedulerQuery } = require('../../config/schedulerDb');
const { mockSFEmployees } = require('./mockDb');

// GET /api/scheduler/employees
// Pulls active users from SF's existing 'user' table
const getEmployees = async (req, res, next) => {
  try {
    try {
      const employees = await schedulerQuery(
        `SELECT id, full_name AS name, email_id AS email, mobile_number AS phone_number, department, 1 AS is_active
         FROM task_users WHERE employment_status = 'active' OR employment_status IS NULL ORDER BY full_name ASC`
      );
      global.schedulerUseMockDb = false;
      return res.json(employees);
    } catch (dbError) {
      console.warn('[Scheduler] DB failed, using mock:', dbError.message);
      global.schedulerUseMockDb = true;
    }
    return res.json(mockSFEmployees.filter(e => e.is_active === 1));
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployees };
