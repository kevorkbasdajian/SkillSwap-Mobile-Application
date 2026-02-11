//This file is to route the main endpoints for registration and login.
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const { registerSchema, loginSchema } = require("../utils/validators");

//POST /api/auth/register
router.post("/register", validate(registerSchema), authController.register);

//POST /api/auth/login
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;

/*
1- we create a router, which handles 'register' and 'login'.
*/
