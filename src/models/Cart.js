const mongoose = require("mongoose");

/**
 * آیتم‌های سبد خرید
 */
const cartItemSchema = new mongoose.Schema(
  {
    /**
     * محصول
     */
    product: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Product",

      required: true,
    },

    /**
     * تعداد محصول
     */
    quantity: {
      type: Number,

      required: true,

      min: 1,

      default: 1,
    },
  },
  {
    _id: false,
  },
);

/**
 * مدل سبد خرید
 *
 * هر کاربر فقط یک سبد خرید دارد.
 */
const cartSchema = new mongoose.Schema(
  {
    /**
     * مالک سبد خرید
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,
    },

    /**
     * آیتم‌های سبد خرید
     */
    items: {
      type: [cartItemSchema],

      default: [],
    },

    /**
     * کوپن اعمال شده
     */
    coupon: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Coupon",

      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Cart", cartSchema);
