const { db } = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment-timezone");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

// test whatsapp
const sendWhatsApp = async (toNumber, userName) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: "greeting_template",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: userName,
              },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp sent to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ WhatsApp failed to ${toNumber}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

// Admin OTP WhatsApp
const sendAdminOtpWhatsApp = async (otp) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    // Hardcoded destination number per requirements
    const toNumber = "917047490032"; 
    // Note: Assuming the API requires country code like 91.

    const data = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: "sfadminotp",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp.toString(),
              },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp OTP sent to Admin (${toNumber})`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ WhatsApp OTP failed to Admin:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

// logout reminder whatsapp

const sendLogoutReminderWhatsApp = async (number, name, today) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: number, // dynamic mobile number
      type: "template",
      template: {
        name: "logout_reminder",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: today },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp logout reminder sent to ${name} (${number})`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp logout reminder to ${name} (${number}):`,
      error.response?.data || error.message
    );
    return { error: error.response?.data || error.message };
  }
};

// const logoutReminderWhatsApp = () => {
//   return new Promise((resolve, reject) => {
//     const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

//     const sql = `
//       SELECT task_users.full_name, task_users.mobile_number
//       FROM attendance
//       JOIN task_users ON attendance.user_id = task_users.id
//       WHERE task_users.employment_status = 'active' AND attendance.attend_date = ?
//         AND (attendance.logout_time IS NULL OR attendance.logout_time = '')
//     `;

//     db.query(sql, [today], async (err, users) => {
//       if (err) {
//         console.error("❌ Database error:", err.message);
//         return reject("Database error");
//       }

//       if (users.length === 0) {
//         console.log("✅ All users have logged out today.");
//         return resolve({ success: true, message: "All users have logged out today." });
//       }

//       try {
//         const results = await Promise.all(
//           users.map(({ full_name, mobile_number }) =>
//             sendLogoutReminderWhatsApp(mobile_number, full_name, today)
//           )
//         );

//         resolve({ success: true, count: users.length, results });
//       } catch (error) {
//         console.error("❌ Error sending WhatsApp messages:", error.message);
//         reject("WhatsApp API error");
//       }
//     });
//   });
// };

const logoutReminderWhatsApp = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const formattedToday = moment(today).format("DD-MM-YYYY");

    // Step 1: Check if today is a holiday
    db.query(
      `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
      [today],
      (holidayErr, holidayRows) => {
        if (holidayErr) {
          console.error("❌ Error checking holiday:", holidayErr.message);
          return reject("Holiday check failed");
        }

        if (holidayRows.length > 0) {
          console.log(
            `🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`
          );
          return resolve({
            success: true,
            message: "Holiday - No logout reminders sent.",
          });
        }

        // Step 2: Get leave user IDs
        db.query(
          `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
          [formattedToday],
          (leaveErr, leaveRows) => {
            if (leaveErr) {
              console.error("❌ Error fetching leave data:", leaveErr.message);
              return reject("Leave check failed");
            }

            const leaveUserIds = leaveRows.map((row) => row.leave_user_id);

            // Step 3: Get users who logged in but didn’t log out
            const sql = `
              SELECT attendance.user_id, task_users.full_name, task_users.mobile_number 
              FROM attendance 
              JOIN task_users ON attendance.user_id = task_users.id
              WHERE task_users.employment_status = 'active'
                AND attendance.attend_date = ?
                AND (attendance.logout_time IS NULL OR attendance.logout_time = '')
            `;

            db.query(sql, [formattedToday], async (err, users) => {
              if (err) {
                console.error("❌ Database error:", err.message);
                return reject("Database error");
              }

              // Step 4: Exclude users on leave
              const filteredUsers = users.filter(
                (user) => !leaveUserIds.includes(user.user_id)
              );

              if (filteredUsers.length === 0) {
                console.log(
                  "✅ No logout reminders needed (all logged out or on leave)."
                );
                return resolve({
                  success: true,
                  message: "No logout reminders needed.",
                });
              }

              try {
                const results = await Promise.all(
                  filteredUsers.map(({ full_name, mobile_number }) =>
                    sendLogoutReminderWhatsApp(
                      mobile_number,
                      full_name,
                      formattedToday
                    )
                  )
                );

                console.log(
                  `✅ Sent WhatsApp logout reminders to ${filteredUsers.length} user(s).`
                );
                resolve({
                  success: true,
                  count: filteredUsers.length,
                  results,
                });
              } catch (error) {
                console.error(
                  "❌ Error sending WhatsApp messages:",
                  error.message
                );
                reject("WhatsApp API error");
              }
            });
          }
        );
      }
    );
  });
};

