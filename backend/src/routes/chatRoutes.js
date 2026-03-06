const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authenticate = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  sendMessageSchema,
  createPollSchema,
  votePollSchema,
} = require("../utils/validators");

//All Routes require authentication

router.use(authenticate);

// Get or Create Group Chat
router.get("/groups/:groupId", chatController.getGroupChat);

//Send Message
router.post(
  "/chats/:groupChatId/messages",
  validate(sendMessageSchema),
  chatController.sendMessage,
);

// Get Chat Messages
router.get("/chats/:groupChatId/messages", chatController.getChatMessages);

// Get Pinned Messages
router.get("/chats/:groupChatId/pinned", chatController.getPinnedMessages);

// Pin a message
router.patch("/messages/:messageId/pin", chatController.pinMessage);

// Unpin a message
router.patch("/messages/:messageId/unpin", chatController.unpinMessage);

// Delete a message
router.delete("/messages/:messageId/delete", chatController.deleteMessage);

// Create a poll
router.post(
  "/chats/:groupChatId/polls",
  validate(createPollSchema),
  chatController.createPoll,
);

// Get poll details
router.get("/polls/:pollId", chatController.getpollDetails);

// Vote on a poll
router.post(
  "/polls/:pollId/vote",
  validate(votePollSchema),
  chatController.votePoll,
);

// Close a poll
router.patch("/polls/:pollId/close", chatController.closePoll);

// Delete a poll
router.delete("/polls/:pollId", chatController.deletePoll);

module.exports = router;
