const { db } = require("../config/db");
const socketUtil = require("../utils/socket");
const { addAdminNotification } = require("./notificationController");

// Helper function to notify Admin and Employee of a new task assignment
const sendAssignmentNotifications = (leaderId, employeeId, details) => {
  // 1. Get leader and employee names
  const getUserNamesQuery = `SELECT id, full_name, role FROM task_users WHERE id IN (?, ?)`;
  db.query(getUserNamesQuery, [leaderId, employeeId], (err, users) => {
    if (err || users.length === 0) {
      console.error("❌ Error getting user names for notifications:", err);
      return;
    }

    const leaderObj = users.find(u => u.id === parseInt(leaderId));
    const employeeObj = users.find(u => u.id === parseInt(employeeId));

    if (!leaderObj || !employeeObj) return;

    const leaderName = leaderObj.full_name;
    const employeeName = employeeObj.full_name;

    const adminMsg = `Team Leader ${leaderName} assigned a task to ${employeeName} (${details}).`;
    const employeeMsg = `Team Leader ${leaderName} has assigned you a new task: ${details}.`;

    // 2. Add Admin Notification (DB + Push + Socket IO)
    addAdminNotification(leaderId, leaderName, "Task Assignment", adminMsg);

    // 3. Add Scheduler Notification to Employee & All Admins (DB + Socket IO)
    db.query(`SELECT id, role FROM task_users WHERE role = 'admin' OR id = ?`, [employeeId], (errUsers, userList) => {
      if (errUsers || userList.length === 0) return;

      db.query(`SELECT id FROM scheduler_reminders WHERE title = 'System Task Assignment' LIMIT 1`, (errRem, reminders) => {
        const proceedInsert = (rId) => {
          userList.forEach(u => {
            const isTargetEmployee = u.id === parseInt(employeeId);
            const msgText = isTargetEmployee ? employeeMsg : adminMsg;

            const notifSql = `
              INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status)
              VALUES (?, ?, 'inapp', ?, 'sent')
            `;
            db.query(notifSql, [rId, u.id, msgText], (errInsert, result) => {
              if (errInsert) {
                console.error("❌ Failed to create notification for user ID " + u.id, errInsert.message);
                return;
              }
              const socketNotif = {
                id: result.insertId,
                employee_id: u.id,
                message_body: msgText
              };
              socketUtil.getIO().emit("new-scheduler-notification", socketNotif);
            });
          });
        };

        if (!errRem && reminders.length > 0) {
          proceedInsert(reminders[0].id);
        } else {
          const createReminderQuery = `
            INSERT INTO scheduler_reminders (title, reminder_date, reminder_time, assignment_type)
            VALUES ('System Task Assignment', CURDATE(), '00:00:00', 'single')
          `;
          db.query(createReminderQuery, (err2, result) => {
            if (err2) {
              console.error("❌ Failed to create system reminder in database:", err2.message);
              return;
            }
            proceedInsert(result.insertId);
          });
        }
      });
    });
  });
};

