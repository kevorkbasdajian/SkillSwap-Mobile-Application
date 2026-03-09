const express = require("express");
const router = express.Router();
const qaController = require("../controllers/qaController");
const authenticate = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { askQuestionSchema } = require("../utils/validators");
const { auth } = require("../config/database");

//All routes require authentication
router.use(authenticate);

//Get or create conversation for a group
router.get("/groups/:groupId/conversation", qaController.getConversation);

//Ask a question (learner only)
router.post(
  "/groups/:groupId/ask",
  validate(askQuestionSchema),
  qaController.askQuestion,
);

//Get conversation history
router.get("/groups/:groupId/history", qaController.getHistory);

//Clear conversation history
router.delete("/groups/:groupId/clear", qaController.clearConversation);

module.exports = router;
