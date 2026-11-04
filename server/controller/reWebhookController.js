/**
 * reWebhookController.js
 * Handles inbound webhooks from Revenue Engine (RE) and queue APIs.
 *
 * Endpoints:
 * - POST /api/re-webhook/project-assigned
 * - GET  /api/re-projects
 */

const { db } = require("../config/db");
const jwt = require("jsonwebtoken");
const socketUtil = require("../utils/socket");
const { notifyReProjectSynced } = require("../services/reAssignmentWhatsAppService");
const { matchesCategoryAndDepartment } = require("../utils/projectStatusHelper");

const handleProjectAssigned = (req, res) => {
  // ── 1. Auth check ────────────────────────────────────────────────────────
  const secret = req.headers["x-webhook-secret"];
  if (!secret || secret !== process.env.RE_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // ── 2. Validate payload ──────────────────────────────────────────────────
  const {
    event_type,
    idempotency_key,
    proforma_id,
    proforma_number,
    client_name,
    start_date,
    end_date,
    assigned_by,
    service_items,
    department,
  } = req.body;

  if (
    event_type !== "project.assigned" ||
    !idempotency_key ||
    !proforma_id ||
    !assigned_by ||
    !Array.isArray(service_items)
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid required fields",
    });
  }

  // ── 3. Get a pooled connection (needed for transaction) ──────────────────
  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("[RE Webhook] getConnection error:", connErr.message);
      return res.status(500).json({ success: false, message: "DB connection error" });
    }

    // ── 4. Idempotency check ─────────────────────────────────────────────
    connection.query(
      "SELECT id FROM re_synced_projects WHERE re_idempotency_key = ?",
      [idempotency_key],
      (checkErr, existing) => {
        if (checkErr) {
          connection.release();
          console.error("[RE Webhook] idempotency check error:", checkErr.message);
          return res.status(500).json({ success: false, message: "DB error during idempotency check" });
        }

        if (existing.length > 0) {
          connection.release();
          return res.status(200).json({
            success: true,
            message: "Already processed",
            re_idempotency_key: idempotency_key,
          });
        }

        // ── 5. Begin transaction ─────────────────────────────────────────
        connection.beginTransaction((txErr) => {
          if (txErr) {
            connection.release();
            console.error("[RE Webhook] beginTransaction error:", txErr.message);
            return res.status(500).json({ success: false, message: "Transaction error" });
          }

          // ── 5a. INSERT into projects ────────────────────────────────────
          const insertProjectSql =
            "INSERT INTO projects (name, department, created_by, created_by_name) VALUES (?, ?, ?, ?)";
          const projectParams = [
            client_name || `RE Project #${proforma_id}`,
            null,
            assigned_by.employee_id || null,
            assigned_by.name || null,
          ];

          connection.query(insertProjectSql, projectParams, (projErr, projResult) => {
            if (projErr) {
              return connection.rollback(() => {
                connection.release();
                console.error("[RE Webhook] INSERT projects error:", projErr.message);
                res.status(500).json({ success: false, message: "Failed to create project", details: projErr.message });
              });
            }

            const newProjectId = projResult.insertId;

            // ── 5b. INSERT into re_synced_projects ─────────────────────────
            const insertReSyncSql = `
              INSERT INTO re_synced_projects
                (project_id, re_proforma_id, re_proforma_number, re_idempotency_key, client_name, start_date, end_date, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `;
            const reSyncParams = [
              newProjectId,
              proforma_id,
              proforma_number || null,
              idempotency_key,
              client_name || null,
              start_date  || null,
              end_date    || null,
            ];

            connection.query(insertReSyncSql, reSyncParams, (syncErr) => {
              if (syncErr) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("[RE Webhook] INSERT re_synced_projects error:", syncErr.message);
                  res.status(500).json({ success: false, message: "Failed to sync RE project", details: syncErr.message });
                });
              }

              const explicitDept =
                department ||
                (service_items && service_items[0] && (service_items[0].department || service_items[0].category)) ||
                null;

              const eventData = {
                proforma_id,
                proforma_number: proforma_number || null,
                client_name: client_name || (proforma_number ? `RE Project ${proforma_number}` : `RE Project #${proforma_id}`),
                start_date: start_date || null,
                end_date: end_date || null,
                department: explicitDept,
                service_items: service_items || [],
              };

              // ── 5c. INSERT service_items into task_owners ────────────────
              if (service_items.length === 0) {
                return commitAndRespond(connection, res, newProjectId, 0, idempotency_key, eventData);
              }

              let insertedCount = 0;
              let hasError      = false;
              const insertedIds = [];

              service_items.forEach((item) => {
                if (hasError) return;

                const insertTaskSql = `
                  INSERT INTO task_owners
                    (project_id, re_item_name, category, description, quantity, status)
                  VALUES (?, ?, ?, ?, ?, 'pending')
                `;
                const taskParams = [
                  newProjectId,
                  item.name        || "Unnamed Task",
                  item.category    || null,
                  item.description || null,
                  item.quantity    || null,
                ];

                connection.query(insertTaskSql, taskParams, (taskErr, taskResult) => {
                  if (hasError) return;
                  if (taskErr) {
                    hasError = true;
                    return connection.rollback(() => {
                      connection.release();
                      console.error("[RE Webhook] INSERT task_owners error:", taskErr.message);
                      res.status(500).json({ success: false, message: "Failed to create task", details: taskErr.message });
                    });
                  }

                  const newTaskId = taskResult.insertId;
                  insertedIds.push(newTaskId);

                  // ── 5d. UPDATE sf_task_id = 'SF-T<id>' ──────────────────
                  connection.query(
                    "UPDATE task_owners SET sf_task_id = ? WHERE id = ?",
                    [`SF-T${newTaskId}`, newTaskId],
                    (updErr) => {
                      if (hasError) return;
                      if (updErr) {
                        hasError = true;
                        return connection.rollback(() => {
                          connection.release();
                          console.error("[RE Webhook] UPDATE sf_task_id error:", updErr.message);
                          res.status(500).json({ success: false, message: "Failed to set sf_task_id", details: updErr.message });
                        });
                      }

                      insertedCount++;
                      if (insertedCount === service_items.length) {
                        commitAndRespond(connection, res, newProjectId, insertedCount, idempotency_key, eventData);
                      }
                    }
                  );
                });
              });
            });
          });
        });
      }
    );
  });
};

