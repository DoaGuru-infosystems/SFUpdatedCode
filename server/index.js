const { join, dirname } = require("path");
const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const socketUtil = require("./utils/socket");
const app = express();
const server = http.createServer(app);
const io = socketUtil.init(server);

io.on("connection", (socket) => {
  console.log("⚡ Admin/Client connected to Socket.io:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const schedule = require("node-schedule");
const userRoutes = require("./router/userRoute.js");
const authRoutes = require("./router/authRoute.js");
const deleteRoute = require("./router/deletsRoutes.js");
const updateRoute = require("./router/updatesRoute.js");
const emailRoutes = require("./router/emailRoutes.js");
const attendanceRotue = require("./router/attendanceRoute.js");
require("./utils/fetchGoogleHolidays");
// const reminderRoute = require("./router/reminderRoute.js");
const { exec } = require("child_process");
// const cron = require('node-cron');
const { getAllAssociates } = require("./controller/sheduler/email.js");
const {
  scheduleWeeklyReport,
} = require("./controller/sheduler/weeklyTaskReport");
const {
  scheduleLoginReminder,
  scheduleLogoutReminder,
  scheduleAdminAbsentEmployeeReminder,
  scheduleCheckNoTaskEmployee,
} = require("./controller/notificationController");
const {
  sendWhatsApp,
  logoutReminderWhatsApp,
  scheduleLogoutReminderWhatsapp,
  scheduleLoginReminderWhatsapp,
  scheduleAdminAbsentCheckReminderWhatsapp,
  adminAbsentCheckReminderWhatsApp,
} = require("./utils/whatsappUtils");
const { fetchAndInsertHolidays } = require("./utils/fetchGoogleHolidays");

dotenv.config();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(userRoutes);
app.use(authRoutes);
app.use(deleteRoute);
app.use(updateRoute);
app.use("/api/email", emailRoutes);
app.use("/api", attendanceRotue);
// app.use("/api", reminderRoute);

// Serve uploaded files (images) for front-end
app.use("/uploads", express.static("uploads"));
app.use(
  "/selfiePicture",
  express.static(path.join(__dirname, "selfiePicture"))
);

// // Configure Nodemailer SMTP
const transporter = nodemailer.createTransport({
  host: "doaguru.com",
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: "hr@doaguru.com",
    pass: "hrAbhinav@Doaguru#",
  },
});

app.use(express.static(join(__dirname, "build")));

app.get("*", (req, res, next) => {
  // If the request is for an API route, skip serving the React HTML file
  if (req.url.startsWith("/api")) {
    return next();
  }

  //   Otherwise, serve the React HTML file
  res.sendFile(join(__dirname, "build", "index.html"));
});

app.get("/", (req, res) => {
  res.json({ message: "Hello" });
});

app.post("/api/test-whatsapp", async (req, res) => {
  const { users } = req.body; // Array of { number, name }

  if (!Array.isArray(users)) {
    return res
      .status(400)
      .json({ success: false, message: "Users must be an array" });
  }

  try {
    const results = await Promise.all(
      users.map(({ number, name }) => sendWhatsApp(number, name))
    );
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});

app.post("/api/test-whatsapp-two", async (req, res) => {
  try {
    const result = await sendAdminAbsentCheckReminderWhatsApp(
      toNumber,
      count,
      today
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// app.post("/api/holiday-fetch", fetchAndInsertHolidays);

setInterval(() => {
  getAllAssociates();
}, 1000 * 60);

// for test purpose

// // Send Email Function
// const sendTestEmail = async () => {
//   try {
//     const info = await transporter.sendMail({
//       from: 'hr@doaguru.com',
//       to: 'mkuldeep313@gmail.com', // ← yahan aap apna test email likh lo
//       subject: 'Test Email from Node.js',
//       text: 'Hello Priyanshu Ji, this is a test email sent using cPanel SMTP and Node.js!',
//     });

//     console.log('Email sent:', info.messageId);
//     return { success: true, message: 'Email sent', messageId: info.messageId };
//   } catch (error) {
//     console.error('ror sending email:', error.message);
//     return { success: false, message: error.message };
//   }
// };

// // GET API to trigger test mail
// app.get('/api/send-test-mail', async (req, res) => {
//   const result = await sendTestEmail();
//   res.json(result);
// });

// // Scheduled Email (runs once after 1 min for demo)
// schedule.scheduleJob('*/1 * * * *', () => {
//   console.log(' Scheduled job triggered');
//   sendTestEmail();
// });

// schedule.scheduleJob('0 18 * * 6', () => { // Every Saturday at 18:00
//     console.log(' Weekly scheduled report job');
//     scheduleWeeklyReport();
//   });

// app.get("/api/test-login-reminder", (req, res) => {
//   try {
//     handleLoginReminder();
//     res.send("✅ Login reminder triggered.");
//   } catch (error) {
//     res.status(500).send("❌ Error triggering login reminder.");
//   }
// });

// // Test Logout Reminder
// app.get("/api/test-logout-reminder", (req, res) => {
//   try {
//     handleLogoutReminder();
//     res.send("✅ Logout reminder triggered.");
//   } catch (error) {
//     res.status(500).send("❌ Error triggering logout reminder.");
//   }
// });

// schedule.scheduleJob("* * * * *", () => {
//   console.log("⏰ Scheduled login reminder running...");
//   runLoginReminder();
// });

scheduleWeeklyReport();
scheduleLoginReminder();
scheduleLogoutReminder();
scheduleAdminAbsentEmployeeReminder();

// whatsapp-reminder
scheduleLogoutReminderWhatsapp();
scheduleLoginReminderWhatsapp();
scheduleCheckNoTaskEmployee();
// scheduleAdminAbsentCheckReminderWhatsapp();

// require("./cron/attendanceReminder");

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log("🚀 Server & Socket.io running on port", PORT);
});
