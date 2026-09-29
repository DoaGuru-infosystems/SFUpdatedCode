const { db } = require("../config/db");
const socketUtil = require("../utils/socket");
const jwt = require("jsonwebtoken");
const schedule = require("node-schedule");

// ── IST Helpers ─────────────────────────────────────────────────────────────
const getISTDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
};

// ── Testing / Simulation Flag ──────────────────────────────────────────────
// Set to true to test Sunday Login flow on any day (e.g. Monday/Tuesday).
// Set to false for standard production behavior (only Sundays).
const FORCE_SUNDAY_TEST_MODE = false;

const isTodaySunday = () => {
  if (FORCE_SUNDAY_TEST_MODE) return true;
  return getISTDate().getDay() === 0; // 0 = Sunday
};

const getISTDateString = (dateObj = null) => {
  const d = dateObj || getISTDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getISTTimeString = (dateObj = null) => {
  const d = dateObj || getISTDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// ── Database Table Initialization ───────────────────────────────────────────
const initSundayTables = () => {
  const createRequestsTable = `
    CREATE TABLE IF NOT EXISTS sunday_login_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      employee_email VARCHAR(255) NOT NULL,
      request_date DATE NOT NULL,
      request_time TIME NOT NULL,
      status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
      approved_by VARCHAR(255) NULL,
      approved_at DATETIME NULL,
      rejection_reason TEXT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_emp_date (employee_id, request_date),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createPreApprovalsTable = `
    CREATE TABLE IF NOT EXISTS sunday_pre_approvals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      employee_email VARCHAR(255) NOT NULL,
      approved_date DATE NOT NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      is_full_day TINYINT(1) DEFAULT 1,
      reason TEXT NULL,
      approved_by VARCHAR(255) DEFAULT 'Admin',
      status ENUM('active', 'revoked', 'used') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_emp_approved_date (employee_id, approved_date),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createRequestsTable, (err) => {
    if (err) {
      console.error("❌ Error creating sunday_login_requests table:", err.message);
    } else {
      console.log("✅ sunday_login_requests table ready");
    }
  });

  db.query(createPreApprovalsTable, (err) => {
    if (err) {
      console.error("❌ Error creating sunday_pre_approvals table:", err.message);
    } else {
      console.log("✅ sunday_pre_approvals table ready");
    }
  });
};

// Run table initialization
initSundayTables();

// ── Auto-Expire Expired Requests ────────────────────────────────────────────
const expireOldRequests = () => {
  const sql = `
    UPDATE sunday_login_requests
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW()
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error expiring old Sunday requests:", err.message);
    } else if (result && result.affectedRows > 0) {
      console.log(`⏰ Expired ${result.affectedRows} overdue Sunday login requests.`);
      try {
        const io = socketUtil.getIO();
        io.emit("sunday_requests_expired", { affectedRows: result.affectedRows });
      } catch (e) {
        // ignore socket error
      }
    }
  });
};

// Check every 5 minutes
schedule.scheduleJob("*/5 * * * *", () => {
  expireOldRequests();
});

// ── Check Sunday Approval on Employee Login ─────────────────────────────────
const checkSundayApproval = (user) => {
  return new Promise((resolve, reject) => {
    // 1. If not Sunday, directly allow
    if (!isTodaySunday()) {
      return resolve({ allowed: true });
    }

    const todayStr = getISTDateString();
    const currentTimeStr = getISTTimeString();

    // 2. Check Pre-Approvals first (MODE 2)
    const preApprovalSql = `
      SELECT * FROM sunday_pre_approvals 
      WHERE employee_id = ? AND approved_date = ? AND status = 'active'
      ORDER BY id DESC LIMIT 1
    `;

    db.query(preApprovalSql, [user.id, todayStr], (preErr, preRows) => {
      if (preErr) return reject(preErr);

      if (preRows.length > 0) {
        const pre = preRows[0];
        let isValidTime = true;

        if (!pre.is_full_day && pre.start_time && pre.end_time) {
          if (currentTimeStr < pre.start_time || currentTimeStr > pre.end_time) {
            isValidTime = false;
          }
        }

        if (isValidTime) {
          // Pre-approved! Notify admin via Socket.io
          try {
            const io = socketUtil.getIO();
            io.emit("sunday_login_alert", {
              type: "pre_approved_login",
              employee_id: user.id,
              employee_name: user.full_name,
              time: currentTimeStr,
              message: `Employee ${user.full_name} logged in (Pre-approved Sunday).`
            });
          } catch (e) {
            console.error("Socket error on pre-approved login:", e.message);
          }

          return resolve({ allowed: true, mode: "pre_approved" });
        }
      }

      // 3. Check Real-Time Approval Requests (MODE 1)
      // Expire overdue pending requests first
      expireOldRequests();

      const requestSql = `
        SELECT * FROM sunday_login_requests
        WHERE employee_id = ? AND request_date = ?
        ORDER BY id DESC LIMIT 1
      `;

      db.query(requestSql, [user.id, todayStr], (reqErr, reqRows) => {
        if (reqErr) return reject(reqErr);

        if (reqRows.length > 0) {
          const reqItem = reqRows[0];

          // If approved today, allow login
          if (reqItem.status === "approved") {
            return resolve({ allowed: true, mode: "realtime_approved" });
          }

          // If pending and not expired yet
          const expiresAt = new Date(reqItem.expires_at).getTime();
          const nowTime = new Date().getTime();

          if (reqItem.status === "pending" && expiresAt > nowTime) {
            return resolve({
              allowed: false,
              requireSundayApproval: true,
              status: "pending",
              request: reqItem
            });
          }
        }

        // 4. No valid approval found -> Automatically create a new Pending Request
        const expiresAtTimestamp = Date.now() + 2 * 60 * 60 * 1000; // 2 hours in ms

        const insertSql = `
          INSERT INTO sunday_login_requests 
          (employee_id, employee_name, employee_email, request_date, request_time, status, expires_at)
          VALUES (?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 2 HOUR))
        `;

        db.query(
          insertSql,
          [user.id, user.full_name, user.email_id, todayStr, currentTimeStr],
          (insertErr, insertResult) => {
            if (insertErr) return reject(insertErr);

            const newRequest = {
              id: insertResult.insertId,
              employee_id: user.id,
              employee_name: user.full_name,
              employee_email: user.email_id,
              request_date: todayStr,
              request_time: currentTimeStr,
              status: "pending",
              expires_at_timestamp: expiresAtTimestamp,
              expires_at: new Date(expiresAtTimestamp).toISOString(),
              created_at: new Date()
            };

            // Send Real-Time Socket Notification to Admin
            try {
              const io = socketUtil.getIO();
              io.emit("sunday_new_login_request", newRequest);
              io.to("admin_room").emit("sunday_new_login_request", newRequest);
              console.log(`⚡ Sunday login request broadcasted for ${user.full_name} (ID: ${newRequest.id})`);
            } catch (e) {
              console.error("Socket error broadcasting sunday request:", e.message);
            }

            return resolve({
              allowed: false,
              requireSundayApproval: true,
              status: "pending",
              request: newRequest
            });
          }
        );
      });
    });
  });
};

// ── Admin Controllers ───────────────────────────────────────────────────────

// 1. Get all Sunday Login Requests (with filtering by date & status)
const getSundayRequests = (req, res) => {
  expireOldRequests();
  const { date, status } = req.query;

  let sql = `
    SELECT r.*, u.designation, u.department, u.mobile_number 
    FROM sunday_login_requests r
    LEFT JOIN task_users u ON r.employee_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    sql += ` AND r.request_date = ?`;
    params.push(date);
  } else {
    // Default to today or all pending
    sql += ` AND (r.request_date = ? OR r.status = 'pending')`;
    params.push(getISTDateString());
  }

  if (status && status !== "all") {
    sql += ` AND r.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY r.id DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({
      success: true,
      data: results,
      isSundayToday: isTodaySunday(),
      todayDate: getISTDateString()
    });
  });
};

// 2. Admin responds to Request (Approve / Reject)
const respondToRequest = (req, res) => {
  const { requestId, action, rejection_reason, adminName } = req.body;

  if (!requestId || !["approved", "rejected"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid parameters" });
  }

  const findSql = `
    SELECT r.*, u.id as user_id, u.full_name, u.email_id, u.role, u.password 
    FROM sunday_login_requests r
    JOIN task_users u ON r.employee_id = u.id
    WHERE r.id = ?
  `;

  db.query(findSql, [requestId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const requestItem = rows[0];
    const updateSql = `
      UPDATE sunday_login_requests
      SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ?
      WHERE id = ?
    `;

    const admin = adminName || "Admin";
    const reason = action === "rejected" ? rejection_reason || "Declined by Admin" : null;

    db.query(updateSql, [action, admin, reason, requestId], (upErr) => {
      if (upErr) return res.status(500).json({ success: false, error: upErr.message });

      let token = null;
      let userData = null;

      if (action === "approved") {
        userData = {
          id: requestItem.user_id,
          full_name: requestItem.full_name,
          email_id: requestItem.email_id,
          role: requestItem.role
        };
        token = jwt.sign(
          { id: requestItem.user_id, email: requestItem.email_id, role: requestItem.role },
          process.env.JWT_SECRET || "default_jwt_secret_key_12345",
          { expiresIn: "1d" }
        );
      }

      const socketPayload = {
        requestId,
        employeeId: requestItem.employee_id,
        status: action,
        approved_by: admin,
        rejection_reason: reason,
        token,
        user: userData,
        message: action === "approved"
          ? "Your Sunday login request has been approved by Admin!"
          : `Your Sunday login request was rejected. Reason: ${reason}`
      };

      // Emit real-time Socket.io events
      try {
        const io = socketUtil.getIO();
        io.emit(`sunday_request_status_${requestId}`, socketPayload);
        io.emit(`sunday_request_status_${requestItem.employee_id}`, socketPayload);
        io.emit("sunday_request_updated", socketPayload);
        console.log(`⚡ Sunday approval responded: Request ${requestId} -> ${action}`);
      } catch (e) {
        console.error("Socket emit error on response:", e.message);
      }

      return res.status(200).json({
        success: true,
        message: `Request successfully ${action}`,
        data: socketPayload
      });
    });
  });
};

// 3. Get Pre-Approvals List
const getPreApprovals = (req, res) => {
  const sql = `
    SELECT p.*, u.designation, u.department, u.mobile_number 
    FROM sunday_pre_approvals p
    LEFT JOIN task_users u ON p.employee_id = u.id
    WHERE p.status = 'active'
    ORDER BY p.approved_date DESC, p.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};

