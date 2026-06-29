const mongoose = require("mongoose");

/**
 * Product Schema
 */
const productSchema = new mongoose.Schema(
  {
    /**
     * نام محصول
     */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * اسلاگ
     */
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    /**
     * توضیحات
     */
    description: {
      type: String,
      default: "",
    },

    /**
     * قیمت
     */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * موجودی
     */
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * دسته بندی
     */
    category: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Category",

      required: true,
    },

    /**
     * وضعیت
     */
    isActive: {
      type: Boolean,

      default: true,
    },
    /**
     * گالری تصاویر محصول
     */
    images: {
      type: [String],
      default: [],
    },
    /**
     * تصویر اصلی محصول
     */
    mainImage: {
      type: String,
      default: null,
    },
    /**
     * Soft Delete Flag
     */
    isDeleted: {
      type: Boolean,
      default: false,
    },
    variants: [
      {
        title: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        stock: {
          type: Number,
          default: 0,
        },
      },
    ],

    /**
     * نظرات کاربران
     */
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },

        comment: {
          type: String,
          required: true,
          trim: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    /**
     * میانگین امتیاز
     */
    averageRating: {
      type: Number,
      default: 0,
    },
    /**
     * تعداد کل امتیازهای ثبت شده
     */
    ratingsCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  },
);

/**
 * INDEXES (بهینه‌سازی جستجو)
 */

/**
 * جستجوی سریع بر اساس title
 */
productSchema.index({ title: "text" });

/**
 * فیلتر category
 */
productSchema.index({ category: 1 });

/**
 * فیلتر قیمت
 */
productSchema.index({ price: 1 });

/**
 * فیلتر موجودی
 */
productSchema.index({ stock: 1 });

/**
 * فیلتر rating
 */
productSchema.index({ averageRating: 1 });

module.exports = mongoose.model("Product", productSchema);
