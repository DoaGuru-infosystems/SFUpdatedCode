/**
 * projectAssignmentController.js
 * Handles Phase 3 Project Owner & Task Owner assignments.
 *
 * Routes:
 * - GET  /api/leader/re-projects
 * - POST /api/leader/assign-project-owner
 * - GET  /api/employee/owned-projects
 * - POST /api/employee/assign-task-owner
 */

const { db } = require("../config/db");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const {
  matchesCategoryAndDepartment,
  deriveProjectStatus,
  isStrictDepartment,
} = require("../utils/projectStatusHelper");
const socketUtil = require("../utils/socket");
const { sendStatusUpdateToRE } = require("../services/reWebhookSender");
const {
  notifyProjectOwnerAssigned,
  notifyTaskOwnerAssigned,
  notifyDepartmentTlAssigned,
} = require("../services/reAssignmentWhatsAppService");

// Helper to check if caller has Admin or GM role
function isCallerAdminOrGm(user) {
  if (!user) return false;
  const role = String(user.role || "").trim().toLowerCase();
  return role === "admin" || role === "gm";
}

// Helper to authenticate user from token
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

// ── TASK 2: Team Lead: see relevant synced projects/tasks ───────────────────
// GET /api/leader/re-projects (Enhanced: Phase G task-level visibility & GM direct tracking)
const getLeaderReProjects = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "team_lead") {
    return res.status(403).json({ success: false, message: "Forbidden: Team Lead access required" });
  }

  // 1. Fetch TL department
  const getDeptSql = "SELECT department FROM task_users WHERE id = ?";
  db.query(getDeptSql, [user.id], (deptErr, deptRows) => {
    if (deptErr) {
      console.error("[Leader RE] Error fetching TL department:", deptErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: deptErr.message });
    }

    if (deptRows.length === 0 || !deptRows[0].department) {
      return res.status(200).json({ success: true, data: [] });
    }

    const tlDepartment = deptRows[0].department;

    // Fetch department list metadata for strict_deadline_tracking
    const deptMetaSql = "SELECT id, name, strict_deadline_tracking FROM departments";
    db.query(deptMetaSql, (dErr, allDepts) => {
      const deptsList = Array.isArray(allDepts) ? allDepts : [];
      const matchedDept = deptsList.find((d) => matchesCategoryAndDepartment(d.name, tlDepartment));
      const tlDeptId = matchedDept ? matchedDept.id : null;

      // Query projects explicitly assigned to this TL's department via re_project_departments
      const explicitSql = tlDeptId
        ? "SELECT project_id FROM re_project_departments WHERE department_id = ?"
        : "SELECT 0 AS project_id WHERE 1=0";

      db.query(explicitSql, [tlDeptId || 0], (expErr, expRows) => {
        const explicitProjectIds = new Set((expRows || []).map((r) => r.project_id));

        // Fetch active project owners with assigner information
        const poSql = `
          SELECT 
            po.project_id,
            po.employee_id,
            po.assigned_by_gm,
            u.full_name AS po_name,
            u.department AS po_department
          FROM project_owners po
          JOIN task_users u ON po.employee_id = u.id
          WHERE po.status = 'active'
        `;

        db.query(poSql, (poErr, poRows) => {
          const poByProject = new Map();
          (poRows || []).forEach((po) => {
            poByProject.set(po.project_id, po);
          });

          // Fetch all RE-synced projects joined with task_owners, assignees, and assigners
          const projectsSql = `
            SELECT 
              rsp.project_id,
              rsp.re_proforma_id,
              rsp.re_proforma_number,
              COALESCE(rsp.client_name, p.name) AS client_name,
              rsp.start_date,
              rsp.end_date,
              t.id AS task_owners_id,
              t.re_item_name AS task_name,
              t.category,
              t.description,
              t.status,
              t.employee_id,
              t.deadline,
              t.assigned_by,
              t.assigned_by_gm,
              u.full_name AS employee_name,
              u.department AS employee_department,
              COALESCE(au.full_name, tu_assigner.full_name) AS assigner_name
            FROM re_synced_projects rsp
            JOIN projects p ON rsp.project_id = p.id
            JOIN task_owners t ON rsp.project_id = t.project_id
            LEFT JOIN task_users u ON t.employee_id = u.id
            LEFT JOIN admin_users au ON t.assigned_by = au.id
            LEFT JOIN task_users tu_assigner ON t.assigned_by = tu_assigner.id
            WHERE rsp.is_active = 1
            ORDER BY rsp.created_at DESC, t.id ASC
          `;

          db.query(projectsSql, (projErr, rows) => {
            if (projErr) {
              console.error("[Leader RE] Error fetching projects and tasks:", projErr.message);
              return res.status(500).json({ success: false, message: "Database error", error: projErr.message });
            }

            const projectMap = new Map();

            rows.forEach((row) => {
              if (!projectMap.has(row.project_id)) {
                const poInfo = poByProject.get(row.project_id);
                projectMap.set(row.project_id, {
                  project_id         : row.project_id,
                  re_proforma_id     : row.re_proforma_id,
                  re_proforma_number : row.re_proforma_number || null,
                  client_name        : row.client_name,
                  start_date         : row.start_date,
                  end_date           : row.end_date,
                  project_owner_id   : poInfo ? poInfo.employee_id : null,
                  project_owner_name : poInfo ? poInfo.po_name : null,
                  po_assigned_by_gm  : Boolean(poInfo?.assigned_by_gm === 1),
                  tasks              : [],
                });
              }

              // Department inclusion check for TL:
              // 1. Task category matches TL department, OR
              // 2. Project explicitly assigned to this TL's department, OR
              // 3. Task assigned to employee belonging to this TL's department
              const catMatches = matchesCategoryAndDepartment(row.category, tlDepartment);
              const isExplicit = explicitProjectIds.has(row.project_id);
              const empMatches = row.employee_department && matchesCategoryAndDepartment(row.employee_department, tlDepartment);

              if (catMatches || isExplicit || empMatches) {
                const isStrict = isStrictDepartment({ category: row.category }, deptsList);
                const deadlineDisplay = isStrict
                  ? (row.deadline ? moment(row.deadline).format("DD-MM-YYYY") : "Deadline Pending")
                  : "No fixed deadline";

                projectMap.get(row.project_id).tasks.push({
                  task_owners_id       : row.task_owners_id,
                  task_name            : row.task_name,
                  category             : row.category,
                  description          : row.description || null,
                  status               : row.status,
                  employee_id          : row.employee_id,
                  employee_name        : row.employee_name || null,
                  deadline             : row.deadline || null,
                  deadline_display     : deadlineDisplay,
                  is_strict_department : isStrict,
                  assigned_by_gm       : Boolean(row.assigned_by_gm === 1),
                  assigned_by_name     : row.assigner_name || null,
                });
              }
            });

            // Filter: Keep only projects that have at least one matching task OR explicit department assignment
            const result = [];
            projectMap.forEach((proj) => {
              if (proj.tasks.length > 0 || explicitProjectIds.has(proj.project_id)) {
                result.push(proj);
              }
            });

            return res.status(200).json({
              success: true,
              data: result,
            });
          });
        });
      });

    });
  });
};

// ── TASK 3: Team Lead: mark employee as Project Owner ───────────────────────
// POST /api/leader/assign-project-owner
const assignProjectOwner = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "team_lead") {
    return res.status(403).json({ success: false, message: "Forbidden: Team Lead access required" });
  }

  const { project_id, employee_id } = req.body;
  if (!project_id || !employee_id) {
    return res.status(400).json({ success: false, message: "project_id and employee_id are required" });
  }

  // 1. Fetch TL department
  const getLeaderDeptSql = "SELECT department FROM task_users WHERE id = ?";
  db.query(getLeaderDeptSql, [user.id], (leadErr, leadRows) => {
    if (leadErr) {
      console.error("[Assign PO] Error fetching leader department:", leadErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: leadErr.message });
    }

    if (leadRows.length === 0 || !leadRows[0].department) {
      return res.status(403).json({ success: false, message: "Leader department not configured" });
    }

    const leaderDept = leadRows[0].department;

    // 2. Validate employee belongs to same department (using exact getMembersQuery pattern)
    const checkMemberSql = `
      SELECT id, role, full_name, email_id, designation, department
      FROM task_users
      WHERE LOWER(department) = LOWER(?)
        AND (role = 'user' OR id = ?)
        AND employment_status = 'active'
        AND id = ?
    `;

    db.query(checkMemberSql, [leaderDept, user.id, employee_id], (memErr, memRows) => {
      if (memErr) {
        console.error("[Assign PO] Error validating member:", memErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: memErr.message });
      }

      if (memRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Employee does not belong to your department or is not active",
        });
      }

      // 3. Check if active row already exists
      const checkExistingSql = `
        SELECT id FROM project_owners
        WHERE project_id = ? AND employee_id = ? AND status = 'active'
      `;

      db.query(checkExistingSql, [project_id, employee_id], (chkErr, existingRows) => {
        if (chkErr) {
          console.error("[Assign PO] Error checking existing assignment:", chkErr.message);
          return res.status(500).json({ success: false, message: "Database error", error: chkErr.message });
        }

        if (existingRows.length > 0) {
          return res.status(200).json({
            success: true,
            message: "Project Owner already assigned",
            data: { id: existingRows[0].id },
          });
        }

        // 4. Insert or reactivate row
        const insertPoSql = `
          INSERT INTO project_owners (project_id, employee_id, assigned_by, status)
          VALUES (?, ?, ?, 'active')
          ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), status = 'active', assigned_by = VALUES(assigned_by)
        `;

        db.query(insertPoSql, [project_id, employee_id, user.id], (insErr, insResult) => {
          if (insErr) {
            console.error("[Assign PO] Error inserting project_owner:", insErr.message);
            return res.status(500).json({ success: false, message: "Database error", error: insErr.message });
          }

          console.log(`[Assign PO] ✅ Employee ${employee_id} assigned as PO for project ${project_id} by TL ${user.id}`);

          // Asynchronously notify assigned Project Owner via WhatsApp
          notifyProjectOwnerAssigned({
            projectId: project_id,
            employeeId: employee_id,
            tlUserId: user.id,
          }).catch((wErr) => console.error("[Assign PO] WhatsApp dispatch error:", wErr.message));

          const finalPoId = (insResult && insResult.insertId) ? insResult.insertId : (existingRows[0] ? existingRows[0].id : 0);

          return res.status(200).json({
            success: true,
            message: "Project Owner assigned",
            data: { id: finalPoId },
          });
        });
      });
    });
  });
};

