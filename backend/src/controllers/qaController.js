const qaService = require("../services/qaService");

const qaController = {
  //Get or create conversation
  getConversation: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const conversation = await qaService.getOrCreateConversation(
        userId,
        groupId,
      );

      res.status(200).json({
        success: true,
        message: "Conversation retrieved or created successfully",
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  },

  //Ask a question
  askQuestion: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;
      const { question } = req.validatedData;

      const result = await qaService.askQuestion(userId, groupId, question);

      res.status(201).json({
        success: true,
        message: "Question answered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  //Get conversation History
  getHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;
      const { limit = 50 } = req.query;

      const messages = await qaService.getConversationHistory(
        userId,
        groupId,
        limit,
      );

      res.status(200).json({
        success: true,
        message: "History retrieved successfully",
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },

  //Clear conversation
  clearConversation: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const result = await qaService.clearConversation(userId, groupId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = qaController;
