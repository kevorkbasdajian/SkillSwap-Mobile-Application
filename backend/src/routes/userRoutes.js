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

// GET /api/users/search - Search users
router.get("/search", userController.searchUsers);

// GET /api/users/recent-searches - Get user's recent searches
router.get("/recent-searches", userController.getRecentSearches);

// POST /api/users/recent-searches/:userId - Add a new recent search
router.post("/recent-searches/:userId", userController.saveRecentSearch);

//DELETE /api/users/recent-searches/:userId - Delete a recent search
router.delete("/recent-searches/:userId", userController.removeRecentSearch);

//DELETE /api/users/recent-searches - Delete all recent searches
router.delete("/recent-searches", userController.clearRecentSearches);

// GET /api/users/:userId/profile - Get a public profile
router.get("/:userId/profile", userController.getPublicProfile);

module.exports = router;

/*
1- register the GET endpoint at '/profile'
2- register the PUT endpoint at '/profile'

*/
