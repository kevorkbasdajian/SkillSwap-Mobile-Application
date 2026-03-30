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

//This schema is for profile update
const profileSchema = Joi.object({
  nick_name: Joi.string().max(50).optional().allow(""),
  gender: Joi.string().valid("male", "female").optional().messages({
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
    .optional()
    .messages({
      "any.required": "Education level is required",
    }),
  biography: Joi.string().optional().allow(""),
  date_of_birth: Joi.date().max("now").optional(),
});

//This schema is for profile completion
const completeProfileSchema = Joi.object({
  nick_name: Joi.string().max(50).min(2).required().messages({
    "string.min": "Nick Name must be minimum 2 characters",
    "string.max": "String cannot exceed 50 characters",
    "any.required": "Nick Name is required",
  }),
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
  date_of_birth: Joi.date().max("now").required().messages({
    "any.max": "Date cannot exceed present date",
    "any.required": "Date of Birth is required",
  }),

  skills_to_learn: Joi.array()
    .items(
      Joi.object({
        skill_id: Joi.string().required(),
        is_default: Joi.boolean().required(),
        proficiency_level: Joi.number().optional(),
      }),
    )
    .min(2)
    .required()
    .messages({
      "array.min": "You must select at least 2 skills to learn",
      "any.required": "Skills to learn are required",
    }),

  skills_to_teach: Joi.array()
    .items(
      Joi.object({
        skill_id: Joi.string().required(),
        is_default: Joi.boolean().required(),
        proficiency_level: Joi.number().optional(),
      }),
    )
    .min(2)
    .required()
    .messages({
      "array.min": "You must select at least 2 skills to teach",
      "any.required": "Skills to teach are required",
    }),
});

//This schema is for Skill creation
const createSKillSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Skill name must be at least 2 characters",
    "string.max": "Skill name cannot exceed 100 characters",
    "any.required": "Skill name is required",
  }),
  is_default: Joi.boolean().default(false),
  icon_url: Joi.string().required().messages({
    "any.required": "Skill Icon is required",
  }),
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

// This schema is to validate Session data
const createSessionSchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    "string.min": "Session title must be at least 3 characters",
    "string.max": "Session title cannot exceed 255 characters",
    "any.required": "Session title is required",
  }),
  description: Joi.string().min(10).required().messages({
    "string.min": "Description must be at least 10 characters",
    "any.required": "Description is required",
  }),
  session_type: Joi.string()
    .valid("meeting", "review", "practice", "problem_solving")
    .default("meeting")
    .messages({
      "any.only":
        "Session type must be meeting, review, practice, or problem_solving",
    }),
  scheduled_date: Joi.date().iso().min("now").required().messages({
    "date.min": "Session date must be in the future",
    "any.required": "Scheduled date is required",
  }),
  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Start time must be in HH:MM format (e.g., 14:30)",
      "any.required": "Start time is required",
    }),
  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "End time must be in HH:MM format (e.g., 16:30)",
      "any.required": "End time is required",
    }),
});

//This schema is to update a Session
const updateSessionSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().min(10).optional(),
  session_type: Joi.string()
    .valid("meeting", "review", "practice", "solving problems")
    .optional(),
  scheduled_date: Joi.date().iso().min("now").optional(),
  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  status: Joi.string().valid("scheduled", "completed", "cancelled").optional(),
});

// This schema is to validate chat messages
const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required().messages({
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 5000 characters",
    "any.required": "Message content is required",
  }),
  reply_to_message_id: Joi.string().uuid().optional().allow(null),
});

//This schema is to create a Poll
const createPollSchema = Joi.object({
  question: Joi.string().min(5).max(500).required().messages({
    "string.min": "Question must be at least 5 characters",
    "string.max": "Question cannot exceed 500 characters",
    "any.required": "Poll question is required",
  }),
  options: Joi.array()
    .items(Joi.string().min(1).max(255))
    .min(2)
    .max(10)
    .required()
    .messages({
      "array.min": "Poll must have at least 2 options",
      "array.max": "Poll cannot have more than 10 options",
      "any.required": "Poll options are required",
    }),
  allow_multiple_answers: Joi.boolean().default(false),
  expires_at: Joi.date().iso().min("now").optional().allow(null),
});

// This schema is to validate poll answer
const votePollSchema = Joi.object({
  option_ids: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      "array.min": "You must select at least one option",
      "any.required": "Vote options are required",
    }),
});

//This schema is to ask valid questions
const askQuestionSchema = Joi.object({
  question: Joi.string().min(5).max(1000).required().messages({
    "string.min": "Question must be at least 5 characters",
    "string.max": "Question cannot exceed 1000 characters",
    "any.required": "Question is required",
  }),
});

module.exports = {
  registerSchema,
  profileSchema,
  completeProfileSchema,
  loginSchema,
  createSKillSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createGroupSchema,
  updateGroupSchema,
  notificationSchema,
  createSessionSchema,
  updateSessionSchema,
  sendMessageSchema,
  createPollSchema,
  votePollSchema,
  askQuestionSchema,
};

/*
1- Joi is JavaScript library used for data validation.
2- We have three schemas, for signup, login, and completion of profiles.
3- Custom messages are delivered in case any of the validation rules is breached and not met.
4- Icon/image file uploads will be handled by multer middleware
*/