// ── TASK 4: Employee: "Projects I Own" ──────────────────────────────────────
// GET /api/employee/owned-projects
const getEmployeeOwnedProjects = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  // 1. Fetch employee's department
  const getEmpDeptSql = "SELECT department FROM task_users WHERE id = ?";
  db.query(getEmpDeptSql, [user.id], (deptErr, deptRows) => {
    if (deptErr) {
      console.error("[Owned Projects] Error fetching employee department:", deptErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: deptErr.message });
    }

    if (deptRows.length === 0 || !deptRows[0].department) {
      return res.status(200).json({ success: true, data: [] });
    }

    const empDepartment = deptRows[0].department;

    // 2. Fetch all ACTIVE project_owners rows for this employee
    const ownedProjectsSql = `
      SELECT 
        po.project_id,
        po.created_at AS assigned_at,
        p.name AS project_name,
        rsp.client_name,
        rsp.start_date,
        rsp.end_date,
        rsp.re_proforma_id,
        rsp.re_proforma_number
      FROM project_owners po
      JOIN projects p ON po.project_id = p.id
      LEFT JOIN re_synced_projects rsp ON po.project_id = rsp.project_id
      WHERE po.employee_id = ? AND po.status = 'active' AND rsp.is_active = 1
      ORDER BY po.created_at DESC
    `;

    db.query(ownedProjectsSql, [user.id], (poErr, poRows) => {
      if (poErr) {
        console.error("[Owned Projects] Error fetching project_owners:", poErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: poErr.message });
      }

      if (poRows.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      const projectIds = poRows.map((r) => r.project_id);

      // 3. Fetch departments for department-aware status derivation
      db.query("SELECT name, strict_deadline_tracking FROM departments", (deptEmpErr, allDeptsEmp) => {
        const deptListEmp = !deptEmpErr && Array.isArray(allDeptsEmp) ? allDeptsEmp : null;

      // 4. Fetch all tasks for these projects to derive status AND filter own-dept tasks
      const tasksSql = `
        SELECT 
          t.id AS task_owners_id,
          t.project_id,
          t.sf_task_id,
          t.re_item_name AS task_name,
          t.category,
          t.description,
          t.quantity,
          t.status,
          t.employee_id,
          t.deadline,
          u.full_name AS employee_name
        FROM task_owners t
        LEFT JOIN task_users u ON t.employee_id = u.id
        WHERE t.project_id IN (?)
        ORDER BY t.id ASC
      `;

      db.query(tasksSql, [projectIds], (taskErr, taskRows) => {
        if (taskErr) {
          console.error("[Owned Projects] Error fetching tasks:", taskErr.message);
          return res.status(500).json({ success: false, message: "Database error", error: taskErr.message });
        }

        // Group tasks by project_id
        const tasksByProject = new Map();
        taskRows.forEach((t) => {
          if (!tasksByProject.has(t.project_id)) {
            tasksByProject.set(t.project_id, []);
          }
          tasksByProject.get(t.project_id).push(t);
        });

        // Assemble response
        const result = poRows.map((p) => {
          const allProjectTasks = tasksByProject.get(p.project_id) || [];
          const overallStatus = deriveProjectStatus(allProjectTasks, deptListEmp);

          // ONLY include tasks matching this employee's department
          const departmentTasks = allProjectTasks
            .filter((t) => matchesCategoryAndDepartment(t.category, empDepartment))
            .map((t) => ({
              task_owners_id: t.task_owners_id,
              sf_task_id    : t.sf_task_id,
              task_name     : t.task_name,
              category      : t.category,
              description   : t.description,
              quantity      : t.quantity,
              status        : t.status,
              employee_id   : t.employee_id,
              employee_name : t.employee_name || null,
              deadline      : t.deadline || null,
            }));

          return {
            project_id         : p.project_id,
            re_proforma_id     : p.re_proforma_id || null,
            re_proforma_number : p.re_proforma_number || null,
            client_name        : p.client_name || p.project_name,
            start_date         : p.start_date || null,
            end_date           : p.end_date || null,
            overall_status     : overallStatus,
            tasks              : departmentTasks,
          };
        });

        return res.status(200).json({
          success: true,
          data: result,
        });
      }); // closes taskRows query
      }); // closes deptSqlEmp query
    }); // closes ownedProjectsSql query
  }); // closes user dept query
};

// ── TASK 5: Assign Task Owner (writes to existing task_owners rows) ──────────
// POST /api/employee/assign-task-owner
const assignTaskOwner = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  const { task_owners_id, employee_id, deadline, description } = req.body;
  if (!task_owners_id || !employee_id) {
    return res.status(400).json({ success: false, message: "task_owners_id and employee_id are required" });
  }

  // 1. Fetch task to get project_id and check if already assigned
  const getTaskSql = "SELECT id, project_id, category, employee_id FROM task_owners WHERE id = ?";
  db.query(getTaskSql, [task_owners_id], (tErr, tRows) => {
    if (tErr) {
      console.error("[Assign Task] Error fetching task:", tErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: tErr.message });
    }

    if (tRows.length === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // If task is already assigned to someone, block fresh "Assign" - must use Reassign
    if (tRows[0].employee_id) {
      return res.status(400).json({
        success: false,
        message: "This task is already assigned. Please use Reassign instead.",
      });
    }

    const projectId = tRows[0].project_id;

    // 2. CONTEXTUAL PERMISSION CHECK: Verify requester is PO, TL, or GM/Admin
    const checkPoSql = `
      SELECT id FROM project_owners
      WHERE project_id = ? AND employee_id = ? AND status = 'active'
    `;

    db.query(checkPoSql, [projectId, user.id], (poErr, poRows) => {
      if (poErr) {
        console.error("[Assign Task] Error verifying Project Owner status:", poErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: poErr.message });
      }

      const isPo = poRows.length > 0;
      const isAdminOrGm = isCallerAdminOrGm(user);

      const checkTlSql = "SELECT department, role FROM task_users WHERE id = ?";
      db.query(checkTlSql, [user.id], (tlErr, tlRows) => {
        const isTl = (user.role === "team_lead" || (tlRows && tlRows.length > 0 && tlRows[0].role === "team_lead")) &&
                     tlRows && tlRows.length > 0 &&
                     matchesCategoryAndDepartment(tRows[0].category, tlRows[0].department);

        if (!isPo && !isTl && !isAdminOrGm) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: You must be an active Project Owner, Team Lead, or GM/Admin to assign this task",
          });
        }

        // 3. Update existing task_owners row
        const updateTaskSql = `
          UPDATE task_owners
          SET employee_id = ?, assigned_by = ?, deadline = ?, description = COALESCE(?, description), status = 'pending'
          WHERE id = ?
        `;

        db.query(updateTaskSql, [employee_id, user.id, deadline || null, description || null, task_owners_id], (updErr) => {
          if (updErr) {
            console.error("[Assign Task] Error updating task_owners:", updErr.message);
            return res.status(500).json({ success: false, message: "Database error", error: updErr.message });
          }

          console.log(`[Assign Task] ✅ Task ${task_owners_id} assigned to employee ${employee_id} by user ${user.id}`);

          // Asynchronously notify assigned Task Owner via WhatsApp
          notifyTaskOwnerAssigned({
            taskOwnersId: task_owners_id,
            employeeId: employee_id,
            poUserId: user.id,
            deadline: deadline || null,
          }).catch((wErr) => console.error("[Assign Task] WhatsApp dispatch error:", wErr.message));

          // Outbound RE Webhook sync (Phase 6)
          sendStatusUpdateToRE(projectId, user.id).catch((e) => console.error("[RE Sync Trigger] Error:", e.message));

          return res.status(200).json({
            success: true,
            message: "Task Owner assigned",
            data: {
              task_owners_id: Number(task_owners_id),
              employee_id: Number(employee_id),
              deadline: deadline || null,
            },
          });
        });
      });
    });
  });
};

