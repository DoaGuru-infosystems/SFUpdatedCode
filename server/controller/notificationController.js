const { db } = require("../config/db");
const socketUtil = require("../utils/socket");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment-timezone");
const nodemailer = require("nodemailer");
const schedule = require('node-schedule');
const dotenv = require("dotenv");
dotenv.config();
const webpush = require("../utils/webPush");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Error:", error.message);
  } else {
    console.log("✅ SMTP is ready to send emails.");
  }
});

const sendEmail = (to, subject, text, html, callback) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("❌ Email send error:", err.message);
      if (callback) callback(err);
    } else {
      console.log("📨 Email sent:", info.response);
      if (callback) callback(null, info);
    }
  });
};

const logoutReminder = () => {
  console.log("📩 Running logout reminder logic...");

  const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
  const formattedToday = moment(today).format("DD-MM-YYYY");

  // Step 1: Check if today is a holiday
  db.query(
    `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
    [today],
    (err, holidayRows) => {
      if (err) {
        console.error("❌ Error checking holiday:", err.message);
        return;
      }

      if (holidayRows.length > 0) {
        console.log(`🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`);
        return; // Skip reminders
      }

      // Step 2: Get list of users who applied leave today
      db.query(
        `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
        [formattedToday],
        (err2, leaveRows) => {
          if (err2) {
            console.error("❌ Error fetching leave data:", err2.message);
            return;
          }

          const leaveUserIds = leaveRows.map(row => row.leave_user_id);

          // Step 3: Fetch users who haven't logged out yet
          const sql = `
            SELECT * FROM attendance 
            JOIN task_users ON attendance.user_id = task_users.id
            WHERE attendance.attend_date = ? 
              AND task_users.employment_status = 'active' 
              AND (attendance.logout_time IS NULL OR attendance.logout_time = '')
          `;

          db.query(sql, [formattedToday], (err3, users) => {
            if (err3) {
              console.error("❌ Error fetching logout data:", err3.message);
              return;
            }

            // Filter out users who are on leave
            const filteredUsers = users.filter(user => !leaveUserIds.includes(user.user_id));

            if (filteredUsers.length === 0) {
              console.log("✅ No logout reminders needed (all logged out or on leave).");
              return;
            }

            // Step 4: Send reminders
            filteredUsers.forEach(user => {
              const subject = "Reminder: You Haven't Logged Out Yet";
              const text = `
Dear ${user.full_name},

Our records show that you have not logged out of the system today (${formattedToday}).

Please make sure to mark your logout to maintain accurate attendance logs.

If you've already done it and this message was sent in error, you may ignore it.

Best regards,  
HR & Admin Team  
Doaguru
              `;

              sendEmail(user.email_id, subject, text, null, (err) => {
                if (err) {
                  console.error(`❌ Failed to send logout email to ${user.email_id}:`, err.message);
                } else {
                  console.log(`✅ Logout reminder sent to ${user.email_id}`);
                }
              });
            });

            console.log(`✅ Logout reminders sent to ${filteredUsers.length} user(s).`);
          });
        }
      );
    }
  );
};

const loginReminder = () => {
  console.log("📩 Running login reminder logic...");

  const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

  // Step 1: Check if today is a paid holiday
  db.query(
    `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
    [today],
    (err, holidayRows) => {
      if (err) {
        console.error("❌ Error checking holiday:", err.message);
        return;
      }

      if (holidayRows.length > 0) {
        console.log(`🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`);
        return; // Exit early if it's a holiday
      }

      // Step 2: Get all active users
      db.query(
        `SELECT * FROM task_users WHERE employment_status = 'active'`,
        (err2, users) => {
          if (err2) {
            console.error("❌ Error fetching users:", err2.message);
            return;
          }

          // Step 3: Get today's attendance
          db.query(
            `SELECT user_id FROM attendance WHERE attend_date = ?`,
            [moment(today).format("DD-MM-YYYY")],
            (err3, attendanceRows) => {
              if (err3) {
                console.error("❌ Error fetching attendance:", err3.message);
                return;
              }

              const loggedInUserIds = attendanceRows.map((row) => row.user_id);

              // Step 4: Get users who applied leave for today
              db.query(
                `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
                [moment(today).format("DD-MM-YYYY")],
                (err4, leaveRows) => {
                  if (err4) {
                    console.error("❌ Error fetching leaves:", err4.message);
                    return;
                  }

                  const leaveUserIds = leaveRows.map((row) => row.leave_user_id);

                  // Step 5: Filter out users who are on leave or logged in
                  const notLoggedInUsers = users.filter(
                    (u) =>
                      !loggedInUserIds.includes(u.id) &&
                      !leaveUserIds.includes(u.id)
                  );

                  if (notLoggedInUsers.length === 0) {
                    console.log("✅ All users have either logged in or are on leave today.");
                    return;
                  }

                  // Step 6: Send reminder emails
                  notLoggedInUsers.forEach((user) => {
                    const subject = "Reminder: You Haven't Logged In Today";
                    const text = `
Dear ${user.full_name},

This is a gentle reminder that you have not logged in to the system today (${moment(today).format("DD-MM-YYYY")}).

Please make sure to mark your login to maintain accurate attendance records.

If you've already done it and this was sent in error, you may ignore this message.

Best regards,  
HR & Admin Team  
Doaguru
                    `;

                    sendEmail(user.email_id, subject, text, null, (err) => {
                      if (err) {
                        console.error(`❌ Failed to send email to ${user.email_id}:`, err.message);
                      } else {
                        console.log(`✅ Reminder sent to ${user.email_id}`);
                      }
                    });
                  });

                  console.log(`✅ Reminders sent to ${notLoggedInUsers.length} user(s).`);
                }
              );
            }
          );
        }
      );
    }
  );
};

