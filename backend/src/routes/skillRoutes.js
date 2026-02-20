const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillController");
const authenticate = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { createSKillSchema } = require("../utils/validators");
const upload = require("../utils/fileUpload");

//Routes
router.use(authenticate);

// GET /api/skills - Get all pre-populated skills
router.get("/", skillController.getAllSkills);

// POST /api/skills - Create new custom skill (with icon upload)
router.post(
  "/",
  upload.single("icon"),
  validate(createSKillSchema),
  skillController.createSkill,
);

// POST /api/skills/user - Add skills to user profile
router.post("/user", skillController.addUserSkills);

// GET /api/skills/user - Get user's skills
router.get("/user", skillController.getUserSkills);

//GET /api/skills/user/:role - Get user skills by role
router.get("/user/:role", skillController.getUserSkillsByRole);

//PATCH /api/skills/user/:userSkillId/favorite - Toggle favorite
router.patch("/user/:userSkillId/favorite", skillController.toggleFavorite);

//GET /api/skills/user/:role/search - Search user skills
router.get("/user/:role/search", skillController.searchUserSkills);

module.exports = router;

/*
1- Get all pre-populated skills endpoint
2- Create new skill with file upload endpoint
3- Add selected skills to user's profile endpoint
4- Get user's current skills endpoint
*/
