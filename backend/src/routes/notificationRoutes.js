const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authenticate = require("../middlewares/auth");

// All routes require authentication
router.use(authenticate);

// GET /api/notificationHistory - History of teacher's notifications
router.get(
  "/:groupId/notification-history",
  notificationController.getNotificationHistory,
);

// GET /api/notifications - Get all notifications
router.get("/", notificationController.getUserNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get("/unread-count", notificationController.getUnreadCount);

// PATCH /api/notifications/:notificationId/read - Mark as read
router.patch("/:notificationId/read", notificationController.markAsRead);

// PATCH /api/notifications/read-all - Mark all as read
router.patch("/read-all", notificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete("/:notificationId", notificationController.deleteNotification);

module.exports = router;
