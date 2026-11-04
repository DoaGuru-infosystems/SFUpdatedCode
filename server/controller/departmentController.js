/**
 * departmentController.js
 * Controller for managing formal departments and deadline tracking flags.
 * Restricted to Admin and GM roles.
 */

const { db } = require("../config/db");
const jwt = require("jsonwebtoken");

function getAuthUser(req) {
  const authHeader = req.headers.authorization || req.headers["x-access-token"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
  if (!token) return null;

  const secretKey = process.env.JWT_SECRET || "Priyanshuisafullstackdeveloper";
  try {
    return jwt.verify(token, secretKey);
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/admin/departments
 * Admin / GM only: lists all departments with TL information and deadline tracking status
 */
const getAdminDepartments = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const sql = `
    SELECT 
      d.id,
      d.name,
      d.tl_employee_id,
      TRIM(u.full_name) AS tl_name,
      u.email_id AS tl_email,
      d.strict_deadline_tracking,
      d.created_at
    FROM departments d
    LEFT JOIN task_users u ON d.tl_employee_id = u.id
    ORDER BY d.id ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("[Departments] Error fetching departments:", err.message);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    const formatted = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      tl_employee_id: r.tl_employee_id ? Number(r.tl_employee_id) : null,
      tl_name: r.tl_name || null,
      tl_email: r.tl_email || null,
      strict_deadline_tracking: Boolean(r.strict_deadline_tracking),
      created_at: r.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  });
};

/**
 * PATCH /api/admin/department/:id/deadline-tracking
 * Admin / GM only: toggles or sets strict_deadline_tracking for a single department
 * Body: { strict_deadline_tracking: boolean }
 */
const updateDeadlineTracking = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const { id } = req.params;
  const { strict_deadline_tracking } = req.body;

  if (strict_deadline_tracking === undefined || typeof strict_deadline_tracking !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Bad Request: strict_deadline_tracking boolean field is required in body",
    });
  }

  const val = strict_deadline_tracking ? 1 : 0;
  const updateSql = `UPDATE departments SET strict_deadline_tracking = ? WHERE id = ?`;

  db.query(updateSql, [val, id], (err, result) => {
    if (err) {
      console.error("[Departments] Error updating deadline tracking:", err.message);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    // Fetch the updated row to return
    const fetchSql = `
      SELECT 
        d.id,
        d.name,
        d.tl_employee_id,
        TRIM(u.full_name) AS tl_name,
        d.strict_deadline_tracking,
        d.created_at
      FROM departments d
      LEFT JOIN task_users u ON d.tl_employee_id = u.id
      WHERE d.id = ?
    `;

    db.query(fetchSql, [id], (fErr, fRows) => {
      if (fErr || fRows.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Deadline tracking updated successfully",
          data: {
            id: Number(id),
            strict_deadline_tracking: Boolean(val),
          },
        });
      }

      const row = fRows[0];
      return res.status(200).json({
        success: true,
        message: "Deadline tracking updated successfully",
        data: {
          id: Number(row.id),
          name: row.name,
          tl_employee_id: row.tl_employee_id ? Number(row.tl_employee_id) : null,
          tl_name: row.tl_name || null,
          strict_deadline_tracking: Boolean(row.strict_deadline_tracking),
          created_at: row.created_at,
        },
      });
    });
  });
};

module.exports = {
  getAdminDepartments,
  updateDeadlineTracking,
};

