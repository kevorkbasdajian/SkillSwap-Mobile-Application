const notificationService = require("../services/notificationService");

const notificationController = {
  // Get all notifications
  getUserNotifications: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const notifications =
        await notificationService.getUserNotifications(userId);

      res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark as read
  markAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const notification = await notificationService.markAsRead(
        userId,
        notificationId,
      );

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark all as read
  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete notification
  deleteNotification: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const result = await notificationService.deleteNotification(
        userId,
        notificationId,
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get unread count
  getUnreadCount: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = notificationController;
/*
1-getUserNotification: Retrieves all user notifications.
2-markAsRead: Marks a specific notification as read.
3-markAllAsRead: Marks all notifications as read.
4-deleteNotification: Deletes a specific notification.
5-getUnreadCount: Calculates the number of unread notifications.
*/