// ── TASK 2 (Phase 4): Employee's own assigned RE tasks ───────────────────────
// GET /api/employee/my-re-tasks
const getMyReTasks = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  const query = `
    SELECT 
      t.id AS task_owners_id,
      t.project_id,
      COALESCE(rsp.client_name, p.name) AS client_name,
      t.re_item_name AS task_name,
      t.category,
      t.description,
      t.deadline,
      t.status
    FROM task_owners t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN re_synced_projects rsp ON t.project_id = rsp.project_id
    WHERE t.employee_id = ? AND rsp.is_active = 1
    ORDER BY t.deadline ASC, t.id DESC
  `;

  db.query(query, [user.id], (err, rows) => {
    if (err) {
      console.error("[My RE Tasks] Error fetching tasks:", err.message);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    const formatted = rows.map((r) => ({
      task_owners_id: r.task_owners_id,
      project_id    : r.project_id,
      client_name   : r.client_name,
      task_name     : r.task_name,
      category      : r.category,
      description   : r.description,
      deadline      : r.deadline ? (typeof r.deadline === "string" ? r.deadline.substring(0, 10) : new Date(r.deadline).toISOString().split("T")[0]) : null,
      status        : r.status,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  });
};

// ── TASK 3 (Phase 4): Status update endpoint ─────────────────────────────────
// PATCH /api/employee/task-status/:task_owners_id
const updateTaskStatus = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  const { task_owners_id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "in_progress", "review", "completed"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  // Ownership check: verify task_owners.employee_id === user.id
  const checkOwnerSql = "SELECT id, employee_id, project_id FROM task_owners WHERE id = ?";
  db.query(checkOwnerSql, [task_owners_id], (chkErr, rows) => {
    if (chkErr) {
      console.error("[Task Status] Error checking task ownership:", chkErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: chkErr.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (String(rows[0].employee_id) !== String(user.id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not assigned to this task",
      });
    }

    const updateSql = "UPDATE task_owners SET status = ? WHERE id = ?";
    db.query(updateSql, [status, task_owners_id], (updErr) => {
      if (updErr) {
        console.error("[Task Status] Error updating status:", updErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: updErr.message });
      }

      console.log(`[Task Status] ✅ Task ${task_owners_id} status updated to '${status}' by employee ${user.id}`);

      // Outbound RE Webhook sync (Phase 6)
      const projectId = rows[0].project_id;
      sendStatusUpdateToRE(projectId, user.id).catch((e) => console.error("[RE Sync Trigger] Error:", e.message));

      return res.status(200).json({
        success: true,
        message: "Status updated",
      });
    });
  });
};

// ── TASK 2 (Phase 5): Reassign a Task Owner ─────────────────────────────────
// POST /api/employee/reassign-task
const reassignTaskOwner = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  const { task_owners_id, new_employee_id, reason } = req.body;
  if (!task_owners_id || !new_employee_id) {
    return res.status(400).json({ success: false, message: "task_owners_id and new_employee_id are required" });
  }

  // 1. Fetch task details + client_name + project_id
  const taskSql = `
    SELECT 
      t.id, t.project_id, t.sf_task_id, t.re_item_name, t.category, 
      t.description, t.quantity, t.status, t.employee_id, t.deadline,
      COALESCE(rsp.client_name, p.name) AS client_name
    FROM task_owners t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN re_synced_projects rsp ON t.project_id = rsp.project_id
    WHERE t.id = ?
  `;

  db.query(taskSql, [task_owners_id], (tErr, tRows) => {
    if (tErr) {
      console.error("[Reassign Task] Error fetching task:", tErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: tErr.message });
    }

    if (tRows.length === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const task = tRows[0];
    const old_employee_id = task.employee_id;

    // 2. Auth check: Requester must EITHER be:
    //    a) active Project Owner for this project, OR
    //    b) TL for this task's department
    const checkPoSql = `
      SELECT id FROM project_owners
      WHERE project_id = ? AND employee_id = ? AND status = 'active'
    `;

    db.query(checkPoSql, [task.project_id, user.id], (poErr, poRows) => {
      if (poErr) {
        console.error("[Reassign Task] Error checking PO status:", poErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: poErr.message });
      }

      const isPo = poRows.length > 0;

      // Check TL status & department
      const getTLDeptSql = "SELECT department, role FROM task_users WHERE id = ?";
      db.query(getTLDeptSql, [user.id], (tlErr, tlRows) => {
        if (tlErr) {
          console.error("[Reassign Task] Error checking user role:", tlErr.message);
          return res.status(500).json({ success: false, message: "Database error", error: tlErr.message });
        }

        const isTL = (user.role === "team_lead" || (tlRows.length > 0 && tlRows[0].role === "team_lead")) &&
                     tlRows.length > 0 &&
                     matchesCategoryAndDepartment(task.category, tlRows[0].department);

        const isAdminOrGm = isCallerAdminOrGm(user);

        if (!isAdminOrGm && !isPo && !isTL) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: You must be an active Project Owner or the department Team Lead to reassign this task",
          });
        }

        // 3. Validate new_employee_id exists and is active
        const getNewEmpSql = "SELECT id, full_name, department, employment_status FROM task_users WHERE id = ?";
        db.query(getNewEmpSql, [new_employee_id], (empErr, empRows) => {
          if (empErr) {
            console.error("[Reassign Task] Error checking new employee:", empErr.message);
            return res.status(500).json({ success: false, message: "Database error", error: empErr.message });
          }

          if (empRows.length === 0) {
            return res.status(404).json({ success: false, message: "New employee not found" });
          }

          const newEmp = empRows[0];

          // Department-match check: COMPLETELY SKIPPED for GM/MD, strictly enforced for TL/PO
          if (!isAdminOrGm) {
            if (!matchesCategoryAndDepartment(task.category, newEmp.department)) {
              return res.status(403).json({
                success: false,
                message: "Forbidden: Employee belongs to a different department than the task category",
              });
            }
          }

          // 4. Transaction: insert assignment_history + update task_owners
          db.getConnection((connErr, conn) => {
            if (connErr) {
              console.error("[Reassign Task] Connection error:", connErr.message);
              return res.status(500).json({ success: false, message: "Database connection error" });
            }

            conn.beginTransaction((txErr) => {
              if (txErr) {
                conn.release();
                console.error("[Reassign Task] Transaction error:", txErr.message);
                return res.status(500).json({ success: false, message: "Transaction start failed" });
              }

              const insertHistorySql = `
                INSERT INTO assignment_history
                  (entity_type, entity_id, project_id, old_employee_id, new_employee_id, changed_by, reason)
                VALUES
                  ('task_owner', ?, ?, ?, ?, ?, ?)
              `;

              conn.query(
                insertHistorySql,
                [task_owners_id, task.project_id, old_employee_id || null, new_employee_id, user.id, reason || null],
                (histErr) => {
                  if (histErr) {
                    return conn.rollback(() => {
                      conn.release();
                      console.error("[Reassign Task] Error logging assignment history:", histErr.message);
                      res.status(500).json({ success: false, message: "Failed to record audit log" });
                    });
                  }

                  const updateTaskSql = `
                    UPDATE task_owners
                    SET employee_id = ?, assigned_by = ?, assigned_by_gm = ?, status = 'pending'
                    WHERE id = ?
                  `;

                  conn.query(updateTaskSql, [new_employee_id, user.id, isAdminOrGm ? 1 : 0, task_owners_id], (updErr) => {
                    if (updErr) {
                      return conn.rollback(() => {
                        conn.release();
                        console.error("[Reassign Task] Error updating task_owners:", updErr.message);
                        res.status(500).json({ success: false, message: "Failed to update task assignment" });
                      });
                    }

                    conn.commit((commitErr) => {
                      if (commitErr) {
                        return conn.rollback(() => {
                          conn.release();
                          console.error("[Reassign Task] Commit error:", commitErr.message);
                          res.status(500).json({ success: false, message: "Failed to commit transaction" });
                        });
                      }

                      conn.release();

                      // 5. Emit Socket.io events
                      try {
                        const io = socketUtil.getIO();
                        if (old_employee_id) {
                          io.to(`employee_${old_employee_id}`).emit("re:task_unassigned", {
                            task_owners_id: Number(task_owners_id),
                            project_id: task.project_id,
                          });
                        }

                        const deadlineStr = task.deadline
                          ? (typeof task.deadline === "string" ? task.deadline.substring(0, 10) : new Date(task.deadline).toISOString().split("T")[0])
                          : null;

                        const taskPayload = {
                          task_owners_id: Number(task.id),
                          project_id    : task.project_id,
                          client_name   : task.client_name,
                          task_name     : task.re_item_name,
                          category      : task.category,
                          description   : task.description,
                          deadline      : deadlineStr,
                          status        : "pending",
                        };

                        io.to(`employee_${new_employee_id}`).emit("re:task_assigned", taskPayload);
                      } catch (sockErr) {
                        console.warn("[Reassign Task] Socket emit warning:", sockErr.message);
                      }

                      console.log(`[Reassign Task] ✅ Task ${task_owners_id} reassigned: ${old_employee_id} -> ${new_employee_id} by user ${user.id}`);

                      // Asynchronously notify newly assigned Task Owner via WhatsApp
                      notifyTaskOwnerAssigned({
                        taskOwnersId: Number(task_owners_id),
                        employeeId: Number(new_employee_id),
                        poUserId: user.id,
                        deadline: task.deadline || null,
                      }).catch((wErr) => console.error("[Reassign Task] WhatsApp dispatch error:", wErr.message));

                      // Outbound RE Webhook sync (Phase 6)
                      sendStatusUpdateToRE(task.project_id, user.id).catch((e) => console.error("[RE Sync Trigger] Error:", e.message));

                      return res.status(200).json({
                        success: true,
                        message: "Task reassigned",
                        data: {
                          task_owners_id: Number(task_owners_id),
                          old_employee_id: old_employee_id || null,
                          new_employee_id: Number(new_employee_id),
                        },
                      });
                    });
                  });
                }
              );
            });
          });
        });
      });
    });
  });
};

