/**
 * departmentRoute.js
 * Admin/GM routes for managing formal departments.
 */

const express = require("express");
const router = express.Router();
const {
  getAdminDepartments,
  updateDeadlineTracking,
} = require("../controller/departmentController");

// Admin / GM Department endpoints
router.get("/api/admin/departments", getAdminDepartments);
router.patch("/api/admin/department/:id/deadline-tracking", updateDeadlineTracking);

module.exports = router;

