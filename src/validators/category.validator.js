const Joi = require("joi");

/**
 * اعتبارسنجی ایجاد دسته‌بندی
 *
 * @example
 * {
 *   title: "Mobile",
 *   slug: "mobile",
 *   description: "All mobile products"
 * }
 */
const createCategorySchema = Joi.object({
  title: Joi.string().min(2).max(100).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title is required",
    "string.min": "Title must be at least 2 characters",
    "string.max": "Title cannot exceed 100 characters",
    "any.required": "Title is required",
  }),

  slug: Joi.string().min(2).max(100).required().lowercase().messages({
    "string.base": "Slug must be a string",
    "string.empty": "Slug is required",
    "string.min": "Slug must be at least 2 characters",
    "string.max": "Slug cannot exceed 100 characters",
    "any.required": "Slug is required",
  }),

  description: Joi.string().allow("").messages({
    "string.base": "Description must be a string",
  }),
});

/**
 * اعتبارسنجی بروزرسانی دسته‌بندی
 *
 * حداقل یکی از فیلدها باید ارسال شود
 */
const updateCategorySchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).messages({
    "string.base": "Title must be a string",
    "string.min": "Title must be at least 2 characters",
    "string.max": "Title cannot exceed 100 characters",
  }),

  slug: Joi.string().trim().lowercase().messages({
    "string.base": "Slug must be a string",
  }),

  description: Joi.string().allow("").messages({
    "string.base": "Description must be a string",
  }),

  isActive: Joi.boolean().messages({
    "boolean.base": "isActive must be true or false",
  }),
}).min(1);

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