// ── TASK 3 (Phase 5): Reassign a Project Owner ──────────────────────────────
// POST /api/leader/reassign-project-owner
const reassignProjectOwner = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  const { project_id, old_employee_id, new_employee_id, reason } = req.body;
  if (!project_id || !new_employee_id) {
    return res.status(400).json({ success: false, message: "project_id and new_employee_id are required" });
  }

  const isAdminOrGm = isCallerAdminOrGm(user);

  // 1. Auth check: Requester must be TL (unless admin/gm)
  const getTLDeptSql = "SELECT department, role FROM task_users WHERE id = ?";
  db.query(getTLDeptSql, [user.id], (tlErr, tlRows) => {
    if (tlErr) {
      console.error("[Reassign PO] Error checking TL:", tlErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: tlErr.message });
    }

    if (!isAdminOrGm && user.role !== "team_lead" && (!tlRows[0] || tlRows[0].role !== "team_lead")) {
      return res.status(403).json({ success: false, message: "Forbidden: Team Lead access required" });
    }

    const tlDepartment = tlRows[0]?.department;

    // 2. Check new_employee exists and is active
    const getNewEmpSql = "SELECT id, full_name, department FROM task_users WHERE id = ?";
    db.query(getNewEmpSql, [new_employee_id], (empErr, empRows) => {
      if (empErr) {
        console.error("[Reassign PO] Error checking new employee:", empErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: empErr.message });
      }

      if (empRows.length === 0) {
        return res.status(404).json({ success: false, message: "New employee not found" });
      }

      const newEmp = empRows[0];

      // Department-match check: COMPLETELY SKIPPED for GM/MD, strictly enforced for TL/PO
      if (!isAdminOrGm) {
        if (tlDepartment && newEmp.department && tlDepartment.toLowerCase() !== newEmp.department.toLowerCase()) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: Employee belongs to a different department",
          });
        }
      }

      // 3. Find current active PO if old_employee_id was not explicitly specified
      const findOldPoSql = "SELECT id, employee_id FROM project_owners WHERE project_id = ? AND status = 'active'";
      db.query(findOldPoSql, [project_id], (fErr, fRows) => {
        if (fErr) {
          console.error("[Reassign PO] Error finding existing PO:", fErr.message);
          return res.status(500).json({ success: false, message: "Database error", error: fErr.message });
        }

        const effectiveOldEmpId = old_employee_id || (fRows.length > 0 ? fRows[0].employee_id : null);

        // 4. Run Transaction:
        //    a) Update active project_owners row(s) to 'removed'
        //    b) Insert or reactivate new project_owners row
        //    c) Insert into assignment_history
        db.getConnection((connErr, conn) => {
          if (connErr) {
            console.error("[Reassign PO] Connection error:", connErr.message);
            return res.status(500).json({ success: false, message: "Database connection error" });
          }

          conn.beginTransaction((txErr) => {
            if (txErr) {
              conn.release();
              console.error("[Reassign PO] Transaction error:", txErr.message);
              return res.status(500).json({ success: false, message: "Transaction start failed" });
            }

            // a) Remove previous active PO
            const removeOldPoSql = `
              UPDATE project_owners 
              SET status = 'removed' 
              WHERE project_id = ? AND status = 'active'
            `;

            conn.query(removeOldPoSql, [project_id], (remErr) => {
              if (remErr) {
                return conn.rollback(() => {
                  conn.release();
                  console.error("[Reassign PO] Error removing old PO:", remErr.message);
                  res.status(500).json({ success: false, message: "Failed to update old Project Owner" });
                });
              }

              // b) Insert or reactivate new PO (with assigned_by_gm)
              const upsertNewPoSql = `
                INSERT INTO project_owners (project_id, employee_id, assigned_by, assigned_by_gm, status)
                VALUES (?, ?, ?, ?, 'active')
                ON DUPLICATE KEY UPDATE status = 'active', assigned_by = VALUES(assigned_by), assigned_by_gm = VALUES(assigned_by_gm)
              `;

              conn.query(upsertNewPoSql, [project_id, new_employee_id, user.id, isAdminOrGm ? 1 : 0], (insErr, insRes) => {
                if (insErr) {
                  return conn.rollback(() => {
                    conn.release();
                    console.error("[Reassign PO] Error inserting new PO:", insErr.message);
                    res.status(500).json({ success: false, message: "Failed to assign new Project Owner" });
                  });
                }

                // Query affected project_owners.id
                const getAffectedPoIdSql = `
                  SELECT id FROM project_owners WHERE project_id = ? AND employee_id = ?
                `;
                conn.query(getAffectedPoIdSql, [project_id, new_employee_id], (idErr, idRows) => {
                  if (idErr || idRows.length === 0) {
                    return conn.rollback(() => {
                      conn.release();
                      console.error("[Reassign PO] Error getting PO id:", idErr?.message);
                      res.status(500).json({ success: false, message: "Failed to retrieve Project Owner record" });
                    });
                  }

                  const affectedPoId = idRows[0].id;

                  // c) Insert into assignment_history
                  const insertHistSql = `
                    INSERT INTO assignment_history
                      (entity_type, entity_id, project_id, old_employee_id, new_employee_id, changed_by, reason)
                    VALUES
                      ('project_owner', ?, ?, ?, ?, ?, ?)
                  `;

                  conn.query(
                    insertHistSql,
                    [affectedPoId, project_id, effectiveOldEmpId, new_employee_id, user.id, reason || null],
                    (histErr) => {
                      if (histErr) {
                        return conn.rollback(() => {
                          conn.release();
                          console.error("[Reassign PO] Error logging audit history:", histErr.message);
                          res.status(500).json({ success: false, message: "Failed to record audit log" });
                        });
                      }

                      conn.commit((commitErr) => {
                        if (commitErr) {
                          return conn.rollback(() => {
                            conn.release();
                            console.error("[Reassign PO] Commit error:", commitErr.message);
                            res.status(500).json({ success: false, message: "Failed to commit transaction" });
                          });
                        }

                        conn.release();

                        // 5. Emit socket events
                        try {
                          const io = socketUtil.getIO();
                          if (effectiveOldEmpId) {
                            io.to(`employee_${effectiveOldEmpId}`).emit("re:project_owner_removed", {
                              project_id: Number(project_id),
                            });
                          }
                          io.to(`employee_${new_employee_id}`).emit("re:project_owner_assigned", {
                            project_id: Number(project_id),
                          });
                        } catch (sockErr) {
                          console.warn("[Reassign PO] Socket emit warning:", sockErr.message);
                        }

                        console.log(`[Reassign PO] ✅ PO for project ${project_id} reassigned: ${effectiveOldEmpId} -> ${new_employee_id} by TL ${user.id}`);

                        // Asynchronously notify newly assigned Project Owner via WhatsApp
                        notifyProjectOwnerAssigned({
                          projectId: Number(project_id),
                          employeeId: Number(new_employee_id),
                          tlUserId: user.id,
                        }).catch((wErr) => console.error("[Reassign PO] WhatsApp dispatch error:", wErr.message));

                        return res.status(200).json({
                          success: true,
                          message: "Project Owner reassigned",
                          data: {
                            project_id: Number(project_id),
                            old_employee_id: effectiveOldEmpId,
                            new_employee_id: Number(new_employee_id),
                          },
                        });
                      });
                    }
                  );
                });
              });
            });
          });
        });
      });
    });
  });
};

