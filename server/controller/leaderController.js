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

    // 3. Add Employee Notification (DB + Socket IO)
    db.query(`SELECT id FROM scheduler_reminders WHERE title = 'System Task Assignment' LIMIT 1`, (err, reminders) => {
      const proceedInsert = (rId) => {
        const notifSql = `
          INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status)
          VALUES (?, ?, 'inapp', ?, 'sent')
        `;
        db.query(notifSql, [rId, employeeId, employeeMsg], (err2, result) => {
          if (err2) {
            console.error("❌ Failed to create employee notification in database:", err2.message);
            return;
          }
          
          const socketNotif = {
            id: result.insertId,
            employee_id: employeeId,
            message_body: employeeMsg
          };
          socketUtil.getIO().emit("new-scheduler-notification", socketNotif);
        });
      };

      if (!err && reminders.length > 0) {
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
        SELECT t.*, u.full_name, u.designation, u.department 
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
        SELECT at.id, at.employeeId, at.projectId, at.targetPost, at.targetVideo, at.targetShoot, at.month, at.year, 
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
    const { leaderId, employeeId, department } = req.body;
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
          sendAssignmentNotifications(
            leaderId, 
            employeeId, 
            `Project: ${ProjectOrClientName || "Development Task"} - Task: ${TaskDescription}`
          );
          return res.status(200).json({ success: true, message: "Development task assigned successfully", id: result.insertId });
        });

      } else if (department.toLowerCase() === "digital marketing" || department.toLowerCase() === "seo") {
        const { projectId, month, year, targetPost, targetVideo, targetShoot, note } = req.body;
        if (!projectId || !month || !year) {
          return res.status(400).json({ success: false, message: "Project, month and year are required" });
        }

        const query = `
          INSERT INTO assigntarget (employeeId, projectId, month, year, targetPost, targetVideo, targetShoot, assigned_by, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [employeeId, projectId, month, year, targetPost || 0, targetVideo || 0, targetShoot || 0, leaderName, note || null], (err, result) => {
          if (err) {
            return res.status(500).json({ success: false, message: err.message });
          }
          
          // Auto-sync with assigned_projects table
          const checkProjectAssignedQuery = `SELECT id FROM assigned_projects WHERE user_id = ? AND project_id = ?`;
          db.query(checkProjectAssignedQuery, [employeeId, projectId], (checkErr, checkRes) => {
            if (!checkErr && checkRes.length === 0) {
              const assignProjectQuery = `
                INSERT INTO assigned_projects (project_id, user_id, assigned_by)
                VALUES (?, ?, ?)
              `;
              db.query(assignProjectQuery, [projectId, employeeId, leaderName], (apErr) => {
                if (apErr) console.error("Error auto-assigning project in assigned_projects:", apErr);
              });
            } else if (!checkErr && checkRes.length > 0) {
              const updateAssignByQuery = `
                UPDATE assigned_projects SET assigned_by = ? WHERE user_id = ? AND project_id = ?
              `;
              db.query(updateAssignByQuery, [leaderName, employeeId, projectId], (apErr) => {
                if (apErr) console.error("Error updating assigned_by in assigned_projects:", apErr);
              });
            }
          });

          db.query(`SELECT name FROM projects WHERE id = ?`, [projectId], (pErr, pRes) => {
            const projectName = (!pErr && pRes.length > 0) ? pRes[0].name : "Marketing Project";
            const detailsStr = `Project ${projectName} - Targets: Post ${targetPost || 0}, Video ${targetVideo || 0}, Shoot ${targetShoot || 0} for ${month}/${year}`;
            sendAssignmentNotifications(leaderId, employeeId, detailsStr);
          });

          return res.status(200).json({ success: true, message: "Project target assigned successfully", id: result.insertId });
        });
      } else {
        return res.status(400).json({ success: false, message: "Unsupported department for assignment" });
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamMembers,
  getTeamDailyTasks,
  getTeamFulfillment,
  assignTeamTask
};