function scheduleLogoutReminderWhatsapp() {
  return schedule.scheduleJob(
    "logout-reminder-every-day-at-9pm whatsapp",
    { rule: "0 0 21 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 Logout reminder triggered at 9 PM IST");
      await logoutReminderWhatsApp();
    }
  );
}

// login reminder whatsapp
const sendLoginReminderWhatsApp = async (number, name, today) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: number, // dynamic mobile number
      type: "template",
      template: {
        name: "login_reminder",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: today },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp logouineminder sent to ${name} (${number})`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp logout reminder to ${name} (${number}):`,
      error.response?.data || error.message
    );
    return { error: error.response?.data || error.message };
  }
};

// const loginReminderWhatsApp = () => {
//   return new Promise((resolve, reject) => {
//     const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

//     // Step 1: Get all users
//     db.query(`SELECT * FROM task_users WHERE employment_status = 'active'`, (err, users) => {
//       if (err) {
//         console.error("❌ Error fetching users:", err.message);
//         return reject("Database error");
//       }

//       // Step 2: Get all attendance records for today
//       db.query(
//         `SELECT user_id FROM attendance WHERE attend_date = ?`,
//         [today],
//         async (err2, attendanceRows) => {
//           if (err2) {
//             console.error("❌ Error fetching attendance:", err2.message);
//             return reject("Database error");
//           }

//           const loggedInUserIds = attendanceRows.map((row) => row.user_id);
//           const notLoggedInUsers = users.filter(
//             (u) => !loggedInUserIds.includes(u.id)
//           );

//           if (notLoggedInUsers.length === 0) {
//             console.log("✅ All users have logged in today.");
//             return resolve({ success: true, message: "All users have logged in today." });
//           }

//           try {
//             const results = await Promise.all(
//               notLoggedInUsers.map(({ full_name, mobile_number }) =>
//                 sendLoginReminderWhatsApp(mobile_number, full_name, today)
//               )
//             );

//             console.log(`✅ WhatsApp reminders sent to ${notLoggedInUsers.length} user(s).`);
//             resolve({ success: true, count: notLoggedInUsers.length, results });
//           } catch (error) {
//             console.error("❌ Error sending WhatsApp messages:", error.message);
//             reject("WhatsApp API error");
//           }
//         }
//       );
//     });
//   });
// };

