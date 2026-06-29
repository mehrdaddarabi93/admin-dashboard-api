const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware احراز هویت کاربر (JWT Authentication)
 *
 * این Middleware بررسی می‌کند که:
 * 1. آیا توکن در Header وجود دارد؟
 * 2. آیا فرمت Bearer صحیح است؟
 * 3. آیا JWT معتبر است؟
 * 4. آیا کاربر هنوز در دیتابیس وجود دارد؟
 *
 * سپس اطلاعات کاربر را در req.user قرار می‌دهد.
 *
 * @middleware
 * @access Private
 *
 * @param {Object} req Express Request
 * @param {Object} req.headers Authorization header
 * @param {Object} res Express Response
 * @param {Function} next Express Next function
 *
 * @returns {void|Object} در صورت خطا پاسخ 401 برمی‌گرداند
 */
const authMiddleware = async (req, res, next) => {
  try {
    /**
     * دریافت Authorization header
     * Format: Bearer <token>
     */
    const authHeader = req.headers.authorization;

    /**
     * بررسی وجود header
     */
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    /**
     * جدا کردن نوع و توکن
     */
    const [type, token] = authHeader.split(" ");

    /**
     * بررسی فرمت Bearer token
     */
    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format.",
      });
    }

    /**
     * اعتبارسنجی JWT
     * اگر توکن نامعتبر یا منقضی باشد Exception رخ می‌دهد
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * بررسی وجود کاربر در دیتابیس
     * (برای زمانی که user حذف شده ولی token هنوز معتبر است)
     */
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    /**
     * attach user to request
     */
    req.user = user;

    next();
  } catch (error) {
    /**
     * جلوگیری از لو رفتن جزئیات JWT error
     */
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authMiddleware;
