/*This controller is to handle the requests of getting a user profile and updating a profile. Furthermore
 the controller searches users, manipulates recent searches( adds, removes, clears, fetches) and handles the profile
 view of a user.*/
const userSearchService = require("../services/userSearchService");
const userService = require("../services/userService");

const userController = {
  //Get current user profile
  getProfile: async (req, res, next) => {
    try {
      const user = await userService.getUserProfile(req.user.id);
      res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  //Update current user profile
  updateProfile: async (req, res, next) => {
    try {
      const updatedUser = await userService.updateUserProfile(
        req.user.id,
        req.validatedData,
        req?.file,
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  completeUserProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const data = req.validatedData;
      const file = req.file;
      if (file) {
        console.log("File is in the controller");
      }

      const profile = await userService.completeUserProfile(userId, data, file);

      res.status(200).json({
        success: true,
        message: "Profile Completed Successfully",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  },
  //Search users
  searchUsers: async (req, res, next) => {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const users = await userSearchService.searchUsers(req.user.id, q.trim());
      res.status(200).json({
        success: true,
        message: "Users searched successfully",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  //Get recent searches of a user
  getRecentSearches: async (req, res, next) => {
    try {
      const searches = await userSearchService.getRecentSearches(req.user.id);
      return res.status(200).json({
        success: true,
        message: "Recent searches retrieved successfully",
        data: searches,
      });
    } catch (error) {
      next(error);
    }
  },

  // Save recent search
  saveRecentSearch: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const data = await userSearchService.saveRecentSearch(
        req.user.id,
        userId,
      );
      res.status(200).json({
        success: true,
        message: "Recent search saved",
        data: data,
      });
    } catch (error) {
      next(error);
    }
  },

  //Remove one recent search
  removeRecentSearch: async (req, res, next) => {
    try {
      const { userId } = req.params;
      await userSearchService.removeRecentSearch(req.user.id, userId);
      res.status(200).json({
        success: true,
        message: "Recent search removed",
      });
    } catch (error) {
      next(error);
    }
  },

  //Clear all recent searches
  clearRecentSearches: async (req, res, next) => {
    try {
      await userSearchService.clearRecentSearches(req.user.id);
      res.status(200).json({
        success: true,
        message: "Recent searches cleared",
      });
    } catch (error) {
      next(error);
    }
  },

  //Get another user's public profile
  getPublicProfile: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const profile = await userService.getPublicProfile(req.user.id, userId);
      return res.status(200).json({
        success: true,
        message: `Public profile of user: ${profile.full_name} fetched successfully`,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  },
  getUserSettings: async (req, res, next) => {
    try {
      const UserSettings = await userService.getUserSettings(req.user.id);
      return res.status(200).json({
        success: true,
        message: "Settings retrieved successfully",
        data: UserSettings,
      });
    } catch (error) {
      next(error);
    }
  },
  updateSettings: async (req, res, next) => {
    try {
      const { option, value } = req.body;
      const userId = req.user.id;
      await userService.updateSettings(userId, option, value);
      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  },
  deleteUserAccount: async (req, res, next) => {
    try {
      const message = await userService.deleteUserAccount(req.user.id);
      return res.status(200).json({
        sucess: true,
        message: message,
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = userController;

/*
1- The first part of the controller sends the id of the user to the service to
fetch the profile of the user.
2- The second part of the controller sends the id and the data that will be used
to update the profile of a user.
3- searchUsers: search a user.
4- getRecentSearches: get the recent searches of a user.
5- saveRecentSearch: saves the search of a user once clicked on it
6- removeRecentSearch: remove a user's one recent search.
7- clearRecentSearches: Clear a user's recent searches.
8-getPublicProfile: Get another user's public profile.
9-completeUserProfile: Complete the profile of a user.

*/
