const userService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * دریافت لیست کاربران با جستجو، فیلتر و صفحه‌بندی
 *
 * @route GET /api/users
 * @access Private (view_users)
 *
 * @param {string} req.query.search - جستجو در name و email
 * @param {string} req.query.role - فیلتر بر اساس نقش
 * @param {boolean} req.query.isActive - فیلتر بر اساس وضعیت
 * @param {boolean} req.query.includeDeleted - شامل کاربران حذف‌شده
 * @param {number} req.query.page - شماره صفحه
 * @param {number} req.query.limit - تعداد در هر صفحه
 *
 * @returns {Object} لیست کاربران + صفحه‌بندی
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * دریافت اطلاعات یک کاربر
 *
 * @route GET /api/users/:id
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه کاربر
 *
 * @returns {Object} اطلاعات کاربر
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * تغییر نقش کاربر
 *
 * @route PATCH /api/users/:id/role
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه کاربر
 * @param {string} req.body.role نقش جدید کاربر
 *
 * @returns {Object} کاربر بروزرسانی شده
 */
exports.changeUserRole = asyncHandler(async (req, res) => {
  const user = await userService.changeUserRole(req.params.id, req.body.role);

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: user,
  });
});

/**
 * فعال یا غیرفعال کردن حساب کاربری
 *
 * @route PATCH /api/users/:id/status
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه کاربر
 *
 * @returns {Object} کاربر بروزرسانی شده
 */
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.toggleUserStatus(req.params.id);

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: user,
  });
});

/**
 * افزودن محصول به علاقه‌مندی‌ها
 *
 * @route POST /api/users/wishlist/:productId
 * @access Private (User)
 *
 * @param {string} req.user.id شناسه کاربر
 * @param {string} req.params.productId شناسه محصول
 *
 * @returns {Object} پیام موفقیت
 */
exports.addToWishlist = asyncHandler(async (req, res) => {
  await userService.addToWishlist(req.user.id, req.params.productId);

  res.status(200).json({
    success: true,
    message: "Added to wishlist successfully",
  });
});

/**
 * دریافت لیست علاقه‌مندی‌های کاربر
 *
 * @route GET /api/users/wishlist
 * @access Private (User)
 *
 * @param {string} req.user.id شناسه کاربر
 *
 * @returns {Array} لیست محصولات علاقه‌مندی
 */
exports.getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await userService.getWishlist(req.user.id);

  res.status(200).json({
    success: true,
    data: wishlist,
  });
});

/**
 * حذف محصول از علاقه‌مندی‌ها
 *
 * @route DELETE /api/users/wishlist/:productId
 * @access Private (User)
 *
 * @param {string} req.user.id شناسه کاربر
 * @param {string} req.params.productId شناسه محصول
 *
 * @returns {Object} پیام موفقیت
 */
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  await userService.removeFromWishlist(req.user.id, req.params.productId);

  res.status(200).json({
    success: true,
    message: "Removed from wishlist successfully",
  });
});

/**
 * ساخت کاربر جدید با نقش دلخواه (فقط chiefadmin)
 *
 * @route POST /api/users
 * @access Private (chiefadmin - manage_admins)
 *
 * @param {string} req.body.name نام کاربر
 * @param {string} req.body.email ایمیل کاربر
 * @param {string} req.body.password رمز عبور کاربر
 * @param {string} req.body.role نقش کاربر (user, support, editor, admin, chiefadmin)
 *
 * @returns {Object} کاربر ایجادشده
 */
exports.createUserWithRole = asyncHandler(async (req, res) => {
  const newUser = await userService.createUserWithRole(req.body);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: newUser,
  });
});

/**
 * حذف نرم کاربر
 *
 * @route DELETE /api/users/:id
 * @access Private (manage_admins)
 *
 * @param {string} req.params.id - شناسه کاربر
 * @param {string} req.body.reason - دلیل حذف (اختیاری)
 *
 * @returns {Object} پیام موفقیت
 */
exports.softDeleteUser = asyncHandler(async (req, res) => {
  await userService.softDeleteUser(req.params.id, req.body.reason);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

/**
 * بازیابی کاربر حذف‌شده
 *
 * @route PATCH /api/users/:id/restore
 * @access Private (manage_admins)
 *
 * @param {string} req.params.id - شناسه کاربر
 *
 * @returns {Object} پیام موفقیت
 */
exports.restoreUser = asyncHandler(async (req, res) => {
  const user = await userService.restoreUser(req.params.id);

  res.status(200).json({
    success: true,
    message: "User restored successfully",
    data: user,
  });
});

/**
 * دریافت کاربران حذف‌شده
 *
 * @route GET /api/users/deleted
 * @access Private (manage_admins)
 *
 * @returns {Object} لیست کاربران حذف‌شده
 */
exports.getDeletedUsers = asyncHandler(async (req, res) => {
  const users = await userService.getDeletedUsers();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});