const loginReminderWhatsApp = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const formattedToday = moment(today).format("DD-MM-YYYY");

    // Step 1: Check if today is a holiday
    db.query(
      `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
      [today],
      (holidayErr, holidayRows) => {
        if (holidayErr) {
          console.error("❌ Error checking holiday:", holidayErr.message);
          return reject("Holiday check failed");
        }

        if (holidayRows.length > 0) {
          console.log(
            `🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`
          );
          return resolve({
            success: true,
            message: "Holiday - No login reminders sent.",
          });
        }

        // Step 2: Get all active users
        db.query(
          `SELECT * FROM task_users WHERE employment_status = 'active'`,
          (err, users) => {
            if (err) {
              console.error("❌ Error fetching users:", err.message);
              return reject("Database error");
            }

            // Step 3: Get attendance for today
            db.query(
              `SELECT user_id FROM attendance WHERE attend_date = ?`,
              [formattedToday],
              async (err2, attendanceRows) => {
                if (err2) {
                  console.error("❌ Error fetching attendance:", err2.message);
                  return reject("Database error");
                }

                const loggedInUserIds = attendanceRows.map(
                  (row) => row.user_id
                );

                // Step 4: Get leave users for today
                db.query(
                  `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
                  [formattedToday],
                  async (leaveErr, leaveRows) => {
                    if (leaveErr) {
                      console.error(
                        "❌ Error fetching leave data:",
                        leaveErr.message
                      );
                      return reject("Leave check failed");
                    }

                    const leaveUserIds = leaveRows.map(
                      (row) => row.leave_user_id
                    );

                    // Step 5: Filter users who are neither logged in nor on leave
                    const notLoggedInUsers = users.filter(
                      (u) =>
                        !loggedInUserIds.includes(u.id) &&
                        !leaveUserIds.includes(u.id)
                    );

                    if (notLoggedInUsers.length === 0) {
                      console.log(
                        "✅ All users have either logged in or are on leave today."
                      );
                      return resolve({
                        success: true,
                        message: "All users covered.",
                      });
                    }

                    try {
                      const results = await Promise.all(
                        notLoggedInUsers.map(({ full_name, mobile_number }) =>
                          sendLoginReminderWhatsApp(
                            mobile_number,
                            full_name,
                            formattedToday
                          )
                        )
                      );

                      console.log(
                        `✅ WhatsApp login reminders sent to ${notLoggedInUsers.length} user(s).`
                      );
                      resolve({
                        success: true,
                        count: notLoggedInUsers.length,
                        results,
                      });
                    } catch (error) {
                      console.error(
                        "❌ Error sending WhatsApp messages:",
                        error.message
                      );
                      reject("WhatsApp API error");
                    }
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};

function scheduleLoginReminderWhatsapp() {
  return schedule.scheduleJob(
    "login-reminder-every-day-at-12am whatsapp",
    { rule: "0 0 12 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 Login reminder triggered at 11AM IST");
      await loginReminderWhatsApp();
    }
  );
}

//Admin check total absent reminder

const sendAdminAbsentCheckReminderWhatsApp = async (toNumber, count, today) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: "total_employee_absent_reminder_admin",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: today },
              { type: "text", text: count.toString() },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp reminder sent to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp reminder to ${toNumber}:`,
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

// const adminAbsentCheckReminderWhatsApp = () => {
//   return new Promise((resolve, reject) => {
//     const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

//     // Step 1: Get all users who have NOT logged in today
//     const absentQuery = `
//       SELECT * FROM task_users LEFT JOIN attendance ON attendance.user_id = task_users.id AND attendance.attend_date = ?
//     WHERE attendance.user_id IS NULL AND task_users.employment_status = 'active'
//     `;

//     db.query(absentQuery, [today], async (err, absentUsers) => {
//       if (err) {
//         console.error("❌ Error fetching non-logged-in users:", err.message);
//         return reject("Database error");
//       }

//       const absentCount = absentUsers.length;

//       if (absentCount === 0) {
//         console.log("✅ All users have logged in today.");
//         return resolve({ success: true, message: "All users have logged in today." });
//       }

//       // Step 2: Send WhatsApp summary to admin
//       const adminQuery = `SELECT full_name, admin_number FROM admin_users`;

//       db.query(adminQuery, async (err2, admins) => {
//         if (err2) {
//           console.error("❌ Error fetching admin users:", err2.message);
//           return reject("Admin query failed");
//         }

//         try {
//           const results = await Promise.all(
//             admins.map(({ admin_number }) =>
//               sendAdminAbsentCheckReminderWhatsApp(admin_number, absentCount, today)
//             )
//           );

//           console.log(`✅ WhatsApp reminders sent to ${admins.length} admin(s).`);
//           resolve({ success: true, adminCount: admins.length, absentCount, results });
//         } catch (error) {
//           console.error("❌ WhatsApp API error:", error.message);
//           reject("WhatsApp API error");
//         }
//       });
//     });
//   });
// };

