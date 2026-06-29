const dashboardService = require("../services/dashboard.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * دریافت آمار داشبورد مدیریتی
 *
 * این endpoint اطلاعات کلی سیستم را برای
 * نمایش در پنل مدیریت برمی‌گرداند.
 *
 * نمونه اطلاعات:
 * - تعداد کاربران
 * - تعداد محصولات
 * - تعداد سفارش‌ها
 * - مجموع فروش
 * - آمار نظرات
 * - سایر KPIهای سیستم
 *
 * @route GET /api/dashboard/stats
 * @access Private (Admin)
 *
 * @returns {Object} آمار داشبورد
 */
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});
