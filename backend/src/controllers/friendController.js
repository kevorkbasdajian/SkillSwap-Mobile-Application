const friendService = require("../services/friendService");

const friendController = {
  // Send friend request
  sendFriendRequest: async (req, res, next) => {
    try {
      const requesterId = req.user.id;
      const { userId } = req.params;

      if (requesterId === userId) {
        return res.status(400).json({
          error: "You cannot send a friend request to yourself",
        });
      }

      const friendRequest = await friendService.sendFriendRequest(
        requesterId,
        userId,
      );

      res.status(201).json({
        success: true,
        message: "Friend request sent successfully",
        data: friendRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  // Accept friend request
  acceptFriendRequest: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { friendshipId } = req.params;

      const friendship = await friendService.acceptFriendRequest(
        userId,
        friendshipId,
      );

      res.status(200).json({
        success: true,
        message: "Friend request accepted",
        data: friendship,
      });
    } catch (error) {
      next(error);
    }
  },

  // Reject friend request
  rejectFriendRequest: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { friendshipId } = req.params;

      const result = await friendService.rejectFriendRequest(
        userId,
        friendshipId,
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
  // Remove friend or cancel request
  removeFriend: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { friendshipId } = req.params;

      const result = await friendService.removeFriend(userId, friendshipId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all friends
  getFriends: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const friends = await friendService.getAllFriends(userId);

      res.status(200).json({
        success: true,
        message: `Friends of user ${req.user.full_name} retrieved successfully`,
        count: friends.length,
        data: friends,
      });
    } catch (error) {
      next(error);
    }
  },
  // Get pending friend requests
  getPendingRequests: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const requests = await friendService.getPendingRequests(userId);

      res.status(200).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = friendController;
/*
1- sendFriendRequest: Briing the id from the attached user object to the req, check if the request is to the same person. if not send request + notification.
2- acceptFriendRequest: Accept friend request and send notification to the sender.
3- rejectFriendRequest: get the user id and the friendship id and delete it.
4- removeFriendRequest: Remove friend or cancecl request.
5- getFriends: get all friends of a user
6- getPendingRequests: Get pending requests in which the user is the addresse
*/
