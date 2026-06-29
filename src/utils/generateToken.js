const jwt = require("jsonwebtoken");

/**
 * تولید Access Token
 *
 * Access Token برای احراز هویت درخواست‌ها استفاده می‌شود
 * و عمر کوتاه دارد (مثلاً 15 دقیقه).
 *
 * @param {string} userId - شناسه کاربر
 * @returns {string} JWT Access Token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

/**
 * تولید Refresh Token
 *
 * Refresh Token برای گرفتن Access Token جدید استفاده می‌شود
 * و عمر طولانی‌تری دارد (مثلاً 30 روز).
 *
 * @param {string} userId - شناسه کاربر
 * @returns {string} JWT Refresh Token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    },
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
