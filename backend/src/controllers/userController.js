//This controller is to handle the requests of getting a user profile and updating a profile.
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
};
module.exports = userController;

/*
1- The first part of the controller sends the id of the user to the service to
fetch the profile of the user.
2- The second part of the controller sends the id and the data that will be used
to update the profile of a user.

*/
