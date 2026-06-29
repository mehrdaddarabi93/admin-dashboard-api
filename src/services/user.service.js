const User = require("../models/User");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");
const validateObjectId = require("../utils/validateObjectId");

/**
 * دریافت لیست کاربران با جستجو، فیلتر و صفحه‌بندی
 *
 * @param {Object} filters - فیلترهای جستجو
 * @param {string} filters.search - جستجو در name و email
 * @param {string} filters.role - فیلتر بر اساس نقش
 * @param {boolean} filters.isActive - فیلتر بر اساس وضعیت فعال
 * @param {boolean} filters.includeDeleted - آیا کاربران حذف‌شده هم باشند
 * @param {number} filters.page - شماره صفحه
 * @param {number} filters.limit - تعداد در هر صفحه
 *
 * @returns {Promise<Object>} لیست کاربران + اطلاعات صفحه‌بندی
 */
const getAllUsers = async (filters = {}) => {
  const {
    search,
    role,
    isActive,
    includeDeleted = false,
    page = 1,
    limit = 20,
  } = filters;

  const query = {};

  /**
   * به‌طور پیش‌فرض کاربران حذف‌شده نمایش داده نمی‌شوند.
   * فقط وقتی includeDeleted=true باشد، همه نمایش داده می‌شوند.
   */
  if (!includeDeleted) {
    query.deletedAt = null;
  }

  /**
   * جستجو در نام و ایمیل (case-insensitive)
   */
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  /**
   * فیلتر بر اساس نقش
   */
  if (role) {
    query.role = role;
  }

  /**
   * فیلتر بر اساس وضعیت فعال/غیرفعال
   */
  if (isActive !== undefined) {
    query.isActive = isActive === "true" || isActive === true;
  }

  const skip = (page - 1) * limit;
  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .select("-password -refreshTokens")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * دریافت یک کاربر بر اساس ID
 *
 * @param {string} userId - شناسه کاربر
 * @returns {Promise<Object>} اطلاعات کاربر
 */
const getUserById = async (userId) => {
  if (!validateObjectId(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(userId)
    .select("-password -refreshTokens")
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/**
 * تغییر نقش کاربر (admin / user)
 *
 * @param {string} userId - شناسه کاربر
 * @param {string} role - نقش جدید
 * @returns {Promise<Object>} کاربر آپدیت شده
 */
const changeUserRole = async (userId, role) => {
  if (!validateObjectId(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const allowedRoles = ["user", "support", "editor", "admin", "chiefadmin"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Invalid role", 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { returnDocument: "after", runValidators: true },
  )
    .select("-password -refreshTokens")
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/**
 * تغییر وضعیت فعال/غیرفعال کاربر
 *
 * @param {string} userId - شناسه کاربر
 * @returns {Promise<Object>} کاربر آپدیت شده
 */
const toggleUserStatus = async (userId) => {
  if (!validateObjectId(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isActive = !user.isActive;

  await user.save();

  return user;
};

/**
 * افزودن محصول به علاقه‌مندی‌ها (Wishlist)
 *
 * @param {string} userId - شناسه کاربر
 * @param {string} productId - شناسه محصول
 * @returns {Promise<Object>} کاربر
 */
const addToWishlist = async (userId, productId) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const exists = user.wishlist.some((item) => item.toString() === productId);

  if (exists) {
    throw new AppError("Product already exists in wishlist", 400);
  }

  user.wishlist.push(productId);

  await user.save();

  return user;
};

/**
 * دریافت لیست علاقه‌مندی‌های کاربر
 *
 * @param {string} userId - شناسه کاربر
 * @returns {Promise<Array>} لیست محصولات wishlist
 */
const getWishlist = async (userId) => {
  const user = await User.findById(userId)
    .populate("wishlist", "title slug price stock image averageRating")
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user.wishlist;
};

/**
 * حذف محصول از علاقه‌مندی‌ها
 *
 * @param {string} userId - شناسه کاربر
 * @param {string} productId - شناسه محصول
 * @returns {Promise<boolean>} نتیجه عملیات
 */
const removeFromWishlist = async (userId, productId) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.wishlist = user.wishlist.filter((item) => item.toString() !== productId);

  await user.save();

  return true;
};

/**
 * ساخت کاربر جدید با نقش دلخواه (فقط chiefadmin)
 *
 * چرا این تابع از مسیر register جدا است؟
 * چون مسیر ثبت‌نام عمومی (auth.service -> registerUser) عمداً
 * فیلد role را از کاربر نمی‌خواند تا از Mass Assignment جلوگیری
 * شود و نقش همیشه user بماند. این تابع فقط باید پشت
 * permissionMiddleware("manage_admins") قرار بگیرد.
 *
 * @param {Object} userData - اطلاعات کاربر جدید
 * @param {string} userData.name - نام کاربر
 * @param {string} userData.email - ایمیل کاربر
 * @param {string} userData.password - رمز عبور (هش‌نشده)
 * @param {string} userData.role - نقش کاربر
 * @returns {Promise<Object>} کاربر ایجادشده
 */
const createUserWithRole = async (userData) => {
  const { name, email, password, role } = userData;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};
/**
 * حذف نرم کاربر (Soft Delete)
 *
 * چرا Soft Delete؟
 * چون کاربر ممکن است سفارش، نظر یا تراکنش مالی داشته باشد.
 * حذف کامل رکورد باعث بی‌صاحب شدن داده‌های مرتبط می‌شود.
 *
 * @param {string} userId - شناسه کاربر
 * @param {string} reason - دلیل حذف (اختیاری)
 * @returns {Promise<Object>} کاربر حذف‌شده
 */
const softDeleteUser = async (userId, reason) => {
  if (!validateObjectId(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findOne({ _id: userId, deletedAt: null });

  if (!user) {
    throw new AppError("User not found or already deleted", 404);
  }

  user.deletedAt = new Date();
  user.deletedReason = reason || null;

  /**
   * باطل کردن همه نشست‌های کاربر حذف‌شده
   */
  user.refreshTokens = [];
  user.isActive = false;

  await user.save();

  return user;
};

/**
 * بازیابی کاربر حذف‌شده (Restore)
 *
 * @param {string} userId - شناسه کاربر
 * @returns {Promise<Object>} کاربر بازیابی‌شده
 */
const restoreUser = async (userId) => {
  if (!validateObjectId(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findOne({
    _id: userId,
    deletedAt: { $ne: null },
  });

  if (!user) {
    throw new AppError("Deleted user not found", 404);
  }

  user.deletedAt = null;
  user.deletedReason = null;
  user.isActive = true;

  await user.save();

  return user;
};

/**
 * دریافت لیست کاربران حذف‌شده
 *
 * @returns {Promise<Array>} لیست کاربران حذف‌شده
 */
const getDeletedUsers = async () => {
  return User.find({ deletedAt: { $ne: null } })
    .select("-password -refreshTokens")
    .sort({ deletedAt: -1 })
    .lean();
};
module.exports = {
  getAllUsers,
  getUserById,
  changeUserRole,
  toggleUserStatus,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  createUserWithRole,
  softDeleteUser,
  restoreUser,
  getDeletedUsers,
};
