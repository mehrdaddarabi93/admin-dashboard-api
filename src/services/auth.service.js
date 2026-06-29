const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const crypto = require("crypto");
const emailService = require("./email.service");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

/**
 * ثبت‌نام کاربر جدید
 *
 * @param {Object} userData - اطلاعات کاربر
 * @param {string} userData.name - نام کاربر
 * @param {string} userData.email - ایمیل کاربر
 * @param {string} userData.password - رمز عبور خام
 *
 * @returns {Object} اطلاعات کاربر ایجاد شده (بدون password)
 */
const registerUser = async (userData) => {
  const { name, email, password } = userData;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
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
 * ورود کاربر
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 *
 * @returns {Object} user + accessToken + refreshToken
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password +refreshTokens");

  if (!user) {
    throw new AppError("Email or password is incorrect", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Email or password is incorrect", 401);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // جلوگیری از انباشت session — قدیمی‌ترین حذف می‌شه
  const MAX_SESSIONS = 5;
  if (user.refreshTokens.length >= MAX_SESSIONS) {
    user.refreshTokens.shift();
  }

  user.refreshTokens.push(hashedRefreshToken);
  user.lastLogin = new Date();
  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * ساخت Access Token جدید با استفاده از Refresh Token
 *
 * @param {string} refreshToken
 * @returns {Object} new accessToken + refreshToken
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Expired refresh token", 401);
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  let tokenIndex = -1;

  for (let i = 0; i < user.refreshTokens.length; i++) {
    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokens[i]);

    if (isMatch) {
      tokenIndex = i;
      break;
    }
  }

  if (tokenIndex === -1) {
    throw new AppError("Invalid refresh token", 401);
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

  user.refreshTokens.splice(tokenIndex, 1);
  user.refreshTokens.push(hashedRefreshToken);

  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * خروج کاربر از سیستم (Logout)
 *
 * حذف فقط همان session مربوط به refresh token
 *
 * @param {string} refreshToken
 * @returns {boolean}
 */
const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  let tokenIndex = -1;

  for (let i = 0; i < user.refreshTokens.length; i++) {
    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokens[i]);

    if (isMatch) {
      tokenIndex = i;
      break;
    }
  }

  if (tokenIndex === -1) {
    throw new AppError("Invalid refresh token", 401);
  }

  user.refreshTokens.splice(tokenIndex, 1);

  await user.save();

  return true;
};

/**
 * شروع فرآیند بازیابی رمز عبور
 *
 * نکته امنیتی مهم: صرف‌نظر از اینکه ایمیل در دیتابیس وجود داشته
 * باشد یا نه، همیشه باید پیام موفقیت یکسان برگردانیم. در غیر این
 * صورت مهاجم می‌تواند با امتحان کردن ایمیل‌های مختلف بفهمد کدام
 * ایمیل در سیستم ثبت شده است (User Enumeration).
 *
 * @param {string} email - ایمیل کاربر
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  /**
   * اگر کاربری با این ایمیل پیدا نشد، بدون هیچ خطایی برمی‌گردیم.
   * کنترلر همیشه پیام موفقیت یکسان نمایش می‌دهد.
   */
  if (!user) {
    return;
  }

  /**
   * تولید یک توکن تصادفی و غیرقابل‌حدس (32 بایت = 64 کاراکتر هگزادسیمال)
   */
  const resetToken = crypto.randomBytes(32).toString("hex");

  /**
   * هش کردن توکن قبل از ذخیره در دیتابیس.
   * از sha256 استفاده می‌کنیم (نه bcrypt) چون این یک مقایسه ساده
   * است نه رمز عبور؛ سرعت بالاتر sha256 اینجا مشکلی ایجاد نمی‌کند
   * چون توکن خودش به اندازه کافی تصادفی و طولانی است.
   */
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 دقیقه

  await user.save();

  /**
   * توکن خام (نه هش‌شده) در لینک ایمیل قرار می‌گیرد، چون فقط
   * کاربر باید آن را داشته باشد. در دیتابیس فقط نسخه هش‌شده ذخیره
   * می‌شود (دقیقا مثل رمز عبور).
   */
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await emailService.sendPasswordResetEmail(user.email, resetUrl);
};

/**
 * تکمیل فرآیند بازیابی رمز عبور با توکن دریافتی
 *
 * @param {string} token - توکن خام (از لینک ایمیل، نه هش‌شده)
 * @param {string} newPassword - رمز عبور جدید
 */
const resetPassword = async (token, newPassword) => {
  /**
   * هش کردن توکن دریافتی تا با مقدار ذخیره‌شده در دیتابیس مقایسه شود
   */
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }, // هنوز منقضی نشده باشد
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;

  /**
   * توکن بعد از استفاده موفق، فورا حذف می‌شود (یک‌بارمصرف بودن)
   */
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  /**
   * باطل کردن تمام refresh token های قبلی کاربر.
   * چرا؟ چون اگر حساب کاربر هک شده بود و مهاجم یک refresh token
   * معتبر داشت، با تغییر رمز عبور باید همه نشست‌های قبلی هم
   * بسته شوند، وگرنه مهاجم همچنان از طریق آن توکن دسترسی دارد.
   */
  user.refreshTokens = [];

  await user.save();
};

/**
 * تغییر رمز عبور کاربر لاگین‌شده
 *
 * چرا currentPassword گرفته می‌شود؟
 * چون داشتن توکن به‌تنهایی کافی نیست برای عملیات حساس.
 * اگر کسی به کامپیوتر کاربر دسترسی پیدا کند (session فعال باشد)،
 * بدون دانستن رمز فعلی نتواند رمز را تغییر دهد.
 * به این الگو Re-authentication for sensitive actions می‌گویند.
 *
 * @param {string} userId - شناسه کاربر (از req.user)
 * @param {string} currentPassword - رمز عبور فعلی برای تأیید هویت
 * @param {string} newPassword - رمز عبور جدید
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password +refreshTokens");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  /**
   * تأیید هویت: رمز فعلی باید درست باشد
   */
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  /**
   * رمز جدید نباید با رمز فعلی یکسان باشد
   */
  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);

  /**
   * باطل کردن تمام refresh token های قبلی.
   * چرا؟ چون با تغییر رمز، همه‌ی نشست‌های دیگر (مثلاً موبایل یا
   * مرورگر دیگر) باید بسته شوند تا کاربر مجبور بشه دوباره با
   * رمز جدید لاگین کنه.
   */
  user.refreshTokens = [];

  await user.save();
};
module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
};
