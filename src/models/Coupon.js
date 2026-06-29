const mongoose = require("mongoose");

/**
 * Coupon Schema
 * مدل کد تخفیف
 */
const couponSchema = new mongoose.Schema(
  {
    /**
     * کد تخفیف
     */
    code: {
      type: String,

      required: true,

      unique: true,

      trim: true,

      uppercase: true,
    },

    /**
     * درصد تخفیف
     */
    discountPercentage: {
      type: Number,

      required: true,

      min: 1,

      max: 100,
    },

    /**
     * تاریخ انقضا
     */
    expiresAt: {
      type: Date,

      required: true,
    },

    /**
     * تعداد دفعات مجاز استفاده
     */
    usageLimit: {
      type: Number,

      required: true,

      min: 1,
    },

    /**
     * تعداد دفعات استفاده شده
     */
    usedCount: {
      type: Number,

      default: 0,
    },

    /**
     * وضعیت فعال بودن
     */
    isActive: {
      type: Boolean,

      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Coupon", couponSchema);