// 4. Create Pre-Approval (Single or Multi-select employees)
const createPreApproval = (req, res) => {
  const { employee_ids, approved_date, start_time, end_time, is_full_day, reason, approved_by } = req.body;

  if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0 || !approved_date) {
    return res.status(400).json({ success: false, message: "Employees and approved date are required" });
  }

  // Fetch employees info
  const empSql = `SELECT id, full_name, email_id FROM task_users WHERE id IN (?)`;
  db.query(empSql, [employee_ids], (fetchErr, employees) => {
    if (fetchErr) return res.status(500).json({ success: false, error: fetchErr.message });

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: "No valid employees found" });
    }

    const fullDayVal = is_full_day ? 1 : 0;
    const admin = approved_by || "Admin";

    const values = employees.map((emp) => [
      emp.id,
      emp.full_name,
      emp.email_id,
      approved_date,
      start_time || null,
      end_time || null,
      fullDayVal,
      reason || "Sunday Work Scheduled",
      admin,
      "active"
    ]);

    const insertSql = `
      INSERT INTO sunday_pre_approvals 
      (employee_id, employee_name, employee_email, approved_date, start_time, end_time, is_full_day, reason, approved_by, status)
      VALUES ?
    `;

    db.query(insertSql, [values], (insErr, result) => {
      if (insErr) return res.status(500).json({ success: false, error: insErr.message });

      try {
        const io = socketUtil.getIO();
        io.emit("sunday_pre_approvals_updated", { count: result.affectedRows, approved_date });
      } catch (e) {
        // ignore
      }

      res.status(201).json({
        success: true,
        message: `Successfully pre-approved ${result.affectedRows} employee(s) for ${approved_date}`,
        count: result.affectedRows
      });
    });
  });
};