// ── TASK 3 (Phase 6): Mark Project Inactive (Admin / GM only) ─────────────
// POST /api/admin/re-project/:project_id/mark-inactive
const markProjectInactive = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const { project_id } = req.params;
  if (!project_id) {
    return res.status(400).json({ success: false, message: "project_id is required" });
  }

  const updateSql = "UPDATE re_synced_projects SET is_active = 0 WHERE project_id = ?";
  db.query(updateSql, [project_id], (err, result) => {
    if (err) {
      console.error("[Mark Inactive] Error updating re_synced_projects:", err.message);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "RE project not found" });
    }

    console.log(`[Mark Inactive] ✅ Project ${project_id} marked inactive by user ${user.id} (${user.role})`);

    // Socket.io live push: notify admin_room, leaders, and affected employees
    try {
      const io = socketUtil.getIO();
      io.to("admin_room").emit("re:project_archived", { project_id: Number(project_id) });

      // Targeted notification to assigned task owners
      const findEmpsSql = "SELECT DISTINCT employee_id FROM task_owners WHERE project_id = ? AND employee_id IS NOT NULL";
      db.query(findEmpsSql, [project_id], (fErr, empRows) => {
        if (!fErr && empRows) {
          empRows.forEach((r) => {
            io.to(`employee_${r.employee_id}`).emit("re:project_archived", { project_id: Number(project_id) });
          });
        }
      });

      // Targeted notification to assigned project owners
      const findPoSql = "SELECT DISTINCT employee_id FROM project_owners WHERE project_id = ? AND status = 'active'";
      db.query(findPoSql, [project_id], (poErr, poRows) => {
        if (!poErr && poRows) {
          poRows.forEach((r) => {
            io.to(`employee_${r.employee_id}`).emit("re:project_archived", { project_id: Number(project_id) });
          });
        }
      });
    } catch (sockErr) {
      console.warn("[Mark Inactive] Socket emit warning:", sockErr.message);
    }

    // Outbound sync to RE
    sendStatusUpdateToRE(project_id, user.id).catch((e) => console.error("[RE Sync Trigger] Error:", e.message));

    return res.status(200).json({
      success: true,
      message: "Project marked inactive",
      data: { project_id: Number(project_id), is_active: false },
    });
  });
};

// ── Mark Project Active / Restore (Admin / GM only) ─────────────
// POST /api/admin/re-project/:project_id/mark-active
const markProjectActive = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const { project_id } = req.params;
  if (!project_id) {
    return res.status(400).json({ success: false, message: "project_id is required" });
  }

  const updateSql = "UPDATE re_synced_projects SET is_active = 1 WHERE project_id = ?";
  db.query(updateSql, [project_id], (err, result) => {
    if (err) {
      console.error("[Mark Active] Error updating re_synced_projects:", err.message);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "RE project not found" });
    }

    console.log(`[Mark Active] ✅ Project ${project_id} restored to active by user ${user.id} (${user.role})`);

    // Socket.io live push: notify admin_room, leaders, and affected employees
    try {
      const io = socketUtil.getIO();
      io.to("admin_room").emit("re:project_unarchived", { project_id: Number(project_id) });

      // Targeted notification to assigned task owners
      const findEmpsSql = "SELECT DISTINCT employee_id FROM task_owners WHERE project_id = ? AND employee_id IS NOT NULL";
      db.query(findEmpsSql, [project_id], (fErr, empRows) => {
        if (!fErr && empRows) {
          empRows.forEach((r) => {
            io.to(`employee_${r.employee_id}`).emit("re:project_unarchived", { project_id: Number(project_id) });
          });
        }
      });

      // Targeted notification to assigned project owners
      const findPoSql = "SELECT DISTINCT employee_id FROM project_owners WHERE project_id = ? AND status = 'active'";
      db.query(findPoSql, [project_id], (poErr, poRows) => {
        if (!poErr && poRows) {
          poRows.forEach((r) => {
            io.to(`employee_${r.employee_id}`).emit("re:project_unarchived", { project_id: Number(project_id) });
          });
        }
      });
    } catch (sockErr) {
      console.warn("[Mark Active] Socket emit warning:", sockErr.message);
    }

    // Outbound sync to RE
    sendStatusUpdateToRE(project_id, user.id).catch((e) => console.error("[RE Sync Trigger] Error:", e.message));

    return res.status(200).json({
      success: true,
      message: "Project restored to active",
      data: { project_id: Number(project_id), is_active: true },
    });
  });
};

// ── TASK 2 (Phase 7): Full-Visibility Endpoints for Admin / GM ─────────────

// GET /api/admin/re-projects?include_archived=true
const getAdminReProjects = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const includeArchived = req.query.include_archived === "true" || req.query.include_archived === "1";

  const projectsSql = `
    SELECT 
      rsp.id AS rsp_id,
      rsp.project_id,
      rsp.re_proforma_id,
      rsp.re_proforma_number,
      COALESCE(rsp.client_name, p.name) AS client_name,
      rsp.start_date,
      rsp.end_date,
      rsp.is_active,
      rsp.created_at
    FROM re_synced_projects rsp
    JOIN projects p ON rsp.project_id = p.id
    ${includeArchived ? "" : "WHERE rsp.is_active = 1"}
    ORDER BY rsp.id DESC
  `;

  db.query(projectsSql, (pErr, projectRows) => {
    if (pErr) {
      console.error("[Admin RE Projects] Error fetching projects:", pErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: pErr.message });
    }

    if (projectRows.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const projectIds = projectRows.map((p) => p.project_id);

    // Fetch all task_owners across all departments
    const tasksSql = `
      SELECT 
        id, project_id, sf_task_id, re_item_name, category, description,
        quantity, status, employee_id, deadline, assigned_by_gm
      FROM task_owners
      WHERE project_id IN (?)
      ORDER BY id ASC
    `;

    db.query(tasksSql, [projectIds], (tErr, taskRows) => {
      if (tErr) {
        console.error("[Admin RE Projects] Error fetching tasks:", tErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: tErr.message });
      }

      // Group tasks by project_id
      const tasksByProject = new Map();
      taskRows.forEach((t) => {
        if (!tasksByProject.has(t.project_id)) {
          tasksByProject.set(t.project_id, []);
        }
        tasksByProject.get(t.project_id).push(t);
      });

      // Fetch active POs for these projects
      const poSql = `
        SELECT po.project_id, po.employee_id, u.full_name AS employee_name, po.assigned_by_gm
        FROM project_owners po
        JOIN task_users u ON po.employee_id = u.id
        WHERE po.project_id IN (?) AND po.status = 'active'
      `;

      db.query(poSql, [projectIds], (poErr, poRows) => {
        const poByProject = new Map();
        if (!poErr && Array.isArray(poRows)) {
          poRows.forEach((row) => {
            poByProject.set(row.project_id, {
              employee_id: row.employee_id,
              employee_name: row.employee_name,
              assigned_by_gm: Boolean(row.assigned_by_gm === 1),
            });
          });
        }

        // Fetch explicitly assigned departments
        const deptsAssignedSql = `
          SELECT rpd.project_id, rpd.department_id, d.name AS department_name
          FROM re_project_departments rpd
          JOIN departments d ON rpd.department_id = d.id
          WHERE rpd.project_id IN (?)
        `;

        db.query(deptsAssignedSql, [projectIds], (rpdErr, rpdRows) => {
          const deptsByProject = new Map();
          if (!rpdErr && Array.isArray(rpdRows)) {
            rpdRows.forEach((row) => {
              if (!deptsByProject.has(row.project_id)) {
                deptsByProject.set(row.project_id, []);
              }
              deptsByProject.get(row.project_id).push({
                department_id: row.department_id,
                department_name: row.department_name,
              });
            });
          }

          // Fetch all departments to dynamically detect if any department involved has no TL assigned
          const deptSql = "SELECT id, name, tl_employee_id, strict_deadline_tracking FROM departments";
          db.query(deptSql, (dErr, depts) => {
            const allDepts = !dErr && Array.isArray(depts) ? depts : [];

            const formatted = projectRows.map((p) => {
              const pTasks = tasksByProject.get(p.project_id) || [];
              const currentStatus = deriveProjectStatus(pTasks, allDepts);
              const totalTasks = pTasks.length;
              const completedTasks = pTasks.filter((t) => t.status === "completed").length;
              const unassignedTasks = pTasks.filter((t) => !t.employee_id).length;

              // Check if any task's category belongs to a department where tl_employee_id is NULL
              const unassignedTlSet = new Set();
              pTasks.forEach((t) => {
                if (t.category) {
                  const matched = allDepts.find((d) => matchesCategoryAndDepartment(t.category, d.name));
                  if (matched && !matched.tl_employee_id) {
                    unassignedTlSet.add(matched.name);
                  }
                }
              });

              const sDate = p.start_date
                ? (typeof p.start_date === "string" ? p.start_date.substring(0, 10) : new Date(p.start_date).toISOString().split("T")[0])
                : null;
              const eDate = p.end_date
                ? (typeof p.end_date === "string" ? p.end_date.substring(0, 10) : new Date(p.end_date).toISOString().split("T")[0])
                : null;

              return {
                project_id         : p.project_id,
                re_proforma_id     : p.re_proforma_id,
                re_proforma_number : p.re_proforma_number || null,
                client_name        : p.client_name,
                start_date         : sDate,
                end_date           : eDate,
                is_active          : Boolean(p.is_active !== 0),
                current_status     : currentStatus,
                total_tasks        : totalTasks,
                completed_tasks    : completedTasks,
                unassigned_tasks   : unassignedTasks,
                unassigned_tl_departments: Array.from(unassignedTlSet),
                assigned_departments: deptsByProject.get(p.project_id) || [],
                project_owner      : poByProject.get(p.project_id) || null,
                created_at         : p.created_at,
              };
            });

            return res.status(200).json({ success: true, data: formatted });
          });
        });
      });
    });
  });
};

