const couponService = require("../services/coupon.service");

const asyncHandler = require("../utils/asyncHandler");

/**
 * ایجاد کد تخفیف
 *
 * @route POST /api/coupons
 * @access Admin
 */
exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);

  res.status(201).json({
    success: true,

    message: "Coupon created successfully",

    data: coupon,
  });
});

/**
 * دریافت تمام کدهای تخفیف
 *
 * @route GET /api/coupons
 * @access Admin
 */
exports.getCoupons = asyncHandler(async (req, res) => {
  const result = await couponService.getCoupons(req.query);

  res.status(200).json({
    success: true,

    data: result,
  });
});

/**
 * دریافت یک کد تخفیف
 *
 * @route GET /api/coupons/:id
 * @access Admin
 */
exports.getCouponById = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);

  res.status(200).json({
    success: true,

    data: coupon,
  });
});

/**
 * بروزرسانی کد تخفیف
 *
 * @route PATCH /api/coupons/:id
 * @access Admin
 */
exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);

  res.status(200).json({
    success: true,

    message: "Coupon updated successfully",

    data: coupon,
  });
});

/**
 * فعال یا غیرفعال کردن کد تخفیف
 *
 * @route PATCH /api/coupons/:id/toggle-status
 * @access Admin
 */
exports.toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await couponService.toggleCouponStatus(req.params.id);

  res.status(200).json({
    success: true,

    message: "Coupon status updated successfully",

    data: coupon,
  });
});

/**
 * حذف کد تخفیف
 *
 * @route DELETE /api/coupons/:id
 * @access Admin
 */
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.deleteCoupon(req.params.id);

  res.status(200).json({
    success: true,
    ...result,
  });
});
