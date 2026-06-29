/**
 * کلاس خطای سفارشی پروژه
 *
 * این کلاس برای استانداردسازی خطاها در کل اپلیکیشن استفاده می‌شود.
 * به جای استفاده از Error معمولی، این کلاس امکان تعیین statusCode را فراهم می‌کند.
 *
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * ایجاد یک خطای سفارشی
   *
   * @param {string} message - پیام خطا
   * @param {number} [statusCode=500] - کد HTTP خطا (پیش‌فرض: 500)
   */
  constructor(message, statusCode = 500) {
    super(message);

    /**
     * کد وضعیت HTTP مرتبط با خطا
     * مثال:
     * 400 -> Bad Request
     * 401 -> Unauthorized
     * 404 -> Not Found
     * 500 -> Server Error
     */
    this.statusCode = statusCode;

    /**
     * حذف constructor از stack trace برای تمیزتر شدن لاگ‌ها
     */
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
