/* This file is to validate data being sent by forms during register,
login, and completion of profile */
const Joi = require("joi");

//This schema is for registration
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

//This schema is for Login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

//This schema is for profile creation
const profileSchema = Joi.object({
  nick_name: Joi.string().max(50).optional().allow(""),
  gender: Joi.string().valid("male", "female").required().messages({
    "any.only": "Gender must be either male or female",
    "any.required": "Gender is required",
  }),
  education_level: Joi.string()
    .valid(
      "Elementary",
      "High school",
      "Bachelor's degree",
      "Master's degree or higher",
    )
    .required()
    .messages({
      "any.required": "Education level is required",
    }),
  biography: Joi.string().optional().allow(""),
});

//This schema is for SKill creation
const createSKillSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Skill name must be at least 2 characters",
    "string.max": "Skill name cannot exceed 100 characters",
    "any.required": "Skill name is required",
  }),
  is_default: Joi.boolean().required(),
  // Note: icon/image will be handled by multer middleware for file upload
});

//This schema is for forgot password
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
});

// This schema is for reset Password
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  password: Joi.string().min(8).messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
});

// Thgis schema is for creating a group
const createGroupSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.min": "Group name must be at least 3 characters",
    "string.max": "Group name cannot exceed 255 characters",
    "any.required": "Group name is required",
  }),
  description: Joi.string().min(10).required().messages({
    "string.min": "Description must be at least 10 characters",
    "any.required": "Description is required",
  }),
  skill_id: Joi.string().uuid().required().messages({
    "string.guid": "Invalid skill ID format",
    "any.required": "Skill ID is required",
  }),
  difficulty_level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .required()
    .messages({
      "any.only": "Difficult must be beginner, intermediate, or advanced.",
      "any.required": "Difficult is required",
    }),
  visibility: Joi.string()
    .valid("public", "private")
    .default("private")
    .messages({
      "any.only": "Visibility must be public or private.",
    }),
  max_participants: Joi.number().integer().min(2).max(50).required().messages({
    "number.min": "Group must allow at least 2 participants",
    "number.max": "Group cannot exceed 50 participants",
    "any.required": "Maximum participants is required",
  }),
});

//This schema is to update group information
const updateGroupSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  description: Joi.string().min(10).optional(),
  difficulty_level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .optional(),
  visibility: Joi.string().valid("public", "private").optional(),
  max_participants: Joi.number().integer().min(2).max(50).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

// This schema is to validate Notification data
const notificationSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.min": "Title should be at least 3 characters",
    "string.max": "Title Cannot exceed 100 characters",
    "any.required": "Title is required",
  }),
  message: Joi.string().min(3).max(255).required().messages({
    "string.min": "Message should be at least 3 characters",
    "string.max": "Message Cannot exceed 255 characters",
    "any.required": "Message is required",
  }),
});

module.exports = {
  registerSchema,
  profileSchema,
  loginSchema,
  createSKillSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createGroupSchema,
  updateGroupSchema,
  notificationSchema,
};

/*
1- Joi is JavaScript library used for data validation.
2- We have three schemas, for signup, login, and completion of profiles.
3- Custom messages are delivered in case any of the validation rules is breached and not met.
4- Icon/image file uploads will be handled by multer middleware
*/
