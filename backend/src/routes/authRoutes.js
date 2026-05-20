//This file is to route the main endpoints for registration and login.
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../utils/validators");

// POST /api/auth/register
router.post("/register", validate(registerSchema), authController.register);

// POST /api/auth/login
router.post("/login", validate(loginSchema), authController.login);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

// GET /api/auth/verify-reset-token?token=xxx
router.get("/verify-reset-token", authController.verifyResetToken);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

module.exports = router;

/*
1- we create a router, which handles 'register', 'login','forgot-password request', and 'reset-password-request'.
*/