const adminAbsentCheckReminderWhatsApp = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const formattedToday = moment(today).format("DD-MM-YYYY");

    // Step 1: Check if today is a holiday
    db.query(
      `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
      [today],
      (holidayErr, holidayRows) => {
        if (holidayErr) {
          console.error("❌ Error checking holiday:", holidayErr.message);
          return reject("Holiday check failed");
        }

        if (holidayRows.length > 0) {
          console.log(
            `🎉 Today (${today}) is a holiday: ${holidayRows[0].holiday_title}`
          );
          return resolve({
            success: true,
            message: "Holiday - No absent summary sent.",
          });
        }

        // Step 2: Get users who have NOT logged in today
        const absentQuery = `
          SELECT task_users.id, task_users.full_name, task_users.designation
          FROM task_users 
          LEFT JOIN attendance 
            ON attendance.user_id = task_users.id AND attendance.attend_date = ?
          WHERE attendance.user_id IS NULL AND task_users.employment_status = 'active'
        `;

        db.query(absentQuery, [formattedToday], (absentErr, absentUsers) => {
          if (absentErr) {
            console.error("❌ Error fetching absent users:", absentErr.message);
            return reject("Database error");
          }

          // Step 3: Get leave user IDs
          db.query(
            `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
            [formattedToday],
            (leaveErr, leaveRows) => {
              if (leaveErr) {
                console.error(
                  "❌ Error fetching leave data:",
                  leaveErr.message
                );
                return reject("Leave check failed");
              }

              const leaveUserIds = leaveRows.map((row) => row.leave_user_id);

              // Step 4: Filter out leave users
              const finalAbsentUsers = absentUsers.filter(
                (user) => !leaveUserIds.includes(user.id)
              );

              const absentCount = finalAbsentUsers.length;

              if (absentCount === 0) {
                console.log(
                  "✅ No actual absentees (all logged in or on leave)."
                );
                return resolve({
                  success: true,
                  message: "All users have logged in or are on leave.",
                });
              }

              // Step 5: Notify admins via WhatsApp
              const adminQuery = `SELECT full_name, admin_number FROM admin_users`;

              db.query(adminQuery, async (err2, admins) => {
                if (err2) {
                  console.error("❌ Error fetching admin users:", err2.message);
                  return reject("Admin query failed");
                }

                try {
                  const results = await Promise.all(
                    admins.map(({ admin_number }) =>
                      sendAdminAbsentCheckReminderWhatsApp(
                        admin_number,
                        absentCount,
                        formattedToday
                      )
                    )
                  );

                  console.log(
                    `✅ WhatsApp absent summary sent to ${admins.length} admin(s).`
                  );
                  resolve({
                    success: true,
                    adminCount: admins.length,
                    absentCount,
                    results,
                  });
                } catch (error) {
                  console.error("❌ WhatsApp API error:", error.message);
                  reject("WhatsApp API error");
                }
              });
            }
          );
        });
      }
    );
  });
};

function scheduleAdminAbsentCheckReminderWhatsapp() {
  return schedule.scheduleJob(
    "login-reminder-every-day-at-12am whatsapp",
    { rule: "0 0 12 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 Login reminder triggered at 11AM IST");
      await adminAbsentCheckReminderWhatsApp();
    }
  );
}

//leave reminder whatsapp

