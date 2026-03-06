const chatService = require("../services/chatService");
const PollService = require("../services/pollService");
const pollService = require("../services/pollService");

const chatController = {
  //Get or create group chat
  getGroupChat: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const chat = await chatService.getOrCreateGroupChat(groupId, userId);

      res.status(200).json({
        success: true,
        message: "Chat retrieved/created successfully",
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  },

  // Send text message
  sendMessage: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupChatId } = req.params;

      const message = await chatService.sendMessage(
        userId,
        groupChatId,
        req.validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Message sent successfully",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get Chat messages
  getChatMessages: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupChatId } = req.params;
      const { limit = 50, before } = req.query;

      const messages = await chatService.getChatMessages(
        userId,
        groupChatId,
        parseInt(limit),
        before,
      );

      res.status(200).json({
        success: true,
        message: "Chat messages retrieved successfully",
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get pinned messages
  getPinnedMessages: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupChatId } = req.params;

      const messages = await chatService.getPinnedMessages(userId, groupChatId);

      res.status(200).json({
        success: true,
        message: "Pinned Messages retrieved successfully",
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },

  //Pin a message
  pinMessage: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      const message = await chatService.pinMessage(userId, messageId);

      res.status(200).json({
        success: true,
        message: "Message pinned successfully",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  },

  //Unpin a message
  unpinMessage: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      const message = await chatService.unpinMessage(userId, messageId);

      res.status(200).json({
        success: true,
        message: "Message unpinned successfully",
        data: message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a message
  deleteMessage: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      const result = await chatService.deleteMessage(userId, messageId);

      res.status(200).json({
        success: true,
        message: result,
      });
    } catch (error) {
      next(error);
    }
  },

  //Create poll
  createPoll: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupChatId } = req.params;

      const poll = await pollService.createPoll(
        userId,
        groupChatId,
        req.validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Poll created successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get poll details
  getpollDetails: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { pollId } = req.params;

      const poll = await PollService.getPollDetails(userId, pollId);

      res.status(200).json({
        success: true,
        message: "Poll Details retrieved successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  },
  //Vote on Poll
  votePoll: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { pollId } = req.params;

      const poll = await pollService.votePoll(
        userId,
        pollId,
        req.validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Vote recorded successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  },
  //Close poll
  closePoll: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { pollId } = req.params;

      const poll = await pollService.closePoll(userId, pollId);

      res.status(200).json({
        success: true,
        message: "Poll closed successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  },
  //Delete poll
  deletePoll: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { pollId } = req.params;

      const poll = await pollService.deletePoll(userId, pollId);

      res.status(200).json({
        success: true,
        message: "Poll deleted successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = chatController;