// 1. Get all active members in the leader's department
const getTeamMembers = (req, res) => {
  try {
    const { leaderId } = req.query;
    if (!leaderId) {
      return res.status(400).json({ success: false, message: "leaderId is required" });
    }

    const getLeaderDeptQuery = `SELECT department FROM task_users WHERE id = ?`;
    db.query(getLeaderDeptQuery, [leaderId], (err, leaderResult) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (leaderResult.length === 0) {
        return res.status(404).json({ success: false, message: "Leader not found" });
      }

      const department = leaderResult[0].department;
      if (!department) {
        return res.status(200).json({ success: true, data: [] });
      }

      const getMembersQuery = `
        SELECT id, role, full_name, email_id, designation, department, mobile_number, profileIMG 
        FROM task_users 
        WHERE LOWER(department) = LOWER(?)
          AND (role = 'user' OR id = ?)
          AND employment_status = 'active'
      `;

      db.query(getMembersQuery, [department, leaderId], (err, members) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        return res.status(200).json({ success: true, data: members });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get daily task submissions of team members for a given date
const getTeamDailyTasks = (req, res) => {
  try {
    const { leaderId, date } = req.query;
    if (!leaderId || !date) {
      return res.status(400).json({ success: false, message: "leaderId and date are required" });
    }

    const getLeaderDeptQuery = `SELECT department FROM task_users WHERE id = ?`;
    db.query(getLeaderDeptQuery, [leaderId], (err, leaderResult) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (leaderResult.length === 0) {
        return res.status(404).json({ success: false, message: "Leader not found" });
      }

      const department = leaderResult[0].department;
      if (!department) {
        return res.status(200).json({ success: true, data: [] });
      }

      const getTasksQuery = `
        SELECT t.*, u.full_name, u.designation, u.department, 'Completed' AS status
        FROM tasks t 
        JOIN task_users u ON t.user_id = u.id 
        WHERE LOWER(u.department) = LOWER(?)
          AND t.task_date = ?
      `;

      db.query(getTasksQuery, [department, date], (err, tasks) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        return res.status(200).json({ success: true, data: tasks });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get monthly target vs achieved fulfillment progress
const getTeamFulfillment = (req, res) => {
  try {
    const { leaderId, month, year } = req.query;
    if (!leaderId || !month || !year) {
      return res.status(400).json({ success: false, message: "leaderId, month, and year are required" });
    }

    const getLeaderDeptQuery = `SELECT department FROM task_users WHERE id = ?`;
    db.query(getLeaderDeptQuery, [leaderId], (err, leaderResult) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (leaderResult.length === 0) {
        return res.status(404).json({ success: false, message: "Leader not found" });
      }

      const department = leaderResult[0].department;
      if (!department) {
        return res.status(200).json({ success: true, data: [] });
      }

      const getTargetsQuery = `
        SELECT at.id, at.employeeId, at.projectId, at.targetPost, at.targetVideo, at.targetShoot, at.month, at.year, at.assigned_by, at.task_date,
               u.full_name AS employeeName, p.name AS projectName 
        FROM assigntarget at 
        JOIN task_users u ON at.employeeId = u.id 
        LEFT JOIN projects p ON at.projectId = p.id 
        WHERE LOWER(u.department) = LOWER(?)
          AND at.month = ? 
          AND at.year = ?
      `;

      db.query(getTargetsQuery, [department, month.toString(), year.toString()], (err, targets) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        const getAchievedQuery = `
          SELECT t.user_id, 
                 SUM(CAST(t.postCount AS SIGNED)) AS totalPost, 
                 SUM(CAST(t.videoCount AS SIGNED)) AS totalVideo, 
                 SUM(t.shootCount) AS totalShoot 
          FROM tasks t
          JOIN task_users u ON t.user_id = u.id
          WHERE LOWER(u.department) = LOWER(?)
            AND MONTH(t.task_date) = ? 
            AND YEAR(t.task_date) = ?
          GROUP BY t.user_id
        `;

        db.query(getAchievedQuery, [department, month, year], (err, achievedList) => {
          if (err) {
            return res.status(500).json({ success: false, message: err.message });
          }

          const achievedMap = {};
          achievedList.forEach(a => {
            achievedMap[a.user_id] = {
              post: a.totalPost || 0,
              video: a.totalVideo || 0,
              shoot: a.totalShoot || 0
            };
          });

          const merged = targets.map(tgt => {
            const ach = achievedMap[tgt.employeeId] || { post: 0, video: 0, shoot: 0 };
            return {
              id: tgt.id,
              employeeId: tgt.employeeId,
              employeeName: tgt.employeeName,
              projectId: tgt.projectId,
              projectName: tgt.projectName,
              month: tgt.month,
              year: tgt.year,
              task_date: tgt.task_date,
              assigned_by: tgt.assigned_by,
              target: {
                post: tgt.targetPost || 0,
                video: tgt.targetVideo || 0,
                shoot: tgt.targetShoot || 0
              },
              achieved: ach
            };
          });

          return res.status(200).json({ success: true, data: merged });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Assign Team Task / Project Target
const assignTeamTask = (req, res) => {
  try {
    const { leaderId, employeeId, department, projectId } = req.body;
    if (!leaderId || !employeeId || !department) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    db.query(`SELECT id, full_name FROM task_users WHERE id IN (?, ?)`, [leaderId, employeeId], (namesErr, namesResult) => {
      if (namesErr || namesResult.length === 0) {
        return res.status(400).json({ success: false, message: "Leader or employee not found" });
      }

      const leaderObj = namesResult.find(u => u.id === parseInt(leaderId));
      const employeeObj = namesResult.find(u => u.id === parseInt(employeeId));

      const leaderName = leaderObj ? leaderObj.full_name : "Team Leader";
      const employeeName = employeeObj ? employeeObj.full_name : "Employee";

      db.query(`SELECT id FROM category WHERE LOWER(name) = LOWER(?) LIMIT 1`, [department], (catErr, catRes) => {
        const categoryId = (!catErr && catRes.length > 0) ? catRes[0].id : null;

        const autoSyncProject = (projId, catId) => {
          if (!projId) return;
          const checkProjectAssignedQuery = `SELECT id FROM assigned_projects WHERE user_id = ? AND project_id = ?`;
          db.query(checkProjectAssignedQuery, [employeeId, projId], (checkErr, checkRes) => {
            if (!checkErr && checkRes.length === 0) {
              const assignProjectQuery = `
                INSERT INTO assigned_projects (project_id, category_id, user_id, assigned_by)
                VALUES (?, ?, ?, ?)
              `;
              db.query(assignProjectQuery, [projId, catId, employeeId, leaderName], (apErr) => {
                if (apErr) console.error("Error auto-assigning project in assigned_projects:", apErr);
              });
            } else if (!checkErr && checkRes.length > 0) {
              const updateAssignByQuery = `
                UPDATE assigned_projects SET assigned_by = ?, category_id = COALESCE(category_id, ?) WHERE user_id = ? AND project_id = ?
              `;
              db.query(updateAssignByQuery, [leaderName, catId, employeeId, projId], (apErr) => {
                if (apErr) console.error("Error updating assigned_by in assigned_projects:", apErr);
              });
            }
          });
        };

        if (department.toLowerCase() === "development") {
          const { ProjectOrClientName, Category, subCategory, TaskDescription, task_date, note } = req.body;
          if (!TaskDescription) {
            return res.status(400).json({ success: false, message: "Task description is required" });
          }

          const taskDate = task_date || new Date().toISOString().split("T")[0];

          const query = `
            INSERT INTO assign_development_tasks 
            (user_id, user_full_name, project_or_client_name, category, sub_category, task_description, status, task_date, assigned_by, status_note)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)
          `;

          db.query(query, [employeeId, employeeName, ProjectOrClientName || "Development Task", Category || "Development", subCategory || "Task Assignment", TaskDescription, taskDate, leaderName, note || null], (err, result) => {
            if (err) {
              return res.status(500).json({ success: false, message: err.message });
            }

            autoSyncProject(projectId, categoryId);

            sendAssignmentNotifications(
              leaderId,
              employeeId,
              `Project: ${ProjectOrClientName || "Development Task"} - Task: ${TaskDescription}${note ? ` - Note: ${note}` : ''}`
            );
            return res.status(200).json({ success: true, message: "Development task assigned successfully", id: result.insertId });
          });

        } else if (department.toLowerCase() === "digital marketing" || department.toLowerCase() === "seo") {
          const { month, year, targetPost, targetVideo, targetShoot, note, task_date } = req.body;
          if (!projectId || !month || !year) {
            return res.status(400).json({ success: false, message: "Project, month and year are required" });
          }

          const query = `
            INSERT INTO assigntarget (employeeId, projectId, month, year, targetPost, targetVideo, targetShoot, assigned_by, note, task_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(query, [employeeId, projectId, month, year, targetPost || 0, targetVideo || 0, targetShoot || 0, leaderName, note || null, task_date || null], (err, result) => {
            if (err) {
              return res.status(500).json({ success: false, message: err.message });
            }

            autoSyncProject(projectId, categoryId);

            db.query(`SELECT name FROM projects WHERE id = ?`, [projectId], (pErr, pRes) => {
              const projectName = (!pErr && pRes.length > 0) ? pRes[0].name : "Marketing Project";
              const detailsStr = `Project ${projectName} - Targets: Post ${targetPost || 0}, Video ${targetVideo || 0}, Shoot ${targetShoot || 0} for ${month}/${year}${note ? ` - Note: ${note}` : ''}`;
              sendAssignmentNotifications(leaderId, employeeId, detailsStr);
            });

            return res.status(200).json({ success: true, message: "Project target assigned successfully", id: result.insertId });
          });
        }
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all tasks assigned to the team by the leader
const getTeamAssignedTasks = (req, res) => {
  try {
    const { leaderId } = req.query;
    if (!leaderId) {
      return res.status(400).json({ success: false, message: "leaderId is required" });
    }

    const getLeaderDeptQuery = `SELECT department, full_name FROM task_users WHERE id = ?`;
    db.query(getLeaderDeptQuery, [leaderId], (err, leaderResult) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (leaderResult.length === 0) return res.status(404).json({ success: false, message: "Leader not found" });

      const department = leaderResult[0].department;
      const leaderName = leaderResult[0].full_name;

      if (!department) {
        return res.status(200).json({ success: true, devTasks: [], targetTasks: [] });
      }

      // Query Development Tasks for users in this department
      const devTasksQuery = `
        SELECT a.*, u.full_name AS employeeName 
        FROM assign_development_tasks a
        JOIN task_users u ON a.user_id = u.id
        WHERE LOWER(u.department) = LOWER(?)
        ORDER BY a.task_date DESC
      `;

      // Query Target Tasks for users in this department
      const targetTasksQuery = `
        SELECT at.*, u.full_name AS employeeName, p.name AS projectName
        FROM assigntarget at
        JOIN task_users u ON at.employeeId = u.id
        LEFT JOIN projects p ON at.projectId = p.id
        WHERE LOWER(u.department) = LOWER(?)
        ORDER BY at.id DESC
      `;

      db.query(devTasksQuery, [department], (errDev, devTasks) => {
        if (errDev) return res.status(500).json({ success: false, message: errDev.message });

        db.query(targetTasksQuery, [department], (errTarget, targetTasks) => {
          if (errTarget) return res.status(500).json({ success: false, message: errTarget.message });

          return res.status(200).json({
            success: true,
            devTasks: devTasks || [],
            targetTasks: targetTasks || []
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamMembers,
  getTeamDailyTasks,
  getTeamFulfillment,
  assignTeamTask,
  getTeamAssignedTasks
};
