const cron = require("node-cron");
const nodemailer = require("nodemailer");
const moment = require("moment");
const db = require("../config/db"); // your MySQL connection file

// Setup email transporter (Gmail example)
const transporter = nodemailer.createTransport({
  host: "doaguru.com",
  port: 465,
  secure: true,
  //   service: "Gmail",
  auth: {
    user: "hr@doaguru.com",
    pass: "hrAbhinav@Doaguru#",
  },
});

// 🔁 1. CRON for 11:00 AM daily - check who has NOT logged in today
cron.schedule("0 11 * * *", async () => {
  const today = moment().format("DD-MM-YYYY");

  try {
    const [allUsers] = await db.query(`SELECT * FROM task_users`);
    const [loggedInUsers] = await db.query(
      `SELECT * FROM attendance WHERE attend_date = ?`,
      [today]
    );

    const loggedInUserIds = loggedInUsers.map((u) => u.user_id);
    const notLoggedIn = allUsers.filter(
      (user) => !loggedInUserIds.includes(user.id)
    );

    for (const user of notLoggedIn) {
      await sendEmail(
        user.email_id,
        "Reminder: You haven't logged in today!",
        `Hi ${user.full_name},\n\nPlease remember to login.`
      );
      await insertNotification(user.id, "login_reminder");
    }
  } catch (error) {
    console.error("11AM Login Check Error:", error);
  }
});

// 🔁 2. CRON for 9:00 PM daily - check who has not logged out today
cron.schedule("0 21 * * *", async () => {
  const today = moment().format("DD-MM-YYYY");

  try {
    const [usersNotLoggedOut] = await db.query(
      `
      SELECT t.email_id, t.full_name, t.id as user_id
      FROM attendance a
      JOIN task_users t ON a.user_id = t.id
      WHERE a.attend_date = ? AND a.logout_time IS NULL
    `,
      [today]
    );

    for (const user of usersNotLoggedOut) {
      await sendEmail(
        user.email_id,
        "Reminder: You haven't logged out yet!",
        `Hi ${user.full_name},\n\nPlease logout before the day ends.`
      );
      await insertNotification(user.user_id, "logout_reminder");
    }
  } catch (error) {
    console.error("9PM Logout Check Error:", error);
  }
});

// 📧 Email Sender
async function sendEmail(to, subject, text) {
  await transporter.sendMail({
    from: "hr@doaguru.com",
    to,
    subject,
    text,
  });
}

// 🛑 Insert Notification Record
async function insertNotification(userId, type) {
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
  await db.query(
    `
    INSERT INTO email_notifications (en_user_id, type_notification, sent_at, en_status, en_created_at)
    VALUES (?, ?, ?, 'sent', ?)
  `,
    [userId, type, timestamp, timestamp]
  );
}
