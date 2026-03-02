const sessionService = require("../services/sessionService");

const sessionController = {
  // Create new session
  createSession: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const newSession = await sessionService.createSession(
        userId,
        groupId,
        req.validatedData,
      );

      res.status(201).json({
        success: true,
        message: "Session created successfully",
        data: newSession,
      });
    } catch (error) {
      next(error);
    }
  },
  // Get session details
  getSessionDetails: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const session = await sessionService.getSessionDetails(sessionId, userId);

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },
  // Get all sessions for a group
  getGroupSessions: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const sessions = await sessionService.getGroupSessions(groupId, userId);

      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  },
  //Get Upcoming Session for a group
  getUpcomingSession: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;
      const sessions = await sessionService.getUpcomingSession(userId, groupId);

      res.status(200).json({
        success: true,
        message: "Upcoming session retrieved successfully",
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  },
  // Check in to session
  checkInToSession: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const result = await sessionService.checkInToSession(userId, sessionId);

      res.status(200).json({
        success: true,
        message: "Successfully checked in to session",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
  // Update session
  updateSession: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const updatedSession = await sessionService.updateSession(
        userId,
        sessionId,
        req.validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Session updated successfully",
        data: updatedSession,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete session
  deleteSession: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const result = await sessionService.deleteSession(userId, sessionId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark session as completed
  markSessionCompleted: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const result = await sessionService.markSessionCompleted(
        userId,
        sessionId,
      );

      res.status(200).json({
        success: true,
        message: "Session marked as completed",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Cancel session
  cancelSession: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const result = await sessionService.cancelSession(userId, sessionId);

      res.status(200).json({
        success: true,
        message: "Session cancelled",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = sessionController;
