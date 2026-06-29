const { roleHasPermission } = require("../configs/permissions");

/**
 * میدلور بررسی مجوز (Permission-Based Access Control)
 *
 * برخلاف roleMiddleware که فقط اسم نقش را چک می‌کند، این میدلور
 * بررسی می‌کند که نقش کاربر، مجوز مشخصی را دارد یا نه. این باعث
 * می‌شود به‌جای نوشتن roleMiddleware("admin", "chiefadmin", ...)
 * در هر route، فقط بنویسیم permissionMiddleware("manage_products")
 * و منطق تصمیم‌گیری در یک فایل مرکزی (permissions.js) بماند.
 *
 * نکته: این میدلور باید همیشه بعد از authMiddleware بیاید چون
 * به req.user.role نیاز دارد.
 *
 * @param {string} requiredPermission مجوز موردنیاز برای این route
 */
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authenticated user found.",
      });
    }

    const hasAccess = roleHasPermission(req.user.role, requiredPermission);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing permission: ${requiredPermission}`,
      });
    }

    next();
  };
};

module.exports = permissionMiddleware;
