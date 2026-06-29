const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const { PERMISSIONS } = require("../configs/permissions");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: آمار و اطلاعات تحلیلی پنل ادمین
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: دریافت آمار کلی داشبورد
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: آمار کلی سیستم
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                           example: 1250
 *                         totalAdmins:
 *                           type: integer
 *                           example: 3
 *                         totalCustomers:
 *                           type: integer
 *                           example: 1247
 *                     products:
 *                       type: object
 *                       properties:
 *                         totalProducts:
 *                           type: integer
 *                           example: 340
 *                         deletedProducts:
 *                           type: integer
 *                           example: 12
 *                         totalCategories:
 *                           type: integer
 *                           example: 18
 *                     orders:
 *                       type: object
 *                       properties:
 *                         totalOrders:
 *                           type: integer
 *                           example: 870
 *                         totalRevenue:
 *                           type: number
 *                           example: 982500000
 *                         avgOrderValue:
 *                           type: number
 *                           example: 1129000
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         bestSellingProducts:
 *                           type: array
 *                           description: "۵ محصول پرفروش (بر اساس مجموع quantity) - فقط _id محصول و totalSold"
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               totalSold:
 *                                 type: integer
 *                         salesByCategory:
 *                           type: array
 *                           description: مجموع فروش به تفکیک دسته‌بندی
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: شناسه دسته‌بندی
 *                               totalSales:
 *                                 type: integer
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز view_dashboard ندارد
 */
router.get(
  "/stats",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.VIEW_DASHBOARD),
  dashboardController.getStats,
);

module.exports = router;