// GET /api/admin/re-project/:project_id/tasks
const getAdminReProjectTasks = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const { project_id } = req.params;

  const projectSql = `
    SELECT 
      rsp.project_id,
      rsp.re_proforma_id,
      rsp.re_proforma_number,
      COALESCE(rsp.client_name, p.name) AS client_name,
      rsp.start_date,
      rsp.end_date,
      rsp.is_active
    FROM re_synced_projects rsp
    JOIN projects p ON rsp.project_id = p.id
    WHERE rsp.project_id = ?
  `;

  db.query(projectSql, [project_id], (pErr, pRows) => {
    if (pErr) {
      console.error("[Admin Project Tasks] Error fetching project:", pErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: pErr.message });
    }

    if (pRows.length === 0) {
      return res.status(404).json({ success: false, message: "RE project not found" });
    }

    const proj = pRows[0];

    const tasksSql = `
      SELECT 
        t.id AS task_owners_id,
        t.project_id,
        t.sf_task_id,
        t.re_item_name AS task_name,
        t.category,
        t.description,
        t.quantity,
        t.status,
        t.deadline,
        t.employee_id,
        t.assigned_by_gm,
        u.full_name AS assignee_name,
        u.designation AS assignee_role,
        u.department AS assignee_department,
        assigner.full_name AS assigned_by_name
      FROM task_owners t
      LEFT JOIN task_users u ON t.employee_id = u.id
      LEFT JOIN task_users assigner ON t.assigned_by = assigner.id
      WHERE t.project_id = ?
      ORDER BY t.id ASC
    `;

    db.query(tasksSql, [project_id], (tErr, taskRows) => {
      if (tErr) {
        console.error("[Admin Project Tasks] Error fetching tasks:", tErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: tErr.message });
      }

      // Fetch active PO for this project
      const poSql = `
        SELECT po.employee_id, u.full_name AS employee_name, po.assigned_by_gm
        FROM project_owners po
        JOIN task_users u ON po.employee_id = u.id
        WHERE po.project_id = ? AND po.status = 'active'
        LIMIT 1
      `;

      db.query(poSql, [project_id], (poErr, poRows) => {
        const activePo = (!poErr && poRows.length > 0) ? {
          employee_id: poRows[0].employee_id,
          employee_name: poRows[0].employee_name,
          assigned_by_gm: Boolean(poRows[0].assigned_by_gm === 1),
        } : null;

        // Fetch explicitly assigned departments
        const deptsAssignedSql = `
          SELECT rpd.department_id, d.name AS department_name
          FROM re_project_departments rpd
          JOIN departments d ON rpd.department_id = d.id
          WHERE rpd.project_id = ?
        `;

        db.query(deptsAssignedSql, [project_id], (rpdErr, rpdRows) => {
          const assignedDepts = (!rpdErr && Array.isArray(rpdRows)) ? rpdRows : [];

          // Fetch departments for department-aware status derivation
          db.query("SELECT name, strict_deadline_tracking FROM departments", (dErrPT, allDeptsPT) => {
            const deptListPT = !dErrPT && Array.isArray(allDeptsPT) ? allDeptsPT : null;
            const currentStatus = deriveProjectStatus(taskRows, deptListPT);

            const sDate = proj.start_date
              ? (typeof proj.start_date === "string" ? proj.start_date.substring(0, 10) : new Date(proj.start_date).toISOString().split("T")[0])
              : null;
            const eDate = proj.end_date
              ? (typeof proj.end_date === "string" ? proj.end_date.substring(0, 10) : new Date(proj.end_date).toISOString().split("T")[0])
              : null;

            const taskIds = taskRows.map((t) => t.task_owners_id).filter(Boolean);

            const sendTasksResponse = (workLogsGrouped = {}) => {
              const formattedTasks = taskRows.map((t) => ({
                task_owners_id     : t.task_owners_id,
                sf_task_id         : t.sf_task_id,
                task_name          : t.task_name,
                category           : t.category,
                description        : t.description,
                quantity           : t.quantity,
                status             : t.status,
                deadline           : t.deadline
                  ? (typeof t.deadline === "string" ? t.deadline.substring(0, 10) : new Date(t.deadline).toISOString().split("T")[0])
                  : null,
                employee_id        : t.employee_id,
                assigned_by_gm     : Boolean(t.assigned_by_gm === 1),
                assigned_by_name   : t.assigned_by_name || null,
                assignee_name      : t.assignee_name || null,
                assignee_role      : t.assignee_role || null,
                assignee_department: t.assignee_department || null,
                work_logs          : workLogsGrouped[t.task_owners_id] || [],
              }));

              return res.status(200).json({
                success: true,
                data: {
                  project_id         : Number(proj.project_id),
                  re_proforma_id     : proj.re_proforma_id,
                  re_proforma_number : proj.re_proforma_number || null,
                  client_name        : proj.client_name,
                  start_date         : sDate,
                  end_date           : eDate,
                  current_status     : currentStatus,
                  is_active          : Boolean(proj.is_active !== 0),
                  project_owner      : activePo,
                  assigned_departments: assignedDepts,
                  tasks              : formattedTasks,
                },
              });
            };

            if (taskIds.length === 0) {
              return sendTasksResponse({});
            }

            const batchLogsSql = `
              SELECT 
                t.id AS task_log_id,
                t.task_owners_id,
                t.user_id AS employee_id,
                t.name AS employee_name,
                t.entry_status,
                t.TaskDescription AS description,
                t.task_image,
                t.ConsumingTimeInMin AS consuming_time_min,
                t.task_date
              FROM tasks t
              WHERE t.task_owners_id IN (?)
              ORDER BY t.task_date ASC, t.id ASC
            `;

            db.query(batchLogsSql, [taskIds], (blErr, blRows) => {
              const grouped = {};
              if (!blErr && Array.isArray(blRows)) {
                blRows.forEach((r) => {
                  if (!grouped[r.task_owners_id]) grouped[r.task_owners_id] = [];
                  grouped[r.task_owners_id].push({
                    task_log_id       : r.task_log_id,
                    task_owners_id    : r.task_owners_id,
                    employee_id       : r.employee_id,
                    employee_name     : r.employee_name,
                    entry_status      : r.entry_status || "pending",
                    description       : r.description,
                    task_image        : r.task_image,
                    consuming_time_min: r.consuming_time_min,
                    task_date         : r.task_date
                      ? (typeof r.task_date === "string" ? r.task_date.substring(0, 10) : new Date(r.task_date).toISOString().split("T")[0])
                      : null,
                  });
                });
              }
              return sendTasksResponse(grouped);
            });
          });
        });
      });
    });
  });
};

// GET /api/admin/re-task/:task_owners_id/work-log
const getAdminReTaskWorkLog = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const { task_owners_id } = req.params;

  const logSql = `
    SELECT 
      t.id AS task_log_id,
      t.task_owners_id,
      t.user_id,
      t.name AS employee_name,
      t.entry_status,
      t.ProjectOrClientName,
      t.Category,
      t.SubCategory,
      t.TaskDescription,
      t.task_image,
      t.ConsumingTimeInMin,
      t.postCount,
      t.videoCount,
      t.shootCount,
      t.task_date,
      to_tab.re_item_name AS task_name,
      to_tab.status AS current_task_status
    FROM tasks t
    LEFT JOIN task_owners to_tab ON to_tab.id = t.task_owners_id
    WHERE t.task_owners_id = ?
    ORDER BY t.task_date ASC, t.id ASC
  `;

  db.query(logSql, [task_owners_id], (err, rows) => {
    if (err) {
      console.error("[Admin Work Log] Error fetching logs:", err.message);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    const formatted = rows.map((r) => ({
      task_log_id       : r.task_log_id,
      task_owners_id    : r.task_owners_id,
      user_id           : r.user_id,
      employee_name     : r.employee_name,
      task_name         : r.task_name || r.SubCategory,
      entry_status      : r.entry_status || r.current_task_status || "pending",
      current_task_status: r.current_task_status,
      project_name      : r.ProjectOrClientName,
      category          : r.Category,
      sub_category      : r.SubCategory,
      description       : r.TaskDescription,
      task_image        : r.task_image,
      consuming_time_min: r.ConsumingTimeInMin,
      post_count        : r.postCount,
      video_count       : r.videoCount,
      shoot_count       : r.shootCount,
      task_date         : r.task_date
        ? (typeof r.task_date === "string" ? r.task_date.substring(0, 10) : new Date(r.task_date).toISOString().split("T")[0])
        : null,
      created_at        : null,
    }));

    return res.status(200).json({ success: true, data: formatted });
  });
};

