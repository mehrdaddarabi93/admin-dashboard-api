const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ثبت نام کاربر جدید
 *
 * @route POST /api/auth/register
 * @access Public
 *
 * @param {Object} req.body اطلاعات کاربر
 * @param {string} req.body.name نام کاربر
 * @param {string} req.body.email ایمیل کاربر
 * @param {string} req.body.password رمز عبور کاربر
 *
 * @returns {Object} اطلاعات کاربر ایجاد شده
 */
exports.register = asyncHandler(async (req, res) => {
  /**
   * ایجاد حساب کاربری جدید
   */
  const user = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

/**
 * ورود کاربر
 *
 * @route POST /api/auth/login
 * @access Public
 *
 * @param {Object} req.body اطلاعات ورود
 * @param {string} req.body.email ایمیل کاربر
 * @param {string} req.body.password رمز عبور کاربر
 *
 * @returns {Object} اطلاعات کاربر و توکن‌ها
 */
exports.login = asyncHandler(async (req, res) => {
  /**
   * اعتبارسنجی اطلاعات ورود
   * و تولید Access Token و Refresh Token
   */
  const result = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

/**
 * دریافت Access Token جدید
 *
 * @route POST /api/auth/refresh-token
 * @access Public
 *
 * @param {Object} req.body
 * @param {string} req.body.refreshToken رفرش توکن معتبر
 *
 * @returns {Object} Access Token جدید
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  /**
   * استخراج Refresh Token از درخواست
   */
  const { refreshToken } = req.body;

  /**
   * اعتبارسنجی Refresh Token
   * و تولید توکن‌های جدید
   */
  const tokens = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: tokens,
  });
});

/**
 * خروج کاربر از سیستم
 *
 * @route POST /api/auth/logout
 * @access Private
 *
 * @param {Object} req.body
 * @param {string} req.body.refreshToken رفرش توکن کاربر
 *
 * @returns {Object} پیام موفقیت
 */
exports.logout = asyncHandler(async (req, res) => {
  /**
   * استخراج Refresh Token
   */
  const { refreshToken } = req.body;

  /**
   * حذف یا غیرفعال سازی Refresh Token
   */
  await authService.logoutUser(refreshToken);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

/**
 * شروع فرآیند بازیابی رمز عبور
 *
 * @route POST /api/auth/forgot-password
 * @access Public
 *
 * @param {string} req.body.email - ایمیل کاربر
 *
 * @returns {Object} پیام یکسان (صرف‌نظر از وجود ایمیل)
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  /**
   * همیشه پیام یکسان برمی‌گردد تا مهاجم نتواند بفهمد
   * آیا این ایمیل در سیستم ثبت شده یا نه (User Enumeration).
   */
  res.status(200).json({
    success: true,
    message: "If this email is registered, a reset link has been sent.",
  });
});

/**
 * تکمیل فرآیند بازیابی رمز عبور
 *
 * @route POST /api/auth/reset-password/:token
 * @access Public
 *
 * @param {string} req.params.token - توکن بازیابی (از لینک ایمیل)
 * @param {string} req.body.password - رمز عبور جدید
 *
 * @returns {Object} پیام موفقیت
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);

  res.status(200).json({
    success: true,
    message: "Password has been reset successfully. Please login again.",
  });
});

/**
 * تغییر رمز عبور کاربر لاگین‌شده
 *
 * @route POST /api/auth/change-password
 * @access Private
 *
 * @param {string} req.body.currentPassword - رمز عبور فعلی
 * @param {string} req.body.newPassword - رمز عبور جدید
 *
 * @returns {Object} پیام موفقیت
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user._id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: "Password changed successfully. Please login again.",
  });
});
