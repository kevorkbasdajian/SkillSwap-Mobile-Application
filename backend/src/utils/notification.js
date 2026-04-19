// This file is to create a notification and send it to the intended user via the socket created to that user.

const supabase = require("../config/database");
const { getIO } = require("../config/socket");

const createNotification = async (notificationData) => {
  const {
    related_entity_type,
    related_entity_id,
    sender_id,
    recipient_id,
    title,
    message,
  } = notificationData;
  try {
    //Create notification
    const { data: notification, error: notiError } = await supabase
      .from("notifications")
      .insert([
        { related_entity_type, related_entity_id, sender_id, title, message },
      ])
      .select()
      .single();
    if (notiError) {
      throw new Error(`Failed to create notification: ${notiError.message}`);
    }

    // Ensure recipients is array
    const recipients = Array.isArray(recipient_id)
      ? recipient_id
      : [recipient_id];

    // Create multiple user_notifications
    const userNotifications = recipients.map((r) => ({
      notification_id: notification.id,
      recipient_id: r,
      is_read: false,
    }));
    // Ensure array format
    const payload = Array.isArray(userNotifications)
      ? userNotifications
      : [userNotifications];

    //Link notification to recipient
    const { data: insertedNotifications, error: userNotifError } =
      await supabase
        .from("user_notifications")
        .insert(payload)
        .select(
          `id,
          recipient_id,
          is_read,
          created_at,
          notifications (
            id,
            related_entity_type,
            related_entity_id,
            sender_id,
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
        );
    if (userNotifError) {
      throw new Error(`Failed to link notification: ${userNotifError.message}`);
    }

    if (!insertedNotifications) return;

    // Emit real-time notifications safely mapped by recipient_id
    const io = getIO();

    for (const notification of insertedNotifications) {
      const recipientId = notification.recipient_id;

      io.to(`user:${recipientId}`).emit("notification", {
        type: "new_notification",
        data: notification,
      });
    }
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
  }
};
module.exports = { createNotification };
