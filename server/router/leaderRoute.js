const express = require("express");
const router = express.Router();
const {
  getTeamMembers,
  getTeamDailyTasks,
  getTeamFulfillment,
  assignTeamTask,
  getTeamAssignedTasks
} = require("../controller/leaderController");

router.get("/api/team-lead/members", getTeamMembers);
router.get("/api/team-lead/daily-tasks", getTeamDailyTasks);
router.get("/api/team-lead/fulfillment", getTeamFulfillment);
router.get("/api/team-lead/assigned-tasks", getTeamAssignedTasks);
router.post("/api/team-lead/assign-task", assignTeamTask);

module.exports = router;
