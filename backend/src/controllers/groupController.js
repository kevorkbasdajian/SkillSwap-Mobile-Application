// This controller is to create new group, get groups for learner, get created groups by a teacher, get all groups, get group details, and join a group

const groupService = require("../services/groupService");

const groupController = {
  //Create new group
  createGroup: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const coverImageFile = req.file;

      const newGroup = await groupService.createGroup(
        userId,
        req.validatedData,
        coverImageFile,
      );
      res.status(201).json({
        success: true,
        message: "Group created successfully",
        data: newGroup,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get available groups for learner (filtered by skill and proficiency)
  getAvailableGroupsForLearner: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { skillId } = req.params;

      const groups = await groupService.getAvailableGroupsForLearner(
        userId,
        skillId,
      );
      res.status(200).json({
        success: true,
        message: "Groups retained successfully",
        count: groups.length,
        data: groups,
      });
    } catch (error) {
      next(error);
    }
  },

  //Get teacher's own groups for a skill
  getTeacherGroups: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { skillId } = req.params;

      const groups = await groupService.getTeacherGroups(userId, skillId);
      res.status(200).json({
        success: true,
        message: "Groups retained successfully",
        count: groups.length,
        data: groups,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get group details (preview page)
  getGroupDetails: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const group = await groupService.getGroupDetails(groupId, userId);
      res.status(200).json({
        success: true,
        message: "Details retrieved successfully",
        data: group,
      });
    } catch (error) {
      next(error);
    }
  },

  //Get all groups by role
  getMyGroups: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { role } = req.params;
      if (!["teacher", "learner"].includes(role)) {
        return res.status(400).json({
          error: "Role must be either teacher or learner",
        });
      }
      const groups = await groupService.getMyGroups(userId, role);

      res.status(200).json({
        success: true,
        message: "Groups retained successfully",
        count: groups.length,
        data: groups,
      });
    } catch (error) {
      next(error);
    }
  },

  // Request to join group
  joinGroup: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const membership = await groupService.joinGroup(userId, groupId);

      res.status(201).json({
        success: true,
        message: "Join request sent. Waiting for teacher approval.",
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  },

  // Approve request (teacher only)
  approveMember: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId, memberId } = req.params;

      const data = await groupService.approveMember(userId, groupId, memberId);

      res.status(200).json({
        success: true,
        message: "Request approved. User is a member now.",
        data: data,
      });
    } catch (error) {
      next(error);
    }
  },

  // Reject request (teacher only)
  rejectMember: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId, memberId } = req.params;

      const data = await groupService.rejectMember(userId, groupId, memberId);

      res.status(200).json({
        success: true,
        message: " Request to join rejected.",
        data: data,
      });
    } catch (error) {
      next(error);
    }
  },

  // leave a group (student only)
  leaveGroup: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const message = await groupService.leaveGroup(userId, groupId);
      res.status(200).json({
        success: true,
        message: message.message,
      });
    } catch (error) {
      next(error);
    }
  },

  //Update a group (teacher only)
  updateGroup: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;
      const updatedData = req.validatedData;
      const coverimagefile = req.file;

      const updatedGroup = await groupService.updateGroup(
        userId,
        groupId,
        updatedData,
        coverimagefile,
      );
      res.status(200).json({
        success: true,
        message: "Group updated successfullly",
        data: updatedGroup,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a group
  deleteGroup: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const message = await groupService.deleteGroup(userId, groupId);
      res.status(200).json({
        success: true,
        message: message.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user skill info
  getUserSkillInfo: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { userSkillId } = req.params;

      const skillInfo = await groupService.getUserSkillInfo(
        userId,
        userSkillId,
      );

      res.status(200).json({
        success: true,
        data: skillInfo,
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = groupController;
