/**
 * reWebhookRoute.js
 * Inbound webhook and queue routes from Revenue Engine (RE).
 */

const express = require("express");
const router  = express.Router();
const {
  handleProjectAssigned,
  handleProjectUpdated,
  getReProjects,
} = require("../controller/reWebhookController");

// Keep the existing endpoint compatible with both RE event types.
router.post("/api/re-webhook/project-assigned", (req, res, next) => {
  if (req.body && req.body.event_type === "project.updated") {
    return handleProjectUpdated(req, res, next);
  }
  return handleProjectAssigned(req, res, next);
});
router.post("/api/re-webhook/project-updated", handleProjectUpdated);

// GET /api/re-projects
router.get("/api/re-projects", getReProjects);

module.exports = router;
