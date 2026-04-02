// This file is to get user profile and update it.
const { map } = require("../app");
const supabase = require("../config/database");
const { uploadToSupabase } = require("../utils/supabaseUpload");

const userService = {
  //Get user profile by ID
  getUserProfile: async (userId) => {
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id,email,full_name,nick_name,gender,profile_image_url,education_level,date_of_birth,biography,created_at, gender",
      )
      .eq("id", userId)
      .single();
    if (error || !user) {
      throw new Error("User not found");
    }

    //Get teaching count
    const { count: teachingCount } = await supabase
      .from("user_skills")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "teacher");

    //Get learning count
    const { count: learningCount } = await supabase
      .from("user_skills")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "learner");

    //Get friends count
    const { count: friendsCount } = await supabase
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    user.teachingCount = teachingCount;
    user.learningCount = learningCount;
    user.friendsCount = friendsCount;
    return user;
  },
  updateUserProfile: async (userId, updateData, file) => {
    const allowedFields = [
      "full_name",
      "nick_name",
      "gender",
      "biography",
      "education_level",
      "date_of_birth",
    ];
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    if (Object.keys(filteredData).length === 0 && !file) {
      throw new Error("No valid fields to update");
    }
    //0.5- Upload file
    let profileImageUrl = null;

    //Upload cover image if provided, otherwise use skill icon
    if (file) {
      profileImageUrl = await uploadToSupabase(file, "avatars");
      filteredData.profile_image_url = profileImageUrl;
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(filteredData)
      .eq("id", userId);

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    const user = userService.getUserProfile(userId);
    return user;
  },

  //Complete User Profile(During initial Setup)
  completeUserProfile: async (userId, profileData, file) => {
    const {
      nick_name,
      date_of_birth,
      gender,
      biography,
      education_level,
      skills_to_teach,
      skills_to_learn,
    } = profileData;

    //0.5- Upload file
    let profileImageUrl = null;

    //Upload cover image if provided, otherwise use skill icon
    if (file) {
      profileImageUrl = await uploadToSupabase(file, "avatars");
    }

    //1- Update user information
    const { error: userError } = await supabase
      .from("users")
      .update({
        nick_name,
        date_of_birth,
        gender,
        biography,
        education_level,
        profile_image_url: profileImageUrl,
      })
      .eq("id", userId);
    if (userError) {
      throw new Error(`Failed to save user profile: ${userError.message}`);
    }
    console.log("Skills to teach", skills_to_teach);
    console.log("Skills to learn", skills_to_learn);
    //2- Insert skills to learn
    const userLearnerSkillsData = skills_to_learn.map((skill) => ({
      user_id: userId,
      skill_id: skill.skill_id,
      role: "learner",
      proficiency_level:
        skill.proficiency_level !== undefined &&
        skill.proficiency_level !== null
          ? skill.proficiency_level
          : skill.is_default
            ? Math.floor(Math.random() * 5) + 1
            : 1,
      is_favorite: false,
    }));

    const { error: learnSkillError } = await supabase
      .from("user_skills")
      .insert(userLearnerSkillsData);
    if (learnSkillError) {
      throw new Error(
        `Failed to insert learning skills: ${learnSkillError.message}`,
      );
    }

    //3- Insert skills to teach
    const userTeacherSkillsData = skills_to_teach.map((skill) => ({
      user_id: userId,
      skill_id: skill.skill_id,
      role: "teacher",
      proficiency_level: skill.is_default
        ? Math.floor(Math.random() * 5) + 1
        : skill.proficiency_level,
      is_favorite: false,
    }));

    const { error: teachSkillError } = await supabase
      .from("user_skills")
      .insert(userTeacherSkillsData);
    if (teachSkillError) {
      throw new Error(
        `Failed to insert teaching skills: ${teachSkillError.message}`,
      );
    }

    return { data: profileImageUrl };
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
      biography,
      profile_image_url
    ),
    addressee:users!friends_addressee_id_fkey (
      id,
      full_name,
      nick_name,
      biography,
      profile_image_url
    )
  `,
      )
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)
      .eq("status", "accepted");

    let formatted = null;
    if (user_friends != null && user_friends.length != 0) {
      //Format the information to only include the info of the user's friends
      formatted = user_friends
        .map((row) => {
          return row.requester.id === targetUserId
            ? row.addressee
            : row.requester;
        })
        .filter((friend) => friend.id !== currentUserId);
    }

    // Get friendship status with current user
    const { data: friendship } = await supabase
      .from("friends")
      .select("id,status,requester_id")
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),` +
          `and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`,
      )
      .single();
    //Determine friend button state
    let friendshipStatus = "none";
    let friendshipId = null;
    if (friendship) {
      friendshipId = friendship.id;
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
      friendshipId: friendshipId,

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
4-CompleteUserProfile: 

*/
