/**
 * departmentHelper.js
 * Helpers for department normalization, auto-creation, and Team Lead assignment validation.
 */

const { db } = require("../config/db");

function normalizeDepartmentName(dept) {
  if (!dept) return "";
  const trimmed = dept.trim();
  if (trimmed.toLowerCase() === "seo") return "SEO";
  if (trimmed.toLowerCase() === "hr") return "HR";
  if (trimmed.toLowerCase() === "dm") return "Digital Marketing";
  if (trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return trimmed;
}

function ensureDepartmentExists(deptName, callback) {
  const normName = normalizeDepartmentName(deptName);
  if (!normName) return callback(null, null);

  const selectSql = "SELECT * FROM departments WHERE LOWER(name) = LOWER(?) LIMIT 1";
  db.query(selectSql, [normName], (err, rows) => {
    if (err) return callback(err);
    if (rows.length > 0) {
      return callback(null, rows[0]);
    }
    const insertSql = "INSERT INTO departments (name, strict_deadline_tracking) VALUES (?, 1)";
    db.query(insertSql, [normName], (iErr, result) => {
      if (iErr) {
        // If race condition / duplicate entry, select again
        return db.query(selectSql, [normName], (sErr, sRows) => {
          if (sErr) return callback(sErr);
          return callback(null, sRows[0] || null);
        });
      }
      return callback(null, {
        id: result.insertId,
        name: normName,
        tl_employee_id: null,
        strict_deadline_tracking: 1,
      });
    });
  });
}

/**
 * Validates TL assignment rules before saving:
 * 1. If role === 'team_lead', status MUST be 'active'. (If inactive, returns 400).
 * 2. If role === 'team_lead', department is required.
 * 3. Conflict Check:
 *    - Looks up department's current tl_employee_id.
 *    - If current tl_employee_id points to a DIFFERENT employee:
 *      - Checks that current TL's employment_status in task_users.
 *      - If current TL is ACTIVE: returns 409 conflict.
 *      - If current TL is INACTIVE: allows replacement!
 */
function validateTeamLeadAssignment(
  { employeeId, role, department, employmentStatus },
  callback
) {
  const targetRole = role || "user";
  const targetStatus = employmentStatus || "active";

  if (targetRole !== "team_lead") {
    // Non-TL roles do not trigger TL conflict/status restrictions
    return callback(null, { ok: true });
  }

  // 1. Role='team_lead' requires active status
  if (targetStatus !== "active") {
    return callback(null, {
      ok: false,
      status: 400,
      message: "Inactive employee ko Team Lead nahi banaya ja sakta.",
    });
  }

  if (!department || !department.trim()) {
    return callback(null, {
      ok: false,
      status: 400,
      message: "Team Lead role ke liye Department zaroori hai.",
    });
  }

  ensureDepartmentExists(department, (err, deptRow) => {
    if (err) return callback(err);
    if (!deptRow) {
      return callback(null, {
        ok: false,
        status: 400,
        message: "Invalid department provided.",
      });
    }

    const currentTlId = deptRow.tl_employee_id;
    // If no TL assigned yet, or current TL is this same employee, no conflict
    if (!currentTlId || (employeeId && Number(currentTlId) === Number(employeeId))) {
      return callback(null, { ok: true, deptRow });
    }

    // Check status of current TL in task_users
    const checkTlSql =
      "SELECT id, full_name, employment_status FROM task_users WHERE id = ?";
    db.query(checkTlSql, [currentTlId], (tlErr, tlRows) => {
      if (tlErr) return callback(tlErr);

      if (tlRows.length === 0 || tlRows[0].employment_status !== "active") {
        // Current TL is inactive or deleted -> allow replacement!
        return callback(null, { ok: true, deptRow, replacedTlId: currentTlId });
      }

      // Current TL is active -> CONFLICT 409
      const activeTlName = tlRows[0].full_name ? tlRows[0].full_name.trim() : "Unknown";
      return callback(null, {
        ok: false,
        status: 409,
        message: `Is department ka TL already ${activeTlName} hai.`,
      });
    });
  });
}

/**
 * Syncs departments.tl_employee_id after task_users row is inserted or updated:
 * - If user is active and role === 'team_lead', set departments.tl_employee_id = user.id for their department.
 *   And clear tl_employee_id for any other department where they were TL.
 * - If user is NOT active, or role !== 'team_lead', clear tl_employee_id on any department where they were TL.
 */
function syncDepartmentTeamLead(
  { employeeId, role, department, employmentStatus },
  callback
) {
  if (!employeeId) return callback && callback(null);

  const targetRole = role || "user";
  const targetStatus = employmentStatus || "active";

  if (targetRole === "team_lead" && targetStatus === "active" && department) {
    ensureDepartmentExists(department, (err, deptRow) => {
      if (err) return callback && callback(err);
      if (!deptRow) return callback && callback(null);

      // Set this department's TL
      const setSql = "UPDATE departments SET tl_employee_id = ? WHERE id = ?";
      db.query(setSql, [employeeId, deptRow.id], (sErr) => {
        if (sErr) return callback && callback(sErr);

        // Clear any other departments that had this employee as TL
        const clearOtherSql =
          "UPDATE departments SET tl_employee_id = NULL WHERE tl_employee_id = ? AND id != ?";
        db.query(clearOtherSql, [employeeId, deptRow.id], (cErr) => {
          if (cErr) return callback && callback(cErr);
          return callback && callback(null);
        });
      });
    });
  } else {
    // If not TL or inactive, clear any department pointing to this employee
    const clearSql = "UPDATE departments SET tl_employee_id = NULL WHERE tl_employee_id = ?";
    db.query(clearSql, [employeeId], (cErr) => {
      if (cErr) return callback && callback(cErr);
      return callback && callback(null);
    });
  }
}

module.exports = {
  normalizeDepartmentName,
  ensureDepartmentExists,
  validateTeamLeadAssignment,
  syncDepartmentTeamLead,
};

