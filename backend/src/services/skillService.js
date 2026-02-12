/*This file is to first select all default skills. The file also creates a new skill,
adds the skills to a user's file, and also selects the skills to which a user is subscribed
*/
const supabase = require("../config/database");
const { uploadToSupabase } = require("../utils/supabaseUpload");

const skillService = {
  //Get all available skills
  getAllSkills: async () => {
    const { data: skills, error } = await supabase
      .from("skills")
      .select("id,name,icon_url,created_at,is_default")
      .eq("is_default", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch skills: ${error.message}`);
    }

    return skills;
  },

  //Create new custom skill
  createSkill: async (name, iconFile, is_default) => {
    //Check if skill with same name already exists
    const { data: existsingSkill } = await supabase
      .from("skills")
      .select("id")
      .eq("name", name)
      .single();

    if (existsingSkill) {
      throw new Error(" A skill with this name already exists");
    }

    //Upload icon to Supabase storage
    const iconurl = await uploadToSupabase(iconFile, "avatars");
    //Insert skill into database
    const { data: newSkill, error } = await supabase
      .from("skills")
      .insert([{ name, icon_url: iconurl, is_default }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create skill: ${error.message}`);
    }

    return newSkill;
  },

  // Add selected skills to User's skills
  addUserSkills: async (userId, skills) => {
    //Generate random proficiency level (1-5)
    console.log("ayo", skills);
    const userSkillsData = skills.map((skill) => ({
      user_id: userId,
      skill_id: skill.skill_id,
      role: skill.role,
      proficiency_level: skill.is_default
        ? Math.floor(Math.random() * 5) + 1
        : skill.proficiency_level,
      is_favorite: false,
    }));

    const { data: addedSkills, error } = await supabase
      .from("user_skills")
      .insert(userSkillsData)
      .select(
        `id, role, proficiency_level, is_favorite, skills (id, name, icon_url)`,
      );

    if (error) {
      throw new Error(`Failed to add skills: ${error.message}`);
    }

    return addedSkills;
  },

  // Get user's selected skills
  getUserSkills: async (userId) => {
    const { data: userSkills, error } = await supabase
      .from("user_skills")
      .select(
        `
        id,
        role,
        proficiency_level,
        is_favorite,
        created_at,
        skills (id, name, icon_url)
      `,
      )
      .eq("user_id", userId);

    if (error) {
      throw new error(`Failed to fetch user skills: ${error.message}`);
    }

    return userSkills;
  },
};
module.exports = skillService;

/*
1-getAllSkills selects all pre-populated skills from the database.
2-createSkill allows the user to create a new skill , unless one exists with the 
same name.
3-addUserSkills subscribes a user to the selected skills. Adds a random proficiency level to those
that are default, and keeps the custom-created one's null.
4-getUserSkills selects and retrieves all of a user's subscribed skills.
*/
