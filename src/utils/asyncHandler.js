/**
 * Async Handler برای حذف نیاز به try/catch در کنترلرها
 *
 * این wrapper باعث می‌شود هر تابع async به صورت خودکار
 * خطاهای Promise را به middleware خطا (next) ارسال کند.
 *
 * @param {Function} fn - تابع async (controller یا middleware)
 * @returns {Function} Express middleware
 */
module.exports = (fn) => {
  return (req, res, next) => {
    /**
     * اجرای امن تابع async
     * اگر خطا رخ دهد به صورت خودکار به error handler ارسال می‌شود
     */
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
