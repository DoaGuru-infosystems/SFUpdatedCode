const { db } = require("../config/db");
const { getAllAssociates } = require("./sheduler/email");
const multer = require('multer');
const moment = require("moment-timezone");
const { addAdminNotification } = require("./notificationController");
const path = require('path');
const fs = require('fs');
const nodemailer = require("nodemailer");
const { sendLeaveStatusNotification } = require("./notificationController");
const { sendLeaveStatusReminderWhatsApp } = require("../utils/whatsappUtils")
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const excel = require('exceljs');

const sendAdminAssignmentNotification = (employeeId, details) => {
  const socketUtil = require("../utils/socket");
  const employeeMsg = `Admin has assigned you a new task: ${details}.`;

  db.query(`SELECT id FROM scheduler_reminders WHERE title = 'System Task Assignment' LIMIT 1`, (errRem, reminders) => {
    const proceedInsert = (rId) => {
      const notifSql = `
        INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status)
        VALUES (?, ?, 'inapp', ?, 'sent')
      `;
      db.query(notifSql, [rId, employeeId, employeeMsg], (errInsert, result) => {
        if (!errInsert) {
          const socketNotif = {
            id: result.insertId,
            employee_id: employeeId,
            message_body: employeeMsg
          };
          socketUtil.getIO().emit("new-scheduler-notification", socketNotif);
        }
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
        if (!err2) {
          proceedInsert(result.insertId);
        }
      });
    }
  });
};

