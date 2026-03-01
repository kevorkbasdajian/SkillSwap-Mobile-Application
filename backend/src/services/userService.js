// This file is to get user profile and update it.
const { map } = require("../app");
const supabase = require("../config/database");

const userService = {
  //Get user profile by ID
  getUserProfile: async (userId) => {
    const { data: user, error } = await supabase
      .from("users")
      .select("id,email,full_name,gender,profile_image_url,education_level")
      .eq("id", userId)
      .single();
    if (error || !user) {
      throw new Error("User not found");
    }
    return user;
  },
  updateUserProfile: async (userId, updateData) => {
    const allowedFields = [
      "full_name",
      "nick_name",
      "gender",
      "biography",
      "profile_image_url",
      "education_level",
    ];
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    if (Object.keys(filteredData).length === 0) {
      throw new Error("No valid fields to update");
    }
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(filteredData)
      .eq("id", userId)
      .select(
        "id, email, full_name, nick_name, gender, profile_image_url, education_level, biography, updated_at",
      )
      .single();
    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
    return updatedUser;
  },

  //Get another user's public profile
  getPublicProfile: async (currentUserId, targetUserId) => {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, nick_name, profile_image_url,biography")
      .eq("id", targetUserId)
      .single();
    if (error || !user) {
      throw new Error("User not found");
    }

    //Get teaching count
    const { count: teachingCount } = await supabase
      .from("user_skills")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("role", "teacher");

    //Get learning count
    const { count: learningCount } = await supabase
      .from("user_skills")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("role", "learner");

    //Get friends count
    const { count: friendsCount } = await supabase
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`);

    // Get friends information of the targetted user
    const { data: user_friends } = await supabase
      .from("friends")
      .select(
        `
    id,
    status,
    requester:users!friends_requester_id_fkey (
      id,
      full_name,
      nick_name,
      profile_image_url
    ),
    addressee:users!friends_addressee_id_fkey (
      id,
      full_name,
      nick_name,
      profile_image_url
    )
  `,
      )
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)
      .eq("status", "accepted");

    //Format the information to only include the info of the user's friends
    const formatted = user_friends.map((row) => {
      return row.requester.id === targetUserId ? row.addressee : row.requester;
    });

    // Get friendship status with current user
    const { data: friendship } = await supabase
      .from("friends")
      .select("id,status,requester_id")
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq${targetUserId}),` +
          `and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`,
      )
      .single();
    //Determine friend button state
    let friendshipStatus = "none";
    if (friendship) {
      if (friendship.status === "accepted") {
        friendshipStatus = "friends";
      } else if (friendship.status === "pending") {
        friendshipStatus =
          friendship.requester_id === currentUserId
            ? "pending_sent"
            : "pending_received";
      }
    }

    //Get user skills (both roles) with skill name and icon
    const { data: skills } = await supabase
      .from("user_skills")
      .select(`id,role,proficiency_level,skills(id , name, icon_url)`)
      .eq("user_id", targetUserId);
    return {
      ...user,
      status: {
        teaching: teachingCount || 0,
        learning: learningCount || 0,
        friends: friendsCount || 0,
      },
      friendshipStatus,
      skills: {
        teaching: skills.filter((s) => s.role === "teacher"),
        learning: skills.filter((s) => s.role === "learner"),
      },
      friends: formatted,
    };
  },
};
module.exports = userService;

/*
1-the first service is to get a user profile by id.
2- the second service is to update a user profile, by only allowing to change 
certain attributes of a user.
3-getPublicProfile: This function at first fetches the user's profile data like full_name
nick_name, etc. Then, the function fetches the # of teaching, learning, and friends count.
Then, the function fetches the target user's connection with the current one to determine the state of the
button. Then the function returns the skills of the users and sorts the data out in the return response.

*/
