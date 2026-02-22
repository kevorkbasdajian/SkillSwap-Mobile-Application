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

    //Link notification to recipient
    const { data: userNotification, error: userNotifError } = await supabase
      .from("user_notifications")
      .insert([
        { notification_id: notification.id, recipient_id, is_read: false },
      ])
      .select(
        `id,
        is_read,
        created_at,
        notifications (
          id,
          related_entity_type,
          related_entity_id,
          sender_id,
          title,
          message,
          created_at
        )
      `,
      )
      .single();
    if (userNotifError) {
      throw new Error(`Failed to link notification: ${userNotifError.message}`);
    }

    //Emit real-time notification via Socket.io
    const io = getIO();
    io.to(`user:${recipient_id}`).emit("notification", {
      type: "new_notification",
      data: userNotification,
    });
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
  }
};
module.exports = { createNotification };