// POST /api/admin/re-daily-digest/trigger
const triggerReDailyDigest = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  try {
    const { runDailyDigest } = require("../services/reDailyDigestService");
    const result = await runDailyDigest();
    return res.status(200).json(result);
  } catch (err) {
    console.error("[RE Daily Digest Trigger] Error:", err.message);
    return res.status(500).json({ success: false, message: "Daily digest failed", error: err.message });
  }
};

// POST /api/admin/re-escalations/trigger
const triggerReEscalations = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (user.role !== "admin" && user.role !== "gm") {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  try {
    const { runDeadlineEscalations } = require("../services/reEscalationService");
    const result = await runDeadlineEscalations();
    return res.status(200).json(result);
  } catch (err) {
    console.error("[RE Escalation Trigger] Error:", err.message);
    return res.status(500).json({ success: false, message: "Escalation run failed", error: err.message });
  }
};

// ── PHASE G (Step 1): Explicit Department Assignment by GM/MD ────────────────
// POST /api/admin/re-project/:projectId/assign-departments
const assignProjectDepartments = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (!isCallerAdminOrGm(user)) {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const projectId = req.params.projectId || req.params.project_id;
  const { department_ids } = req.body;

  if (!projectId || !Array.isArray(department_ids) || department_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "projectId and a non-empty array of department_ids are required",
    });
  }

  // Verify project exists
  db.query("SELECT id FROM projects WHERE id = ?", [projectId], (pErr, pRows) => {
    if (pErr) {
      console.error("[Assign Departments] DB error:", pErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: pErr.message });
    }

    if (pRows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const values = department_ids.map((dId) => [Number(projectId), Number(dId), user.id]);
    const insertSql = `
      INSERT INTO re_project_departments (project_id, department_id, assigned_by)
      VALUES ?
      ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by)
    `;

    db.query(insertSql, [values], (insErr) => {
      if (insErr) {
        console.error("[Assign Departments] Insert error:", insErr.message);
        return res.status(500).json({ success: false, message: "Database error", error: insErr.message });
      }

      console.log(`[Assign Departments] ✅ Project ${projectId} explicitly assigned to departments [${department_ids.join(", ")}] by GM/MD ${user.id}`);

      // Notify the relevant Department TLs via WhatsApp
      notifyDepartmentTlAssigned({
        projectId: Number(projectId),
        departmentIds: department_ids,
        assignedByUserId: user.id,
      }).catch((wErr) => console.error("[Assign Departments] WhatsApp error:", wErr.message));

      // Emit live socket event to admin_room
      const io = socketUtil.getIO();
      if (io) {
        io.to("admin_room").emit("re:project_departments_assigned", {
          project_id: Number(projectId),
          department_ids,
          assigned_by: user.id,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Departments explicitly assigned to project",
        data: {
          project_id: Number(projectId),
          department_ids,
        },
      });
    });
  });
};

// ── PHASE G (Step 2): Direct PO Assignment by GM/MD (Skip TL) ─────────────────
// POST /api/admin/re-project/:projectId/direct-assign-po
const directAssignProjectOwner = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (!isCallerAdminOrGm(user)) {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const projectId = req.params.projectId || req.params.project_id;
  const { employee_id } = req.body;

  if (!projectId || !employee_id) {
    return res.status(400).json({ success: false, message: "projectId and employee_id are required" });
  }

  // 1. Verify project exists
  db.query("SELECT id FROM projects WHERE id = ?", [projectId], (pErr, pRows) => {
    if (pErr || pRows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // 2. Validate employee exists and is active (no department restriction for GM/MD)
    const empSql = "SELECT id, full_name, department, employment_status FROM task_users WHERE id = ? AND employment_status = 'active'";
    db.query(empSql, [employee_id], (eErr, eRows) => {
      if (eErr || eRows.length === 0) {
        return res.status(404).json({ success: false, message: "Active employee not found" });
      }

      // 3. Upsert into project_owners with assigned_by_gm = 1
      const insertPoSql = `
        INSERT INTO project_owners (project_id, employee_id, assigned_by, assigned_by_gm, status)
        VALUES (?, ?, ?, 1, 'active')
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), status = 'active', assigned_by = VALUES(assigned_by), assigned_by_gm = 1
      `;

      db.query(insertPoSql, [projectId, employee_id, user.id], (insErr, insResult) => {
        if (insErr) {
          console.error("[Direct Assign PO] Error inserting project_owner:", insErr.message);
          return res.status(500).json({ success: false, message: "Database error", error: insErr.message });
        }

        const sendDirectPoResponse = (realId) => {
          console.log(`[Direct Assign PO] ✅ Employee ${employee_id} directly assigned as PO (id: ${realId}) for project ${projectId} by GM/MD ${user.id}`);

          // Notify PO via WhatsApp
          notifyProjectOwnerAssigned({
            projectId: Number(projectId),
            employeeId: Number(employee_id),
            tlUserId: user.id,
          }).catch((wErr) => console.error("[Direct Assign PO] WhatsApp error:", wErr.message));

          const io = socketUtil.getIO();
          if (io) {
            io.to("admin_room").emit("re:po_assigned", {
              project_id: Number(projectId),
              employee_id: Number(employee_id),
              assigned_by_gm: true,
            });
          }

          return res.status(200).json({
            success: true,
            message: "Project Owner directly assigned by GM/MD",
            data: {
              id: Number(realId),
              project_id: Number(projectId),
              employee_id: Number(employee_id),
            },
          });
        };

        const resolvedId = insResult && insResult.insertId ? insResult.insertId : null;
        if (resolvedId) {
          return sendDirectPoResponse(resolvedId);
        }

        // Fallback: If insertId is 0 or falsy, fetch the matching row's auto-increment id from DB
        db.query(
          "SELECT id FROM project_owners WHERE project_id = ? AND employee_id = ? ORDER BY id DESC LIMIT 1",
          [projectId, employee_id],
          (selErr, selRows) => {
            const finalId = (!selErr && selRows && selRows.length > 0) ? selRows[0].id : 0;
            return sendDirectPoResponse(finalId);
          }
        );
      });
    });
  });
};

// ── PHASE G (Step 3): Direct Task Owner Assignment by GM/MD (Skip TL + PO) ───
// POST /api/admin/re-project/:projectId/direct-assign-task-owner
const directAssignTaskOwner = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  if (!isCallerAdminOrGm(user)) {
    return res.status(403).json({ success: false, message: "Forbidden: Admin or GM access required" });
  }

  const projectId = req.params.projectId || req.params.project_id;
  const { task_id, employee_id, deadline, description } = req.body;

  if (!projectId || !task_id || !employee_id) {
    return res.status(400).json({ success: false, message: "projectId, task_id, and employee_id are required" });
  }

  // 1. Validate employee is active (no department restriction for GM/MD)
  const empSql = "SELECT id, full_name, department, employment_status FROM task_users WHERE id = ? AND employment_status = 'active'";
  db.query(empSql, [employee_id], (eErr, eRows) => {
    if (eErr || eRows.length === 0) {
      return res.status(404).json({ success: false, message: "Active employee not found" });
    }

    // 2. Validate task belongs to this project
    const taskSql = "SELECT id, project_id, category FROM task_owners WHERE id = ? AND project_id = ?";
    db.query(taskSql, [task_id, projectId], (tErr, tRows) => {
      if (tErr || tRows.length === 0) {
        return res.status(404).json({ success: false, message: "Task not found for this project" });
      }

      // 3. Update task_owners row directly with assigned_by_gm = 1
      const updateTaskSql = `
        UPDATE task_owners
        SET employee_id = ?, assigned_by = ?, assigned_by_gm = 1, deadline = ?, description = COALESCE(?, description), status = 'pending'
        WHERE id = ? AND project_id = ?
      `;

      db.query(updateTaskSql, [employee_id, user.id, deadline || null, description || null, task_id, projectId], (updErr) => {
        if (updErr) {
          console.error("[Direct Assign Task] Error updating task_owners:", updErr.message);
          return res.status(500).json({ success: false, message: "Database error", error: updErr.message });
        }

        console.log(`[Direct Assign Task] ✅ Task ${task_id} directly assigned to employee ${employee_id} by GM/MD ${user.id} (deadline: ${deadline || "none"})`);

        // Notify Task Owner via WhatsApp
        notifyTaskOwnerAssigned({
          taskOwnersId: task_id,
          employeeId: employee_id,
          poUserId: user.id,
          deadline: deadline || null,
        }).catch((wErr) => console.error("[Direct Assign Task] WhatsApp error:", wErr.message));

        // Sync status to RE
        sendStatusUpdateToRE(projectId, user.id).catch((e) => console.error("[Direct Assign Task] RE sync error:", e.message));

        const io = socketUtil.getIO();
        if (io) {
          io.to("admin_room").emit("re:task_assigned", {
            project_id: Number(projectId),
            task_id: Number(task_id),
            employee_id: Number(employee_id),
            deadline: deadline || null,
            assigned_by_gm: true,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Task Owner assigned directly by GM/MD",
          data: {
            project_id: Number(projectId),
            task_id: Number(task_id),
            employee_id: Number(employee_id),
            deadline: deadline || null,
          },
        });
      });
    });
  });
};

// ── PHASE H: Employee Progress Logging for RE Task ───────────────────────────
// POST /api/employee/re-task/:task_owners_id/log-progress
const logReTaskProgress = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  const { task_owners_id } = req.params;
  const { description, status } = req.body;

  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ success: false, message: "Task description is required" });
  }

  const validStatuses = ["pending", "in_progress", "review", "completed"];

  // 1. Fetch task details & project context
  const getTaskSql = `
    SELECT 
      t.id AS task_owners_id,
      t.project_id,
      t.employee_id,
      t.re_item_name,
      t.category,
      t.status AS current_status,
      p.name AS project_name,
      rsp.client_name,
      u.full_name AS employee_name
    FROM task_owners t
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN re_synced_projects rsp ON rsp.project_id = t.project_id
    LEFT JOIN task_users u ON u.id = t.employee_id
    WHERE t.id = ?
  `;

  db.query(getTaskSql, [task_owners_id], (tErr, tRows) => {
    if (tErr) {
      console.error("[Log Progress] Error fetching task context:", tErr.message);
      return res.status(500).json({ success: false, message: "Database error", error: tErr.message });
    }

    if (tRows.length === 0) {
      return res.status(404).json({ success: false, message: "RE task not found" });
    }

    const taskRow = tRows[0];
    const isOwner = String(taskRow.employee_id) === String(user.id);
    const isAdminOrGm = isCallerAdminOrGm(user);

    if (!isOwner && !isAdminOrGm) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not assigned to this task" });
    }

    // Determine the immutable status snapshot for this log entry
    let statusSnapshot = taskRow.current_status || "pending";
    if (status && validStatuses.includes(status)) {
      statusSnapshot = status;
    }

    const todayDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const employeeName = user.full_name || user.name || taskRow.employee_name || "Employee";
    const clientName = taskRow.client_name || taskRow.project_name || `RE Project #${taskRow.project_id}`;
    const categoryName = taskRow.category || "General";
    const subCategoryName = taskRow.re_item_name || taskRow.category || "General";

    // 2. Insert ONE NEW ROW into tasks table (immutable snapshot)
    const insertTaskSql = `
      INSERT INTO tasks (
        user_id,
        task_owners_id,
        entry_status,
        name,
        ProjectOrClientName,
        Category,
        SubCategory,
        TaskDescription,
        postCount,
        videoCount,
        ConsumingTimeInMin,
        TotalConsumingTime,
        task_date,
        shootCount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '0', '0', 0, 0, ?, 0)
    `;

    const insertParams = [
      user.id,
      task_owners_id,
      statusSnapshot,
      employeeName,
      clientName,
      categoryName,
      subCategoryName,
      description.trim(),
      todayDate,
    ];

    db.query(insertTaskSql, insertParams, (insErr, insResult) => {
      if (insErr) {
        console.error("[Log Progress] Error inserting into tasks:", insErr.message);
        return res.status(500).json({ success: false, message: "Failed to record task progress", error: insErr.message });
      }

      const newLogId = insResult.insertId;
      console.log(`[Log Progress] ✅ Progress logged for task #${task_owners_id} (log #${newLogId}, status: ${statusSnapshot}) by user ${user.id}`);

      // 3. SEPARATELY update task_owners.status to match whatever status was just submitted
      const updateTaskOwnerSql = "UPDATE task_owners SET status = ? WHERE id = ?";
      db.query(updateTaskOwnerSql, [statusSnapshot, task_owners_id], (updErr) => {
        if (updErr) {
          console.error("[Log Progress] Warning: Failed to update task_owners.status:", updErr.message);
        } else {
          console.log(`[Log Progress] ✅ task_owners #${task_owners_id} status updated to '${statusSnapshot}'`);
        }

        // Outbound RE Webhook sync
        sendStatusUpdateToRE(taskRow.project_id, user.id).catch((e) =>
          console.error("[Log Progress] RE sync error:", e.message)
        );

        // Socket.io emit
        const io = socketUtil.getIO();
        if (io) {
          io.to("admin_room").emit("re:task_status_changed", {
            task_owners_id: Number(task_owners_id),
            status: statusSnapshot,
            project_id: Number(taskRow.project_id),
          });
        }

        return res.status(200).json({
          success: true,
          message: "Progress logged successfully",
          data: {
            task_log_id: newLogId,
            task_owners_id: Number(task_owners_id),
            entry_status: statusSnapshot,
            task_owners_status: statusSnapshot,
            description: description.trim(),
            task_date: todayDate,
            employee_name: employeeName,
            task_name: taskRow.re_item_name,
          },
        });
      });
    });
  });
};