const EmployeeNotLoginLogoutReminder = () => {
  console.log("📩 Running EmployeeNotLoginLogoutReminder...");

  const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
  const formattedToday = moment(today).format("DD-MM-YYYY");

  // Step 1: Check if today is a holiday
  db.query(
    `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
    [today],
    (err, holidayRows) => {
      if (err) {
        console.error("❌ Error checking holiday:", err.message);
        return;
      }

      if (holidayRows.length > 0) {
        console.log(`🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`);
        return; // Exit early if today is a holiday
      }

      // Step 2: Get users who have applied for leave today
      db.query(
        `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
        [formattedToday],
        (err2, leaveRows) => {
          if (err2) {
            console.error("❌ Error fetching leave data:", err2.message);
            return;
          }

          const leaveUserIds = leaveRows.map(row => row.leave_user_id);

          // Step 3: Get users who have no attendance record today
          const noLoginLogoutQuery = `
            SELECT task_users.id, task_users.full_name, task_users.email_id, task_users.designation
            FROM task_users
            LEFT JOIN attendance 
              ON attendance.user_id = task_users.id AND attendance.attend_date = ?
            WHERE attendance.user_id IS NULL
              AND task_users.employment_status = 'active'
          `;

          db.query(noLoginLogoutQuery, [formattedToday], (err3, absentUsers) => {
            if (err3) {
              console.error("❌ Error fetching users with no attendance record:", err3.message);
              return;
            }

            // Filter out users who are on leave
            const filteredAbsentUsers = absentUsers.filter(
              user => !leaveUserIds.includes(user.id)
            );

            if (filteredAbsentUsers.length === 0) {
              console.log("✅ All active users have either attended or are on leave today.");
              return;
            }

            // Step 4: Send reminders
            filteredAbsentUsers.forEach((user) => {
              const subject = `🟡 Attendance Alert: No Login/Logout Recorded - ${formattedToday}`;

              const html = `
                <p>Dear ${user.full_name},</p>

                <p>This is a gentle reminder that your <strong>attendance has not been recorded</strong> for today (<strong>${formattedToday}</strong>).</p>

                <p>⚠️ You have neither logged in nor logged out today.</p>

                <p>If you are on leave, please apply for leave immediately.<br/>
                For any other issue, kindly contact your admin as soon as possible.</p>

                <p>Regards,<br/>System Bot<br/>Doaguru</p>
              `;

              sendEmail(user.email_id, subject, null, html, (err) => {
                if (err) {
                  console.error(`❌ Failed to send reminder to ${user.email_id}:`, err.message);
                } else {
                  console.log(`📧 Reminder email sent to ${user.email_id}`);
                }
              });
            });

            console.log(`✅ Sent ${filteredAbsentUsers.length} reminder(s) for no login/logout.`);
          });
        }
      );
    }
  );
};

