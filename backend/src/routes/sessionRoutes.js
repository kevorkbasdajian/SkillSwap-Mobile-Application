const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionsController");
const authenticate = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createSessionSchema,
  updateSessionSchema,
} = require("../utils/validators");
const { upload, uploadArtifacts } = require("../utils/fileUpload");

// All routes require authentication
router.use(authenticate);

// User's upcoming session (For a specific groups)
router.get("/:groupId/upcoming", sessionController.getUpcomingSession);

// Create Session
router.post(
  "/groups/:groupId",
  uploadArtifacts.array("artifacts", 10),
  validate(createSessionSchema),
  sessionController.createSession,
);

// Get all of the group's sessions
router.get("/groups/:groupId", sessionController.getGroupSessions);

// Check into a session
router.post("/:sessionId/check-in", sessionController.checkInToSession);

// Mark a session as being completed
router.patch("/:sessionId/complete", sessionController.markSessionCompleted);

// Cancel a session
router.patch("/:sessionId/cancel", sessionController.cancelSession);

//Get Existing Session Artifacts
router.get("/:sessionId/artifacts", sessionController.getSessionArtifacts);

//Upload new artifact to an existing session
router.post(
  "/:sessionId/artifacts",
  uploadArtifacts.array("artifacts", 10),
  sessionController.uploadArtifacts,
);

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

//Delete a Session's existing artifacts
router.delete("/artifacts/:artifactId", sessionController.deleteArtifact);

module.exports = router;
