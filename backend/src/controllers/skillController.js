/*This controller is used to Get default skills, Create new skills, Subsribe
to selected skills, and Retrieve user-subscribed skills.Moreover, it gets user skills by role, 
toggles skill as favorite/unfavorite, and searches skills by user role.
*/
const skillService = require("../services/skillService");

const skillController = {
  //Get all default skills
  getAllSkills: async (req, res, next) => {
    try {
      const skills = await skillService.getAllSkills();
      res.status(200).json({
        success: true,
        message: "All pre-populated skills fetched successfully",
        count: skills.length,
        data: skills,
      });
    } catch (error) {
      next(error);
    }
  },

  //Create new custom skill
  createSkill: async (req, res, next) => {
    try {
      const { name } = req.body;
      const iconFile = req.file;
      if (!iconFile) {
        return res.status(400).json({
          error: "Skill icon is required",
        });
      }
      const newskill = await skillService.createSkill(name, iconFile, false);

      res.status(201).json({
        success: true,
        message: "Skill created successfully",
        data: newskill,
      });
    } catch (error) {
      next(error);
    }
  },

  //Add skills to user profile
  addUserSkills: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { skills } = req.body;
      const addedSkills = await skillService.addUserSkills(userId, skills);
      res.status(201).json({
        success: true,
        message: "Skills added to user's profile successfully",
        data: addedSkills,
      });
    } catch (error) {
      next(error);
    }
  },

  //Get current user's skills
  getUserSkills: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userSkills = await skillService.getUserSkills(userId);

      res.status(200).json({
        success: true,
        message: "Retrieved user's skills successfully",
        data: userSkills,
      });
    } catch (error) {
      next(error);
    }
  },

  //Get user skills by role (teacher or learner)
  getUserSkillsByRole: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { role } = req.params;
      if (!["teacher", "learner"].includes(role)) {
        return res.status(400).json({
          error: "Role must be either teacher or learner",
        });
      }
      const skills = await skillService.getUserSkillsByRole(userId, role);
      res.status(200).json({
        success: true,
        role,
        message: "Skills retrieved successfully",
        data: skills,
      });
    } catch (error) {
      next(error);
    }
  },

  //Toggle favorite status
  toggleFavorite: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { userSkillId } = req.params;

      const updatedSkill = await skillService.toggleFavorite(
        userId,
        userSkillId,
      );

      res.status(200).json({
        success: true,
        message: `Skill : ${updatedSkill.is_favorite ? "added to" : "removed from"} favorites`,
        data: updatedSkill,
      });
    } catch (error) {
      next(error);
    }
  },

  //Search user skills
  searchUserSkills: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { role } = req.params;
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          error: "Search query is required",
        });
      }
      if (!["teacher", "learner"].includes(role)) {
        return res.status(400).json({
          error: "Role must be either teacher or learner",
        });
      }
      const skills = await skillService.searchUserSkills(
        userId,
        role,
        q.trim(),
      );
      res.status(200).json({
        success: true,
        message: `${skills.length > 0 ? "Skills searched successfully" : "No skills matched to search query"}`,
        query: q,
        data: skills,
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = skillController;

/*
1-getAllSkills simply gets all pre-populated skills
2-createSkill gets the name of the skill, the filename associated with it, and creates a skill
with is_default column having a false value.
3-addUserSkill gtes the userId from the req.user.id after authentication check is done, gets the 
skills selected, and adds them to the user's profile.
4-getUserSkills gets the user's id and retrieves the user subscribed skills.
5-getUserSkillsByRole: Select user skills by role.
6-toggleFavorite: Toggle a user skill as favorite or not.
7-searchUserSkills: Search user skills by name.
*/