const sendAdminLeaveCheckReminderWhatsApp = async (toNumber, count, today) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: "leave_reminder_admin",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: today },
              { type: "text", text: count.toString() },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp reminder sent to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp reminder to ${toNumber}:`,
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

const adminLeaveCheckReminderWhatsApp = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    // Step 1: Get all users who have NOT logged in today
    const absentQuery = `SELECT * FROM attend_leaves JOIN task_users ON attend_leaves.leave_user_id = task_users.id WHERE task_users.employment_status = 'active' AND DATE(STR_TO_DATE(attend_leaves.applied_at_date, '%d-%m-%Y %H:%i:%s')) = ?`;

    db.query(absentQuery, [today], async (err, absentUsers) => {
      if (err) {
        console.error("❌ Error fetching non-logged-in users:", err.message);
        return reject("Database error");
      }

      const absentCount = absentUsers.length;

      if (absentCount === 0) {
        console.log("✅ All users have logged in today.");
        return resolve({
          success: true,
          message: "All users have logged in today.",
        });
      }

      // Step 2: Send WhatsApp summary to admin
      const adminQuery = `SELECT full_name, admin_number FROM admin_users`;

      db.query(adminQuery, async (err2, admins) => {
        if (err2) {
          console.error("❌ Error fetching admin users:", err2.message);
          return reject("Admin query failed");
        }

        try {
          const results = await Promise.all(
            admins.map(({ admin_number }) =>
              sendAdminLeaveCheckReminderWhatsApp(
                admin_number,
                absentCount,
                today
              )
            )
          );

          console.log(
            `✅ WhatsApp reminders sent to ${admins.length} admin(s).`
          );
          resolve({
            success: true,
            adminCount: admins.length,
            absentCount,
            results,
          });
        } catch (error) {
          console.error("❌ WhatsApp API error:", error.message);
          reject("WhatsApp API error");
        }
      });
    });
  });
};

function scheduleAdminLeaveCheckReminderWhatsapp() {
  return schedule.scheduleJob(
    "leave-reminder-every-day-at-12am whatsapp",
    { rule: "0 0 21 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 Login reminder triggered at 11AM IST");
      await adminLeaveCheckReminderWhatsApp();
    }
  );
}

//leave approve reject message handler whatsapp

const sendLeaveStatusReminderWhatsApp = async (
  number,
  name,
  leaveDate,
  status
) => {
  try {
    const templateName =
      status === "approved"
        ? "leave_approved_notification"
        : status === "rejected"
        ? "leave_reject_notification"
        : null;

    if (!templateName) {
      throw new Error("Invalid leave status provided for WhatsApp template.");
    }

    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: number,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name }, // User Name
              { type: "text", text: leaveDate }, // Leave Date (DD-MM-YYYY)
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(
      `✅ WhatsApp ${status} notification sent to ${name} (${number})`
    );
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp ${status} notification to ${name} (${number}):`,
      error.response?.data || error.message
    );
    return { error: error.response?.data || error.message };
  }
};

//Admin Employee Not Logout List

const sendAdminNotLogoutWhatsApp = async (toNumber, count, today) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: "admin_logout_notification",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: today },
              { type: "text", text: count.toString() },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp reminder sent to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp reminder to ${toNumber}:`,
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

const adminNotLogoutWhatsApp = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

    // Step 1: Get all users who have NOT logged out in today
    const absentQuery = `
      SELECT task_users.full_name, task_users.email_id, task_users.designation, attendance.login_time
    FROM attendance
    JOIN task_users ON attendance.user_id = task_users.id
    WHERE attendance.attend_date = ? AND attendance.login_time IS NOT NULL
      AND attendance.logout_time IS NULL 
      AND task_users.employment_status = 'active'
    `;

    db.query(absentQuery, [today], async (err, absentUsers) => {
      if (err) {
        console.error("❌ Error fetching non-logged-in users:", err.message);
        return reject("Database error");
      }

      const absentCount = absentUsers.length;

      if (absentCount === 0) {
        console.log("✅ All users have logged in today.");
        return resolve({
          success: true,
          message: "All users have logged in today.",
        });
      }

      // Step 2: Send WhatsApp summary to admin
      const adminQuery = `SELECT full_name, admin_number FROM admin_users`;

      db.query(adminQuery, async (err2, admins) => {
        if (err2) {
          console.error("❌ Error fetching admin users:", err2.message);
          return reject("Admin query failed");
        }

        try {
          const results = await Promise.all(
            admins.map(({ admin_number }) =>
              sendAdminNotLogoutWhatsApp(admin_number, absentCount, today)
            )
          );

          console.log(
            `✅ WhatsApp reminders sent to ${admins.length} admin(s).`
          );
          resolve({
            success: true,
            adminCount: admins.length,
            absentCount,
            results,
          });
        } catch (error) {
          console.error("❌ WhatsApp API error:", error.message);
          reject("WhatsApp API error");
        }
      });
    });
  });
};

function scheduleAdminNotLogoutWhatsapp() {
  return schedule.scheduleJob(
    "login-reminder-every-day-at-12am whatsapp",
    { rule: "0 0 21 * * 0-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 Login reminder triggered at 11AM IST");
      await adminNotLogoutWhatsApp();
    }
  );
}

//Admin Employee Not login and Logout List

const sendAdminNotLoginLogoutWhatsApp = async (toNumber, count, today) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: "admin_no_attendance_list",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: today },
              { type: "text", text: count.toString() },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp reminder sent to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp reminder to ${toNumber}:`,
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

