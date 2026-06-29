const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const validate = require("../middlewares/validationMiddleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/category.validator");
const { PERMISSIONS } = require("../configs/permissions");

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: مدیریت دسته‌بندی محصولات
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: ایجاد دسته‌بندی جدید
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug]
 *             properties:
 *               title:
 *                 type: string
 *                 example: موبایل
 *               slug:
 *                 type: string
 *                 example: mobile
 *                 description: یکتا - برای استفاده در URL
 *               description:
 *                 type: string
 *                 example: انواع موبایل و گوشی هوشمند
 *     responses:
 *       201:
 *         description: دسته‌بندی ایجاد شد
 *       400:
 *         description: خطای اعتبارسنجی (title یا slug ارسال نشده)
 *       401:
 *         description: "از authMiddleware: توکن ارسال نشده یا نامعتبر است"
 *       403:
 *         description: "کاربر مجوز manage_categories ندارد (Forbidden)"
 *       409:
 *         description: "این slug قبلاً استفاده شده (Category slug already exists)"
 */
router.post(
  "/",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_CATEGORIES),
  validate(createCategorySchema),
  categoryController.createCategory,
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: دریافت لیست دسته‌بندی‌ها (Pagination, Search, Filter, Sort)
 *     tags: [Categories]
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
 *         name: search
 *         schema:
 *           type: string
 *           example: موبایل
 *         description: جستجو در فیلد title (case-insensitive)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: "فیلدهای مجاز: title, slug, createdAt (برای نزولی با - شروع شود)"
 *     responses:
 *       200:
 *         description: لیست دسته‌بندی‌ها به همراه اطلاعات صفحه‌بندی
 */
router.get("/", categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: دریافت یک دسته‌بندی با ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: اطلاعات دسته‌بندی
 *       400:
 *         description: "id فرمت ObjectId معتبر ندارد (Invalid category id)"
 *       404:
 *         description: "دسته‌بندی پیدا نشد (Category not found)"
 */
router.get("/:id", categoryController.getCategoryById);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: بروزرسانی دسته‌بندی
 *     tags: [Categories]
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
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: دسته‌بندی بروز شد
 *       400:
 *         description: "id نامعتبر است یا body خالی ارسال شده"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_categories ندارد
 *       404:
 *         description: دسته‌بندی پیدا نشد
 *       409:
 *         description: "Slug جدید قبلاً برای دسته‌بندی دیگری استفاده شده"
 */
router.patch(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_CATEGORIES),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: حذف دسته‌بندی
 *     tags: [Categories]
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
 *         description: دسته‌بندی حذف شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_categories ندارد
 *       404:
 *         description: دسته‌بندی پیدا نشد
 */
router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_CATEGORIES),
  categoryController.deleteCategory,
);

module.exports = router;