// 5. Revoke Pre-Approval
const revokePreApproval = (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE sunday_pre_approvals SET status = 'revoked' WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Pre-approval record not found" });
    }

    try {
      const io = socketUtil.getIO();
      io.emit("sunday_pre_approvals_updated", { revokedId: id });
    } catch (e) {
      // ignore
    }

    res.status(200).json({ success: true, message: "Pre-approval revoked successfully" });
  });
};

// 6. Check status of a specific request (Polling fallback for employee)
const checkRequestStatus = (req, res) => {
  const { requestId } = req.params;

  const sql = `
    SELECT r.*, u.id as user_id, u.full_name, u.email_id, u.role
    FROM sunday_login_requests r
    JOIN task_users u ON r.employee_id = u.id
    WHERE r.id = ?
  `;

  db.query(sql, [requestId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const item = rows[0];

    // Check if expired
    if (item.status === "pending" && new Date(item.expires_at).getTime() < Date.now()) {
      item.status = "expired";
      db.query(`UPDATE sunday_login_requests SET status = 'expired' WHERE id = ?`, [requestId]);
    }

    let token = null;
    let user = null;

    if (item.status === "approved") {
      user = {
        id: item.user_id,
        full_name: item.full_name,
        email_id: item.email_id,
        role: item.role
      };
      token = jwt.sign(
        { id: item.user_id, email: item.email_id, role: item.role },
        process.env.JWT_SECRET || "default_jwt_secret_key_12345",
        { expiresIn: "1d" }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        id: item.id,
        status: item.status,
        expires_at: item.expires_at,
        approved_by: item.approved_by,
        rejection_reason: item.rejection_reason,
        token,
        user
      }
    });
  });
};

