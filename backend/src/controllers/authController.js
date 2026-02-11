// This file is to handle register and login requests
const authService = require("../services/authService");

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
};
module.exports = authController;

/*
1- the first part handles registration and the second part handles login.
*/
