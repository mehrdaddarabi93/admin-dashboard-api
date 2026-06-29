const Coupon = require("../models/Coupon");
const AppError = require("../utils/AppError");
const validateObjectId = require("../utils/validateObjectId");

/**
 * ایجاد کد تخفیف
 *
 * @param {Object} couponData
 *
 * @returns {Object}
 */
const createCoupon = async (couponData) => {
  const { code, discountPercentage, expiresAt, usageLimit } = couponData;

  /**
   * بررسی تکراری نبودن کد
   */
  const existingCoupon = await Coupon.findOne({
    code: code.toUpperCase(),
  });

  if (existingCoupon) {
    throw new AppError("Coupon code already exists", 400);
  }

  /**
   * ایجاد کد تخفیف
   */
  const coupon = await Coupon.create({
    code,
    discountPercentage,
    expiresAt,
    usageLimit,
  });

  return coupon;
};

/**
 * دریافت لیست کدهای تخفیف
 *
 * @param {Object} query
 *
 * @returns {Object}
 */
const getCoupons = async (query) => {
  const page = Number(query.page) || 1;

  const limit = Number(query.limit) || 10;

  const skip = (page - 1) * limit;

  const filter = {};

  /**
   * فیلتر وضعیت فعال
   */
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  /**
   * مرتب‌سازی
   */
  const sort = query.sort || "-createdAt";

  const coupons = await Coupon.find(filter).sort(sort).skip(skip).limit(limit);

  const total = await Coupon.countDocuments(filter);

  return {
    coupons,

    pagination: {
      page,

      limit,

      total,

      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * دریافت یک کد تخفیف
 *
 * @param {String} couponId
 *
 * @returns {Object}
 */
const getCouponById = async (couponId) => {
  /**
   * اعتبارسنجی شناسه
   */
  if (!validateObjectId(couponId)) {
    throw new AppError("Invalid coupon id", 400);
  }

  /**
   * دریافت کد تخفیف
   */
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  return coupon;
};

/**
 * بروزرسانی کد تخفیف
 *
 * @param {String} couponId
 * @param {Object} updateData
 *
 * @returns {Object}
 */
const updateCoupon = async (couponId, updateData) => {
  /**
   * اعتبارسنجی شناسه
   */
  if (!validateObjectId(couponId)) {
    throw new AppError("Invalid coupon id", 400);
  }

  /**
   * جلوگیری از تغییر code
   */
  delete updateData.code;

  /**
   * دریافت کوپن
   */
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  /**
   * بروزرسانی فیلدها
   */
  Object.assign(coupon, updateData);

  await coupon.save();

  return coupon;
};

/**
 * تغییر وضعیت فعال بودن کد تخفیف
 *
 * @param {String} couponId
 *
 * @returns {Object}
 */
const toggleCouponStatus = async (couponId) => {
  /**
   * اعتبارسنجی شناسه
   */
  if (!validateObjectId(couponId)) {
    throw new AppError("Invalid coupon id", 400);
  }

  /**
   * دریافت کوپن
   */
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  /**
   * تغییر وضعیت
   */
  coupon.isActive = !coupon.isActive;

  await coupon.save();

  return coupon;
};

/**
 * حذف کد تخفیف
 *
 * @param {String} couponId
 *
 * @returns {Object}
 */
const deleteCoupon = async (couponId) => {
  /**
   * اعتبارسنجی شناسه
   */
  if (!validateObjectId(couponId)) {
    throw new AppError("Invalid coupon id", 400);
  }

  /**
   * دریافت کوپن
   */
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  /**
   * حذف کوپن
   */
  await coupon.deleteOne();

  return {
    message: "Coupon deleted successfully",
  };
};

module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
};
