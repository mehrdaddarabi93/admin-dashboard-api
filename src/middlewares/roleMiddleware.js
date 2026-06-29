/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * این middleware برای کنترل دسترسی بر اساس نقش کاربر استفاده می‌شود.
 * فقط کاربرانی که نقش آن‌ها در لیست roles مجاز باشد اجازه دسترسی دارند.
 *
 * پیش‌نیاز:
 * - باید authMiddleware قبل از این middleware اجرا شده باشد
 * - زیرا req.user باید وجود داشته باشد
 *
 * مثال استفاده:
 * router.get("/admin", protect, roleMiddleware("admin"), handler)
 *
 * @function roleMiddleware
 *
 * @param {...string} roles لیست نقش‌های مجاز (مثلاً: "admin", "manager")
 *
 * @returns {Function} Express middleware function
 *
 * @middleware
 */
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    /**
     * بررسی وجود کاربر احراز هویت شده
     */
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /**
     * بررسی اینکه نقش کاربر در لیست مجاز هست یا نه
     */
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    /**
     * اجازه عبور به middleware یا controller بعدی
     */
    next();
  };
};

module.exports = roleMiddleware;
