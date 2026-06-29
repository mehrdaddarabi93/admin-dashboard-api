const Joi = require("joi");

/**
 * اعتبارسنجی ساخت کوپن جدید
 */
const createCouponSchema = Joi.object({
  code: Joi.string().min(2).max(50).required().messages({
    "string.base": "Coupon code must be a string",
    "string.empty": "Coupon code is required",
    "string.min": "Coupon code must be at least 2 characters",
    "string.max": "Coupon code cannot exceed 50 characters",
    "any.required": "Coupon code is required",
  }),

  discountPercentage: Joi.number().min(1).max(100).required().messages({
    "number.base": "Discount percentage must be a number",
    "number.min": "Discount percentage must be at least 1",
    "number.max": "Discount percentage cannot exceed 100",
    "any.required": "Discount percentage is required",
  }),

  expiresAt: Joi.date().greater("now").required().messages({
    "date.base": "Expiry date must be a valid date",
    "date.greater": "Expiry date must be in the future",
    "any.required": "Expiry date is required",
  }),

  usageLimit: Joi.number().integer().min(1).required().messages({
    "number.base": "Usage limit must be a number",
    "number.integer": "Usage limit must be an integer",
    "number.min": "Usage limit must be at least 1",
    "any.required": "Usage limit is required",
  }),
});

/**
 * اعتبارسنجی بروزرسانی کوپن
 * code در اینجا مجاز نیست — service آن را حذف می‌کند ولی
 * بهتر است در validator هم reject شود تا پیام واضح‌تری بدهیم
 */
const updateCouponSchema = Joi.object({
  discountPercentage: Joi.number().min(1).max(100).messages({
    "number.min": "Discount percentage must be at least 1",
    "number.max": "Discount percentage cannot exceed 100",
  }),

  expiresAt: Joi.date().greater("now").messages({
    "date.greater": "Expiry date must be in the future",
  }),

  usageLimit: Joi.number().integer().min(1).messages({
    "number.min": "Usage limit must be at least 1",
  }),

  isActive: Joi.boolean(),
});

module.exports = { createCouponSchema, updateCouponSchema };