const AdminEmployeeNotLoginList = () => {
  console.log("📩 Running AdminEmployeeNotLoginList reminder logic...");

  const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
  const formattedToday = moment(today).format("DD-MM-YYYY");

  // Step 1: Check if today is a holiday
  db.query(
    `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
    [today],
    (err, holidayRows) => {
      if (err) {
        console.error("❌ Error checking holiday:", err.message);
        return;
      }

      if (holidayRows.length > 0) {
        console.log(`🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`);
        return; // Exit if holiday
      }

      // Step 2: Fetch users who applied for leave today
      db.query(
        `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
        [formattedToday],
        (err2, leaveRows) => {
          if (err2) {
            console.error("❌ Error fetching leave data:", err2.message);
            return;
          }

          const leaveUserIds = leaveRows.map((row) => row.leave_user_id);

          // Step 3: Get users who did NOT log in today
          const absentQuery = `
            SELECT task_users.id, task_users.full_name, task_users.email_id, task_users.designation
            FROM task_users
            LEFT JOIN attendance ON attendance.user_id = task_users.id AND attendance.attend_date = ?
            WHERE attendance.user_id IS NULL AND task_users.employment_status = 'active'
          `;

          db.query(absentQuery, [formattedToday], (err3, absentUsers) => {
            if (err3) {
              console.error("❌ Error fetching non-logged-in users:", err3.message);
              return;
            }

            // Step 4: Filter out users on leave
            const filteredAbsentUsers = absentUsers.filter(
              (user) => !leaveUserIds.includes(user.id)
            );

            if (filteredAbsentUsers.length === 0) {
              console.log("✅ Everyone has either logged in or is on leave today.");
              return;
            }

            // Step 5: Build HTML table for email
            const subject = "🟡 Login Reminder Report: Employees Not Logged In Today";

            const html = `
              <p>Dear Admin,</p>
              <p>Here is the list of users who have not logged in today (<strong>${formattedToday}</strong>):</p>

              <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredAbsentUsers
                .map(
                  (user, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${user.full_name}</td>
                      <td>${user.email_id}</td>
                      <td>${user.designation}</td>
                    </tr>
                  `
                )
                .join("")}
                </tbody>
              </table>

              <p>Regards,<br/>System Bot<br/>Doaguru</p>
            `;

            // Step 6: Send report to admins
            const adminQuery = `SELECT full_name, email_id FROM admin_users`;

            db.query(adminQuery, (err4, admins) => {
              if (err4) {
                console.error("❌ Failed to fetch admin emails:", err4.message);
                return;
              }

              admins.forEach((admin) => {
                sendEmail(admin.email_id, subject, null, html, (err5) => {
                  if (err5) {
                    console.error(
                      `❌ Failed to send login reminder report to ${admin.email_id}:`,
                      err5.message
                    );
                  } else {
                    console.log(`✅ Login reminder report sent to ${admin.email_id}`);
                  }
                });
              });
            });
          });
        }
      );
    }
  );
};


const AdminEmployeeLeaveList = () => {
  console.log("📩 Running AdminEmployeeLeaveList reminder logic...");

  const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

  // Step 1: Get users who did NOT log in today
  const absentQuery = `
  SELECT * 
  FROM attend_leaves 
  JOIN task_users ON attend_leaves.leave_user_id = task_users.id 
  WHERE task_users.employment_status = 'active' AND DATE(STR_TO_DATE(attend_leaves.applied_at_date, '%d-%m-%Y %H:%i:%s')) = ?
`;


  db.query(absentQuery, [today], (err, absentUsers) => {
    if (err) {
      console.error("❌ Error fetching Leave Details:", err.message);
      return;
    }

    if (absentUsers.length === 0) {
      console.log("No one is on leave today.");
      return;
    }

    // Step 2: Build HTML table for email
    const subject =
      "🟡 Leave Reminder Report: Employees applied for a leave today";

    const html = `
      <p>Dear Admin,</p>
      <p>Here is the list of Employee who applied for leave today (<strong>${today}</strong>):</p>

      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>#</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Designation</th>
            <th>Leave Reason</th>
          </tr>
        </thead>
        <tbody>
          ${absentUsers
        .map(
          (user, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${user.full_name}</td>
              <td>${user.email_id}</td>
              <td>${user.designation}</td>
              <td>${user.leave_reason}</td>
            </tr>
          `
        )
        .join("")}
        </tbody>
      </table>

      <p>Regards,<br/>System Bot<br/>Doaguru</p>
    `;

    // Step 3: Fetch admin email IDs
    const adminQuery = `SELECT full_name, email_id FROM admin_users`;

    db.query(adminQuery, (err, admins) => {
      if (err) {
        console.error("❌ Failed to fetch admin emails:", err.message);
        return;
      }

      admins.forEach((admin) => {
        sendEmail(admin.email_id, subject, null, html, (err) => {
          if (err) {
            console.error(
              `❌ Failed to send login reminder report to ${admin.email_id}:`,
              err.message
            );
          } else {
            console.log(`✅ Login reminder report sent to ${admin.email_id}`);
          }
        });
      });
    });
  });
};

const sendLeaveStatusNotification = (user, leaveDate, leaveStatus) => {
  const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

  const statusText =
    leaveStatus.toLowerCase() === "approved"
      ? "approved ✅"
      : leaveStatus.toLowerCase() === "rejected"
        ? "rejected ❌"
        : leaveStatus;

  const subject = `Leave ${leaveStatus} Notification - ${leaveDate}`;

  const text = `
Dear ${user.full_name},

This is to inform you that your leave request for **${leaveDate}** has been **${statusText}** as of ${today}.

If you have any questions or believe this decision was made in error, please contact the HR team.

Best regards,  
HR & Admin Team  
Doaguru
`;

  sendEmail(user.email_id, subject, text, null, (err) => {
    if (err) {
      console.error(`❌ Failed to send leave ${leaveStatus} notification to ${user.email_id}:`, err.message);
    } else {
      console.log(`✅ Leave ${leaveStatus} notification sent to ${user.email_id}`);
    }
  });
};

const AdminEmployeeNotLogoutList = () => {
  console.log("📩 Running AdminEmployeeNotLogoutList reminder logic...");

  const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

  // Step 1: Get users who logged in today but didn't logout
  const notLogoutQuery = `
    SELECT task_users.full_name, task_users.email_id, task_users.designation, attendance.login_time
    FROM attendance
    JOIN task_users ON attendance.user_id = task_users.id
    WHERE attendance.attend_date = ? AND attendance.login_time IS NOT NULL
      AND attendance.logout_time IS NULL 
      AND task_users.employment_status = 'active'
  `;

  db.query(notLogoutQuery, [today], (err, notLoggedOutUsers) => {
    if (err) {
      console.error("❌ Error fetching users not logged out:", err.message);
      return;
    }

    if (notLoggedOutUsers.length === 0) {
      console.log("✅ Everyone has logged out today.");
      return;
    }

    // Step 2: Build HTML table for email
    const subject = "🔴 Logout Reminder Report: Employees Logged In but Not Logged Out";

    const html = `
      <p>Dear Admin,</p>
      <p>Here is the list of users who logged in but haven't logged out yet (<strong>${today}</strong>):</p>

      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>#</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Designation</th>
            <th>Login Time</th>
          </tr>
        </thead>
        <tbody>
          ${notLoggedOutUsers
        .map(
          (user, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${user.full_name}</td>
              <td>${user.email_id}</td>
              <td>${user.designation}</td>
              <td>${user.login_time}</td>
            </tr>
          `
        )
        .join("")}
        </tbody>
      </table>

      <p>Regards,<br/>System Bot<br/>Doaguru</p>
    `;

    // Step 3: Fetch admin email IDs
    const adminQuery = `SELECT full_name, email_id FROM admin_users`;

    db.query(adminQuery, (err, admins) => {
      if (err) {
        console.error("❌ Failed to fetch admin emails:", err.message);
        return;
      }

      admins.forEach((admin) => {
        sendEmail(admin.email_id, subject, null, html, (err) => {
          if (err) {
            console.error(`❌ Failed to send logout reminder report to ${admin.email_id}:`, err.message);
          } else {
            console.log(`✅ Logout reminder report sent to ${admin.email_id}`);
          }
        });
      });
    });
  });
};

const AdminEmployeeNotLoginLogoutList = () => {
  console.log("📩 Running AdminEmployeeNotLoginLogoutList reminder logic...");

  const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
  const formattedToday = moment(today).format("DD-MM-YYYY");

  // Step 1: Check if today is a holiday
  db.query(
    `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
    [today],
    (err, holidayRows) => {
      if (err) {
        console.error("❌ Error checking holiday:", err.message);
        return;
      }

      if (holidayRows.length > 0) {
        console.log(`🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`);
        return; // Exit if it's a holiday
      }

      // Step 2: Get users on leave today
      db.query(
        `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
        [formattedToday],
        (err2, leaveRows) => {
          if (err2) {
            console.error("❌ Error fetching leave data:", err2.message);
            return;
          }

          const leaveUserIds = leaveRows.map((row) => row.leave_user_id);

          // Step 3: Get active users with no attendance today
          const noLoginLogoutQuery = `
            SELECT task_users.id, task_users.full_name, task_users.email_id, task_users.designation
            FROM task_users
            LEFT JOIN attendance 
              ON attendance.user_id = task_users.id AND attendance.attend_date = ?
            WHERE attendance.user_id IS NULL
              AND task_users.employment_status = 'active'
          `;

          db.query(noLoginLogoutQuery, [formattedToday], (err3, absentUsers) => {
            if (err3) {
              console.error("❌ Error fetching users with no attendance record:", err3.message);
              return;
            }

            // Step 4: Filter out users who are on leave
            const filteredAbsentUsers = absentUsers.filter(
              (user) => !leaveUserIds.includes(user.id)
            );

            if (filteredAbsentUsers.length === 0) {
              console.log("✅ All users have either logged in or are on leave today.");
              return;
            }

            // Step 5: Build email content
            const subject = "🟡 Login Reminder Report: Employees Not Logged In Today";

            const html = `
              <p>Dear Admin,</p>
              <p>The following active employees have <strong>not logged in or out</strong> at all today (<strong>${formattedToday}</strong>):</p>

              <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Designation</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredAbsentUsers.map((user, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${user.full_name}</td>
                      <td>${user.email_id}</td>
                      <td>${user.designation}</td>
                    </tr>`).join("")}
                </tbody>
              </table>

              <p>Regards,<br/>System Bot<br/>Doaguru</p>
            `;

            // Step 6: Send email to admins
            const adminQuery = `SELECT full_name, email_id FROM admin_users`;

            db.query(adminQuery, (err4, admins) => {
              if (err4) {
                console.error("❌ Failed to fetch admin emails:", err4.message);
                return;
              }

              admins.forEach((admin) => {
                sendEmail(admin.email_id, subject, null, html, (err5) => {
                  if (err5) {
                    console.error(`❌ Failed to send login reminder to ${admin.email_id}:`, err5.message);
                  } else {
                    console.log(`✅ Login reminder report sent to ${admin.email_id}`);
                  }
                });
              });
            });
          });
        }
      );
    }
  );
};

const markDailyAbsentees = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const formattedToday = moment(today).format("DD-MM-YYYY");
    const recordTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    // Step 0: Check if today is a holiday
    const holidayQuery = `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`;
    db.query(holidayQuery, [today], (holidayErr, holidayRows) => {
      if (holidayErr) {
        console.error("❌ Error checking holiday:", holidayErr.message);
        return reject(holidayErr);
      }

      if (holidayRows.length > 0) {
        console.log(`🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`);
        return resolve({ success: true, message: "Holiday - No absentees marked." });
      }

      // Step 1: Get all active users
      const usersQuery = `SELECT id FROM task_users WHERE employment_status = 'active'`;

      db.query(usersQuery, (err, users) => {
        if (err) {
          console.error("❌ Error fetching users:", err.message);
          return reject(err);
        }

        const userChecks = users.map((user) => {
          return new Promise((resolveUser) => {
            const userId = user.id;

            // Step 2: Check if attendance exists
            const attendanceQuery = `
              SELECT * FROM attendance 
              WHERE user_id = ? AND attend_date = ?
            `;
            db.query(attendanceQuery, [userId, formattedToday], (attErr, attRows) => {
              if (attErr || attRows.length > 0) return resolveUser(); // Already marked

              // Step 3: Check for approved/pending leave
              const leaveQuery = `
                SELECT * FROM attend_leaves 
                WHERE leave_user_id = ? AND leave_date = ? AND leave_status IN ('approved', 'pending')
              `;
              db.query(leaveQuery, [userId, formattedToday], (leaveErr, leaveRows) => {
                if (leaveErr || leaveRows.length > 0) return resolveUser(); // Has leave

                // Step 4: Insert absent record
                const insertQuery = `
                  INSERT INTO attendance 
                  (user_id, attend_date, day_status, work_minutes, record_created_at) 
                  VALUES (?, ?, 'absent', '0', ?)
                `;
                db.query(insertQuery, [userId, formattedToday, recordTime], (insertErr) => {
                  if (insertErr) {
                    console.error(`❌ Failed to mark absent for user ${userId}:`, insertErr.message);
                  }
                  resolveUser();
                });
              });
            });
          });
        });

        Promise.all(userChecks).then(() => {
          console.log("✅ Absent marking process completed.");
          resolve({ success: true });
        });
      });
    });
  });
};

