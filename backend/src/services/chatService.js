// This file is to implement chatting functionality.
const supabase = require("../config/database");
const { getIO } = require("../config/socket");

const chatService = {
  //Get or create group chat
  getOrCreateGroupChat: async (groupId, userId) => {
    // Verify user is a member
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .eq("has_joined", true)
      .single();
    if (memberError || !membership) {
      throw new Error("You are not a member of this group");
    }

    // Check if chat exists
    let { data: chat, error: chatError } = await supabase
      .from("group_chats")
      .select("id, group_id, created_at")
      .eq("group_id", groupId)
      .single();

    if (chatError || !chat) {
      const { data: newChat, error: createError } = await supabase
        .from("group_chats")
        .insert([{ group_id: groupId }])
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create chat: ${createError.message}`);
      }
      chat = newChat;
    }

    return chat;
  },

  //Send text messages
  sendMessage: async (userId, groupChatId, messageData) => {
    const { content, reply_to_message_id } = messageData;

    // Get chat to verify access
    const { data: chat, error: chatError } = await supabase
      .from("group_chats")
      .select("id, group_id")
      .eq("id", groupChatId)
      .single();

    if (chatError) {
      throw new Error("Chat not found");
    }

    // Verify user is member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id, role")
      .eq("group_id", chat.group_id)
      .eq("has_joined", true)
      .eq("user_id", userId)
      .single();

    if (!membership) {
      throw new Error(" You are not a member of this group");
    }

    // Verify reply_to message exists if provided
    if (reply_to_message_id) {
      const { data: replyMessage } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("id", reply_to_message_id)
        .eq("group_chat_id", groupChatId)
        .single();

      if (!replyMessage) {
        throw new Error("Reply message not found");
      }
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert([
        {
          group_chat_id: groupChatId,
          sender_id: userId,
          message_type: "text",
          content,
          reply_to_message_id: reply_to_message_id || null,
        },
      ])
      .select(
        `
        id,
        content,
        message_type,
        reply_to_message_id,
        is_pinned,
        created_at,
        sender:sender_id(id,full_name,nick_name,profile_image_url),
        reply_to: reply_to_message_id(
            id,
            content,
            sender:sender_id(id,full_name,nick_name)
        )
        `,
      )
      .single();
    if (messageError) {
      throw new Error(`Failed to send message: ${messageError.message}`);
    }

    //Emit real-time message
    const io = getIO();
    io.to(`group-chat:${groupChatId}`).emit("new-message", {
      type: "text",
      data: message,
    });

    return message;
  },

  // Get chat messages with pagination
  getChatMessages: async (userId, groupChatId, limit = 50, before = null) => {
    // Verify user has access
    const { data: chat } = await supabase
      .from("group_chats")
      .select("id,group_id")
      .eq("id", groupChatId)
      .single();

    if (!chat) {
      throw new Error("Chat not found");
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", chat.group_id)
      .eq("user_id", userId)
      .eq("has_joined", true)
      .single();

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    // Build query
    let query = supabase
      .from("chat_messages")
      .select(
        `
        id,
        content,
        message_type,
        poll_id,
        reply_to_message_id,
        is_pinned,
        created_at,
        sender:sender_id(id,full_name,nick_name,profile_image_url),
        reply_to:reply_to_message_id (
            id,
            content,
            message_type,
            sender:sender_id(id,full_name,nick_name)
        )
        `,
      )
      .eq("group_chat_id", groupChatId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }
    const { data: messages, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
    return messages.reverse();
  },

  // Get pinned messages
  getPinnedMessages: async (userId, groupChatId) => {
    // Verify access
    const { data: chat } = await supabase
      .from("group_chats")
      .select("id, group_id")
      .eq("id", groupChatId)
      .single();

    if (!chat) {
      throw new Error("Chat not found");
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", chat.group_id)
      .eq("user_id", userId)
      .eq("has_joined", true)
      .single();

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select(
        `
        id,
        content,
        message_type,
        poll_id,
        pinned_at,
        created_at,
        sender:sender_id (id,full_name,nick_name,profile_image_url),
        pinned_by:pinned_by(id,full_name,nick_name)
        `,
      )
      .eq("group_chat_id", groupChatId)
      .eq("is_pinned", true)
      .order("pinned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pinned messages: ${error.message}`);
    }
    return messages;
  },

  //Pin message (teacher only)
  pinMessage: async (userId, messageId) => {
    //Get message and verify teacher role
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .select(
        `
        id,
        is_pinned,
        group_chat: group_chat_id(
            id,
            group:group_id(id,creator_id)
        )
        `,
      )
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      throw new Error("Message not found");
    }

    if (message.group_chat.group.creator_id !== userId) {
      throw new Error("Only the teacher can pin messages");
    }

    if (message.is_pinned) {
      throw new Error("Message is already pinned");
    }

    // Pin message
    const { data: updated, error: updateError } = await supabase
      .from("chat_messages")
      .update({
        is_pinned: true,
        pinned_by: userId,
        pinned_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to pin message: ${updateError.message}`);
    }

    //Emit real-time update
    const io = getIO();
    io.to(`group-chat:${message.group_chat.id}`).emit("message-pinned", {
      messageId,
      pinnedBy: userId,
    });

    return updated;
  },

  //Unpin message (teacher-only)
  unpinMessage: async (userId, messageId) => {
    // Get message and verify teacher role
    const { data: message, messageError } = await supabase
      .from("chat_messages")
      .select(
        `
        id,
        is_pinned,
        group_chat:group_chat_id(
            id,
            group:group_id(id,creator_id)
        )
        `,
      )
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      throw new Error("Message not found");
    }
    if (message.group_chat.group.creator_id !== userId) {
      throw new Error("Only the teacher can unpin messages");
    }
    if (!message.is_pinned) {
      throw new Error("Message is not pinned");
    }

    //Unpin message
    const { data: updated, error: updateError } = await supabase
      .from("chat_messages")
      .update({
        is_pinned: false,
        pinned_by: null,
        pinned_at: null,
      })
      .eq("id", messageId)
      .select()
      .single();
    if (updateError) {
      throw new Error(`Failed to unpin message: ${updateError.message}`);
    }

    //Emit real-time update
    const io = getIO();
    io.to(`group-chat:${message.group_chat.id}`).emit("message_unpinned", {
      messageId,
    });

    return updated;
  },

  // Delete message
  deleteMessage: async (userId, messageId) => {
    // Get message
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .select(
        `
        id,
        sender_id,
        group_chat:group_chat_id(
            id,
            group:group_id (id,creator_id)
        )
        `,
      )
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      throw new Error("Message not found");
    }

    //Only sender or teacher can delete
    const isTeacher = message.group_chat.group.creator_id === userId;
    const isSender = message.sender_id === userId;

    if (!isTeacher && !isSender) {
      throw new Error("You can only delete your own messages");
    }

    // Delete a message
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);

    if (deleteError) {
      throw new Error(`Failed to delete message: ${deleteError.message}`);
    }

    //Emit real-time update
    const io = getIO();
    io.to(`group-chat:${message.group_chat.id}`).emit("message-deleted", {
      messageId,
    });

    return { message: "Message deleted successfully" };
  },
};
module.exports = chatService;

/*
1-getOrCreateGroupChat: Checks if the user is a member, retrieves the chat if existent, or creates a new one in case of new chat.
2-sendMessage: This service first retrieves the group, checks that the user is a member of the group, checks if the message is a reply, if so checks that the replied_to message exists. Then, it inserts
the new message , and sends it to the group_chat_socket created.
3-getChatMessages: First checks that the requester is a group_member, then retrieves 50 of the last messages and orders them such that the newest (with the largest date) appears at the bottom.
4-getPinnedMessages: Verify that the requester is a member, then retrieves the pinned messages.
5-pinMessage: This service first checks that the requester is the group creator a.k.a. the teacher. Then it checks that the message is there and is not already pinned, and afterwards pins the message and
sends a real-time notification to the users.
6-unpinMessage: First checks that the requester is the creator of the group a.k.a. the teacher. THen checks if the message exists and is pinned, and then allows the requester to update the message
and send a real-time notification to the users about the event.
7-deleteMessage: This service checks that the deleter is either the teacher or the sender of the message. And then deletes the message and emits a real-time update.
*/
