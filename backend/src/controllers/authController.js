// This file is to handle register and login requests, as well as forgot and reset password requests.
const authService = require("../services/authService");
const passwordResetService = require("../services/passwordResetService");
const authController = {
  register: async (req, res, next) => {
    try {
      const result = await authService.register(req.validatedData);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      const { email, password } = req.validatedData;
      const result = await authService.login(email, password);
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.validatedData;
      const result = await passwordResetService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  verifyResetToken: async (req, res, next) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({
          error: "Reset token is required",
        });
      }
      await passwordResetService.verifyResetToken(token);

      return res.status(200).json({
        success: true,
        message: "Token is valid",
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { token, password } = req.validatedData;
      const result = await passwordResetService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};
module.exports = authController;

/*
1- the first part handles registration and the second part handles login.
*/