const addLead = (req, res) => {
  try {
    const { u_Id, fullName, mobileNo, email, address, inquiryType } = req.body;
    const insertLead = `INSERT INTO leads (
            u_Id, fullName, mobileNo, email, address, inquiryType) VALUES (?, ?, ?, ?, ?, ? )`;
    const insertLeadParams = [
      u_Id,
      fullName,
      mobileNo,
      email,
      address,
      inquiryType,
    ];
    db.query(insertLead, insertLeadParams, (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        // console.log(result);
        return res.status(200).json({
          success: true,
          data: result,
          message: "lead registered successfully",
        });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateLead = (req, res) => {
  try {
    const { lead_Id, fullName, mobileNo, email, address, inquiryType } =
      req.body;
    console.log(lead_Id, fullName, mobileNo, email, address, inquiryType);
    const updateLeadQuery = `
        UPDATE leads 
        SET fullName = ?, 
            mobileNo = ?, 
            email = ?, 
            address = ?, 
            inquiryType = ?
        WHERE lead_Id = ?
    `;
    db.query(
      updateLeadQuery,
      [fullName, mobileNo, email, address, inquiryType, lead_Id],
      (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({ err: "Internal server error" });
        }

        // console.log(updateResult);
        return res.status(200).json({
          message: "Lead updated successfully",
          result: updateResult,
        });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
const updateFollowReport = (req, res) => {
  try {
    const { report_id, followUpDate, followUpPhase, followUpReport, status } =
      req.body;
    // console.log(report_id, followUpDate, followUpPhase, followUpReport, status);
    const updatefollowupQuery = `
        UPDATE followupreport 
        SET followUpDate = ?, 
            followUpPhase = ?, 
            followUpReport = ?, 
            status = ?
        WHERE report_id = ?
    `;
    db.query(
      updatefollowupQuery,
      [followUpDate, followUpPhase, followUpReport, status, report_id],
      (updateErr, updateResult) => {
        if (updateErr) {
          // console.log(updateErr);
          return res.status(500).json({ err: "Internal server error" });
        }
        // console.log(updateResult);
        return res.status(200).json({
          message: "Lead updated successfully",
          result: updateResult,
        });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createFollowUpReport = (req, res) => {
  try {
    const {
      lead_Id,
      u_Id,
      followUpDate,
      followUpPhase,
      followUpReport,
      status,
    } = req.body;

    const insertFollowUpReport =
      "INSERT INTO followupreport (lead_Id, u_Id, followUpDate, followUpPhase, followUpReport, status) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(
      insertFollowUpReport,
      [lead_Id, u_Id, followUpDate, followUpPhase, followUpReport, status],
      (err, result) => {
        if (err) {
          res.status(500).json({
            err: "Interval server error",
          });
        }
        res.status(200).json({
          result,
        });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  };
};

const getLeadDetails = (req, res) => {
  try {
    const u_Id = req.params.user_id;
    // console.log(u_Id);
    const getLead = "SELECT * FROM leads WHERE u_Id = ?";
    db.query(getLead, [u_Id], (leadErr, leadResult) => {
      if (leadErr) {
        return res.status(500).json({ error: "Internal server error" });
      }
      const getFollowUp = "SELECT * FROM followupreport WHERE u_Id = ?";

      db.query(getFollowUp, [u_Id], (followUpErr, followUpResult) => {
        if (followUpErr) {
          return res.status(500).json({ error: "Internal server error" });
        }
        if (followUpResult.length == 0 && leadResult.length == 0) {
          return res.status(400).json({ message: "not found" });
        }

        function convertUTCtoIST(utcDateTime) {
          const options = {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          };
          console.log(utcDateTime);
          const istDateTime = new Intl.DateTimeFormat("en-IN", options).format(
            utcDateTime
          );
          return istDateTime;
        }
        // Return the retrieved data
        leadResult.forEach((obj) => {
          let date = convertUTCtoIST(obj.date);
          obj.date = date.toString().substring(0, 10);
          if (obj.nextFollowDate) {
            obj.nextFollowDate = obj.nextFollowDate;
          }
          return obj;
        });

        followUpResult.forEach((obj) => {
          if (obj.followUpDate) {
            obj.followUpDate = obj.followUpDate;
          }
          let date = obj.followUpDate;
          obj.followUpDate = date.toString().substring(0, 10);
          return obj;
        });

        leadResult.reverse();
        followUpResult.reverse();

        return res.status(200).json({
          lead: leadResult,
          followUp: followUpResult,
        });
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateMeeting = (req, res) => {
  const { lead_Id, nextFollowDate, nextFollowPhase } =
    req.body;

  const [datePart, timePart] = nextFollowDate.split('T');
  let Str_nextFollowDate = `${datePart} ${timePart}:00`;
  let defaultData = { "week": "false", "yesterday": "false", "today": "false", "onehour": "false", "halfhour": "false" };
  let defaultJson = JSON.stringify(defaultData);

  const updateLeadQuery = `
        UPDATE leads 
        SET
            nextFollowDate = ?,
            nextFollowPhase = ?,
            remind = ?
        WHERE lead_Id = ? 
    `;
  db.query(
    updateLeadQuery,
    [Str_nextFollowDate, nextFollowPhase, defaultJson, lead_Id],
    (updateErr, updateResult) => {
      if (updateErr) {
        return res.status(500).json({ err: "Internal server error" });
      }

      return res.status(200).json({
        message: "Lead updated successfully",
        result: updateResult,
      });
    }
  );
};

const mailTest = async (req, res) => {
  try {
    await getAllAssociates();
    res.status(200).json({ messaages: 'Successfully' });
  } catch (err) {
    res.status(400).json({ messaages: 'Error' });
  }
}


const AddData = (req, res) => {
  const {
    user_id,
    user_full_name,
    ProjectOrClientName,
    Category,
    subCategory,
    TaskDescription,
    ConsumingTimeInMin,
    VideoCount,
    PostCreativeCount,
    PostCreativeStatus,
    VideoStatus,
    OtherGraphicsName,
    OtherGraphicsCount,
    OtherGraphicsStatus,
    shootCount,
    task_date
  } = req.body;

  if (!user_id || !user_full_name || !ProjectOrClientName || !Category || !subCategory || !TaskDescription || !ConsumingTimeInMin) {
    return res.status(400).send('All fields are required');
  }
  // Use the provided task_date or default to current date if not provided
  const taskDate = task_date || new Date().toISOString().split('T')[0];

  // Calculate counts based on status to ensure they're always 0 or 1
  let finalPostCreativeCount = 0;
  let finalVideoCount = 0;
  let finalOtherGraphicsCount = 0;

  // Calculate Post Creative Count
  if (subCategory === "POST Create ") {
    finalPostCreativeCount = PostCreativeStatus === "Complete" ? 1 : 0;
  }

  // Calculate Video Count
  if (subCategory === "Video Edittor") {
    finalVideoCount = VideoStatus === "Complete" ? 1 : 0;
  }

  // Calculate Other Graphics Count
  if (subCategory === "Other Graphic Design") {
    finalOtherGraphicsCount = OtherGraphicsStatus === "Complete" ? 1 : 0;
  }

  // Ensure all count fields are properly set (never null)
  const safePostCreativeCount = finalPostCreativeCount || 0;
  const safeVideoCount = finalVideoCount || 0;
  const safeOtherGraphicsCount = finalOtherGraphicsCount || 0;

  const query = `INSERT INTO tasks (
    user_id, name, ProjectOrClientName, Category, SubCategory, TaskDescription, ConsumingTimeInMin,
    videoCount, postCount, post_creative_status, video_status,
    other_graphics_name, other_graphics_count, other_graphics_status, shootCount, task_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [
    user_id,
    user_full_name,
    ProjectOrClientName,
    Category,
    subCategory,
    TaskDescription,
    ConsumingTimeInMin,
    safeVideoCount, // Always 0 or 1 based on status
    safePostCreativeCount, // Always 0 or 1 based on status
    PostCreativeStatus,
    VideoStatus,
    OtherGraphicsName,
    safeOtherGraphicsCount, // Always 0 or 1 based on status
    OtherGraphicsStatus,
    shootCount || 0,
    taskDate
  ], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
    }

    // ═══ Admin Notification Trigger ═══
    addAdminNotification(user_id, user_full_name, "task", `${user_full_name} added a task: ${TaskDescription.substring(0, 30)}...`);

    // ═══ Team Lead Notification Trigger ═══
    db.query('SELECT department FROM task_users WHERE id = ?', [user_id], (errDept, deptRes) => {
      if (!errDept && deptRes.length > 0) {
        const dept = deptRes[0].department;
        if (dept) {
          db.query(`SELECT id FROM task_users WHERE (role = 'team_lead' OR id = 62 OR LOWER(designation) LIKE '%lead%') AND LOWER(department) = LOWER(?)`, [dept], (errLead, leadRes) => {
            if (!errLead && leadRes.length > 0) {
              const msg = `Employee ${user_full_name} filled a daily task for project ${ProjectOrClientName} - Task: ${TaskDescription.substring(0, 50)}...`;
              db.query(`SELECT id FROM scheduler_reminders WHERE title = 'System Task Update' LIMIT 1`, (errRem, remRes) => {
                const insertTLNotif = (remId) => {
                  leadRes.forEach(lead => {
                    db.query(`INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status) VALUES (?, ?, 'inapp', ?, 'sent')`, [remId, lead.id, msg], (errNotif, notifRes) => {
                      if (!errNotif) {
                        try {
                          const socketUtil = require("../utils/socket");
                          socketUtil.getIO().emit("new-scheduler-notification", {
                            id: notifRes.insertId,
                            employee_id: lead.id,
                            message_body: msg
                          });
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    });
                  });
                };

                if (!errRem && remRes.length > 0) {
                  insertTLNotif(remRes[0].id);
                } else {
                  db.query(`INSERT INTO scheduler_reminders (title, reminder_date, reminder_time, assignment_type) VALUES ('System Task Update', CURDATE(), '00:00:00', 'single')`, (errCreateRem, createRemRes) => {
                    if (!errCreateRem) {
                      insertTLNotif(createRemRes.insertId);
                    }
                  });
                }
              });
            }
          });
        }
      }
    });

    try {
      const socketUtil = require("../utils/socket");
      socketUtil.getIO().emit("task-updated", { user_id });
    } catch (err) {
      console.error("Socket emit error in AddData:", err);
    }

    res.send('Data saved successfully');
  });
};


// Route to add creative count data
const addCreativeCount = (req, res) => {
  const { user_id, creative, video, flyer, other } = req.body;
  const date = new Date().toISOString().split('T')[0];

  if (!user_id) {
    return res.status(400).send('User ID is required');
  }

  const query = 'INSERT INTO creative_counts (user_id, creative, video, flyer, other, date) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [user_id, creative, video, flyer, other, date], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send('Creative counts added successfully');
  });
};


// Route to fetch data by date to show user only by date
const FetchData = (req, res) => {
  const { date } = req.query
  const query = 'SELECT * FROM tasks WHERE task_date = ?';
  db.query(query, [date], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
};

// fetch full task data show full task details
const FetchFUllData = (req, res) => {
  const query = 'SELECT * FROM tasks ';

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    console.log(results);
    res.json(results);
  });
};


const UpdateTask = (req, res) => {
  try {
    const { ProjectOrClientName, Category, subCategory, TaskDescription, ConsumingTimeInMin, id, task_date,
      VideoCount, PostCreativeCount, PostCreativeStatus, VideoStatus, OtherGraphicsName, OtherGraphicsCount, OtherGraphicsStatus, shootCount } = req.body;

    console.log('Updating task with ID:', id);
    console.log('Task date:', task_date);

    // Use the provided task_date or default to current date if not provided
    const taskDate = task_date || new Date().toISOString().split('T')[0];

    // Calculate counts based on status to ensure they're always 0 or 1
    let finalPostCreativeCount = 0;
    let finalVideoCount = 0;
    let finalOtherGraphicsCount = 0;

    // Calculate Post Creative Count
    if (subCategory === "POST Create ") {
      finalPostCreativeCount = PostCreativeStatus === "Complete" ? 1 : 0;
    }

    // Calculate Video Count
    if (subCategory === "Video Edittor") {
      finalVideoCount = VideoStatus === "Complete" ? 1 : 0;
    }

    // Calculate Other Graphics Count
    if (subCategory === "Other Graphic Design") {
      finalOtherGraphicsCount = OtherGraphicsStatus === "Complete" ? 1 : 0;
    }

    // Ensure all count fields are properly set (never null)
    const safePostCreativeCount = finalPostCreativeCount || 0;
    const safeVideoCount = finalVideoCount || 0;
    const safeOtherGraphicsCount = finalOtherGraphicsCount || 0;

    const updateTask = `
      UPDATE tasks
      SET ProjectOrClientName = ?,
          Category = ?,
          SubCategory = ?,
          TaskDescription = ?,
          ConsumingTimeInMin = ?,
          task_date = ?,
          videoCount = ?,
          postCount = ?,
          post_creative_status = ?,
          video_status = ?,
          other_graphics_name = ?,
          other_graphics_count = ?,
          other_graphics_status = ?,
          shootCount = ?
      WHERE id = ?;
    `;

    db.query(updateTask, [
      ProjectOrClientName,
      Category,
      subCategory,
      TaskDescription,
      ConsumingTimeInMin,
      taskDate,
      safeVideoCount, // Always 0 or 1 based on status
      safePostCreativeCount, // Always 0 or 1 based on status
      PostCreativeStatus || null,
      VideoStatus || null,
      OtherGraphicsName || null,
      safeOtherGraphicsCount, // Always 0 or 1 based on status
      OtherGraphicsStatus || null,
      shootCount || 0,
      id
    ], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating task:', updateErr);
        return res.status(500).json({
          error: updateErr.message,
          sqlMessage: updateErr.sqlMessage || 'Internal server error'
        });
      }
      // Success Response 
      console.log('Task updated successfully:', updateResult);

      // ═══ Admin & Team Lead Notification Trigger ═══
      db.query('SELECT t.user_id, t.TaskDescription, t.ProjectOrClientName, u.full_name, u.department FROM tasks t JOIN task_users u ON t.user_id = u.id WHERE t.id = ?', [id], (errTask, taskRes) => {
        if (!errTask && taskRes.length > 0) {
          const { user_id, TaskDescription, ProjectOrClientName, full_name, department } = taskRes[0];

          // Notify Admin
          const { addAdminNotification } = require('./notificationController');
          addAdminNotification(user_id, full_name, "task", `${full_name} updated a task: ${TaskDescription.substring(0, 30)}...`);

          // Notify Team Lead
          if (department) {
            db.query(`SELECT id FROM task_users WHERE (role = 'team_lead' OR id = 62 OR LOWER(designation) LIKE '%lead%') AND LOWER(department) = LOWER(?)`, [department], (errLead, leadRes) => {
              if (!errLead && leadRes.length > 0) {
                const msg = `Employee ${full_name} updated their daily task for project ${ProjectOrClientName} - Task: ${TaskDescription.substring(0, 50)}...`;
                db.query(`SELECT id FROM scheduler_reminders WHERE title = 'System Task Update' LIMIT 1`, (errRem, remRes) => {
                  const insertTLNotif = (remId) => {
                    leadRes.forEach(lead => {
                      db.query(`INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status) VALUES (?, ?, 'inapp', ?, 'sent')`, [remId, lead.id, msg], (errNotif, notifRes) => {
                        if (!errNotif) {
                          try {
                            const socketUtil = require("../utils/socket");
                            socketUtil.getIO().emit("new-scheduler-notification", {
                              id: notifRes.insertId,
                              employee_id: lead.id,
                              message_body: msg
                            });
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      });
                    });
                  };

                  if (!errRem && remRes.length > 0) {
                    insertTLNotif(remRes[0].id);
                  } else {
                    db.query(`INSERT INTO scheduler_reminders (title, reminder_date, reminder_time, assignment_type) VALUES ('System Task Update', CURDATE(), '00:00:00', 'single')`, (errCreateRem, createRemRes) => {
                      if (!errCreateRem) {
                        insertTLNotif(createRemRes.insertId);
                      }
                    });
                  }
                });
              }
            });
          }
        }
      });

      try {
        const socketUtil = require("../utils/socket");
        socketUtil.getIO().emit("task-updated", { id });
      } catch (err) {
        console.error("Socket emit error in UpdateTask:", err);
      }

      return res.status(200).json({
        message: "Task updated successfully",
        result: updateResult
      });
    });
  } catch (e) {
    console.error('Caught error:', e);
    res.status(500).json({ error: e.message });
  }
};


// Route to delete Task 
const DeleteTask = (req, res) => {
  const { id } = req.body;

  const deleteTaskData = 'DELETE FROM tasks WHERE id = ?';

  db.query(deleteTaskData, [id], (deleteErr, deleteResult) => {
    if (deleteErr) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json({ message: 'Task deleted successfully' });
  });
};
// Route to fetch options for selects filed (Add task)
const ProjectsList = (req, res) => {
  const { department, created_by } = req.query;
  let query = `
    SELECT p.*, 
           COALESCE(p.created_by_name, u.full_name) AS creator_name,
           u.role AS creator_role,
           u.designation AS creator_designation
    FROM projects p
    LEFT JOIN task_users u ON p.created_by = u.id
  `;
  const conditions = [];
  const params = [];
  if (department && department.trim() !== "" && department !== "All") {
    conditions.push(`(p.department IS NULL OR p.department = '' OR LOWER(p.department) LIKE CONCAT('%', LOWER(?), '%'))`);
    params.push(department.trim());
  }
  if (created_by && created_by !== "All") {
    conditions.push(`p.created_by = ?`);
    params.push(created_by);
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY p.id DESC';

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error fetching projects:', err);
      res.status(500).json({ error: 'Error fetching projects', details: err.message });
      return;
    }
    res.json(result);
  });
};

const CategoryList = (req, res) => {
  const { projects_id } = req.query;
  const query = 'SELECT * FROM category ';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Error fetching categories', details: err.message });
      return;
    }
    res.json(result);
    console.log(result)
  });
};

const SubCategoryList = (req, res) => {
  const { category_id } = req.query;
  console.log(category_id)
  const query = 'SELECT * FROM subcategory WHERE category_id = ?';

  db.query(query, [category_id], (err, result) => {
    if (err) {
      console.error('Error fetching sub-categories:', err);
      res.status(500).json({ message: 'Error fetching sub-categories', error: err });
      return;
    }
    console.log('sub category ', result)
    res.json(result);
  });
};


// route for user only show user data 
const myTask = (req, res) => {
  console.log('OKAY Task a raha he backend se ');
  const { id } = req.params;
  console.log(id);
  const query = 'SELECT * from tasks WHERE user_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).send('Internal Server Error')
    };
    console.log(result, 'line 398');
    if (result.length < 1) {
      return res.status(404).send('No Data Available')
    };
    res.status(200).json(result);
  })
}


// Add new project
const AddProject = (req, res) => {
  const { name, department, created_by, created_by_name } = req.body;
  const query = 'INSERT INTO projects (name, department, created_by, created_by_name) VALUES (?, ?, ?, ?)';
  db.query(query, [name, department || null, created_by || null, created_by_name || null], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).json({ message: 'Project added successfully', id: results.insertId });
  });
};

// Add new category
const AddCategory = (req, res) => {
  const { name } = req.body;
  const query = 'INSERT INTO category (name) VALUES (?)';
  db.query(query, [name], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).json({ message: 'Category added successfully', id: results.insertId });
  });
};

// Add new subcategory
const AddSubcategory = (req, res) => {
  const { name, category_id } = req.body;
  const query = 'INSERT INTO subcategory (name, category_id) VALUES (?, ?)';
  db.query(query, [name, category_id], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).json({ message: 'Subcategory added successfully', id: results.insertId });
  });
};


const UserData = (req, res) => {
  try {
    const selectQuery = `select * from task_users left join emp_salary on emp_salary.employee_id = task_users.id`;
    db.query(selectQuery, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const UserDataById = (req, res) => {
  try {
    const { empId } = req.params;
    const selectQuery = `select * from task_users left join emp_salary on emp_salary.employee_id = task_users.id where task_users.id = ?`;
    db.query(selectQuery, empId, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ensure the 'uploads' directory exists, create it if it doesn't
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

//Update User (Employee karna he )

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure 'uploads/' directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

const UpdateEmployeeAPI = (req, res) => {
  const {
    fullName,
    mobileNumber,
    designation,
    bloodGroup,
    dob,
    joiningDate,
    address,
    idNumber,
    department,
  } = req.body;

  // Dynamically generate the base URL
  const baseURL = `${req.protocol}://${req.get('host')}`;

  // Check if a new profile picture is uploaded and update the URL
  let profilePictureUrl = req.body.profilePicture; // Retain old URL if no new file is uploaded
  if (req.file) {
    profilePictureUrl = `${baseURL}/uploads/${req.file.filename}`;
    if (profilePictureUrl.startsWith("http://sf.doaguru.com")) {
      profilePictureUrl = profilePictureUrl.replace("http://sf.doaguru.com", "http://localhost:3000");
    }
  }

  const query = `
    UPDATE task_users SET 
      full_name = ?, 
      mobile_number = ?, 
      designation = ?, 
      bloodGroup = ?, 
      DOB = ?, 
      joiningDate = ?, 
      address = ?, 
      profileIMG = ?,
      department = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      fullName,
      mobileNumber,
      designation,
      bloodGroup,
      dob,
      joiningDate,
      address,
      profilePictureUrl,
      department,
      idNumber,
    ],
    (err, result) => {
      if (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'Failed to update profile' });
      }
      res.status(200).json({ message: 'Profile updated successfully' });
    }
  );
};
// Fetch Employee API
const getEmployeeAPI = (req, res) => {
  const { id } = req.params; // Get employee ID from request params

  const query = `
    SELECT 
      id,
      role,
      full_name,
      mobile_number,
      designation,
      bloodGroup,
      DOB,
      joiningDate,
      address,
      profileIMG,
      department
    FROM task_users
    WHERE id = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error fetching employee data:', err);
      return res.status(500).json({ message: 'Failed to fetch employee data' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(result[0]);
  });
};


//  fetch from asing task
const projectFromAssign = (req, res) => {
  const user_id = req.params.user_id;
  const query = `
    SELECT 
      ap.id, 
      ap.project_id, 
      ap.category_id, 
      ap.user_id,
      p.name as project_name,
      c.name as category_name,
      ap.created_at,
      ap.status,
      ap.status_note,
      ap.assigned_by
    FROM assigned_projects ap
    LEFT JOIN projects p ON ap.project_id = p.id
    LEFT JOIN category c ON ap.category_id = c.id
    WHERE ap.user_id = ?
    ORDER BY ap.id ASC
  `;
  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error('Error fetching projects:', err);
      res.status(500).json({ error: 'Failed to fetch projects' });
    } else {
      res.status(200).json(result);
    }
  });
}


const assignProject = (req, res) => {
  const { projectId, categoryId, userId, assigned_by } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  // Handle optional IDs (convert empty strings to null)
  const pid = projectId || null;
  const cid = categoryId || null;

  if (!pid && !cid) {
    return res.status(400).json({ message: 'Please select at least a Project or a Category.' });
  }

  // Query to check if the specific assignment already exists
  const checkQuery = `
    SELECT * FROM assigned_projects 
    WHERE user_id = ? 
    AND (project_id <=> ? ) 
    AND (category_id <=> ? )
  `;
  // <=> is the NULL-safe equality operator in MySQL
  db.query(checkQuery, [userId, pid, cid], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).send(checkErr);
    }

    if (checkResults.length > 0) {
      return res.status(400).json({ message: 'This specific assignment already exists for this user.' });
    }

    const assignQuery = 'INSERT INTO assigned_projects (project_id, category_id, user_id, assigned_by) VALUES (?, ?, ?, ?)';
    db.query(assignQuery, [pid, cid, userId, assigned_by || 'Admin'], (assignErr, assignResults) => {
      if (assignErr) {
        return res.status(500).send(assignErr);
      }

      // Auto-sync to assigntarget or assign_development_tasks to allow status updates
      if (pid) {
        db.query(`SELECT department FROM task_users WHERE id = ?`, [userId], (errUser, resUser) => {
          if (!errUser && resUser.length > 0) {
            const dept = resUser[0].department;
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();

            if (dept === 'Digital Marketing' || dept === 'SEO') {
              const tgtQuery = `INSERT INTO assigntarget (employeeId, projectId, month, year, targetPost, targetVideo, targetShoot, assigned_by) VALUES (?, ?, ?, ?, 0, 0, 0, ?)`;
              db.query(tgtQuery, [userId, pid, month, year, assigned_by || 'Admin']);
            } else {
              db.query(`SELECT name FROM projects WHERE id = ?`, [pid], (errProj, resProj) => {
                if (!errProj && resProj.length > 0) {
                  const pName = resProj[0].name;
                  const devQuery = `INSERT INTO assign_development_tasks (user_id, project_or_client_name, assignment_date, status, assigned_by) VALUES (?, ?, CURDATE(), 'Pending', ?)`;
                  db.query(devQuery, [userId, pName, assigned_by || 'Admin']);
                }
              });
            }
          }
        });
      }

      sendAdminAssignmentNotification(userId, 'A new project/category has been assigned to you');
      res.status(201).json({ message: 'Assignment recorded successfully' });
    });
  });
};

const getAllAssignments = (req, res) => {
  const query = `
    SELECT 
      ap.id, 
      ap.project_id, 
      ap.category_id, 
      ap.user_id,
      u.full_name as user_name,
      p.name as project_name,
      c.name as category_name,
      ap.created_at,
      ap.status,
      ap.status_note,
      ap.assigned_by
    FROM assigned_projects ap
    LEFT JOIN task_users u ON ap.user_id = u.id
    LEFT JOIN projects p ON ap.project_id = p.id
    LEFT JOIN category c ON ap.category_id = c.id
    ORDER BY ap.id DESC
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(result);
  });
};

const deleteAssignment = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM assigned_projects WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Assignment removed successfully' });
  });
};



// User task show to admin side 
const getUserTasks = (req, res) => {
  const { userId } = req.params;
  const { month, startDate, endDate, year } = req.query; // Add month and year to the query parameters

  let query = `
    SELECT *
    FROM tasks
    WHERE user_id = ?
  `;

  // Filter by month if provided
  const queryParams = [userId];
  if (month) {
    query += ` AND MONTH(task_date) = ?`;
    queryParams.push(month);
  }
  if (year) {
    query += ` AND YEAR(task_date) = ?`;
    queryParams.push(year);
  }

  // Filter by date range if provided
  if (startDate && endDate) {
    query += ` AND task_date BETWEEN ? AND ?`;
    queryParams.push(startDate, endDate);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.status(200).json(results);
  });
};


const DownloadUserTaskReport = (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate, month, year } = req.query;  // Query parameters for date filtering

  let query = `
    SELECT 
      user_id, 
      name, 
      ProjectOrClientName, 
      Category, 
      SubCategory, 
      TaskDescription,
      postCount,
      videoCount,
      ConsumingTimeInMin,
      TotalConsumingTime,
      DATE_FORMAT(task_date, '%Y-%m-%d') as task_date,
      post_creative_status,
      video_status,
      other_graphics_name,
      other_graphics_count,
      other_graphics_status
    FROM tasks
  `;

  const params = [];

  // Handle conditions based on whether we want all users or a specific user
  if (userId !== 'all') {
    query += ` WHERE user_id = ?`;
    params.push(userId);

    if (startDate && endDate) {
      query += ` AND task_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (month) {
      query += ` AND MONTH(task_date) = ?`;
      params.push(month);
    }
    if (year) {
      query += ` AND YEAR(task_date) = ?`;
      params.push(year);
    }
  } else {
    // For all users, just apply date filters if provided
    let whereAdded = false;

    if (startDate && endDate) {
      query += ` WHERE task_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
      whereAdded = true;
    }

    if (month) {
      query += whereAdded ? ` AND MONTH(task_date) = ?` : ` WHERE MONTH(task_date) = ?`;
      params.push(month);
      whereAdded = true;
    }

    if (year) {
      query += whereAdded ? ` AND YEAR(task_date) = ?` : ` WHERE YEAR(task_date) = ?`;
      params.push(year);
      whereAdded = true;
    }
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('User Tasks');

    // Format the data before adding to worksheet
    const formattedResults = results.map(task => ({
      'User ID': task.user_id,
      'User Name': task.name,
      'Project/Client Name': task.ProjectOrClientName || '',
      'Task Category': task.Category || '',
      'Sub Category': task.SubCategory || '',
      'Task Description': task.TaskDescription || '',
      'Post Count': task.postCount || 0,
      'Video Count': task.videoCount || 0,
      'Time Spent (Min)': task.ConsumingTimeInMin || 0,
      'Total Consuming Time': task.TotalConsumingTime || 0,
      'Task Date': task.task_date || '',
      'Post Creative Status': task.post_creative_status || 'Not Started',
      'Video Status': task.video_status || 'Not Started',
      'Other Graphics Name': task.other_graphics_name || 'N/A',
      'Other Graphics Count': task.other_graphics_count || 0,
      'Other Graphics Status': task.other_graphics_status || 'Not Started'
    }));

    // Define worksheet columns with proper headers and widths
    worksheet.columns = [
      { header: 'User ID', key: 'User ID', width: 10 },
      { header: 'User Name', key: 'User Name', width: 20 },
      { header: 'Project/Client Name', key: 'Project/Client Name', width: 25 },
      { header: 'Task Category', key: 'Task Category', width: 20 },
      { header: 'Sub Category', key: 'Sub Category', width: 20 },
      { header: 'Task Description', key: 'Task Description', width: 40 },
      { header: 'Post Count', key: 'Post Count', width: 12 },
      { header: 'Video Count', key: 'Video Count', width: 12 },
      { header: 'Time Spent (Min)', key: 'Time Spent (Min)', width: 15 },
      { header: 'Total Consuming Time', key: 'Total Consuming Time', width: 18 },
      { header: 'Task Date', key: 'Task Date', width: 15 },
      { header: 'Post Creative Status', key: 'Post Creative Status', width: 20 },
      { header: 'Video Status', key: 'Video Status', width: 15 },
      { header: 'Other Graphics Name', key: 'Other Graphics Name', width: 20 },
      { header: 'Other Graphics Count', key: 'Other Graphics Count', width: 18 },
      { header: 'Other Graphics Status', key: 'Other Graphics Status', width: 20 }
    ];

    // Add the formatted data to the worksheet
    worksheet.addRows(formattedResults);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Set appropriate filename based on whether it's all users or a specific user
    const filename = userId === 'all'
      ? `all_users_tasksReport_${new Date().toISOString().split('T')[0]}.xlsx`
      : `user_${userId}_tasksReport.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating Excel file:', err);
        res.status(500).send(err);
      });
  });
};


const checkInAttend = (req, res) => {
  const { user_id, latitude, longitude } = req.body;
  const selfie = req.file;
  const selfiePicture = selfie ? `selfiePicture/${selfie.filename}` : null;

  const currentDate = moment().tz("Asia/Kolkata").format("DD-MM-YYYY"); // FIXED
  const currentTime = moment().tz("Asia/Kolkata").format("HH:mm:ss");
  const dateTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  //   if (!latitude || !longitude) {
  //     return res.status(400).json({ success: false, message: "Location is required" });
  //   }

  try {
    const insertQuery = `
      INSERT INTO attendance 
        (user_id, login_time, login_selfie_url, login_latitude, login_longitude, attend_date, record_created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const insertParams = [
      user_id,
      currentTime,
      selfiePicture,
      latitude,
      longitude,
      currentDate,
      dateTime,
    ];

    db.query(insertQuery, insertParams, (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: err.message });
      }

      // ═══ Admin Notification Trigger ═══
      db.query("SELECT full_name FROM task_users WHERE id = ?", [user_id], (err, userRes) => {
        if (!err && userRes.length > 0) {
          addAdminNotification(user_id, userRes[0].full_name, "login", `${userRes[0].full_name} logged in at ${currentTime}`);
        }
      });

      res.status(200).json({ success: true, message: "Check-in saved" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



const checkOutAttend = (req, res) => {
  const { user_id, latitude, longitude } = req.body;
  const selfie = req.file;
  const selfiePicture = `selfiePicture/${selfie?.filename || ""}`;
  const currentDate = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");
  const currentTime = moment().tz("Asia/Kolkata").format("HH:mm:ss");

  try {
    const getLoginTimeQuery = `
      SELECT * FROM attendance 
      WHERE user_id = ? AND attend_date = ? 
      ORDER BY attend_id DESC 
      LIMIT 1
    `;

    db.query(getLoginTimeQuery, [user_id, currentDate], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No check-in found for today.",
        });
      }

      const attendance = result[0];
      const attendanceId = attendance.attend_id;
      const loginTime = attendance.login_time;          // e.g. "16:32:37"
      const attendDate = attendance.attend_date;        // e.g. "30-06-2025"

      // Combine date and time to form full datetime
      const loginDateTime = moment.tz(
        `${attendDate} ${loginTime}`,
        "DD-MM-YYYY HH:mm:ss",
        "Asia/Kolkata"
      );
      const logoutDateTime = moment().tz("Asia/Kolkata");

      if (!loginDateTime.isValid()) {
        return res.status(500).json({
          success: false,
          message: `Invalid login datetime: ${attendDate} ${loginTime}`,
        });
      }

      // Calculate duration in minutes and convert to hours
      const minutesWorked = logoutDateTime.diff(loginDateTime, "minutes");
      const workHours = minutesWorked // for DB

      // Calculate day status
      let dayStatus = "full";
      const isSunday = logoutDateTime.day() === 0;

      if (parseFloat(workHours) < 300) {
        dayStatus = "half";
      }
      if (isSunday && parseFloat(workHours) >= 420) {
        dayStatus = "weekend_served";
      }

      // Prepare update query
      const updateQuery = `
        UPDATE attendance 
        SET logout_time = ?, 
            logout_selfie_url = ?, 
            logout_latitude = ?, 
            logout_longitude = ?, 
            work_minutes = ?, 
            day_status = ?
        WHERE attend_id = ?
      `;

      const updateParams = [
        logoutDateTime.format("HH:mm:ss"),
        selfiePicture,
        latitude,
        longitude,
        workHours,
        dayStatus,
        attendanceId,
      ];

      db.query(updateQuery, updateParams, (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(500).json({
            success: false,
            message: updateErr.message,
          });
        }

        if (updateResult.affectedRows === 0) {
          return res.status(400).json({
            success: false,
            message: "No record updated. Possibly wrong attend_id or date mismatch.",
          });
        }

        // ═══ Admin Notification Trigger ═══
        db.query("SELECT full_name FROM task_users WHERE id = ?", [user_id], (err, userRes) => {
          if (!err && userRes.length > 0) {
            addAdminNotification(user_id, userRes[0].full_name, "logout", `${userRes[0].full_name} logged out at ${logoutDateTime.format("HH:mm:ss")}`);
          }
        });

        return res.status(200).json({
          success: true,
          message: "Check-out saved.",
          work_minutes: workHours,
          //   minutes_worked: minutesWorked,
          day_status: dayStatus,
        });
      });
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getCheckInByUser = (req, res) => {
  try {
    const userId = req.params.userId;
    const currentDateDD = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");
    const currentDateYY = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const selectQuery = `SELECT * FROM attendance WHERE user_id = ? AND (attend_date = ? OR attend_date = ?) ORDER BY attend_id DESC LIMIT 1`;
    db.query(selectQuery, [userId, currentDateDD, currentDateYY], (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      } else {
        res.status(200).send(result);
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const getCheckInByUserIdOnly = (req, res) => {
  try {
    const { userId, month, year } = req.params;
    const selectQuery = `
      SELECT * FROM task_users 
      LEFT JOIN attendance 
        ON attendance.user_id = task_users.id 
        AND MONTH(COALESCE(STR_TO_DATE(attendance.attend_date, '%d-%m-%Y'), STR_TO_DATE(attendance.attend_date, '%Y-%m-%d'))) = ? 
        AND YEAR(COALESCE(STR_TO_DATE(attendance.attend_date, '%d-%m-%Y'), STR_TO_DATE(attendance.attend_date, '%Y-%m-%d'))) = ?
      WHERE task_users.id = ? ORDER BY attendance.attend_date ASC`;
    db.query(selectQuery, [month, year, userId], (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      } else {
        res.status(200).send(result);
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};


const getMonthlyAttendance = (req, res) => {
  const month = req.params.month;
  const year = req.params.year;

  try {
    const selectQuery = `
  SELECT * 
  FROM task_users 
  LEFT JOIN attendance 
    ON task_users.id = attendance.user_id
    AND MONTH(COALESCE(STR_TO_DATE(attendance.attend_date, '%d-%m-%Y'), STR_TO_DATE(attendance.attend_date, '%Y-%m-%d'))) = ?
    AND YEAR(COALESCE(STR_TO_DATE(attendance.attend_date, '%d-%m-%Y'), STR_TO_DATE(attendance.attend_date, '%Y-%m-%d'))) = ?
  WHERE task_users.employment_status = 'active'
`;

    db.query(selectQuery, [month, year], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const applyForLeaves = (req, res) => {
  const { user_id, leave_date, leave_type, leave_duration, leave_reason } =
    req.body;
  const dateTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");
  const todayDate = moment().tz("Asia/Kolkata").startOf("day");
  const submittedLeaveDate = moment.tz(leave_date, "DD-MM-YYYY", true, "Asia/Kolkata").startOf("day");


  if (submittedLeaveDate.isBefore(todayDate)) {
    return res.status(400).json({
      success: false,
      message: "Cannot apply for leave on a past date.",
    });
  }

  try {
    const checkQuery = `
      SELECT * FROM attend_leaves
      WHERE leave_user_id = ? AND leave_date = ?
    `;
    db.query(checkQuery, [user_id, leave_date], (checkErr, checkResult) => {
      if (checkErr) {
        return res
          .status(400)
          .json({ success: false, message: checkErr.message });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Leave already applied for this date.",
        });
      }

      // Step 2: Insert new leave entry
      const insertQuery = `
        INSERT INTO attend_leaves (leave_user_id, leave_date, leave_type, leave_duration, leave_reason, applied_at_date)
        VALUES (?,?,?,?,?,?)
      `;
      const insertParams = [
        user_id,
        leave_date,
        leave_type,
        leave_duration,
        leave_reason,
        dateTime,
      ];

      db.query(insertQuery, insertParams, (err, result) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        // ═══ Admin Notification Trigger ═══
        db.query("SELECT full_name FROM task_users WHERE id = ?", [user_id], (err, userRes) => {
          if (!err && userRes.length > 0) {
            addAdminNotification(user_id, userRes[0].full_name, "leave", `${userRes[0].full_name} applied for leave on ${leave_date}`);
          }
        });

        res.status(200).json({ success: true, message: "Leave request submitted" });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



const getMonthlyEmployeeLeavesByUserId = (req, res) => {
  try {
    const { userId, month, year } = req.params;
    const selectQuery = `SELECT * FROM attend_leaves JOIN task_users ON task_users.id = attend_leaves.leave_user_id AND MONTH(STR_TO_DATE(attend_leaves.leave_date, '%d-%m-%Y')) = ? 
        AND YEAR(STR_TO_DATE(attend_leaves.leave_date, '%d-%m-%Y')) = ? WHERE attend_leaves.leave_user_id = ?`;
    db.query(selectQuery, [month, year, userId], (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const getAllLeaveDataForAdmin = (req, res) => {
  try {
    const selectQuery =
      "SELECT * FROM attend_leaves JOIN task_users ON task_users.id = attend_leaves.leave_user_id";
    db.query(selectQuery, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};


const approveRejectLeaves = (req, res) => {
  try {
    const leaveId = req.params.leaveId;
    const { status } = req.body;

    const checkQuery = "SELECT * FROM attend_leaves WHERE leave_id = ?";
    db.query(checkQuery, [leaveId], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No leave found with the given ID",
        });
      }

      const leave = result[0];
      const today = moment.tz("Asia/Kolkata").startOf("day");
      const leaveDate = moment.tz(leave.leave_date, "DD-MM-YYYY", "Asia/Kolkata").startOf("day");

      if (status === "approved" && leaveDate.isBefore(today)) {
        return res.status(400).json({
          success: false,
          message: "Past dated leaves cannot be approved.",
        });
      }

      const updateLeaveStatusQuery = "UPDATE attend_leaves SET leave_status = ? WHERE leave_id = ?";
      db.query(updateLeaveStatusQuery, [status, leaveId], (updateErr) => {
        if (updateErr) {
          return res.status(400).json({ success: false, message: updateErr.message });
        }

        const proceedAfterAttendance = () => {
          const userQuery = "SELECT * FROM task_users WHERE id = ?";
          db.query(userQuery, [leave.leave_user_id], (userErr, userResult) => {
            if (!userErr && userResult.length > 0) {
              const user = userResult[0];
              sendLeaveStatusNotification(user, leave.leave_date, status);
              sendLeaveStatusReminderWhatsApp(user.mobile_number, user.full_name, leave.leave_date, status);
            }
          });
        };

        // Step 1: Check if attendance record already exists
        const checkAttendanceQuery = `
          SELECT * FROM attendance 
          WHERE user_id = ? AND attend_date = ?
        `;
        db.query(checkAttendanceQuery, [leave.leave_user_id, leave.leave_date], (attendErr, attendResult) => {
          if (attendErr) {
            return res.status(500).json({ success: false, message: attendErr.message });
          }

          const newDayStatus = status === "approved" ? "leave" : "absent";

          if (attendResult.length > 0) {
            // Record exists, perform update
            const updateQuery = `
              UPDATE attendance 
              SET day_status = ?, record_created_at = ?
              WHERE user_id = ? AND attend_date = ?
            `;
            db.query(updateQuery, [newDayStatus, leave.leave_date, leave.leave_user_id, leave.leave_date], (updateAttendanceErr) => {
              if (updateAttendanceErr) {
                return res.status(400).json({
                  success: false,
                  message: "Attendance update failed: " + updateAttendanceErr.message,
                });
              }

              proceedAfterAttendance();
              return res.status(200).json({
                success: true,
                message: `Leave ${status} and attendance updated successfully`,
              });
            });
          } else {
            // No record, insert new
            const insertQuery = `
              INSERT INTO attendance (user_id, day_status, attend_date, record_created_at)
              VALUES (?, ?, ?, ?)
            `;
            db.query(insertQuery, [leave.leave_user_id, newDayStatus, leave.leave_date, leave.leave_date], (insertErr) => {
              if (insertErr) {
                return res.status(400).json({
                  success: false,
                  message: "Attendance insert failed: " + insertErr.message,
                });
              }

              proceedAfterAttendance();
              return res.status(200).json({
                success: true,
                message: `Leave ${status} and attendance recorded successfully`,
              });
            });
          }
        });
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const getEmployeeTodaysLeavesByUserId = (req, res) => {
  try {
    const { userId } = req.params;
    const todayDate = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

    const selectQuery = `
      SELECT * FROM attend_leaves 
      JOIN task_users ON task_users.id = attend_leaves.leave_user_id 
      WHERE attend_leaves.leave_user_id = ? AND attend_leaves.leave_date = ? AND attend_leaves.leave_status = ?`;

    db.query(selectQuery, [userId, todayDate, 'approved'], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).json(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const adminAddAttendance = (req, res) => {
  const { user_id, login_time, logout_time, attend_date } = req.body;
  const dateTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");
  const formattedAttendDate = moment(attend_date, "YYYY-MM-DD").format("DD-MM-YYYY");

  // Step 1: Check if attendance already exists
  const checkAttendanceQuery = `
    SELECT * FROM attendance 
    WHERE user_id = ? AND attend_date = ?
  `;
  db.query(checkAttendanceQuery, [user_id, formattedAttendDate], (err, attendanceRows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (attendanceRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this date.",
      });
    }

    // Step 2: Check if user is on approved leave
    const checkLeaveQuery = `
      SELECT * FROM attend_leaves 
      WHERE leave_user_id = ? AND leave_date = ? AND leave_status = 'approved'
    `;
    db.query(checkLeaveQuery, [user_id, formattedAttendDate], (err, leaveRows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      if (leaveRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "User is on approved leave on this date.",
        });
      }

      // Step 3: Calculate work_minutes
      const start = moment(`${formattedAttendDate} ${login_time}`, ["DD-MM-YYYY HH:mm:ss", "DD-MM-YYYY HH:mm"]);
      const end = moment(`${formattedAttendDate} ${logout_time}`, ["DD-MM-YYYY HH:mm:ss", "DD-MM-YYYY HH:mm"]);

      if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        return res.status(400).json({
          success: false,
          message: "Invalid login/logout time.",
        });
      }

      const work_minutes = Math.round(moment.duration(end.diff(start)).asMinutes());

      // Step 4: Determine day status
      let day_status = "full";
      if (work_minutes < 300) {
        day_status = "half";
      }

      const dayOfWeek = moment(formattedAttendDate, "DD-MM-YYYY").day(); // 0 = Sunday
      if (dayOfWeek === 0 && work_minutes >= 700) {
        day_status = "weekend_served";
      }

      // Step 5: Insert attendance
      const insertQuery = `
        INSERT INTO attendance 
        (user_id, login_time, logout_time, work_minutes, day_status, attend_date, record_created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const insertParams = [
        user_id,
        login_time,
        logout_time,
        work_minutes,
        day_status,
        formattedAttendDate,
        dateTime,
      ];

      db.query(insertQuery, insertParams, (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        return res.status(200).json({
          success: true,
          message: "Attendance added successfully.",
        });
      });
    });
  });
};


const adminUpdateAttendanceLogoutTime = (req, res) => {
  const attendId = req.params.attendId;
  const { user_id, attend_date, login_time, logout_time } = req.body;

  if (!login_time || !logout_time) {
    return res.status(400).json({ success: false, message: "Both login time and logout time are required." });
  }

  // Step 1: Check if attendance exists
  const fetchQuery = `
    SELECT * 
    FROM attendance 
    WHERE user_id = ? AND attend_date = ? AND attend_id = ?
  `;
  db.query(fetchQuery, [user_id, attend_date, attendId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found for this user and date.",
      });
    }

    // Step 2: Calculate work_minutes
    const start = moment(`${attend_date} ${login_time}`, [
      "DD-MM-YYYY HH:mm:ss",
      "DD-MM-YYYY HH:mm",
    ]);
    const end = moment(`${attend_date} ${logout_time}`, [
      "DD-MM-YYYY HH:mm:ss",
      "DD-MM-YYYY HH:mm",
    ]);

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        message: "Invalid login/logout time or logout is before login.",
      });
    }

    const work_minutes = Math.round(
      moment.duration(end.diff(start)).asMinutes()
    );

    // Step 3: Determine day_status
    let day_status = "full";
    if (work_minutes < 300) {
      day_status = "half";
    }

    const dayOfWeek = moment(attend_date, "DD-MM-YYYY").day(); // 0 = Sunday
    if (dayOfWeek === 0 && work_minutes >= 700) {
      day_status = "weekend_served";
    }

    // Step 4: Update attendance
    const updateQuery = `
      UPDATE attendance 
      SET login_time = ?, logout_time = ?, work_minutes = ?, day_status = ?
      WHERE user_id = ? AND attend_date = ? AND attend_id = ?
    `;
    db.query(
      updateQuery,
      [login_time, logout_time, work_minutes, day_status, user_id, attend_date, attendId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        return res.status(200).json({
          success: true,
          message: "Attendance login and logout times updated successfully.",
        });
      }
    );
  });
};

