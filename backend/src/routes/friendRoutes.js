const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friendController");
const authenticate = require("../middlewares/auth");

// All routes require authentication
router.use(authenticate);

//POST /api/friends/request/:userId - Send friend request
router.post("/request/:userId", friendController.sendFriendRequest);

// GET /api/friends - Get all friends (accepted)
router.get("/", friendController.getFriends);

// GET /api/friends/pending - Get pending requests (received)
router.get("/pending", friendController.getPendingRequests);

// PATCH /api/friends/:friendshipId/accept - Accept request
router.patch("/:friendshipId/accept", friendController.acceptFriendRequest);

// PATCH /api/friends/:friendshipId/reject - Reject request
router.patch("/:friendshipId/reject", friendController.rejectFriendRequest);

// DELETE /api/friends/:friendshipId - Remove friend/cancel request
router.delete("/:friendshipId", friendController.removeFriend);

module.exports = router;
