const mongoose = require("mongoose");

/**
 * Category Schema
 *
 * این مدل برای مدیریت دسته‌بندی‌های محصولات استفاده می‌شود.
 *
 * ویژگی‌ها:
 * - عنوان دسته‌بندی (title)
 * - slug یکتا برای URL
 * - توضیحات اختیاری
 * - وضعیت فعال/غیرفعال
 *
 * @model Category
 */
const categorySchema = new mongoose.Schema(
  {
    /**
     * عنوان دسته‌بندی
     *
     * نام قابل نمایش برای کاربر
     * مثال:
     * - Mobile
     * - Laptop
     * - Camera
     */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * شناسه یکتا (URL Friendly)
     *
     * برای استفاده در URL ها:
     * مثال:
     * /categories/mobile
     * /categories/laptop
     */
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /**
     * توضیحات دسته‌بندی
     *
     * اختیاری - برای SEO یا توضیح بیشتر
     */
    description: {
      type: String,
      default: "",
      trim: true,
    },

    /**
     * وضعیت فعال بودن دسته‌بندی
     *
     * اگر false باشد در لیست عمومی نمایش داده نمی‌شود
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    /**
     * ایجاد createdAt و updatedAt
     */
    timestamps: true,
  },
);

module.exports = mongoose.model("Category", categorySchema);
