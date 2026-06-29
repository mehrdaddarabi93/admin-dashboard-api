const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const validate = require("../middlewares/validationMiddleware");
const { createUserWithRoleSchema } = require("../validators/auth.validator");
const { PERMISSIONS } = require("../configs/permissions");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: مدیریت کاربران و علاقه‌مندی‌ها
 */

// ─────────────────────────────────────────────────────────────────────────────
// WISHLIST routes (static segment: "/wishlist/..." باید قبل از "/:id" باشد)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/wishlist/{productId}:
 *   post:
 *     summary: افزودن محصول به علاقه‌مندی‌ها
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: محصول به علاقه‌مندی‌ها اضافه شد
 *       400:
 *         description: >
 *           productId نامعتبر است یا محصول قبلاً در wishlist موجود است
 *           (Product already exists in wishlist)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: "محصول پیدا نشد یا کاربر پیدا نشد"
 */
router.post(
  "/wishlist/:productId",
  authMiddleware,
  userController.addToWishlist,
);

/**
 * @swagger
 * /api/users/wishlist:
 *   get:
 *     summary: دریافت لیست علاقه‌مندی‌های کاربر
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست علاقه‌مندی‌ها (populate شده با title, slug, price, stock, image, averageRating)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: کاربر پیدا نشد
 */
router.get("/wishlist", authMiddleware, userController.getWishlist);

/**
 * @swagger
 * /api/users/wishlist/{productId}:
 *   delete:
 *     summary: حذف محصول از علاقه‌مندی‌ها
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: محصول از علاقه‌مندی‌ها حذف شد
 *       400:
 *         description: "productId نامعتبر است (Invalid product id)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: کاربر پیدا نشد
 */
router.delete(
  "/wishlist/:productId",
  authMiddleware,
  userController.removeFromWishlist,
);

// ─────────────────────────────────────────────────────────────────────────────
// STATIC routes (باید قبل از dynamic /:id باشند تا Express اشتباه parse نکند)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/deleted:
 *   get:
 *     summary: دریافت لیست کاربران حذف‌شده (نیاز به مجوز manage_admins)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست کاربران حذف‌شده
 *       401:
 *         description: توکن نامعتبر
 *       403:
 *         description: فقط chiefadmin
 */
router.get(
  "/deleted",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ADMINS),
  userController.getDeletedUsers,
);

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION routes (GET / و POST /)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: دریافت لیست کاربران با جستجو و فیلتر (نیاز به مجوز view_users)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: علی
 *         description: جستجو در name و email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, support, editor, admin, chiefadmin]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: آیا کاربران حذف‌شده هم نمایش داده شوند
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: لیست کاربران به همراه اطلاعات صفحه‌بندی
 *       401:
 *         description: توکن نامعتبر
 *       403:
 *         description: کاربر مجوز view_users ندارد
 */
router.get(
  "/",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.VIEW_USERS),
  userController.getAllUsers,
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: >
 *       ساخت کاربر جدید با نقش دلخواه (نیاز به مجوز manage_admins -
 *       فقط chiefadmin). برخلاف /api/auth/register که همیشه role را
 *       user می‌گذارد، اینجا role صراحتاً در body مشخص می‌شود.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: سارا احمدی
 *               email:
 *                 type: string
 *                 example: sara@example.com
 *               password:
 *                 type: string
 *                 example: pass1234
 *               role:
 *                 type: string
 *                 enum: [user, support, editor, admin, chiefadmin]
 *                 example: editor
 *     responses:
 *       201:
 *         description: کاربر ایجاد شد
 *       400:
 *         description: "خطای Joi validation (role خارج از enum یا فیلد اجباری ارسال نشده)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: "کاربر مجوز manage_admins ندارد (فقط chiefadmin مجاز است)"
 *       409:
 *         description: "ایمیل تکراری است (Email already exists)"
 */
router.post(
  "/",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ADMINS),
  validate(createUserWithRoleSchema),
  userController.createUserWithRole,
);

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC /:id routes (باید آخر از همه بیایند)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: دریافت اطلاعات یک کاربر با ID (نیاز به مجوز view_users)
 *     tags: [Users]
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
 *         description: اطلاعات کاربر
 *       400:
 *         description: "id نامعتبر است (Invalid user id)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: "کاربر مجوز view_users ندارد"
 *       404:
 *         description: کاربر پیدا نشد
 */
router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.VIEW_USERS),
  userController.getUserById,
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: >
 *       تغییر نقش کاربر (نیاز به مجوز manage_admins - عملیات حساس،
 *       فقط نقش chiefadmin این مجوز را دارد)
 *     tags: [Users]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, support, editor, admin, chiefadmin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: نقش کاربر تغییر کرد
 *       400:
 *         description: "id نامعتبر است یا role خارج از مقادیر مجاز (Invalid role)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: "کاربر مجوز manage_admins ندارد (فقط chiefadmin مجاز است)"
 *       404:
 *         description: کاربر پیدا نشد
 */
router.patch(
  "/:id/role",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ADMINS),
  userController.changeUserRole,
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: >
 *       فعال/غیرفعال کردن حساب کاربر (toggle - بدون body).
 *       نیاز به مجوز manage_admins - فقط نقش chiefadmin این مجوز را دارد.
 *     tags: [Users]
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
 *         description: وضعیت isActive کاربر معکوس شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: "کاربر مجوز manage_admins ندارد (فقط chiefadmin مجاز است)"
 *       404:
 *         description: کاربر پیدا نشد
 */
router.patch(
  "/:id/status",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ADMINS),
  userController.toggleUserStatus,
);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   patch:
 *     summary: بازیابی کاربر حذف‌شده (نیاز به مجوز manage_admins)
 *     tags: [Users]
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
 *         description: کاربر بازیابی شد
 *       400:
 *         description: شناسه نامعتبر است
 *       401:
 *         description: توکن نامعتبر
 *       403:
 *         description: فقط chiefadmin
 *       404:
 *         description: کاربر حذف‌شده‌ای با این شناسه پیدا نشد
 */
router.patch(
  "/:id/restore",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ADMINS),
  userController.restoreUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: حذف نرم کاربر - Soft Delete (نیاز به مجوز manage_admins)
 *     tags: [Users]
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
 *               reason:
 *                 type: string
 *                 example: تخلف از قوانین سایت
 *     responses:
 *       200:
 *         description: کاربر حذف شد
 *       400:
 *         description: شناسه نامعتبر یا کاربر قبلاً حذف شده
 *       401:
 *         description: توکن نامعتبر
 *       403:
 *         description: فقط chiefadmin
 *       404:
 *         description: کاربر پیدا نشد
 */
router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_ADMINS),
  userController.softDeleteUser,
);

module.exports = router;
