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
router.get(
  "/skills/:skillId/learner-groups",
  groupController.getAvailableGroupsForLearner,
);
router.get("/skills/:skillId/teacher-groups", groupController.getTeacherGroups);

// Group management
router.post(
  "/",
  upload.single("cover_image"),
  validate(createGroupSchema),
  groupController.createGroup,
);
router.get("/my-groups/:role", groupController.getMyGroups);
router.get("/:groupId", groupController.getGroupDetails);
router.put(
  "/:groupId",
  upload.single("cover_image"),
  validate(updateGroupSchema),
  groupController.updateGroup,
);
router.delete("/:groupId", groupController.deleteGroup);

// Group membership
router.post("/:groupId/join", groupController.joinGroup);
router.patch(
  "/:groupId/members/:memberId/approve",
  groupController.approveMember,
);
router.patch(
  "/:groupId/members/:memberId/reject",
  groupController.rejectMember,
);
router.delete("/:groupId/leave", groupController.leaveGroup);

module.exports = router;
