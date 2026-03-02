const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const authenticate = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { createGroupSchema, updateGroupSchema } = require("../utils/validators");
const upload = require("../utils/fileUpload");

// All routes require authentication
router.use(authenticate);

// Skill detail page routes
router.get("/user-skill/:userSkillId", groupController.getUserSkillInfo);

// Get available skills for learners
router.get(
  "/skills/:skillId/learner-groups",
  groupController.getAvailableGroupsForLearner,
);

//Get groups created by a teacher
router.get("/skills/:skillId/teacher-groups", groupController.getTeacherGroups);

// create a group
router.post(
  "/",
  upload.single("cover_image"),
  validate(createGroupSchema),
  groupController.createGroup,
);

//Get a user's groups by role
router.get("/my-groups/:role", groupController.getMyGroups);

//Get a groups members
router.get("/:groupId/members", groupController.getGroupMembers);

// Get list of friends of the teacher who are qualified to be invited
router.get(
  "/:groupId/possible-members",
  groupController.getFriendsWithInterest,
);
router.get("/:groupId/search/", groupController.searchPossibleMembers);

//Get a groups detail (preview page before joining)
router.get("/:groupId", groupController.getGroupDetails);

//Update a group (teacher only)
router.put(
  "/:groupId",
  upload.single("cover_image"),
  validate(updateGroupSchema),
  groupController.updateGroup,
);

//Delete a group (teacher only)
router.delete("/:groupId", groupController.deleteGroup);

// Join a group
router.post("/:groupId/join", groupController.joinGroup);

//Approve a request (teacher only)
router.patch(
  "/:groupId/members/:memberId/approve",
  groupController.approveMember,
);

//Reject a request (teacher only)
router.patch(
  "/:groupId/members/:memberId/reject",
  groupController.rejectMember,
);

//Leave a group
router.delete("/:groupId/leave", groupController.leaveGroup);

//Remnove a group member
router.delete("/:groupId/members/:memberId", groupController.removeGroupMember);
module.exports = router;