// ── Helper: commit transaction, broadcast live socket event, and send 201 ────
function commitAndRespond(connection, res, projectId, tasksCreated, idempotency_key, eventData) {
  connection.commit((commitErr) => {
    connection.release();
    if (commitErr) {
      console.error("[RE Webhook] commit error:", commitErr.message);
      return res.status(500).json({ success: false, message: "Transaction commit failed" });
    }
    console.log(`[RE Webhook] ✅ project.assigned processed — project_id=${projectId}, tasks_created=${tasksCreated}, key=${idempotency_key}`);

    // Check unassigned TL departments for this project
    const deptSql = "SELECT id, name, tl_employee_id FROM departments";
    db.query(deptSql, (dErr, depts) => {
      const allDepts = !dErr && Array.isArray(depts) ? depts : [];
      const unassignedTlSet = new Set();

      (eventData.service_items || []).forEach((item) => {
        const cat = item.category || item.department;
        if (cat) {
          const matched = allDepts.find((d) => matchesCategoryAndDepartment(cat, d.name));
          if (matched && !matched.tl_employee_id) {
            unassignedTlSet.add(matched.name);
          }
        }
      });

      if (eventData.department) {
        const matched = allDepts.find((d) => matchesCategoryAndDepartment(eventData.department, d.name));
        if (matched && !matched.tl_employee_id) {
          unassignedTlSet.add(matched.name);
        }
      }

      const unassignedTlDepts = Array.from(unassignedTlSet);

      // TASK 1: Socket.io live push to admin_room (joined by both admin and gm)
      try {
        const io = socketUtil.getIO();
        const payload = {
          project_id         : projectId,
          re_proforma_id     : eventData.proforma_id,
          re_proforma_number : eventData.proforma_number || null,
          client_name        : eventData.client_name,
          start_date         : eventData.start_date,
          end_date           : eventData.end_date,
          tasks_created      : tasksCreated,
          unassigned_tl_departments: unassignedTlDepts,
        };
        io.to("admin_room").emit("re:project_assigned", payload);
        console.log(`[RE Webhook] ⚡ Broadcasted re:project_assigned to admin_room for project ${projectId}`);
      } catch (sockErr) {
        console.error("[RE Webhook] Socket emit error:", sockErr.message);
      }

      // ── 7. Asynchronous WhatsApp Notifications (MD/GM & Department TL) ───────
      try {
        notifyReProjectSynced({
          projectId,
          clientName: eventData.client_name,
          proformaNumber: eventData.proforma_number || null,
          department: eventData.department || null,
        }).catch((wErr) => console.error("[RE Webhook] WhatsApp dispatch error:", wErr.message));
      } catch (wErr) {
        console.error("[RE Webhook] WhatsApp setup error:", wErr.message);
      }

      return res.status(201).json({
        success: true,
        message: "Project assigned and synced successfully",
        data: {
          project_id    : projectId,
          tasks_created : tasksCreated,
          unassigned_tl_departments: unassignedTlDepts,
        },
      });
    });
  });
}

