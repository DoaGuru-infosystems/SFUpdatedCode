const express = require("express");
const router = express.Router();
const {
  getTeamMembers,
  getTeamDailyTasks,
  getTeamFulfillment,
  assignTeamTask
} = require("../controller/leaderController");

router.get("/api/team-lead/members", getTeamMembers);
router.get("/api/team-lead/daily-tasks", getTeamDailyTasks);
router.get("/api/team-lead/fulfillment", getTeamFulfillment);
router.post("/api/team-lead/assign-task", assignTeamTask);

module.exports = router;