// const adminNotLoginLogoutWhatsApp = () => {
//   return new Promise((resolve, reject) => {
//     const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

//     // Step 1: Get all users who have NOT logged out in today
//     const absentQuery = `
//       SELECT task_users.full_name, task_users.email_id, task_users.designation
//     FROM task_users
//     LEFT JOIN attendance
//       ON attendance.user_id = task_users.id AND attendance.attend_date = ?
//     WHERE attendance.user_id IS NULL
//       AND task_users.employment_status = 'active'
//     `;

//     db.query(absentQuery, [today], async (err, absentUsers) => {
//       if (err) {
//         console.error("❌ Error fetching non-logged-in users:", err.message);
//         return reject("Database error");
//       }

//       const absentCount = absentUsers.length;

//       if (absentCount === 0) {
//         console.log("✅ All users have logged in today.");
//         return resolve({ success: true, message: "All users have logged in today." });
//       }

//       // Step 2: Send WhatsApp summary to admin
//       const adminQuery = `SELECT full_name, admin_number FROM admin_users`;

//       db.query(adminQuery, async (err2, admins) => {
//         if (err2) {
//           console.error("❌ Error fetching admin users:", err2.message);
//           return reject("Admin query failed");
//         }

//         try {
//           const results = await Promise.all(
//             admins.map(({ admin_number }) =>
//               sendAdminNotLoginLogoutWhatsApp(admin_number, absentCount, today)
//             )
//           );

//           console.log(`✅ WhatsApp reminders sent to ${admins.length} admin(s).`);
//           resolve({ success: true, adminCount: admins.length, absentCount, results });
//         } catch (error) {
//           console.error("❌ WhatsApp API error:", error.message);
//           reject("WhatsApp API error");
//         }
//       });
//     });
//   });
// };

const adminNotLoginLogoutWhatsApp = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const formattedToday = moment(today).format("DD-MM-YYYY");

    // Step 1: Check if today is a holiday
    db.query(
      `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
      [today],
      (holidayErr, holidayRows) => {
        if (holidayErr) {
          console.error("❌ Error checking holiday:", holidayErr.message);
          return reject("Holiday check failed");
        }

        if (holidayRows.length > 0) {
          console.log(
            `🎉 Today (${formattedToday}) is a holiday: ${holidayRows[0].holiday_title}`
          );
          return resolve({
            success: true,
            message: "Holiday - No admin alert needed.",
          });
        }

        // Step 2: Get users who did NOT log in or out today
        const absentQuery = `
          SELECT task_users.id, task_users.full_name, task_users.email_id, task_users.designation
          FROM task_users
          LEFT JOIN attendance 
            ON attendance.user_id = task_users.id AND attendance.attend_date = ?
          WHERE attendance.user_id IS NULL
            AND task_users.employment_status = 'active'
        `;

        db.query(absentQuery, [formattedToday], (err, absentUsers) => {
          if (err) {
            console.error(
              "❌ Error fetching non-logged-in users:",
              err.message
            );
            return reject("Database error");
          }

          // Step 3: Get leave user IDs
          db.query(
            `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
            [formattedToday],
            (leaveErr, leaveRows) => {
              if (leaveErr) {
                console.error(
                  "❌ Error fetching leave data:",
                  leaveErr.message
                );
                return reject("Leave check failed");
              }

              const leaveUserIds = leaveRows.map((row) => row.leave_user_id);

              // Step 4: Filter out users who are on leave
              const finalAbsentUsers = absentUsers.filter(
                (user) => !leaveUserIds.includes(user.id)
              );

              const absentCount = finalAbsentUsers.length;

              if (absentCount === 0) {
                console.log(
                  "✅ All users have either logged in or are on leave."
                );
                return resolve({
                  success: true,
                  message: "No absent users to report.",
                });
              }

              // Step 5: Send WhatsApp summary to all admins
              const adminQuery = `SELECT full_name, admin_number FROM admin_users`;

              db.query(adminQuery, async (err2, admins) => {
                if (err2) {
                  console.error("❌ Error fetching admin users:", err2.message);
                  return reject("Admin query failed");
                }

                try {
                  const results = await Promise.all(
                    admins.map(({ admin_number }) =>
                      sendAdminNotLoginLogoutWhatsApp(
                        admin_number,
                        absentCount,
                        formattedToday
                      )
                    )
                  );

                  console.log(
                    `✅ WhatsApp summary sent to ${admins.length} admin(s).`
                  );
                  resolve({
                    success: true,
                    adminCount: admins.length,
                    absentCount,
                    results,
                  });
                } catch (error) {
                  console.error("❌ WhatsApp API error:", error.message);
                  reject("WhatsApp API error");
                }
              });
            }
          );
        });
      }
    );
  });
};