// ── TASK 2: Queue list API (GET /api/re-projects) ─────────────────────────────
const getReProjects = (req, res) => {
  const authHeader = req.headers.authorization || req.headers["x-access-token"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authentication token provided.",
    });
  }

  const secretKey = process.env.JWT_SECRET || "Priyanshuisafullstackdeveloper";
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (decoded.role !== "admin" && decoded.role !== "gm") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin or GM role required",
    });
  }

  const query = `
    SELECT 
      rsp.project_id,
      rsp.re_proforma_id,
      rsp.re_proforma_number,
      COALESCE(rsp.client_name, p.name) AS client_name,
      p.department AS project_department,
      rsp.start_date,
      rsp.end_date,
      rsp.is_active,
      CAST(COUNT(t.id) AS SIGNED) AS total_tasks,
      CAST(COALESCE(SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END), 0) AS SIGNED) AS unassigned_tasks,
      rsp.created_at
    FROM re_synced_projects rsp
    LEFT JOIN projects p ON rsp.project_id = p.id
    LEFT JOIN task_owners t ON rsp.project_id = t.project_id
    GROUP BY rsp.id, rsp.project_id, rsp.re_proforma_id, rsp.re_proforma_number, rsp.client_name, p.name, p.department, rsp.start_date, rsp.end_date, rsp.is_active, rsp.created_at
    ORDER BY rsp.created_at DESC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error("[RE Projects] Error fetching projects:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch RE projects",
        error: err.message,
      });
    }

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const projectIds = rows.map((r) => r.project_id);

    // Fetch departments and task categories to check for unassigned TLs dynamically
    const deptSql = "SELECT id, name, tl_employee_id FROM departments";
    db.query(deptSql, (dErr, depts) => {
      const allDepts = !dErr && Array.isArray(depts) ? depts : [];

      const taskCatSql = "SELECT project_id, category FROM task_owners WHERE project_id IN (?)";
      db.query(taskCatSql, [projectIds], (tErr, taskCats) => {
        const catMap = new Map();
        (taskCats || []).forEach((tc) => {
          if (!catMap.has(tc.project_id)) {
            catMap.set(tc.project_id, []);
          }
          if (tc.category) {
            catMap.get(tc.project_id).push(tc.category);
          }
        });

        const formatted = rows.map((r) => {
          const cats = catMap.get(r.project_id) || [];
          const unassignedTlSet = new Set();

          cats.forEach((cat) => {
            const matched = allDepts.find((d) => matchesCategoryAndDepartment(cat, d.name));
            if (matched && !matched.tl_employee_id) {
              unassignedTlSet.add(matched.name);
            }
          });

          if (r.project_department) {
            const matched = allDepts.find((d) => matchesCategoryAndDepartment(r.project_department, d.name));
            if (matched && !matched.tl_employee_id) {
              unassignedTlSet.add(matched.name);
            }
          }

          return {
            ...r,
            unassigned_tl_departments: Array.from(unassignedTlSet),
          };
        });

        return res.status(200).json({
          success: true,
          data: formatted,
        });
      });
    });
  });
};

module.exports = {
  handleProjectAssigned,
  getReProjects,
};
