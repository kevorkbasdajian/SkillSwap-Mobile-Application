const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionsController");
const authenticate = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createSessionSchema,
  updateSessionSchema,
} = require("../utils/validators");

// All routes require authentication
router.use(authenticate);

// User's upcoming session (For a specific groups)
router.get("/:groupId/upcoming", sessionController.getUpcomingSession);

// Create Session
router.post(
  "/groups/:groupId",
  validate(createSessionSchema),
  sessionController.createSession,
);

// Get all of the group's sessions
router.get("/groups/:groupId", sessionController.getGroupSessions);

// Get session details
router.get("/:sessionId", sessionController.getSessionDetails);

// Update a session's information
router.put(
  "/:sessionId",
  validate(updateSessionSchema),
  sessionController.updateSession,
);

// Delete a session
router.delete("/:sessionId", sessionController.deleteSession);

// Check into a session
router.post("/:sessionId/check-in", sessionController.checkInToSession);

// Mark a session as being completed
router.patch("/:sessionId/complete", sessionController.markSessionCompleted);

// Cancel a session
router.patch("/:sessionId/cancel", sessionController.cancelSession);

module.exports = router;
