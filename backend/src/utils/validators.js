/* This file is to validate data being sent by forms during register,
login, or completion of profile */
const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
  full_name: Joi.string().min(2).max(255).required().messages({
    "string.min": "Full name must be at least 2 characters",
    "any.required": "Full name is required",
  }),
});

const profileSchema = Joi.object({
  nick_name: Joi.string().max(50).optional().allow(""),
  gender: Joi.string().valid("male", "female").required().messages({
    "any.only": "Gender must be either male or female",
    "any.required": "Gender is required",
  }),
  education_level: Joi.string()
    .valid(
      "Elementary, High school, Bachelor's degree , Master's degree or higher",
    )
    .required()
    .messages({
      "any.required": "Education level is required",
    }),
  biography: Joi.string().optional().allow(""),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

module.exports = { registerSchema, profileSchema, loginSchema };

/*
1- Joi is JavaScript library used for data validation.
2- We have three schemas, for signup, login, and completion of profiles.
3- Custom messages are delivered in case any of the validation rules is breached and not met.
*/
