const mongoose = require("mongoose");

/**
 * User Schema
 *
 * این مدل برای مدیریت کاربران سیستم استفاده می‌شود.
 *
 * شامل:
 * - اطلاعات پایه کاربر
 * - نقش (Role-Based Access)
 * - وضعیت حساب
 * - احراز هویت (refresh tokens)
 * - علاقه‌مندی‌ها (wishlist)
 *
 * @model User
 */
const userSchema = new mongoose.Schema(
  {
    /**
     * نام کاربر
     */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * ایمیل کاربر (Unique Identifier)
     */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /**
     * رمز عبور (هش شده)
     */
    password: {
      type: String,
      required: true,
      select: false,
    },

    /**
     * نقش کاربر در سیستم (RBAC)
     */
    role: {
      type: String,
      enum: ["user", "support", "editor", "admin", "chiefadmin"],
      default: "user",
      index: true,
    },

    /**
     * وضعیت فعال بودن حساب
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    /**
     * توکن بازیابی رمز عبور (هش‌شده، نه مقدار خام)
     * هرگز توکن خام در دیتابیس ذخیره نمی‌شود؛ دقیقا مثل رمز عبور.
     */
    resetPasswordToken: {
      type: String,
      select: false, // در کوئری‌های عادی برگردانده نشود
    },

    /**
     * زمان انقضای توکن بازیابی رمز عبور
     */
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    /**
     * لیست Refresh Token ها (Multi-device login)
     *
     * ⚠ بهتر است در آینده هش شده و یا در Redis ذخیره شود
     */
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },

    /**
     * لیست علاقه‌مندی‌های کاربر
     */
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    /**
     * تاریخ حذف نرم کاربر (Soft Delete)
     * اگر مقدار داشته باشد، کاربر حذف‌شده محسوب می‌شود.
     * null یعنی کاربر فعال است.
     */
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },

    /**
     * آخرین زمان ورود به سیستم
     * هر بار که کاربر لاگین می‌کند، این فیلد به‌روز می‌شود.
     */
    lastLogin: {
      type: Date,
      default: null,
    },

    /**
     * دلیل حذف کاربر (اختیاری، برای گزارش‌گیری)
     */
    deletedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
