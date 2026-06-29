/**
 * Joi Validation Middleware
 *
 * این middleware برای اعتبارسنجی داده‌های ورودی درخواست
 * با استفاده از Joi schema استفاده می‌شود.
 *
 * در صورت وجود خطا:
 * - status code = 400
 * - لیست خطاهای validation برگردانده می‌شود
 *
 * در غیر این صورت درخواست به middleware بعدی منتقل می‌شود.
 *
 * مثال استفاده:
 * router.post("/products", validate(productSchema), controller)
 *
 * @function validate
 *
 * @param {Object} schema Joi schema object
 *
 * @returns {Function} Express middleware function
 *
 * @middleware
 */
module.exports = (schema) => {
  return (req, res, next) => {
    /**
     * اجرای validation روی body درخواست
     */
    const { error } = schema.validate(req.body, {
      abortEarly: false, // نمایش همه خطاها به جای توقف روی اولین خطا
    });

    /**
     * اگر validation خطا داشته باشد
     */
    if (error) {
      return res.status(400).json({
        success: false,

        /**
         * تبدیل خطاهای Joi به آرایه پیام‌های قابل خواندن
         */
        errors: error.details.map((item) => item.message),
      });
    }

    /**
     * داده معتبر است → ادامه مسیر
     */
    next();
  };
};
