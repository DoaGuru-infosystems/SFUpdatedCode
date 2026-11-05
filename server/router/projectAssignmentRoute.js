/**
 * projectAssignmentRoute.js
 * Phase 3 & Phase 4 Project Owner & Task Owner routes.
 */

const express = require("express");
const router  = express.Router();
const {
  getLeaderReProjects,
  assignProjectOwner,
  getEmployeeOwnedProjects,
  assignTaskOwner,
  getMyReTasks,
  updateTaskStatus,
  reassignTaskOwner,
  reassignProjectOwner,
  markProjectInactive,
  markProjectActive,
  getAdminReProjects,
  getAdminReProjectTasks,
  getAdminReTaskWorkLog,
  triggerReDailyDigest,
} = require("../controller/projectAssignmentController");

// Team Lead routes (Phase 3 & Phase 5)
router.get("/api/leader/re-projects", getLeaderReProjects);
router.post("/api/leader/assign-project-owner", assignProjectOwner);
router.post("/api/leader/reassign-project-owner", reassignProjectOwner);

// Employee routes (Phase 3, Phase 4 & Phase 5)
router.get("/api/employee/owned-projects", getEmployeeOwnedProjects);
router.post("/api/employee/assign-task-owner", assignTaskOwner);
router.post("/api/employee/reassign-task", reassignTaskOwner);

// Employee Assigned Tasks routes (Phase 4)
router.get("/api/employee/my-re-tasks", getMyReTasks);
router.patch("/api/employee/task-status/:task_owners_id", updateTaskStatus);

// Admin / GM routes (Phase 6 & Phase 7)
router.post("/api/admin/re-project/:project_id/mark-inactive", markProjectInactive);
router.post("/api/admin/re-project/:project_id/mark-active", markProjectActive);
router.get("/api/admin/re-projects", getAdminReProjects);
router.get("/api/admin/re-project/:project_id/tasks", getAdminReProjectTasks);
router.get("/api/admin/re-task/:task_owners_id/work-log", getAdminReTaskWorkLog);
router.post("/api/admin/re-daily-digest/trigger", triggerReDailyDigest);
router.post("/api/admin/re-escalations/trigger", triggerReEscalations);

module.exports = router;
