const { db } = require('../config/db');
const {
  normalizeDepartmentName,
  validateTeamLeadAssignment,
  syncDepartmentTeamLead,
} = require('../utils/departmentHelper');
const moment = require("moment-timezone");

// Route to update projects
const UpdateProject = (req, res) => {
  const { id, name, department } = req.body;
  console.log(name, id, department, 'print');

  const updateQuery = `UPDATE projects SET name = ?, department = ? WHERE id = ?`;
  console.log(updateQuery);

  db.query(updateQuery, [name, department || null, id], (err, result) => {
    console.log(updateQuery, name, department, id);

    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, error: 'Failed to update project' });
    }
    return res.status(200).json({ success: true, message: 'Project updated successfully' });
  });
};

// Similar routes for categories and subcategories...
// Update Category
const UpdateCategory = (req, res) => {
  const { id, name } = req.body;
  const updateQuery = `UPDATE category SET name = ? WHERE id = ?`;

  db.query(updateQuery, [name, id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to update category' });
    }
    return res.status(200).json({ success: true, message: 'Category updated successfully' });
  });
};

// Update Subcategory
const UpdateSubcategory = (req, res) => {
  const { id, name, category_id } = req.body;
  const updateQuery = `UPDATE subcategory SET name = ?, category_id = ? WHERE id = ?`;

  db.query(updateQuery, [name, category_id, id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to update subcategory' });
    }
    return res.status(200).json({ success: true, message: 'Subcategory updated successfully' });
  });
};


const UpdateEmployeeDetails = (req, res) => {
  let {
    id,
    full_name,
    designation,
    email_id,
    mobile_number,
    role,
    employment_status,
    salary_amount,
  } = req.body;

  if (
    !id ||
    !full_name ||
    !designation ||
    !email_id ||
    !mobile_number ||
    !employment_status
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields to update employee details.",
    });
  }

  const UpdateEmployee = `
    UPDATE task_users
    SET full_name = ?, designation = ?, email_id = ?, mobile_number = ?, role = ?, employment_status = ?
    WHERE id = ?;
  `;

  db.query(
    UpdateEmployee,
    [full_name, designation, email_id, mobile_number, role || "user", employment_status, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Failed to update employee details.",
          message: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      // Auto-sync department Team Lead mapping in departments table
      const targetDept = req.body.department;
      if (targetDept) {
        syncDepartmentTeamLead(
          { employeeId: id, role: role || "user", department: targetDept, employmentStatus },
          (sErr) => {
            if (sErr) console.error("[UpdateEmployeeDetails] Error syncing department TL:", sErr.message);
          }
        );
      } else {
        // Fetch employee's current department from task_users if not provided in request body
        db.query("SELECT department FROM task_users WHERE id = ? LIMIT 1", [id], (deptErr, deptRows) => {
          const dept = (deptRows && deptRows[0]?.department) || null;
          syncDepartmentTeamLead(
            { employeeId: id, role: role || "user", department: dept, employmentStatus },
            (sErr) => {
              if (sErr) console.error("[UpdateEmployeeDetails] Error syncing department TL:", sErr.message);
            }
          );
        });
      }

      // ----------- Salary update/insert logic -----------
      const checkSalaryQuery = `
        SELECT salary_id FROM emp_salary WHERE employee_id = ?
      `;

      db.query(checkSalaryQuery, [id], (err, rows) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: "Error checking salary record.",
            message: err.message,
          });
        }

        const currentTime = new Date().toISOString();

        if (rows.length > 0) {
          // Salary Record Exists → UPDATE
          const updateSalaryQuery = `
            UPDATE emp_salary
            SET salary_amount = ?, salary_updated_at = ?
            WHERE employee_id = ?
          `;

          db.query(
            updateSalaryQuery,
            [salary_amount, currentTime, id],
            (err2) => {
              if (err2) {
                return res.status(500).json({
                  success: false,
                  error: "Failed to update salary.",
                  message: err2.message,
                });
              }

              return res.status(200).json({
                success: true,
                message: "Employee & Salary updated successfully.",
              });
            }
          );
        } else {
          // Salary Record does not exist → INSERT
          const insertSalaryQuery = `
            INSERT INTO emp_salary (employee_id, salary_amount, salary_created_at)
            VALUES (?, ?, ?)
          `;

          db.query(
            insertSalaryQuery,
            [id, salary_amount, currentTime],
            (err3) => {
              if (err3) {
                return res.status(500).json({
                  success: false,
                  error: "Failed to insert new salary record.",
                  message: err3.message,
                });
              }

              return res.status(200).json({
                success: true,
                message: "Employee updated & new Salary added successfully.",
              });
            }
          );
        }
      });
    }
  );
};


