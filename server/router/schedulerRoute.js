// Scheduler Routes - mounted at /api/scheduler in SF's main index.js
const express = require("express");
const router = express.Router();

const { getEmployees } = require("../controller/scheduler/employeeController");
const {
  getReminders,
  getReminderById,
  getReminderStats,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  triggerReminder,
  testWhatsApp,
} = require("../controller/scheduler/reminderController");
const {
  getNotifications,
  getUnreadNotifications,
  getNotificationHistory,
  markAsRead,
  markAllAsRead,
} = require("../controller/scheduler/notificationController");

// Employee routes
router.get("/employees", getEmployees);

// WhatsApp connection tester
router.post("/test-whatsapp", testWhatsApp);

// Reminder routes
router.get("/reminders/stats", getReminderStats);
router.get("/reminders", getReminders);
router.get("/reminders/:id", getReminderById);
router.post("/reminders", createReminder);
router.put("/reminders/:id", updateReminder);
router.delete("/reminders/:id", deleteReminder);
router.patch("/reminders/:id/complete", completeReminder);
router.post("/reminders/:id/trigger", triggerReminder);

// Notification routes
router.get("/notifications", getNotifications);
router.get("/notifications/unread", getUnreadNotifications);
router.get("/notifications/history", getNotificationHistory);
router.patch("/notifications/mark-all-read", markAllAsRead);
router.patch("/notifications/:id/read", markAsRead);

module.exports = router;