// const checkNoTaskEmployeeMail = async () => {
//   return new Promise((resolve, reject) => {
//     try {
//       const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

//       const allActiveUsersQuery = `
//         SELECT tu.id AS user_id, tu.full_name, tu.email_id, tu.designation, tu.department
//         FROM task_users tu
//         WHERE tu.employment_status = 'active'
//       `;

//       const filledUsersQuery = `
//         SELECT DISTINCT user_id
//         FROM tasks
//         WHERE task_date = ?
//       `;

//       db.query(allActiveUsersQuery, (err, allUsers) => {
//         if (err) return reject({ success: false, message: err.message });

//         db.query(filledUsersQuery, [today], (err2, filledUsers) => {
//           if (err2) return reject({ success: false, message: err2.message });

//           const filledIds = filledUsers.map((t) => t.user_id);
//           const missingEmployees = allUsers.filter(
//             (user) => !filledIds.includes(user.user_id)
//           );

//           if (missingEmployees.length === 0) {
//             return resolve({
//               success: true,
//               date: today,
//               totalMissing: 0,
//               missingEmployees: [],
//               failedEmails: [],
//             });
//           }

//           const subject = `Task Defaulter Report - ${today}`;
//           const html = `
//             <p>Dear Admin,</p>
//             <p>The following employees have <strong>not filled their daily task</strong> for <strong>${today}</strong>:</p>

