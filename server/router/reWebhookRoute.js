/**
 * reWebhookRoute.js
 * Inbound webhook and queue routes from Revenue Engine (RE).
 */

const express = require("express");
const router  = express.Router();
const { handleProjectAssigned, getReProjects } = require("../controller/reWebhookController");

// POST /api/re-webhook/project-assigned
router.post("/api/re-webhook/project-assigned", handleProjectAssigned);

// GET /api/re-projects
router.get("/api/re-projects", getReProjects);

module.exports = router;