// 7. Get active employees list for Admin Pre-Approval Dropdown
const getActiveEmployees = (req, res) => {
  const sql = `
    SELECT id, full_name, email_id, designation, department, mobile_number
    FROM task_users
    WHERE employment_status = 'active' AND role != 'admin'
    ORDER BY full_name ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, data: rows });
  });
};

// 8. Manual Request Trigger from Employee (e.g., if re-requesting after expiry)
const createManualRequest = (req, res) => {
  const { emailId, password } = req.body;
  if (!emailId || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const sql = "SELECT * FROM task_users WHERE email_id = ?";
  db.query(sql, [emailId], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const user = result[0];
    const bcrypt = require("bcryptjs");
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (e) {
      // ignore
    }
    if (!isMatch) isMatch = password === user.password;
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    try {
      const checkResult = await checkSundayApproval(user);
      return res.status(200).json({ success: true, ...checkResult });
    } catch (checkErr) {
      return res.status(500).json({ success: false, error: checkErr.message });
    }
  });
};

// 9. Attendance Check-In Gateway (Called when clicking "LOGIN SYSTEM" on Dashboard)
const checkAttendanceAccess = (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const sql = "SELECT * FROM task_users WHERE id = ?";
  db.query(sql, [userId], async (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (result.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    const user = result[0];
    if (user.role === "admin") {
      return res.status(200).json({ success: true, allowed: true });
    }

    try {
      const sundayCheck = await checkSundayApproval(user);
      return res.status(200).json({
        success: true,
        ...sundayCheck,
        user: {
          id: user.id,
          full_name: user.full_name,
          email_id: user.email_id,
          role: user.role
        }
      });
    } catch (checkErr) {
      return res.status(500).json({ success: false, error: checkErr.message });
    }
  });
};

module.exports = {
  checkSundayApproval,
  getSundayRequests,
  respondToRequest,
  getPreApprovals,
  createPreApproval,
  revokePreApproval,
  checkRequestStatus,
  getActiveEmployees,
  createManualRequest,
  checkAttendanceAccess,
  isTodaySunday
};