function scheduleAdminNotLoginLogoutWhatsapp() {
  return schedule.scheduleJob(
    "login-reminder-every-day-at-12am whatsapp",
    { rule: "0 0 21 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 Login reminder triggered at 11AM IST");
      await adminNotLoginLogoutWhatsApp();
    }
  );
}

//Admin Employee Not login and Logout List

const sendEmployeeNotLoginLogoutWhatsApp = async (toNumber, fullName, date) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "template",
      template: {
        name: "employee_no_attendance_reminder",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: fullName },
              { type: "text", text: date },
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log(`✅ WhatsApp reminder sent to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to send WhatsApp reminder to ${toNumber}:`,
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

// const employeeNotLoginLogoutWhatsApp = () => {
//   return new Promise((resolve, reject) => {
//     const today = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");

//     // Step 1: Get all users who have NOT logged in or logged out today
//     const absentQuery = `
//       SELECT task_users.full_name, task_users.mobile_number, task_users.email_id, task_users.designation
//       FROM task_users
//       LEFT JOIN attendance
//         ON attendance.user_id = task_users.id AND attendance.attend_date = ?
//       WHERE attendance.user_id IS NULL
//         AND task_users.employment_status = 'active'
//     `;

//     db.query(absentQuery, [today], async (err, absentUsers) => {
//       if (err) {
//         console.error("❌ Error fetching non-logged-in users:", err.message);
//         return reject("Database error");
//       }

//       if (absentUsers.length === 0) {
//         console.log("✅ All users have logged in or logged out today.");
//         return resolve({ success: true, message: "All users are present today." });
//       }

//       try {
//         const results = await Promise.all(
//           absentUsers.map(user =>
//             sendEmployeeNotLoginLogoutWhatsApp(user.mobile_number, user.full_name, today)
//           )
//         );

//         console.log(`✅ WhatsApp reminders sent to ${absentUsers.length} absent employee(s).`);
//         resolve({ success: true, userCount: absentUsers.length, results });
//       } catch (error) {
//         console.error("❌ Error sending WhatsApp to employees:", error.message);
//         reject("WhatsApp API error");
//       }
//     });
//   });
// };

const employeeNotLoginLogoutWhatsApp = () => {
  return new Promise((resolve, reject) => {
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const formattedToday = moment(today).format("DD-MM-YYYY");

    // Step 1: Check if today is a holiday
    db.query(
      `SELECT * FROM paid_holidays WHERE holiday_date = ? AND holiday_status = 'active'`,
      [today],
      (holidayErr, holidayRows) => {
        if (holidayErr) {
          console.error("❌ Error checking holiday:", holidayErr.message);
          return reject("Holiday check failed");
        }

        if (holidayRows.length > 0) {
          console.log(
            `🎉 Today (${formattedToday}) is a holiday: ${holidayRows[0].holiday_title}`
          );
          return resolve({
            success: true,
            message: "Holiday - No WhatsApp reminders sent.",
          });
        }

        // Step 2: Fetch users who did NOT log in or out today
        const absentQuery = `
          SELECT task_users.id, task_users.full_name, task_users.mobile_number, task_users.email_id, task_users.designation
          FROM task_users
          LEFT JOIN attendance 
            ON attendance.user_id = task_users.id AND attendance.attend_date = ?
          WHERE attendance.user_id IS NULL
            AND task_users.employment_status = 'active'
        `;

        db.query(absentQuery, [formattedToday], (err, absentUsers) => {
          if (err) {
            console.error(
              "❌ Error fetching non-logged-in users:",
              err.message
            );
            return reject("Database error");
          }

          if (absentUsers.length === 0) {
            console.log("✅ All users have logged in or logged out today.");
            return resolve({
              success: true,
              message: "All users are present today.",
            });
          }

          // Step 3: Get leave users for today
          db.query(
            `SELECT leave_user_id FROM attend_leaves WHERE leave_date = ? AND leave_status IN ('approved', 'pending')`,
            [formattedToday],
            async (leaveErr, leaveRows) => {
              if (leaveErr) {
                console.error(
                  "❌ Error fetching leave data:",
                  leaveErr.message
                );
                return reject("Leave check failed");
              }

              const leaveUserIds = leaveRows.map((row) => row.leave_user_id);

              // Step 4: Filter out leave users
              const finalAbsentUsers = absentUsers.filter(
                (user) => !leaveUserIds.includes(user.id)
              );

              if (finalAbsentUsers.length === 0) {
                console.log(
                  "✅ All absentees are on approved or pending leave."
                );
                return resolve({
                  success: true,
                  message: "No actual absentees.",
                });
              }

              // Step 5: Send WhatsApp reminders
              try {
                const results = await Promise.all(
                  finalAbsentUsers.map((user) =>
                    sendEmployeeNotLoginLogoutWhatsApp(
                      user.mobile_number,
                      user.full_name,
                      formattedToday
                    )
                  )
                );

                console.log(
                  `✅ WhatsApp reminders sent to ${finalAbsentUsers.length} absent employee(s).`
                );
                resolve({
                  success: true,
                  userCount: finalAbsentUsers.length,
                  results,
                });
              } catch (error) {
                console.error(
                  "❌ Error sending WhatsApp to employees:",
                  error.message
                );
                reject("WhatsApp API error");
              }
            }
          );
        });
      }
    );
  });
};

function scheduleEmployeeNotLoginLogoutWhatsapp() {
  return schedule.scheduleJob(
    "login-reminder-every-day-at-12am whatsapp",
    { rule: "0 0 21 * * 1-6", tz: "Asia/Kolkata" },
    async () => {
      console.log("🚀 Login reminder triggered at 11AM IST");
      await employeeNotLoginLogoutWhatsApp();
    }
  );
}

module.exports = {
  sendWhatsApp,
  logoutReminderWhatsApp,
  scheduleLogoutReminderWhatsapp,
  scheduleLoginReminderWhatsapp,
  scheduleAdminAbsentCheckReminderWhatsapp,
  sendAdminAbsentCheckReminderWhatsApp,
  loginReminderWhatsApp,
  adminAbsentCheckReminderWhatsApp,
  sendAdminOtpWhatsApp,
  scheduleAdminLeaveCheckReminderWhatsapp,
  sendLeaveStatusReminderWhatsApp,
  scheduleAdminNotLogoutWhatsapp,
  sendAdminNotLoginLogoutWhatsApp,
  scheduleAdminNotLoginLogoutWhatsapp,
  scheduleEmployeeNotLoginLogoutWhatsapp,
};
