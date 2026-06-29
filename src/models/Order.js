const mongoose = require("mongoose");

/**
 * آیتم‌های سفارش
 */
const orderItemSchema = new mongoose.Schema(
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
     * تعداد
     */
    quantity: {
      type: Number,

      required: true,

      min: 1,
    },

    /**
     * قیمت محصول در زمان خرید
     */
    price: {
      type: Number,

      required: true,

      min: 0,
    },
  },
  {
    _id: false,
  },
);

/**
 * مدل سفارش
 */
const orderSchema = new mongoose.Schema(
  {
    /**
     * صاحب سفارش
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
    },

    /**
     * محصولات سفارش
     */
    orderItems: {
      type: [orderItemSchema],

      required: true,

      validate: {
        validator(value) {
          return value.length > 0;
        },

        message: "Order must contain at least one item",
      },
    },

    /**
     * مبلغ کل
     */
    totalPrice: {
      type: Number,

      required: true,

      min: 0,
    },

    /**
     * وضعیت سفارش
     */
    status: {
      type: String,

      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],

      default: "pending",
    },

    /**
     * آدرس ارسال
     */
    shippingAddress: {
      type: String,

      required: true,

      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
