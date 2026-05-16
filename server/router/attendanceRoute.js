const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  applyForBackDateAttendance,
  getAllBackDateRequestBYId,
  deleteBackDateRequest,
  getAllBackDateRequest,
  updateBackDateRequestStatus,
  markBackDateAttendance,
  downloadMonthlyAttendanceReport,
} = require("../controller/AttendanceController");
const router = express.Router();

router.post("/applyForBackDateAttendance", applyForBackDateAttendance);
router.get("/getAllBackDateRequestBYId/:uid", getAllBackDateRequestBYId);
router.delete("/deleteBackDateRequest/:reqId", deleteBackDateRequest);
router.get("/getAllBackDateRequest", getAllBackDateRequest);
router.put("/updateBackDateRequestStatus/:reqId", updateBackDateRequestStatus);
router.put("/markBackDateAttendance", markBackDateAttendance);
router.get(
  "/downloadMonthlyAttendanceReport/:month/:year",
  downloadMonthlyAttendanceReport
);

module.exports = router;
