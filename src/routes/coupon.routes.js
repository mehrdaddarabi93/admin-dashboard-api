const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const validate = require("../middlewares/validationMiddleware");
const { PERMISSIONS } = require("../configs/permissions");
const {
  createCouponSchema,
  updateCouponSchema,
} = require("../validators/coupon.validator");
const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} = require("../controllers/coupon.controller");

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: مدیریت کدهای تخفیف
 */

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: ایجاد کد تخفیف جدید
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountPercentage, expiresAt, usageLimit]
 *             properties:
 *               code:
 *                 type: string
 *                 example: SUMMER20
 *                 description: به صورت خودکار به حروف بزرگ تبدیل می‌شود
 *               discountPercentage:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 20
 *               expiresAt:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               usageLimit:
 *                 type: integer
 *                 minimum: 1
 *                 example: 100
 *     responses:
 *       201:
 *         description: کد تخفیف ایجاد شد
 *       400:
 *         description: "کد تخفیف تکراری است (Coupon code already exists)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_coupons ندارد
 */
router.post(
  "/",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_COUPONS),
  validate(createCouponSchema),
  createCoupon,
);

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: دریافت تمام کدهای تخفیف (با pagination و فیلتر isActive)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: لیست کدهای تخفیف
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_coupons ندارد
 */
router.get(
  "/",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_COUPONS),
  getCoupons,
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   get:
 *     summary: دریافت یک کد تخفیف با ID
 *     tags: [Coupons]
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
 *         description: اطلاعات کد تخفیف
 *       400:
 *         description: "id نامعتبر است (Invalid coupon id)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_coupons ندارد
 *       404:
 *         description: کد تخفیف پیدا نشد
 */
router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_COUPONS),
  getCouponById,
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   patch:
 *     summary: بروزرسانی کد تخفیف (فیلد code قابل تغییر نیست و نادیده گرفته می‌شود)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discountPercentage:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 30
 *               expiresAt:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-30"
 *               usageLimit:
 *                 type: integer
 *                 example: 200
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: کد تخفیف بروز شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_coupons ندارد
 *       404:
 *         description: کد تخفیف پیدا نشد
 */
router.patch(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_COUPONS),
  validate(updateCouponSchema),
  updateCoupon,
);

/**
 * @swagger
 * /api/coupons/{id}/toggle-status:
 *   patch:
 *     summary: فعال/غیرفعال کردن کد تخفیف (toggle - بدون body)
 *     tags: [Coupons]
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
 *         description: وضعیت isActive کد تخفیف معکوس شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_coupons ندارد
 *       404:
 *         description: کد تخفیف پیدا نشد
 */
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_COUPONS),
  toggleCouponStatus,
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: حذف کد تخفیف
 *     tags: [Coupons]
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
 *         description: کد تخفیف حذف شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_coupons ندارد
 *       404:
 *         description: کد تخفیف پیدا نشد
 */
router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_COUPONS),
  deleteCoupon,
);

module.exports = router;
