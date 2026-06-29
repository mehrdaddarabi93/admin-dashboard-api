const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const { PERMISSIONS } = require("../configs/permissions");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: مدیریت سفارشات
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: ایجاد سفارش جدید (مسیر مستقیم، بدون نیاز به سبد خرید)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderItems, shippingAddress]
 *             properties:
 *               orderItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product, quantity]
 *                   properties:
 *                     product:
 *                       type: string
 *                       example: 64f1a2b3c4d5e6f7a8b9c0d1
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *               shippingAddress:
 *                 type: string
 *                 example: تهران، خیابان ولیعصر، پلاک ۱۲
 *     responses:
 *       201:
 *         description: سفارش ثبت شد
 *       400:
 *         description: >
 *           orderItems خالی یا ارسال نشده (Order items are required) /
 *           موجودی یکی از محصولات کافی نیست (... stock is insufficient)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: "یکی از محصولات orderItems پیدا نشد (Product not found)"
 */
router.post("/", authMiddleware, createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: دریافت سفارشات کاربر جاری
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست سفارشات من
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 */
router.get("/my-orders", authMiddleware, getMyOrders);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: دریافت تمام سفارشات (ادمین)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست تمام سفارشات
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_orders ندارد
 */
router.get(
  "/",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ORDERS),
  getAllOrders,
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: بروزرسانی وضعیت سفارش (ادمین) - با قوانین گذار وضعیت
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 example: processing
 *     responses:
 *       200:
 *         description: وضعیت سفارش بروز شد
 *       400:
 *         description: >
 *           id نامعتبر (Invalid order id) / status خارج از enum
 *           (Invalid order status) / گذار وضعیت غیرمجاز
 *           (Cannot change status from X to Y).
 *           ترتیب مجاز: pending → processing | cancelled,
 *           processing → shipped | cancelled, shipped → delivered.
 *           delivered و cancelled دیگر قابل تغییر نیستند.
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_orders ندارد
 *       404:
 *         description: سفارش پیدا نشد
 */
router.patch(
  "/:id/status",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ORDERS),
  updateOrderStatus,
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: دریافت جزئیات یک سفارش (صاحب سفارش یا کاربران با مجوز manage_orders)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: جزئیات سفارش
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: "کاربر نه صاحب سفارش است و نه مجوز manage_orders دارد (support/admin/chiefadmin مجاز هستند)"
 *       404:
 *         description: سفارش پیدا نشد
 */
router.get("/:id", authMiddleware, getOrderById);

module.exports = router;