//             <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
//               <thead>
//                 <tr style="background-color: #f2f2f2;">
//                   <th>#</th>
//                   <th>Full Name</th>
//                   <th>Email</th>
//                   <th>Designation</th>
//                   <th>Department</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${missingEmployees
//                   .map(
//                     (emp, index) => `
//                   <tr>
//                     <td>${index + 1}</td>
//                     <td>${emp.full_name}</td>
//                     <td>${emp.email_id}</td>
//                     <td>${emp.designation || "-"}</td>
//                     <td>${emp.department || "-"}</td>
//                   </tr>
//                 `
//                   )
//                   .join("")}
//               </tbody>
//             </table>

//             <p>Regards,<br/>System Bot<br/>Doaguru CRM</p>
//           `;

//           const adminQuery = `SELECT * FROM admin_users`;

//           db.query(adminQuery, (err3, admins) => {
//             if (err3) {
//               return reject({ success: false, message: err3.message });
//             }

//             if (!admins || admins.length === 0) {
//               return resolve({
//                 success: true,
//                 date: today,
//                 totalMissing: missingEmployees.length,
//                 missingEmployees,
//                 failedEmails: [],
//               });
//             }

//             const failedEmails = [];

//             let completed = 0;
//             const totalAdmins = admins.length;

//             admins.forEach((admin) => {
//               sendEmail(admin.email_id, subject, null, html, (err4) => {
//                 if (err4) {
//                   failedEmails.push({
//                     admin_email: admin.email_id,
//                     error: err4.message,
//                   });
//                 }

