//This router registers the endpoints for GETing and PUTting a profile
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { profileSchema } = require("../utils/validators");

//All routes require authentication
router.use(authenticate);

// GET /api/users/profile - Get current user profile
router.get("/profile", userController.getProfile);

// PUT /api/users/profile - Update current user profile
router.put("/profile", validate(profileSchema), userController.updateProfile);

module.exports = router;

/*
1- register the GET endpoint at '/profile'
2- register the PUT endpoint at '/profile'

*/
