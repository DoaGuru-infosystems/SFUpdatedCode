const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { loginReminder, logoutReminder } = require("../controller/notificationController");
const router = express.Router();

router.get("/loginReminder", loginReminder);
router.get("/logoutReminder", logoutReminder)

module.exports = router;