//                 completed++;
//                 if (completed === totalAdmins) {
//                   resolve({
//                     success: true,
//                     date: today,
//                     totalMissing: missingEmployees.length,
//                     missingEmployees,
//                     failedEmails,
//                   });
//                 }
//               });
//             });
//           });
//         });
//       });
//     } catch (error) {
//       reject({ success: false, message: error.message });
//     }
//   });
// };

const checkNoTaskEmployeeMail = async () => {
  return new Promise((resolve, reject) => {
    try {
      const taskToday = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
      const attendToday = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

      // 1️⃣ Get all active users
      const allActiveUsersQuery = `
        SELECT id AS user_id, full_name, email_id, designation, department
        FROM task_users
        WHERE employment_status = 'active'
      `;

      // 2️⃣ Get users who logged in today
      const todayLoginUsersQuery = `
        SELECT DISTINCT user_id
        FROM attendance
        WHERE attend_date = ? AND login_time IS NOT NULL
      `;

      // 3️⃣ Get users who filled tasks today
      const filledUsersQuery = `
        SELECT DISTINCT user_id
        FROM tasks
        WHERE task_date = ?
      `;

      db.query(allActiveUsersQuery, (err, allUsers) => {
        if (err) return reject({ success: false, message: err.message });

        db.query(todayLoginUsersQuery, [attendToday], (err2, loginUsers) => {
          if (err2) return reject({ success: false, message: err2.message });

          db.query(filledUsersQuery, [taskToday], (err3, filledUsers) => {
            if (err3) return reject({ success: false, message: err3.message });

            const loggedInIds = loginUsers.map((u) => u.user_id);
            const filledIds = filledUsers.map((f) => f.user_id);

            // 4️⃣ Smart Filter:
            // Only those who logged in but did not fill tasks
            const missingEmployees = allUsers.filter(
              (user) =>
                loggedInIds.includes(user.user_id) &&
                !filledIds.includes(user.user_id)
            );

            if (missingEmployees.length === 0) {
              return resolve({
                success: true,
                date: taskToday,
                totalMissing: 0,
                missingEmployees: [],
                failedEmails: [],
              });
            }

            // Email Body
            const subject = `Task Defaulter Report - ${taskToday}`;
            const html = `
              <p>Dear Admin,</p>
              <p>The following employees <strong>logged in</strong> but 
              <strong>did not fill today's task</strong> for <strong>${taskToday}</strong>:</p>

              <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  ${missingEmployees
                .map(
                  (emp, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${emp.full_name}</td>
                      <td>${emp.email_id}</td>
                      <td>${emp.designation || "-"}</td>
                      <td>${emp.department || "-"}</td>
                    </tr>
                  `
                )
                .join("")}
                </tbody>
              </table>

              <p>Regards,<br/>System Bot<br/>Doaguru CRM</p>
            `;

            // Get admin emails
            const adminQuery = `SELECT * FROM admin_users`;

            db.query(adminQuery, (err4, admins) => {
              if (err4) return reject({ success: false, message: err4.message });

              if (!admins || admins.length === 0) {
                return resolve({
                  success: true,
                  date: taskToday,
                  totalMissing: missingEmployees.length,
                  missingEmployees,
                  failedEmails: [],
                });
              }

              const failedEmails = [];
              let completed = 0;

              // admin.email_id

              admins.forEach((admin) => {
                sendEmail(admin.email_id, subject, null, html, (errMail) => {
                  if (errMail) {
                    failedEmails.push({
                      admin_email: admin.email_id,
                      error: errMail.message,
                    });
                  }

                  completed++;
                  if (completed === admins.length) {
                    resolve({
                      success: true,
                      date: taskToday,
                      totalMissing: missingEmployees.length,
                      missingEmployees,
                      failedEmails,
                    });
                  }
                });
              });
            });
          });
        });
      });
    } catch (error) {
      reject({ success: false, message: error.message });
    }
  });
};


function scheduleLoginReminder() {
  return schedule.scheduleJob(
    'login-reminder-every-day-at-11am',
    { rule: '0 0 11 * * 1-6', tz: 'Asia/Kolkata' },
    async () => {
      console.log('🚀 Login reminder triggered every minute (IST)');
      await loginReminder(); // this must NOT rely on req/res
    }
  );
}

function scheduleLogoutReminder() {
  return schedule.scheduleJob(
    'logout-reminder-every-day-at-9pm',
    { rule: '0 0 21 * * 1-6', tz: 'Asia/Kolkata' }, // ⏰ Every minute IST
    async () => {
      console.log('🚀 Login reminder triggered every minute (IST)');
      await logoutReminder(); // this must NOT rely on req/res
    }
  );
}

function scheduleAdminAbsentEmployeeReminder() {
  return schedule.scheduleJob(
    "Admin-absent-employee-list at 12am daily",
    { rule: "0 0 12 * * 1-6", tz: "Asia/Kolkata" }, // ⏰ Every minute IST
    async () => {
      console.log("🚀 Login reminder triggered every minute (IST)");
      await AdminEmployeeNotLoginList(); // this must NOT rely on req/res
    }
  );
}

function scheduleAdminLeaveEmployeeReminder() {
  return schedule.scheduleJob(
    "Admin-leave-employee-list at 12am daily",
    { rule: "0 0 21 * * 1-6", tz: "Asia/Kolkata" }, // ⏰ Every minute IST
    async () => {
      console.log("🚀 leave reminder triggered every minute (IST)");
      await AdminEmployeeLeaveList(); // this must NOT rely on req/res
    }
  );
}

function scheduleAdminEmployeeNotLogoutListReminder() {
  return schedule.scheduleJob(
    "Admin-Employee-Not-Logout-List at 21PM daily",
    { rule: "0 0 21 * * 1-6", tz: "Asia/Kolkata" }, // ⏰ Every minute IST
    async () => {
      console.log("🚀 leave reminder triggered every minute (IST)");
      await AdminEmployeeNotLogoutList(); // this must NOT rely on req/res
    }
  );
}


function scheduleAdminEmployeeNotLoginLogoutListReminder() {
  return schedule.scheduleJob(
    "Admin-Employee-Not-Logout-List at 21PM daily",
    { rule: "0 0 21 * * 1-6", tz: "Asia/Kolkata" }, // ⏰ Every minute IST
    async () => {
      console.log("🚀 leave reminder triggered every minute (IST)");
      await AdminEmployeeNotLoginLogoutList(); // this must NOT rely on req/res
    }
  );
}

function scheduleEmployeeNotLoginLogoutListReminder() {
  return schedule.scheduleJob(
    "Admin-Employee-Not-Logout-List at 21PM daily",
    { rule: "0 0 20 * * 1-6", tz: "Asia/Kolkata" }, // ⏰ Every minute IST
    async () => {
      console.log("🚀 leave reminder triggered every minute (IST)");
      await EmployeeNotLoginLogoutReminder(); // this must NOT rely on req/res
    }
  );
}


function scheduleMarkDailyAbsentees() {
  return schedule.scheduleJob(
    "markDailyAbsentees at 21:00PM daily",
    { rule: "0 0 18 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 leave reminder triggered every minute (IST)");
      await markDailyAbsentees();
    }
  );
}


function scheduleMarkDailyAbsenteesOne() {
  return schedule.scheduleJob(
    "markDailyAbsentees at 21:00PM daily",
    { rule: "0 0 20 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 leave reminder triggered every minute (IST)");
      await markDailyAbsentees();
    }
  );
}



function scheduleCheckNoTaskEmployee() {
  return schedule.scheduleJob(
    "checkNoTaskEmployee at 08:00PM daily",
    { rule: "0 0 23 * * 1-6", tz: "Asia/Kolkata" }, // Mon–Sat at 8:00 PM IST
    async () => {
      await checkNoTaskEmployeeMail();
    }
  );
}

// function scheduleCheckNoTaskEmployee() {
//   const rule = new schedule.RecurrenceRule();
//   rule.minute = new schedule.Range(0, 59);
//   rule.tz = "Asia/Kolkata";

//   return schedule.scheduleJob(
//     "checkNoTaskEmployee",
//     rule,
//     async () => {
//       await checkNoTaskEmployeeMail();
//     }
//   );
// }




const addAdminNotification = (userId, userName, type, message) => {
  const sql = `
    INSERT INTO admin_notifications (user_id, user_name, type, message)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [userId, userName, type, message], (err, result) => {
    if (err) {
      console.error("❌ Failed to create admin notification:", err.message);
      return;
    }

    // ═══ Real-Time Socket Emission ═══
    const newNotif = {
      id: result.insertId,
      user_id: userId,
      user_name: userName,
      type,
      message,
      is_read: 0,
      created_at: new Date(),
    };
    socketUtil.getIO().emit("new-notification", newNotif);

    // ═══ Hybrid Web Push (Offline Support) ═══
    const psql = "SELECT * FROM push_subscriptions";
    db.query(psql, (perr, subscriptions) => {
      if (perr) {
        console.error("❌ Error fetching push subscriptions:", perr.message);
        return;
      }

      if (subscriptions.length > 0) {
        console.log(`📡 Sending Background Push to ${subscriptions.length} device(s)...`);
      }

      const pushPayload = JSON.stringify({
        title: `DG Workspace: ${userName}`,
        message: message,
        type: type,
        url: "/task/Admin-Home-page"
      });

      subscriptions.forEach((sub) => {
        try {
          const pushSubscription = JSON.parse(sub.subscription);
          webpush.sendNotification(pushSubscription, pushPayload)
            .then(() => console.log(`✅ Background alert success for subscriber ID: ${sub.id}`))
            .catch(error => {
              if (error.statusCode === 410 || error.statusCode === 404) {
                console.log("♻️ Removing expired push subscription for ID:", sub.id);
                db.query("DELETE FROM push_subscriptions WHERE id = ?", [sub.id]);
              } else {
                console.error(`❌ Web Push Error for ID ${sub.id}:`, error.message);
              }
            });
        } catch (parseErr) {
          console.error(`❌ Failed to parse subscription for ID ${sub.id}:`, parseErr.message);
        }
      });
    });
  });
};

const saveSubscription = (req, res) => {
  const { subscription, userId } = req.body;

  console.log(`📥 Incoming Push Subscription for user ID: ${userId || 'unknown'}`);
  console.log("Subscription payload:", JSON.stringify(subscription));

  if (!subscription) {
    console.warn("⚠️ Subscription missing in request body");
    return res.status(400).json({ success: false, message: "Subscription missing" });
  }

  const subString = JSON.stringify(subscription);

  // Using INSERT IGNORE or ON DUPLICATE KEY to prevent crashes on re-subscription
  const sql = "INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?) ON DUPLICATE KEY UPDATE subscription = ?";

  db.query(sql, [userId || 0, subString, subString], (err) => {
    if (err) {
      console.error("❌ DB Error saving subscription:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log("✅ Subscription saved successfully to Database.");
    res.status(200).json({ success: true, message: "Push Subscription Saved Successfully" });
  });
};

const getAdminNotifications = (req, res) => {
  const sql = `
    SELECT * FROM admin_notifications 
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.status(200).json({ success: true, notifications: result });
  });
};

const markNotificationAsRead = (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE admin_notifications SET is_read = 1 WHERE id = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.status(200).json({ success: true, message: "Notification marked as read" });
  });
};

module.exports = {
  loginReminder,
  scheduleLoginReminder,
  scheduleLogoutReminder,
  scheduleAdminAbsentEmployeeReminder,
  scheduleAdminLeaveEmployeeReminder,
  sendLeaveStatusNotification,
  scheduleAdminEmployeeNotLogoutListReminder,
  scheduleAdminEmployeeNotLoginLogoutListReminder,
  scheduleEmployeeNotLoginLogoutListReminder,
  scheduleMarkDailyAbsentees,
  scheduleMarkDailyAbsenteesOne,
  scheduleCheckNoTaskEmployee,
  checkNoTaskEmployeeMail,
  addAdminNotification,
  getAdminNotifications,
  markNotificationAsRead,
  saveSubscription
}