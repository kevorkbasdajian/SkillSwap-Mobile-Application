// This file is to get user profile and update it
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
};
module.exports = userService;

/*
1-the first service is to get a user profile by id.
2- the second service is to update a user profile, by only allowing to change 
certain attributes of a user.

*/