const adminResetPassword = (req, res) => {
  try {
    const { email, password } = req.body;
    const selectQuery = "SELECT * FROM admin_users WHERE email_id = ?";
    db.query(selectQuery, email, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      if (result && result.length > 0) {
        const saltRounds = 0;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const updateQuery =
          "UPDATE admin_users SET password = ? WHERE email_id = ?";
        db.query(updateQuery, [hashedPassword, email], (err, result) => {
          if (err) {
            res.status(400).json({ success: false, message: err.message });
          }
          res.status(200).json({
            success: true,
            message: "password updated successfully! Now Login",
          });
        });
      } else {
        res.status(400).json({ success: false, message: "Invalid email ID" });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const employeeResetPassword = (req, res) => {
  try {
    const { email, password } = req.body;
    const selectQuery = "SELECT * FROM task_users WHERE email_id = ?";
    db.query(selectQuery, email, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      if (result && result.length > 0) {
        const saltRounds = 0;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const updateQuery =
          "UPDATE task_users SET password = ? WHERE email_id = ?";
        db.query(updateQuery, [hashedPassword, email], (err, result) => {
          if (err) {
            res.status(400).json({ success: false, message: err.message });
          }
          res.status(200).json({
            success: true,
            message: "password updated successfully! Now Login",
          });
        });
      } else {
        res.status(400).json({ success: false, message: "Invalid email ID" });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const sendOtp = (req, res) => {
  const { email } = req.body;

  // random otp
  function generateOTP(length) {
    const chars = "0123456789";
    let otp = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      otp += chars[randomIndex];
    }

    return otp;
  }

  const OTP = generateOTP(6);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${OTP}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res
          .status(500)
          .json("An error occurred while sending the email.");
      } else {
        const selectQuery = "SELECT * FROM otpcollections WHERE email = ?";
        db.query(selectQuery, email, (err, result) => {
          if (err) {
            res.status(400).json({ success: false, message: err.message });
          }
          if (result && result.length > 0) {
            const updateQuery =
              "UPDATE otpcollections SET code = ? WHERE email = ?";
            db.query(updateQuery, [OTP, email], (upErr, upResult) => {
              if (upErr) {
                res
                  .status(400)
                  .json({ success: false, message: upErr.message });
              }
              res.status(200).send(upResult);
            });
          } else {
            // Assuming you have a 'db' object for database operations
            db.query(
              "INSERT INTO otpcollections (email, code) VALUES (?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code)",
              [email, OTP],
              (err, result) => {
                if (err) {
                  console.error(err);
                  return res
                    .status(500)
                    .send({ message: "Failed to store OTP" });
                }
                res.status(200).json({ message: "OTP sent successfully" });
              }
            );
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json("An error occurred.");
  }
};

const verifyOtp = (req, res) => {
  try {
    const { email, otp } = req.body;
    db.query(
      "SELECT * FROM otpcollections WHERE email = ? AND code = ?",
      [email, otp],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }
        if (result.length > 0) {
          return res
            .status(200)
            .json({ success: true, message: "Otp verification  success" });
        } else {
          return res
            .status(404)
            .json({ success: false, message: "Invalid email or OTP" });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const adminReverseLeave = (req, res) => {
  const { user_id, leave_date, leave_type, leave_duration, leave_reason } =
    req.body;

  const today = moment().tz("Asia/Kolkata").startOf("day");
  const formattedLeaveDate = moment
    .tz(leave_date, "DD-MM-YYYY", "Asia/Kolkata")
    .startOf("day");

  // ✅ Only past dates allowed
  if (!formattedLeaveDate.isBefore(today)) {
    return res.status(400).json({
      success: false,
      message: "Only past-dated leaves can be marked as reversal.",
    });
  }

  // ✅ Check if leave already applied
  const checkLeaveQuery = `
    SELECT * FROM attend_leaves 
    WHERE leave_user_id = ? AND leave_date = ?
  `;

  db.query(checkLeaveQuery, [user_id, leave_date], (err, existing) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Leave already applied for this date.",
      });
    }

    // ✅ Insert leave into attend_leaves
    const insertLeaveQuery = `
      INSERT INTO attend_leaves 
      (leave_user_id, leave_date, leave_type, leave_duration, leave_reason, leave_status, applied_at_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const appliedAt = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    db.query(
      insertLeaveQuery,
      [
        user_id,
        leave_date,
        leave_type,
        leave_duration,
        leave_reason,
        "approved",
        appliedAt,
      ],
      (insertErr, insertResult) => {
        if (insertErr) {
          return res
            .status(500)
            .json({ success: false, message: insertErr.message });
        }

        // ✅ Check if attendance exists
        const checkAttendanceQuery = `
          SELECT * FROM attendance 
          WHERE user_id = ? AND attend_date = ?
        `;

        db.query(checkAttendanceQuery, [user_id, leave_date], (checkErr, attendResult) => {
          if (checkErr) {
            return res.status(500).json({
              success: false,
              message: "Leave applied but error checking attendance.",
              error: checkErr.message,
            });
          }

          if (attendResult.length > 0) {
            // ✅ Attendance exists → update it
            const updateQuery = `
              UPDATE attendance 
              SET day_status = 'leave' 
              WHERE user_id = ? AND attend_date = ?
            `;
            db.query(updateQuery, [user_id, leave_date], (updateErr) => {
              if (updateErr) {
                return res.status(500).json({
                  success: false,
                  message: "Leave applied but failed to update attendance.",
                  error: updateErr.message,
                });
              }

              return res.status(200).json({
                success: true,
                message: "Leave marked and attendance updated successfully.",
              });
            });
          } else {
            // ❌ Attendance not exists → insert it
            const insertAttendanceQuery = `
              INSERT INTO attendance (user_id, attend_date, day_status)
              VALUES (?, ?, 'leave')
            `;

            db.query(insertAttendanceQuery, [user_id, leave_date], (insertAttErr) => {
              if (insertAttErr) {
                return res.status(500).json({
                  success: false,
                  message: "Leave applied but failed to insert attendance.",
                  error: insertAttErr.message,
                });
              }

              return res.status(200).json({
                success: true,
                message: "Leave marked and attendance inserted successfully.",
              });
            });
          }
        });
      }
    );
  });
};


const SalaryCalculatorsByUser = (req, res) => {
  try {
    const userId = req.params.userId;
    const { monthlySalary, paidLeaves = 1, selectedMonth, selectedYear, startDate, endDate } = req.body;

    const timezone = "Asia/Kolkata";

    if (!monthlySalary || isNaN(monthlySalary)) {
      return res.status(400).json({ success: false, message: "Invalid monthly salary." });
    }

    let startMoment, endMoment;
    let month, year;

    if (startDate && endDate) {
      startMoment = moment.tz(startDate, "YYYY-MM-DD", timezone).startOf("day");
      endMoment = moment.tz(endDate, "YYYY-MM-DD", timezone).endOf("day");
      if (!startMoment.isValid() || !endMoment.isValid() || endMoment.isBefore(startMoment)) {
        return res.status(400).json({ success: false, message: "Please provide a valid date range." });
      }
      month = startMoment.month() + 1;
      year = startMoment.year();
    } else {
      if (!selectedMonth || !selectedYear || isNaN(selectedMonth) || isNaN(selectedYear)) {
        return res.status(400).json({ success: false, message: "Please provide a valid month and year or a custom date range." });
      }
      month = parseInt(selectedMonth, 10);
      year = parseInt(selectedYear, 10);
      startMoment = moment.tz({ year, month: month - 1 }, timezone).startOf("month");
      endMoment = moment.tz({ year, month: month - 1 }, timezone).endOf("month");
    }

    const totalDaysInMonth = startMoment.daysInMonth();
    const dailySalary = monthlySalary / totalDaysInMonth;

    const attendanceQuery = `
      SELECT * FROM attendance 
      WHERE user_id = ?
    `;

    db.query(attendanceQuery, [userId], (err, attendanceResult) => {

      if (err) {
        return res.status(500).json({ success: false, message: "Database error (attendance)." });
      }

      // Filter attendance within the date range
      const attendData = attendanceResult.filter((record) => {
        const date = moment.tz(record.attend_date, ["DD-MM-YYYY", "YYYY-MM-DD"], timezone);
        return date.isSameOrAfter(startMoment, 'day') && date.isSameOrBefore(endMoment, 'day');
      });

      const holidayQuery = `
        SELECT holiday_title, holiday_date 
        FROM paid_holidays
        WHERE holiday_date >= ? 
          AND holiday_date <= ? 
          AND holiday_status = 'active'
        ORDER BY holiday_date ASC
      `;

      const qStart = startMoment.format("YYYY-MM-DD");
      const qEnd = endMoment.format("YYYY-MM-DD");

      db.query(holidayQuery, [qStart, qEnd], (hErr, holidayResult) => {
        if (hErr) {
          return res.status(500).json({ success: false, message: "Database error (holidays)." });
        }

        // Convert holiday_date to same format as attendance
        const paidHolidayDates = holidayResult.map(h =>
          moment(h.holiday_date).tz(timezone).format("DD-MM-YYYY")
        );
        const paidHolidayDatesISO = holidayResult.map(h =>
          moment(h.holiday_date).tz(timezone).format("YYYY-MM-DD")
        );

        let totalSundays = 0;
        let curr = moment(startMoment);
        while (curr.isSameOrBefore(endMoment, 'day')) {
          if (curr.day() === 0) totalSundays++;
          curr.add(1, 'day');
        }

        // -------------------------
        // 4️⃣ Count Attendance
        // -------------------------
        let fullDays = 0,
          halfDays = 0,
          workedSundaysFull = 0,
          workedSundaysHalf = 0,
          workedHolidays = 0;

        attendData.forEach((record) => {
          const date = moment.tz(record.attend_date, ["DD-MM-YYYY", "YYYY-MM-DD"], timezone);
          const isSunday = date.day() === 0;

          // ❗ If a day is paid holiday → treat as FULL DAY
          const formattedRecordDate = date.format("DD-MM-YYYY");
          const formattedRecordDateISO = date.format("YYYY-MM-DD");
          if (paidHolidayDates.includes(formattedRecordDate) || paidHolidayDatesISO.includes(formattedRecordDateISO)) {
            fullDays++;
            workedHolidays++;
            return;
          }

          if (record.day_status === "full" || record.day_status === "logged-in") {
            fullDays++;
            if (isSunday) workedSundaysFull++;
          }
          else if (record.day_status === "half") {
            if (isSunday) {
              // Sunday half → count ONLY here
              workedSundaysHalf++;
            } else {
              // Normal half-day
              halfDays++;
            }
          }
          else if (isSunday && record.day_status === "weekend_served") {
            workedSundaysFull++;
          }
        });

        const paidHolidayPay = holidayResult.length * dailySalary;


        const basePay = (fullDays * dailySalary) + (halfDays * (dailySalary / 2));
        const sundayFixedPay = totalSundays * dailySalary;
        const paidLeaveAmount = paidLeaves * dailySalary;

        let absentDays = totalDaysInMonth - (
          (fullDays - workedSundaysFull - workedHolidays) +
          (halfDays * 0.5) +
          totalSundays +
          paidLeaves +
          paidHolidayDates.length
        );
        if (absentDays < 0) absentDays = 0;

        let originalAbsentDays = absentDays;

        // Comp-off logic
        let extraSundaysWorked = workedSundaysFull + (workedSundaysHalf * 0.5);
        let compOffsAdjustedThisMonth = 0;

        if (extraSundaysWorked > 0 && absentDays > 0) {
          if (extraSundaysWorked >= absentDays) {
            compOffsAdjustedThisMonth = absentDays;
            extraSundaysWorked -= absentDays;
            absentDays = 0;
          } else {
            compOffsAdjustedThisMonth = extraSundaysWorked;
            absentDays -= extraSundaysWorked;
            extraSundaysWorked = 0;
          }
        }

        let totalSalary =
          basePay +
          sundayFixedPay +
          paidLeaveAmount +
          paidHolidayPay +
          (compOffsAdjustedThisMonth * dailySalary);

        const totalDaysInCalculatedRange = endMoment.diff(startMoment, 'days') + 1;
        const maxRangeSalary = totalDaysInCalculatedRange * dailySalary;

        if (totalSalary > maxRangeSalary) {
          totalSalary = maxRangeSalary;
        }

        return res.status(200).json({
          success: true,
          year,
          month,
          dailySalary: dailySalary.toFixed(2),

          // Attendance Summary
          fullDays,
          halfDays,
          originalAbsentDays,
          absentDays,
          paidLeaves,
          workedSundaysFull,
          workedSundaysHalf,
          totalSundays,
          totalDaysInMonth: totalDaysInCalculatedRange,

          // Comp-off Summary
          earnedCompOffsThisMonth: (workedSundaysFull + (workedSundaysHalf * 0.5)),
          compOffsAdjustedThisMonth,
          remainingCompOffBalance: extraSundaysWorked,

          // Paid Holiday Summary
          totalPaidHolidays: holidayResult.length,
          paidHolidayDates,

          // Salary Breakup
          basePay: basePay.toFixed(2),
          paidHolidayPay: paidHolidayPay.toFixed(2),
          paidLeaveAmount: paidLeaveAmount.toFixed(2),
          sundayExtraPay: "0.00", // deprecated
          sundayFixedPay: sundayFixedPay.toFixed(2),
          compOffPay: (compOffsAdjustedThisMonth * dailySalary).toFixed(2),
          totalSalary: totalSalary.toFixed(2),

          note: "If a paid holiday and leave occur on the same day, that day is treated as a paid holiday (not leave/absent).",
        });
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getAllHolidaysCurrentYear = (req, res) => {
  try {
    const timezone = "Asia/Kolkata";
    const yearParam = req.query.year;
    const currentYear = yearParam ? parseInt(yearParam) : moment().tz(timezone).year();

    const selectQuery = `
      SELECT * FROM paid_holidays 
      WHERE YEAR(holiday_date) = ?
      ORDER BY holiday_date ASC
    `;

    db.query(selectQuery, [currentYear], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const addHolidayManually = (req, res) => {
  try {
    const { title, date, status } = req.body;

    const dateTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");
    const formattedDate = moment(date, ["YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY"]).format("YYYY-MM-DD");


    // First check if a holiday already exists on that date
    const checkQuery = `SELECT * FROM paid_holidays WHERE holiday_date = ?`;
    db.query(checkQuery, [formattedDate], (checkErr, checkResult) => {
      if (checkErr) {
        return res.status(500).json({ success: false, message: checkErr.message });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: "A holiday already exists on this date",
        });
      }

      // Proceed to insert if no existing record
      const insertQuery = `
        INSERT INTO paid_holidays 
        (holiday_title, holiday_date, holiday_status, holiday_created_at)
        VALUES (?, ?, ?, ?)
      `;
      const insertParams = [title, formattedDate, status, dateTime];

      db.query(insertQuery, insertParams, (insertErr, result) => {
        if (insertErr) {
          return res.status(400).json({ success: false, message: insertErr.message });
        }

        res.status(200).json({
          success: true,
          message: "Holiday added successfully",
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateHolidayStatus = (req, res) => {
  try {
    const hid = req.params.hid;
    const { status } = req.body;
    if (!hid || !status) {
      return res
        .status(400)
        .json({ success: false, message: "date and status are required" });
    }

    const updateQuery = `UPDATE paid_holidays SET holiday_status = ? WHERE hid = ?`;

    db.query(updateQuery, [status, hid], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (result.effectedRows === 0) {
        return res
          .status(400)
          .json({ success: false, message: "holiday not found" });
      }

      res.status(200).json({
        success: true,
        message: "Holiday status updated successfully",
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};

const deleteHoliday = (req, res) => {
  try {
    const hid = req.params.hid;
    const deleteQuery = "DELETE FROM paid_holidays WHERE hid = ?";
    db.query(deleteQuery, hid, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (result.effectedRows === 0) {
        return res
          .status(400)
          .json({ success: false, message: "invalid holiday ID" });
      }

      res
        .status(200)
        .json({ success: true, message: "Holiday deleted successfully" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "internal server error" });
  }
};


const getEmployeeSalary = (req, res) => {
  try {
    const userId = req.params.userId;
    const selectQuery = `select * from emp_salary where employee_id = ?`;
    db.query(selectQuery, userId, (err, result) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Assign Project Target 
const assignProjectTarget = (req, res) => {
  try {
    const { employeeId, projectId, month, year, targetPost, targetVideo, targetShoot, assigned_by } = req.body;
    const insertQuery = `INSERT INTO assigntarget (employeeId, projectId, month, year, targetPost, targetVideo, targetShoot, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(insertQuery, [employeeId, projectId, month, year, targetPost, targetVideo, targetShoot, assigned_by || 'Admin'], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // Auto-sync with assigned_projects
      const checkProjectAssignedQuery = `SELECT id FROM assigned_projects WHERE user_id = ? AND project_id = ?`;
      db.query(checkProjectAssignedQuery, [employeeId, projectId], (checkErr, checkRes) => {
        if (!checkErr && checkRes.length === 0) {
          db.query(`SELECT department FROM projects WHERE id = ? LIMIT 1`, [projectId], (pErr, pRes) => {
            const department = (!pErr && pRes.length > 0) ? pRes[0].department : 'Digital Marketing';
            db.query(`SELECT id FROM category WHERE LOWER(name) = LOWER(?) LIMIT 1`, [department], (cErr, cRes) => {
              const categoryId = (!cErr && cRes.length > 0) ? cRes[0].id : null;
              const assignProjectQuery = `INSERT INTO assigned_projects (project_id, category_id, user_id, assigned_by) VALUES (?, ?, ?, ?)`;
              db.query(assignProjectQuery, [projectId, categoryId, employeeId, assigned_by || 'Admin']);
            });
          });
        }
      });

      sendAdminAssignmentNotification(employeeId, `Project target for ${month}/${year}`);
      res.status(200).json({ success: true, message: "Project target assigned successfully" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get All Project Target 
const getAllProjectTarget = (req, res) => {
  try {
    const selectQuery = `
            SELECT 
                at.*, 
                tu.full_name AS employeeName, 
                p.name AS projectName
            FROM assigntarget at
            LEFT JOIN task_users tu ON at.employeeId = tu.id
            LEFT JOIN projects p ON at.projectId = p.id
        `;
    db.query(selectQuery, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).json({ success: true, data: result });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get Employe Wise Project Target 
const getEmployeeWiseProjectTarget = (req, res) => {
  try {
    const { employeeId } = req.params;
    const selectQuery = `
            SELECT 
                at.*, 
                p.name AS projectName
            FROM assigntarget at
            LEFT JOIN projects p ON at.projectId = p.id
            WHERE at.employeeId = ?
        `;
    db.query(selectQuery, [employeeId], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).json({ success: true, data: result });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const sendTargetUpdateNotifications = (targetId, updatedFields) => {
  const getTargetDetailsQuery = `
    SELECT t.*, u.full_name AS employee_name, u.department AS employee_department, p.name AS project_name
    FROM assigntarget t
    JOIN task_users u ON t.employeeId = u.id
    JOIN projects p ON t.projectId = p.id
    WHERE t.id = ?
  `;
  db.query(getTargetDetailsQuery, [targetId], (err, res) => {
    if (err || res.length === 0) return;
    const target = res[0];

    const msg = `Employee ${target.employee_name} updated monthly targets for project ${target.project_name} (${target.month}/${target.year}) to: Status: ${updatedFields.status || target.status}${updatedFields.status_note ? ` - Note: ${updatedFields.status_note}` : ''}.`;

    const findRecipientsQuery = `
      SELECT id, role, full_name, department 
      FROM task_users 
      WHERE (role = 'team_lead' OR id = 62 OR LOWER(designation) LIKE '%lead%')
    `;
    db.query(findRecipientsQuery, (err2, teamLeads) => {
      if (err2 || teamLeads.length === 0) return;

      let assignedLead = teamLeads.find(tl => tl.full_name.trim().toLowerCase() === (target.assigned_by || '').trim().toLowerCase());
      if (!assignedLead) {
        assignedLead = teamLeads.find(tl => tl.department && target.employee_department && tl.department.toLowerCase() === target.employee_department.toLowerCase());
      }
      const recipientId = assignedLead ? assignedLead.id : teamLeads[0].id;

      db.query(`SELECT id FROM scheduler_reminders WHERE title = 'System Task Update' LIMIT 1`, (err3, reminders) => {
        const insertNotif = (reminderId) => {
          const notifSql = `
            INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status)
            VALUES (?, ?, 'inapp', ?, 'sent')
          `;
          db.query(notifSql, [reminderId, recipientId, msg], (err4, result) => {
            if (!err4) {
              // Emit socket notifications to Team Lead
              const socketNotifTL = {
                id: result.insertId,
                employee_id: recipientId,
                message_body: msg
              };
              const socketUtil = require("../utils/socket");
              socketUtil.getIO().emit("new-scheduler-notification", socketNotifTL);

              // Also emit socket notification to Admin if they are active
              const socketNotifAdmin = {
                id: result.insertId,
                employee_id: 'admin', // send to admin socket room or generic channel
                message_body: msg
              };
              socketUtil.getIO().emit("new-scheduler-notification", socketNotifAdmin);

              addAdminNotification(target.employeeId, target.employee_name, "task", msg);
            }
          });
        };

        if (!err3 && reminders.length > 0) {
          insertNotif(reminders[0].id);
        } else {
          const createReminderQuery = `
            INSERT INTO scheduler_reminders (title, reminder_date, reminder_time, assignment_type)
            VALUES ('System Task Update', CURDATE(), '00:00:00', 'single')
          `;
          db.query(createReminderQuery, (err4, result) => {
            if (!err4) {
              insertNotif(result.insertId);
            }
          });
        }
      });
    });
  });
};

const sendDevTaskUpdateNotifications = (taskId, updatedFields) => {
  const getTaskDetailsQuery = `
    SELECT t.*, u.full_name AS employee_name, u.department AS employee_department
    FROM assign_development_tasks t
    JOIN task_users u ON t.user_id = u.id
    WHERE t.id = ?
  `;
  db.query(getTaskDetailsQuery, [taskId], (err, res) => {
    if (err || res.length === 0) return;
    const task = res[0];

    const noteText = updatedFields.status_note !== undefined ? updatedFields.status_note : (task.status_note || task.note);
    const noteStr = noteText ? ` - Note: ${noteText}` : '';
    const msg = `Employee ${task.employee_name} updated development task for project ${task.project_or_client_name} to: Status: ${updatedFields.status || task.status}${noteStr}.`;

    const findRecipientsQuery = `
      SELECT id, role, full_name, department 
      FROM task_users 
      WHERE (role = 'team_lead' OR id = 62 OR LOWER(designation) LIKE '%lead%')
    `;
    db.query(findRecipientsQuery, (err2, teamLeads) => {
      if (err2 || teamLeads.length === 0) return;

      let assignedLead = teamLeads.find(tl => tl.full_name.trim().toLowerCase() === (task.assigned_by || '').trim().toLowerCase());
      if (!assignedLead) {
        assignedLead = teamLeads.find(tl => tl.department && task.employee_department && tl.department.toLowerCase() === task.employee_department.toLowerCase());
      }
      const recipientId = assignedLead ? assignedLead.id : teamLeads[0].id;

      db.query(`SELECT id FROM scheduler_reminders WHERE title = 'System Task Update' LIMIT 1`, (err3, reminders) => {
        const insertNotif = (reminderId) => {
          const notifSql = `
            INSERT INTO scheduler_notifications (reminder_id, employee_id, channel_type, message_body, delivery_status)
            VALUES (?, ?, 'inapp', ?, 'sent')
          `;
          db.query(notifSql, [reminderId, recipientId, msg], (err4, result) => {
            if (!err4) {
              // Emit socket notifications to Team Lead
              const socketNotifTL = {
                id: result.insertId,
                employee_id: recipientId,
                message_body: msg
              };
              const socketUtil = require("../utils/socket");
              socketUtil.getIO().emit("new-scheduler-notification", socketNotifTL);

              // Also emit socket notification to Admin if they are active
              const socketNotifAdmin = {
                id: result.insertId,
                employee_id: 'admin', // send to admin socket room or generic channel
                message_body: msg
              };
              socketUtil.getIO().emit("new-scheduler-notification", socketNotifAdmin);

              addAdminNotification(task.user_id, task.employee_name, "task", msg);
            }
          });
        };

        if (!err3 && reminders.length > 0) {
          insertNotif(reminders[0].id);
        } else {
          const createReminderQuery = `
            INSERT INTO scheduler_reminders (title, reminder_date, reminder_time, assignment_type)
            VALUES ('System Task Update', CURDATE(), '00:00:00', 'single')
          `;
          db.query(createReminderQuery, (err4, result) => {
            if (!err4) {
              insertNotif(result.insertId);
            }
          });
        }
      });
    });
  });
};

// Update Project Target
const updateProjectTarget = (req, res) => {
  try {
    const { id } = req.params;
    const { targetPost, targetVideo, targetShoot, status, status_note } = req.body;

    let fields = [];
    let params = [];

    if (targetPost !== undefined) {
      fields.push("targetPost = ?");
      params.push(targetPost);
    }
    if (targetVideo !== undefined) {
      fields.push("targetVideo = ?");
      params.push(targetVideo);
    }
    if (targetShoot !== undefined) {
      fields.push("targetShoot = ?");
      params.push(targetShoot);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      params.push(status);
    }
    if (status_note !== undefined) {
      fields.push("status_note = ?");
      params.push(status_note);
    }

    if (fields.length === 0) {
      return res.status(400).send('No fields provided for update');
    }

    params.push(id);
    const updateQuery = `UPDATE assigntarget SET ${fields.join(", ")} WHERE id = ?`;

    db.query(updateQuery, params, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Target not found" });
      }

      try {
        const socketUtil = require("../utils/socket");
        socketUtil.getIO().emit("target-updated", { id });
      } catch (err) {
        console.error("Socket emit error in updateProjectTarget:", err);
      }

      sendTargetUpdateNotifications(id, { status, status_note });
      res.status(200).json({ success: true, message: "Target updated successfully" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete Project Target
const deleteProjectTarget = (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = `DELETE FROM assigntarget WHERE id = ?`;
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Target not found" });
      }
      res.status(200).json({ success: true, message: "Target deleted successfully" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Bulk Assign Project Targets
const bulkAssignProjectTarget = (req, res) => {
  try {
    const { targets, assigned_by } = req.body;

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ success: false, message: "Targets array is required" });
    }

    // Validate each target
    const validatedTargets = [];
    const errors = [];

    targets.forEach((target, index) => {
      if (!target.employeeId || !target.projectId) {
        errors.push(`Target ${index + 1}: employeeId, projectId, and date are required`);
        return;
      }

      if (target.targetPost === undefined || target.targetVideo === undefined || target.targetShoot === undefined) {
        errors.push(`Target ${index + 1}: targetPost, targetVideo, and targetShoot are required`);
        return;
      }

      validatedTargets.push([
        parseInt(target.employeeId),
        parseInt(target.projectId),
        parseInt(target.targetPost) || 0,
        parseInt(target.targetVideo) || 0,
        parseInt(target.targetShoot) || 0,
        assigned_by || 'Admin'
      ]);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors: " + errors.slice(0, 5).join('; ') + (errors.length > 5 ? '...' : '')
      });
    }

    // Insert multiple targets with ON DUPLICATE KEY UPDATE
    const insertQuery = `
            INSERT INTO assigntarget (employeeId, projectId, targetPost, targetVideo, targetShoot, assigned_by) 
            VALUES ?
            ON DUPLICATE KEY UPDATE 
                targetPost = VALUES(targetPost), 
                targetVideo = VALUES(targetVideo),
                targetShoot = VALUES(targetShoot),
                assigned_by = VALUES(assigned_by)
        `;

    db.query(insertQuery, [validatedTargets], (err, result) => {
      if (err) {
        console.error('Bulk insert error:', err);
        return res.status(400).json({ success: false, message: err.message });
      }

      const inserted = result.affectedRows;

      // Send notifications to each employee
      targets.forEach((target) => {
        sendAdminAssignmentNotification(target.employeeId, `Project target (bulk)`);
      });

      res.status(200).json({
        success: true,
        message: `Successfully processed ${validatedTargets.length} targets. ${inserted} records inserted/updated.`
      });
    });
  } catch (error) {
    console.error('Bulk assign error:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Assign Development Task 
const AssignDevelopmentTask = (req, res) => {
  const {
    user_id,
    user_full_name,
    ProjectOrClientName,
    Category,
    subCategory,
    TaskDescription,
    task_date
  } = req.body;

  if (!user_id || !user_full_name || !TaskDescription || !task_date) {
    return res.status(400).send('Required fields are missing');
  }

  const query = `INSERT INTO assign_development_tasks (
    user_id, user_full_name, project_or_client_name, category, sub_category,
    task_description, task_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [
    user_id,
    user_full_name,
    ProjectOrClientName,
    Category,
    subCategory,
    TaskDescription,
    task_date
  ], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    sendAdminAssignmentNotification(user_id, `Development Task: ${TaskDescription}`);
    res.status(201).json({ message: 'Development task assigned successfully', id: result.insertId });
  });
};
// get all assign task 
const getAssignDevelopmentTask = (req, res) => {
  const { employeeId } = req.params;
  console.log("Employee ID :", employeeId);

  const query = `SELECT * FROM assign_development_tasks WHERE user_id = ? ORDER BY id ASC`;
  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
};

// update assign task 
const updateAssignDevelopmentTask = (req, res) => {
  const { id } = req.params;
  console.log("Task ID :", id);
  const { status, deadline_date, status_note, note } = req.body;

  if (!status) {
    return res.status(400).send('Status is required');
  }

  const updatedNote = status_note !== undefined ? status_note : (note !== undefined ? note : null);
  const updatedDeadline = deadline_date || null;

  const query = `UPDATE assign_development_tasks SET status = ?, deadline_date = COALESCE(?, deadline_date, task_date), status_note = COALESCE(?, status_note), note = COALESCE(?, note) WHERE id = ?`;
  db.query(query, [status, updatedDeadline, updatedNote, updatedNote, id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    sendDevTaskUpdateNotifications(id, { status, status_note: updatedNote });
    res.status(200).json({ message: 'Development task updated successfully' });
  });
};

const getHolidaysByMonthYear = (req, res) => {
  try {
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and Year are required",
      });
    }

    const selectQuery = `
      SELECT 
        hid,
        holiday_title,
        holiday_date,
        holiday_status
      FROM paid_holidays
      WHERE YEAR(holiday_date) = ?
        AND MONTH(holiday_date) = ?
        AND holiday_status = 'active'
      ORDER BY holiday_date ASC
    `;

    db.query(selectQuery, [year, month], (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      res.status(200).json({
        success: true,
        month,
        year,
        data: result,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const addExpense = (req, res) => {
  const { category, amount, description, expense_date } = req.body;
  const q = "INSERT INTO expense_records (category, amount, description, expense_date) VALUES (?, ?, ?, ?)";
  db.query(q, [category, amount, description, expense_date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, message: "Expense added successfully", id: result.insertId });
  });
};

const getExpenses = (req, res) => {
  const q = "SELECT * FROM expense_records ORDER BY expense_date DESC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(data);
  });
};

const updateExpense = (req, res) => {
  const { id } = req.params;
  const { category, amount, description, expense_date } = req.body;
  const q = "UPDATE expense_records SET category = ?, amount = ?, description = ?, expense_date = ? WHERE id = ?";
  db.query(q, [category, amount, description, expense_date, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, message: "Expense updated successfully" });
  });
};

const deleteExpense = (req, res) => {
  const { id } = req.params;
  const q = "DELETE FROM expense_records WHERE id = ?";
  db.query(q, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, message: "Expense deleted successfully" });
  });
};

const updateAssignedProjectStatus = (req, res) => {
  const { id } = req.params;
  const { status, status_note } = req.body;

  let fields = [];
  let params = [];

  if (status !== undefined) {
    fields.push("status = ?");
    params.push(status);
  }
  if (status_note !== undefined) {
    fields.push("status_note = ?");
    params.push(status_note);
  }

  if (fields.length === 0) {
    return res.status(400).send('No fields provided for update');
  }

  params.push(id);
  const query = `UPDATE assigned_projects SET ${fields.join(", ")} WHERE id = ?`;

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    try {
      const socketUtil = require("../utils/socket");
      socketUtil.getIO().emit("assigned-project-updated", { id });
    } catch (err) {
      console.error("Socket emit error in updateAssignedProjectStatus:", err);
    }

    res.status(200).json({ message: 'Assignment updated successfully' });
  });
};

const getAllAssignedDevelopmentTasks = (req, res) => {
  const query = `SELECT * FROM assign_development_tasks ORDER BY id ASC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
};

module.exports = {
  addLead,
  updateLead,
  createFollowUpReport,
  getLeadDetails,
  updateMeeting,
  updateFollowReport,
  mailTest,
  AddData,
  addCreativeCount,
  FetchData,
  UpdateTask,
  DeleteTask,
  FetchFUllData,
  ProjectsList,
  CategoryList,
  SubCategoryList,
  myTask,
  AddProject,
  AddCategory,
  AddSubcategory,
  UserData,
  UpdateEmployeeAPI,
  upload,
  projectFromAssign,
  assignProject,
  getUserTasks,
  DownloadUserTaskReport,
  getEmployeeAPI,
  checkInAttend, checkOutAttend, getCheckInByUser,
  getCheckInByUserIdOnly,
  getMonthlyAttendance,
  applyForLeaves,
  getMonthlyEmployeeLeavesByUserId,
  getAllLeaveDataForAdmin,
  approveRejectLeaves,
  getEmployeeTodaysLeavesByUserId,
  adminAddAttendance,
  adminUpdateAttendanceLogoutTime,
  adminResetPassword,
  sendOtp,
  verifyOtp,
  employeeResetPassword,
  adminReverseLeave,
  SalaryCalculatorsByUser,
  getAllHolidaysCurrentYear,
  addHolidayManually,
  updateHolidayStatus,
  deleteHoliday,
  getEmployeeSalary,
  assignProjectTarget,
  getAllProjectTarget,
  getEmployeeWiseProjectTarget,
  updateProjectTarget,
  deleteProjectTarget,
  bulkAssignProjectTarget,
  AssignDevelopmentTask,
  getAssignDevelopmentTask,
  updateAssignDevelopmentTask,
  UserDataById,
  getHolidaysByMonthYear,
  getAllAssignments,
  deleteAssignment,
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  updateAssignedProjectStatus,
  getAllAssignedDevelopmentTasks
};