// ── Employee Update Progress for RE Task Log ───────────────────────────
// PUT /api/employee/re-task-log/:id
const updateReTaskProgress = (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  const { id } = req.params;
  const { description, status } = req.body;

  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ success: false, message: "Task description is required" });
  }

  const validStatuses = ["pending", "in_progress", "review", "completed"];

  // 1. Fetch existing task log
  const getLogSql = `
    SELECT 
      t.id,
      t.user_id,
      t.task_owners_id,
      t.entry_status,
      tow.project_id,
      tow.employee_id
    FROM tasks t
    LEFT JOIN task_owners tow ON tow.id = t.task_owners_id
    WHERE t.id = ?
  `;

  db.query(getLogSql, [id], (err, rows) => {
    if (err) {
      console.error("[Update Progress] Error fetching log:", err.message);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Task entry not found" });
    }

    const logRow = rows[0];
    const isOwner = String(logRow.user_id) === String(user.id);
    const isAdminOrGm = isCallerAdminOrGm(user);

    if (!isOwner && !isAdminOrGm) {
      return res.status(403).json({ success: false, message: "Forbidden: Not your task entry" });
    }

    const newStatus = status && validStatuses.includes(status) ? status : (logRow.entry_status || "pending");

    // 2. Update tasks table row
    const updateTaskSql = `
      UPDATE tasks 
      SET TaskDescription = ?, entry_status = ? 
      WHERE id = ?
    `;

    db.query(updateTaskSql, [description.trim(), newStatus, id], (uErr) => {
      if (uErr) {
        console.error("[Update Progress] Error updating task:", uErr.message);
        return res.status(500).json({ success: false, message: "Failed to update task", error: uErr.message });
      }

      // 3. Update task_owners status if task_owners_id is linked
      if (logRow.task_owners_id) {
        const updateOwnerSql = "UPDATE task_owners SET status = ? WHERE id = ?";
        db.query(updateOwnerSql, [newStatus, logRow.task_owners_id], (oErr) => {
          if (oErr) {
            console.error("[Update Progress] Warning: Failed to update task_owners:", oErr.message);
          } else {
            console.log(`[Update Progress] ✅ task_owners #${logRow.task_owners_id} status updated to '${newStatus}'`);
          }

          if (logRow.project_id) {
            sendStatusUpdateToRE(logRow.project_id, user.id).catch((e) =>
              console.error("[Update Progress] RE sync error:", e.message)
            );
          }

          const io = socketUtil.getIO();
          if (io) {
            io.to("admin_room").emit("re:task_status_changed", {
              task_owners_id: Number(logRow.task_owners_id),
              status: newStatus,
              project_id: Number(logRow.project_id),
            });
          }

          return res.status(200).json({
            success: true,
            message: "Progress updated successfully",
            data: {
              id: Number(id),
              task_owners_id: Number(logRow.task_owners_id),
              entry_status: newStatus,
              description: description.trim(),
            },
          });
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Task updated successfully",
          data: {
            id: Number(id),
            entry_status: newStatus,
            description: description.trim(),
          },
        });
      }
    });
  });
};

module.exports = {
  getLeaderReProjects,
  assignProjectOwner,
  getEmployeeOwnedProjects,
  assignTaskOwner,
  getMyReTasks,
  updateTaskStatus,
  reassignTaskOwner,
  reassignProjectOwner,
  markProjectInactive,
  markProjectActive,
  getAdminReProjects,
  getAdminReProjectTasks,
  getAdminReTaskWorkLog,

  triggerReDailyDigest,
  triggerReEscalations,
  assignProjectDepartments,
  directAssignProjectOwner,
  directAssignTaskOwner,
  logReTaskProgress,
  updateReTaskProgress,
};

