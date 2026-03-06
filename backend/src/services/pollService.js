// This file is for the poll functionality in the chat

const supabase = require("../config/database");
const { getIO } = require("../config/socket");

const PollService = {
  //Create poll (teacher only)
  createPoll: async (userId, groupChatId, pollData) => {
    const { question, options, allow_multiple_answers, expires_at } = pollData;

    // Get chat and verify teacher role
    const { data: chat, error: chatError } = await supabase
      .from("group_chats")
      .select("id,group:group_id(id, creator_id)")
      .eq("id", groupChatId)
      .single();

    if (chatError || !chat) {
      throw new Error("Chat Not found");
    }

    if (chat.group.creator_id !== userId) {
      throw new Error("Only the teacher can create polls");
    }

    //Create poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert([
        {
          question,
          created_by: userId,
          group_id: chat.group.id,
          allow_multiple_answers,
          expires_at: expires_at || null,
          is_closed: false,
        },
      ])
      .select()
      .single();

    if (pollError) {
      throw new Error(`Failed to create poll: ${pollError.message}`);
    }

    // Create poll options
    const pollOptions = options.map((option, index) => ({
      poll_id: poll.id,
      option_text: option,
      display_order: index,
    }));

    const { data: createdOptions, error: optionsError } = await supabase
      .from("poll_options")
      .insert(pollOptions)
      .select();
    if (optionsError) {
      throw new Error(`Failed to create poll options: ${optionsError.message}`);
    }

    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert([
        {
          group_chat_id: groupChatId,
          sender_id: userId,
          message_type: "poll",
          poll_id: poll.id,
        },
      ])
      .select(
        `
        id,
        message_type,
        poll_id,
        created_at,
        sender: sender_id(id, full_name,nick_name,profile_image_url)
        `,
      )
      .single();
    if (messageError) {
      throw new Error(`Failed to create poll message: ${messageError.message}`);
    }

    // Combine poll data
    const pollResponse = {
      ...poll,
      options: createdOptions,
      message_id: message.id,
    };

    // Emit real-time message
    const io = getIO();
    io.to(`group-chat:${groupChatId}`).emit("new-message", {
      type: "poll",
      data: {
        ...message,
        poll: pollResponse,
      },
    });

    return pollResponse;
  },

  // Get poll details with votes
  getPollDetails: async (userId, pollId) => {
    //Get poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(
        `
        id,
        question,
        allow_multiple_answers,
        expires_at,
        is_closed,
        closed_at,
        created_at,
        created_by,
        group: group_id (id, name, creator_id)
        `,
      )
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      throw new Error("Poll not found");
    }
    console.log("Poll is", poll);

    // Verify user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id,role")
      .eq("user_id", userId)
      .eq("group_id", poll.group.id)
      .eq("has_joined", true)
      .single();
    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    // Get poll options with vote counts
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select(
        `
        id,
        option_text,
        display_order,
        poll_votes(id)
        `,
      )
      .eq("poll_id", pollId)
      .order("display_order", { ascending: true });
    if (optionsError) {
      throw new Error(`Failed to fetch poll options: ${optionsError.message}`);
    }

    //Calculate vote counts
    const optionsWithCounts = options.map((option) => ({
      id: option.id,
      option_text: option.option_text,
      display_order: option.display_order,
      vote_count: option.poll_votes.length,
    }));

    // Get user's votes
    const { data: userVotes } = await supabase
      .from("poll_votes")
      .select("poll_option_id")
      .eq("poll_id", pollId)
      .eq("user_id", userId);

    const userVotedOptions = userVotes
      ? userVotes.map((v) => v.poll_option_id)
      : [];

    // if teacher, get voter details
    let voterDetails = null;
    if (poll.group.creator_id === userId) {
      const { data: votes } = await supabase
        .from("poll_votes")
        .select(
          `
        id,
        poll_option_id,
        created_at,
        user:user_id(id, full_name, nick_name, profile_image_url)
        `,
        )
        .eq("poll_id", pollId)
        .order("created_at", { ascending: false });

      voterDetails = votes || [];
    }

    return {
      ...poll,
      user_voted: userVotedOptions,
      is_teacher: poll.group.creator_id === userId,
      voter_details: voterDetails,
      total_votes: optionsWithCounts.reduce(
        (sum, opt) => sum + opt.vote_count,
        0,
      ),
    };
  },
  //Vote on poll
  votePoll: async (userId, pollId, voteData) => {
    const { option_ids } = voteData;

    // Get poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(`id, group_id,allow_multiple_answers,is_closed,expires_at`)
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      throw new Error("Poll not found");
    }

    //Check if poll is closed
    if (poll.is_closed) {
      throw new Error("This poll is closed");
    }

    //Check if poll is expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new Error("This poll has expired");
    }

    // Verify user is a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("id,role")
      .eq("group_id", poll.group_id)
      .eq("user_id", userId)
      .eq("has_joined", true)
      .single();

    if (!membership) {
      throw new Error(`You are not a member of this group`);
    }

    //Verify teacher is not voting
    const { data: group } = await supabase
      .from("groups")
      .select("id,creator_id")
      .eq("id", poll.group_id)
      .single();

    if (group.creator_id === userId) {
      throw new Error("Teachers cannot vote on their own polls");
    }

    // Validate multiple answers
    if (!poll.allow_multiple_answers && option_ids.length > 1) {
      throw new Error(`This poll allows only one answer`);
    }

    //Verify all options belong to this poll
    const { data: validOptions, error: optionsError } = await supabase
      .from("poll_options")
      .select("id")
      .eq("poll_id", pollId)
      .in("id", option_ids);

    if (optionsError || validOptions.length !== option_ids.length) {
      throw new Error("Invalid poll options");
    }

    // Delete existing votes from this user
    await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", userId);

    //Create new votes
    const votes = option_ids.map((optionId) => ({
      poll_id: pollId,
      poll_option_id: optionId,
      user_id: userId,
    }));

    // Insert the votes
    const { data: createdVotes, error: voteError } = await supabase
      .from("poll_votes")
      .insert(votes)
      .select();
    if (voteError) {
      throw new Error(`Failed to record vote: ${voteError.message}`);
    }

    // Get updated poll details
    const updatedPoll = await PollService.getPollDetails(userId, pollId);

    // Emit real-time update
    const { data: chat } = await supabase
      .from("group_chats")
      .select("id")
      .eq("group_id", poll.group_id)
      .single();

    if (chat) {
      const io = getIO();
      io.to(`group-chat:${chat.id}`).emit("poll-updated", {
        pollId,
        userId,
        optionIds: option_ids,
      });
    }

    return updatedPoll;
  },
  // Close poll (teacher onlu)
  closePoll: async (userId, pollId) => {
    //Get poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(
        `
        id,
        is_closed,
        group:group_id(id, creator_id)
        `,
      )
      .eq("id", pollId)
      .single();
    if (pollError || !poll) {
      throw new Error("Poll not found");
    }
    if (poll.group.creator_id !== userId) {
      throw new Error("Only the teacher can close polls");
    }
    if (poll.is_closed) {
      throw new Error("Poll is already closed");
    }

    // Close poll
    const { data: updated, error: updateError } = await supabase
      .from("polls")
      .update({
        is_closed: true,
        closed_at: new Date().toISOString(),
      })
      .eq("id", pollId)
      .select()
      .single();
    if (updateError) {
      throw new Error(`Failed to close poll: ${updateError.message}`);
    }

    // Emit real-time update
    const { data: chat } = await supabase
      .from("chats")
      .select("id")
      .eq("group_id", poll.group.id)
      .single();
    if (chat) {
      const io = getIO();
      io.to(`group-chat:${chat.id}`).emit("poll-closed", {
        pollId,
      });
    }

    return updated;
  },

  //Delete poll (teacher only)
  deletePoll: async (userId, pollId) => {
    // Get poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(
        `
        id,
        group:group_id(id,creator_id)
        `,
      )
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      throw new Error("Poll not found");
    }

    if (poll.group.creator_id !== userId) {
      throw new Error("Only teachers can delete a poll");
    }
    //Delete a poll ( cascades to option, votes, and chat message)
    const { error: deleteError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    const { data: chat } = await supabase
      .from("chats")
      .select("id")
      .eq("group_id", poll.group.id)
      .single();
    if (chat) {
      const io = getIO();
      io.to(`group-chat:${chat.id}`).emit("poll-deleted", {
        pollId,
      });
    }
    return { message: "Poll deleted successfully" };
  },
};
module.exports = PollService;

/*
1- createPoll: First we verify the requester. Second, we create the poll and the poll options and insert them. After that, we create the poll message, then we combine the response to include the poll,
the options created and the message id. Then we emit the combination with the message info as a real-time notification.
2- getPollDetails: Gets the details of a poll, verifies that the user is a member of the group in which the poll is made, gets the count of vote for each option, gets the current user's vote in the poll,
and gets the details of the other voters in case the requester is a teacher.
3- votePoll: Get the poll and check that it has not been closed or expired. Check that the user is in the group and can vote and is not the teacher or creator of the poll. Verify that the options
belong to this poll, verify that the poll can accept multiple_answers, delete any existing answers, add the new answers, get the poll detials, and push into group socket for real time update.
4-closePoll: Gets the poll, checks if the user is the creator and if the poll is not already closed. Closes the poll, and emits a real-time message in case the chat is there.
5-deletePoll: First checks that the deleter is the group creator then deletes the poll, emits a rel-time message indicating that the poll has been deleted, and returns a success message.
*/
