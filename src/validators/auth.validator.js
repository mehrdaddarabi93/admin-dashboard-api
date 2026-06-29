const Joi = require("joi");

/**
 * Schema اعتبارسنجی ثبت نام کاربر
 *
 * @example
 * {
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "123456"
 * }
 */
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).max(30).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "Password is required",
  }),
});

/**
 * Schema اعتبارسنجی ورود کاربر
 *
 * @example
 * {
 *   email: "john@example.com",
 *   password: "123456"
 * }
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

/**
 * Schema اعتبارسنجی ساخت کاربر با نقش دلخواه (مخصوص chiefadmin)
 *
 * @example
 * {
 *   name: "Sara Ahmadi",
 *   email: "sara@example.com",
 *   password: "123456",
 *   role: "editor"
 * }
 */
const createUserWithRoleSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).max(30).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "Password is required",
  }),

  role: Joi.string()
    .valid("user", "support", "editor", "admin", "chiefadmin")
    .required()
    .messages({
      "string.base": "Role must be a string",
      "any.only":
        "Role must be one of: user, support, editor, admin, chiefadmin",
      "any.required": "Role is required",
    }),
});
/**
 * اعتبارسنجی درخواست بازیابی رمز عبور
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
});

/**
 * اعتبارسنجی تنظیم رمز عبور جدید
 */
const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).max(30).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "Password is required",
  }),
});

/**
 * اعتبارسنجی تغییر رمز عبور
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
    "any.required": "Current password is required",
  }),

  newPassword: Joi.string().min(6).max(30).required().messages({
    "string.base": "New password must be a string",
    "string.empty": "New password is required",
    "string.min": "New password must be at least 6 characters",
    "string.max": "New password cannot exceed 30 characters",
    "any.required": "New password is required",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  createUserWithRoleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
