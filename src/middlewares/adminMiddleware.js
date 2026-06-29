/**
 * Middleware بررسی دسترسی Admin
 *
 * پیش نیاز:
 *
 * authMiddleware
 *
 * باید قبل از این Middleware اجرا شده باشد.
 */
const adminMiddleware = (req, res, next) => {
  /**
   * اطلاعات کاربر
   * از authMiddleware آمده است.
   */
  const user = req.user;

  /**
   * اگر نقش Admin نباشد
   */
  if (user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }

  /**
   * انتقال به Route بعدی
   */
  next();
};

module.exports = adminMiddleware;
