/**
 * Global Error Handler Middleware
 *
 * این middleware تمام خطاهای اپلیکیشن را مدیریت می‌کند و یک
 * پاسخ استاندارد برای کل API برمی‌گرداند.
 *
 * این handler باید در انتهای middleware stack در Express قرار بگیرد.
 *
 * ویژگی‌ها:
 * - مدیریت status code
 * - جلوگیری از crash شدن server
 * - بازگرداندن response استاندارد
 *
 * @middleware
 *
 * @param {Error} err خطای پرتاب شده در اپلیکیشن
 * @param {Object} req درخواست Express
 * @param {Object} res پاسخ Express
 * @param {Function} next انتقال به middleware بعدی (در error handler معمولاً استفاده نمی‌شود)
 *
 * @returns {Object} پاسخ JSON استاندارد خطا
 */
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
