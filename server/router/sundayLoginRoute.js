const express = require("express");
const router = express.Router();
const {
  getSundayRequests,
  respondToRequest,
  getPreApprovals,
  createPreApproval,
  revokePreApproval,
  checkRequestStatus,
  getActiveEmployees,
  createManualRequest,
  checkAttendanceAccess
} = require("../controller/sundayLoginController");

// Admin Routes
router.get("/api/sunday-login/requests", getSundayRequests);
router.post("/api/sunday-login/respond", respondToRequest);
router.get("/api/sunday-login/pre-approvals", getPreApprovals);
router.post("/api/sunday-login/pre-approve", createPreApproval);
router.delete("/api/sunday-login/pre-approve/:id", revokePreApproval);
router.get("/api/sunday-login/employees", getActiveEmployees);

// Employee Status Check & Manual Re-request
router.get("/api/sunday-login/check-status/:requestId", checkRequestStatus);
router.post("/api/sunday-login/manual-request", createManualRequest);
router.post("/api/sunday-login/check-attendance-access", checkAttendanceAccess);

module.exports = router;
