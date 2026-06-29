const Joi = require("joi");

/**
 * اعتبارسنجی ایجاد محصول
 *
 * @example
 * {
 *   title: "iPhone 15",
 *   slug: "iphone-15",
 *   description: "Apple smartphone",
 *   price: 1000,
 *   stock: 10,
 *   category: "64f..."
 * }
 */
const createProductSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title is required",
    "string.min": "Title must be at least 2 characters",
    "string.max": "Title cannot exceed 200 characters",
    "any.required": "Title is required",
  }),

  slug: Joi.string().trim().lowercase().required().messages({
    "string.base": "Slug must be a string",
    "string.empty": "Slug is required",
    "any.required": "Slug is required",
  }),

  description: Joi.string().allow("").messages({
    "string.base": "Description must be a string",
  }),

  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Price is required",
  }),

  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),

  category: Joi.string().required().messages({
    "string.base": "Category must be a string",
    "any.required": "Category is required",
  }),
});

/**
 * اعتبارسنجی بروزرسانی محصول
 *
 * حداقل یکی از فیلدها باید ارسال شود
 */
const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).messages({
    "string.base": "Title must be a string",
    "string.min": "Title must be at least 2 characters",
  }),

  slug: Joi.string().trim().lowercase().messages({
    "string.base": "Slug must be a string",
  }),

  description: Joi.string().allow(""),

  price: Joi.number().min(0).messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
  }),

  stock: Joi.number().integer().min(0).messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
  }),

  category: Joi.string(),

  isActive: Joi.boolean().messages({
    "boolean.base": "isActive must be true or false",
  }),
}).min(1);

module.exports = {
  createProductSchema,
  updateProductSchema,
};
