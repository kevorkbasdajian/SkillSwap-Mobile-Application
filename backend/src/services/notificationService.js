const supabase = require("../config/database");

const notificationService = {
  // Get user's notifications
  getUserNotifications: async (userId) => {
    const { data: notifications, error } = await supabase
      .from("user_notifications")
      .select(
        `
        id,
        is_read,
        created_at,
        notifications (
          id,
          related_entity_type,
          related_entity_id,
          title,
          message,
          created_at,
          sender:sender_id (
            id,
            full_name,
            nick_name,
            profile_image_url
          )
        )
      `,
      )
      .eq("recipient_id", userId)
      .not("notifications", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return notifications.filter((n) =>
      ["friendship", "group"].includes(n.notifications.related_entity_type),
    );
  },

  // History of Sent Notifications for the teacher
  getNotificationHistory: async (userId, groupId) => {
    //Check that the user is the owner of the group
    // const { data: group, error: groupError } = await supabase
    //   .from("groups")
    //   .select("id, creator_id")
    //   .eq("id", groupId)
    //   .single();

    // if (groupError || !group) {
    //   throw new Error("Group not found");
    // }

    // if (group.creator_id !== userId) {
    //   throw new Error(
    //     "Only the group creator can view the history of notifications sent",
    //   );
    // }

    //Retrieve notification history
    const { data: notification_history, error } = await supabase
      .from("notifications")
      .select("id,title,message,created_at")
      // .eq("sender_id", userId)
      .eq("related_entity_id", groupId)
      .in("related_entity_type", ["session", "Group General"])
      .order("created_at", { ascending: true });

    console.log(notification_history, groupId);

    if (error) {
      throw new Error(
        `Failed to retrieve Notification History: ${error.message}`,
      );
    }
    if (notification_history.length === 0) {
      return { message: "No notifications sent." };
    }

    return notification_history;
  },

  // Mark notification as read
  markAsRead: async (userId, userNotificationId) => {
    const { data, error } = await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("id", userNotificationId)
      .eq("recipient_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark as read: ${error.message}`);
    }

    return data;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) {
      throw new Error(`Failed to mark all as read: ${error.message}`);
    }

    return { message: "All notifications marked as read" };
  },

  // Delete notification
  deleteNotification: async (userId, userNotificationId) => {
    const { error } = await supabase
      .from("user_notifications")
      .delete()
      .eq("id", userNotificationId)
      .eq("recipient_id", userId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return { message: "Notification deleted" };
  },

  // Get unread count
  getUnreadCount: async (userId) => {
    const { count, error } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return { unread_count: count || 0 };
  },
};

module.exports = notificationService;
/*
1- getUserNotifications: This service fetches the notifications related to a user, as well as the information of the sender.
2- markAsRead: This service updates a notification and marks it as read.
3- markAllAsRead: This service marks all of the notifications of a user as read.
4- deleteNotification: This service deletes a specific chosen notification.
5- getUnreadCount: This service calculates the number of unread notifications of a user.
6-getNotificationHistory: This service retrieves the history of sent notifications of a teacher.
*/
