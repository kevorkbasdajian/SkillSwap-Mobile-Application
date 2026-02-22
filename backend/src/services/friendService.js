// This file is to send, accept, reject, remove friend requests + get all friends, get pending requests.

const supabase = require("../config/database");
const { createNotification } = require("../utils/notification");

const friendService = {
  //Send friend request
  sendFriendRequest: async (requesterId, addresseeId) => {
    //Check if they're already friends or request exists
    const { data: existing } = await supabase
      .from("friends")
      .select("id, status")

      .or(
        `and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),` +
          `and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`,
      )
      .single();
    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("You are already friends with this user");
      }
      if (existing.status === "pending") {
        throw new Error("Friend request already sent");
      }
    }

    //Create friend request
    const { data: friendRequest, error } = await supabase
      .from("friends")
      .insert([
        {
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: "pending",
        },
      ])
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to send friend request: ${error.message}`);
    }

    //Get requester info for notification
    const { data: requester } = await supabase
      .from("users")
      .select("full_name, nick_name")
      .eq("id", requesterId)
      .single();
    const displayName = requester.nick_name || requester.full_name;

    //Create notification
    await createNotification({
      related_entity_type: "friendship",
      related_entity_id: friendRequest.id,
      sender_id: requesterId,
      recipient_id: addresseeId,
      title: "New Friend Request",
      message: `${displayName} sent you a friend request`,
    });

    return friendRequest;
  },

  //Accept friend request
  acceptFriendRequest: async (userId, friendshipId) => {
    //Verify user is the addressee
    const { data: friendship, error: fetchError } = await supabase
      .from("friends")
      .select("*")
      .eq("id", friendshipId)
      .eq("addressee_id", userId)
      .eq("status", "pending")
      .single();
    if (fetchError || !friendship) {
      throw new Error(`Friend request not found or already processed`);
    }

    //Update status to accepted
    const { data: updated, error: updateError } = await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", friendshipId)
      .select()
      .single();
    if (updateError) {
      throw new Error(`Failed to accept request: ${updateError.message}`);
    }
    const { data: accepter } = await supabase
      .from("users")
      .select("full_name, nick_name")
      .eq("id", userId)
      .single();
    const displayName = accepter.full_name || accepter.nick_name;
    await createNotification({
      related_entity_type: "friendship",
      related_entity_id: friendshipId,
      sender_id: userId,
      recipient_id: friendship.requester_id,
      title: "Friend Request Accepted",
      message: `${displayName} accepted your friend request`,
    });
    return updated;
  },

  //Reject friend request
  rejectFriendRequest: async (userId, friendshipId) => {
    // Verify user is the addressee
    const { data: friendship, error: fetchError } = await supabase
      .from("friends")
      .select("*")
      .eq("id", friendshipId)
      .eq("addressee_id", userId)
      .eq("status", "pending")
      .single();

    if (fetchError || !friendship) {
      throw new Error("Friend request not found or already processed");
    }

    const { error: deleteError } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendshipId);

    if (deleteError) {
      throw new Error(`Failed to reject request: ${deleteError.message}`);
    }

    return { message: "Friend request rejected" };
  },

  // Remove friend / Cancel request
  removeFriend: async (userId, friendshipId) => {
    // Verify user is part of this friendship
    const { data: friendship, error: fetchError } = await supabase
      .from("friends")
      .select("*")
      .eq("id", friendshipId)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .single();

    if (fetchError || !friendship) {
      throw new Error("Friendship not found");
    }

    // Delete friendship
    const { error: deleteError } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendshipId);

    if (deleteError) {
      throw new Error(`Failed to remove friend: ${deleteError.message}`);
    }

    return { message: "Friendship removed successfully" };
  },

  //Get all friends (accepted)
  getAllFriends: async (userId) => {
    const { data: friendships, error } = await supabase
      .from("friends")
      .select(
        `
        id,
        requester_id,
        addressee_id,
        created_at,
        requester:requester_id (id, full_name, nick_name, profile_image_url),
        addressee:addressee_id (id, full_name, nick_name, profile_image_url)
      `,
      )
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (error) {
      throw new Error(`Failed to fetch friends: ${error.message}`);
    }

    //Format response to show the "other" user
    const friends = friendships.map((f) => ({
      friendship_id: f.id,
      friend: f.requester_id === userId ? f.addressee : f.requester,
      since: f.created_at,
    }));
    return friends;
  },

  // Get pending requests (received)
  getPendingRequests: async (userId) => {
    const { data: requests, error } = await supabase
      .from("friends")
      .select(
        `id,
        created_at,
        requester:requester_id (id, full_name, nick_name, profile_image_url, biography)`,
      )
      .eq("addressee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to fetch pending requests: ${error.message}`);
    }

    return requests;
  },
};

module.exports = friendService;
/*
1- sendFriendRequest: Checks if friendship or request already exists first. If not, it goes on to create the request, get the full_name
or nick_name of the requester, and send a notification to the addressee.
2- acceptFriendRequest: First, we check if the request exists. Then, try to accept the request by changing the status of the request to accepted. Then, the info of the accepter is collected,
and a notification is sent to the requester informing that the request has been accepted.
3- rejectFriendRequest: First we verify that the user is the addresse. Then we delete the request.
4- removeFriend: First we verify that the user is part of this friendship (either the addressee or the requester). Then, we delete the friendship.
5- getFriends: We get all of the friendships in which the the user is part of. Then we format the response to show only the "other" user.
6-getPendingRequests: Retrieves the pending requests in which the user is the addressee.
*/