const checkNoTaskEmployee = (req, res) => {
  try {
    let { date } = req.params;

    const formattedDate = moment.tz(date, ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"], "Asia/Kolkata").format("YYYY-MM-DD");

    // Check if parsed correctly
    if (formattedDate === "Invalid date") {
      return res.status(400).json({ success: false, message: "Invalid date format. Use DD-MM-YYYY or YYYY-MM-DD." });
    }

    // Fetch all active users
    const allActiveUsersQuery = `
      SELECT tu.id AS user_id, tu.full_name, tu.email_id, tu.designation, tu.department
      FROM task_users tu
      WHERE tu.employment_status = 'active'
    `;

    // Fetch users who have filled tasks for the given date
    const filledUsersQuery = `
      SELECT DISTINCT user_id
      FROM tasks
      WHERE task_date = ?
    `;

    db.query(allActiveUsersQuery, (err, allUsers) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      db.query(filledUsersQuery, [formattedDate], (err, filledUsers) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        const filledIds = filledUsers.map((t) => t.user_id);
        const missingEmployees = allUsers.filter(
          (user) => !filledIds.includes(user.user_id)
        );

        return res.status(200).json({
          success: true,
          date: formattedDate,
          totalMissing: missingEmployees.length,
          missingEmployees,
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const updateEmployeeKyc = (req, res) => {
  try {
    const employeeId = req.params.empId;
    const body = req.body;
    const files = req.files;

    // Fetch existing employee to evaluate TL role and department transitions
    db.query("SELECT id, role, department, employment_status, full_name FROM task_users WHERE id = ?", [employeeId], (fetchErr, empRows) => {
      if (fetchErr) {
        return res.status(500).json({ success: false, message: "Database error", error: fetchErr.message });
      }
      if (empRows.length === 0) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }

      const currentEmp = empRows[0];
      const targetRole = body.role !== undefined && body.role !== "" && body.role !== "null" ? body.role : currentEmp.role;
      const rawDept = body.department !== undefined && body.department !== "" && body.department !== "null" ? body.department : currentEmp.department;
      const targetDept = normalizeDepartmentName(rawDept);
      const targetStatus = body.employment_status !== undefined && body.employment_status !== "" && body.employment_status !== "null" ? body.employment_status : currentEmp.employment_status;

      if (body.department !== undefined && body.department !== "" && body.department !== "null") {
        body.department = targetDept;
      }

      // Validate Team Lead active-only and conflict rules
      validateTeamLeadAssignment({ employeeId, role: targetRole, department: targetDept, employmentStatus: targetStatus }, (valErr, valResult) => {
        if (valErr) {
          return res.status(500).json({ success: false, message: "Database error", error: valErr.message });
        }
        if (!valResult.ok) {
          return res.status(valResult.status).json({ success: false, message: valResult.message });
        }

    // Allowed table fields only
    const allowedFields = [
      "role",
      "full_name",
      "mobile_number",
      "email_id",
      "designation",
      "bloodGroup",
      "DOB",
      "joiningDate",
      "address",
      "profileIMG",
      "password",
      "department",
      "employment_status",
      "aadhar_number",
      "pan_number",
      "driving_licence",
      "aadhar_card_image",
      "pan_card_image",
      "bank_account_number",
      "bank_ifsc_number",
      "bank_upi_id",
      "bank_barcode",
      "previous_company_experience_letter",
      "previous_company_relieving_letter",
      "salary_slips",
      "previous_employer_contact",
      "graduation_degree_marksheets",
      "cancelled_cheque",
      "offer_letter",
      "emergency_contact",
      "emp_created_at",
      "emp_updated_at"
    ];

    let updateFields = [];


    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        // Skip if this field is being updated via a direct file upload in req.files
        if (files && files[key]) return;

        const value = body[key];

        // ONLY add to update query if value is NOT empty, null, undefined, or "null" string
        // This prevents overwriting existing database values with blank/null state
        if (value !== undefined && value !== null && value !== "" && value !== "null") {
          updateFields.push(`${key} = ${db.escape(value)}`);
        }
      }
    });

    // Process file fields if they are allowed
    if (files) {
      for (const key in files) {
        if (allowedFields.includes(key)) {
          const filename = files[key][0].filename;
          const filePath = `/uploads/employees/${filename}`;
          updateFields.push(`${key} = ${db.escape(filePath)}`);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const sql = `
      UPDATE task_users 
      SET ${updateFields.join(", ")}
      WHERE id = ${db.escape(employeeId)}
    `;

    db.query(sql, (err, result) => {
      if (err) {
        console.log("Error updating employee:", err);
        return res.status(500).json({ message: "Database error", err });
      }

      syncDepartmentTeamLead({ employeeId, role: targetRole, department: targetDept, employmentStatus: targetStatus }, (sErr) => {
        if (sErr) console.error("Error syncing department TL:", sErr.message);
        return res.json({
          success: true,
          message: "Employee updated successfully",
          result,
        });
      });
    });
      });
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
  UpdateProject,
  UpdateCategory,
  UpdateSubcategory,
  UpdateEmployeeDetails,
  checkNoTaskEmployee,
  updateEmployeeKyc

}
