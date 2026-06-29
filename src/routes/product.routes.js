const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const { PERMISSIONS } = require("../configs/permissions");
const validate = require("../middlewares/validationMiddleware");
const upload = require("../configs/multer");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validators/product.validator");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: مدیریت محصولات فروشگاه
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: دریافت لیست محصولات (Pagination) - فقط محصولات حذف‌نشده
 *     tags: [Products]
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
 *     responses:
 *       200:
 *         description: لیست محصولات
 */
router.get("/", productController.getAllProducts);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: جستجوی پیشرفته محصولات
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           example: لپ‌تاپ
 *         description: جستجو در title و description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: "اگر دقیقا 'true' باشد فقط محصولات با stock > 0"
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, rating_desc]
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
 *     responses:
 *       200:
 *         description: نتایج جستجو
 */
router.get("/search", productController.searchProducts);

/**
 * @swagger
 * /api/products/trash:
 *   get:
 *     summary: دریافت محصولات حذف‌شده (Soft Delete شده)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست محصولات حذف‌شده
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 */
router.get(
  "/trash",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.getDeletedProducts,
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: دریافت یک محصول با ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: اطلاعات محصول
 *       400:
 *         description: "id نامعتبر است (Invalid product id)"
 *       404:
 *         description: "محصول پیدا نشد یا حذف شده است (Product not found)"
 */
router.get("/:id", productController.getProductById);

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: دریافت نظرات یک محصول
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: لیست نظرات
 *       400:
 *         description: id نامعتبر است
 *       404:
 *         description: محصول پیدا نشد
 */
router.get("/:id/reviews", productController.getProductReviews);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: ایجاد محصول جدید
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, price, stock, category]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: لپ‌تاپ ایسوس ROG
 *               slug:
 *                 type: string
 *                 example: asus-rog-laptop
 *               description:
 *                 type: string
 *                 example: لپ‌تاپ گیمینگ با پردازنده i9
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 45000000
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *               category:
 *                 type: string
 *                 example: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 description: ID دسته‌بندی - باید از قبل وجود داشته باشد
 *     responses:
 *       201:
 *         description: محصول ایجاد شد
 *       400:
 *         description: "خطای اعتبارسنجی Joi (از validationMiddleware)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: "دسته‌بندی با این id پیدا نشد (Category not found)"
 *       409:
 *         description: "این slug قبلاً استفاده شده (Product slug already exists)"
 */
router.post(
  "/",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  validate(createProductSchema),
  productController.createProduct,
);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: بروزرسانی محصول
 *     tags: [Products]
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
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: محصول بروز شد
 *       400:
 *         description: "خطای اعتبارسنجی Joi یا id نامعتبر (Invalid product id)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: "محصول پیدا نشد یا (در صورت تغییر category) دسته‌بندی جدید پیدا نشد"
 *       409:
 *         description: "Slug جدید تکراری است (Product slug already exists)"
 */
router.patch(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  validate(updateProductSchema),
  productController.updateProduct,
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: حذف نرم محصول (Soft Delete - isDeleted=true)
 *     tags: [Products]
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
 *         description: محصول حذف شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: "محصول پیدا نشد (در بین محصولات حذف‌نشده)"
 */
router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.deleteProduct,
);

/**
 * @swagger
 * /api/products/{id}/restore:
 *   patch:
 *     summary: بازیابی محصول حذف‌شده (isDeleted=false)
 *     tags: [Products]
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
 *         description: محصول بازیابی شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: "محصول حذف‌شده‌ای با این شناسه پیدا نشد (Deleted product not found)"
 */
router.patch(
  "/:id/restore",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.restoreProduct,
);

/**
 * @swagger
 * /api/products/{id}/image:
 *   post:
 *     summary: آپلود تصویر اصلی محصول (mainImage)
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: تصویر اصلی آپلود شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: محصول پیدا نشد
 */
router.post(
  "/:id/image",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  upload.single("image"),
  productController.uploadProductImage,
);

/**
 * @swagger
 * /api/products/{id}/gallery:
 *   post:
 *     summary: آپلود گالری تصاویر (حداکثر ۵ تصویر - افزوده می‌شوند به images موجود)
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: تصاویر گالری آپلود شدند
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: محصول پیدا نشد
 */
router.post(
  "/:id/gallery",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  upload.array("images", 5),
  productController.uploadProductImages,
);

/**
 * @swagger
 * /api/products/{id}/images/{imageName}/main:
 *   patch:
 *     summary: تعیین تصویر اصلی از گالری موجود
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageName
 *         required: true
 *         schema:
 *           type: string
 *         example: product-1234567890.jpg
 *     responses:
 *       200:
 *         description: تصویر اصلی تنظیم شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: "محصول پیدا نشد یا imageName در آرایه images محصول نیست (Image not found in gallery)"
 */
router.patch(
  "/:id/images/:imageName/main",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.setMainImage,
);

/**
 * @swagger
 * /api/products/{id}/images/{imageName}:
 *   delete:
 *     summary: حذف تصویر از گالری (و حذف فایل از دیسک در صورت وجود)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تصویر حذف شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: "محصول پیدا نشد یا imageName در گالری نیست"
 */
router.delete(
  "/:id/images/:imageName",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.deleteProductImage,
);

/**
 * @swagger
 * /api/products/{id}/variants:
 *   post:
 *     summary: افزودن variant به محصول (مثلا رنگ یا ظرفیت متفاوت)
 *     tags: [Products]
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
 *             required: [title, price]
 *             properties:
 *               title:
 *                 type: string
 *                 example: رنگ مشکی - 256GB
 *               price:
 *                 type: number
 *                 example: 47000000
 *               stock:
 *                 type: integer
 *                 default: 0
 *                 example: 5
 *     responses:
 *       200:
 *         description: variant اضافه شد
 *       400:
 *         description: id نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: محصول پیدا نشد
 */
router.post(
  "/:id/variants",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.addProductVariant,
);

/**
 * @swagger
 * /api/products/{id}/stock/increase:
 *   patch:
 *     summary: افزایش موجودی محصول
 *     tags: [Products]
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
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 20
 *     responses:
 *       200:
 *         description: موجودی افزایش یافت
 *       400:
 *         description: "id نامعتبر یا quantity صفر/منفی (Quantity must be greater than zero)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: محصول پیدا نشد
 */
router.patch(
  "/:id/stock/increase",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.increaseStock,
);

/**
 * @swagger
 * /api/products/{id}/stock/decrease:
 *   patch:
 *     summary: کاهش موجودی محصول
 *     tags: [Products]
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
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *     responses:
 *       200:
 *         description: موجودی کاهش یافت
 *       400:
 *         description: >
 *           سه حالت: id نامعتبر (Invalid product id) /
 *           quantity صفر یا منفی (Quantity must be greater than zero) /
 *           موجودی کافی نیست (Insufficient stock)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: کاربر مجوز manage_products ندارد
 *       404:
 *         description: محصول پیدا نشد
 */
router.patch(
  "/:id/stock/decrease",
  authMiddleware,
  permissionMiddleware(PERMISSIONS.MANAGE_PRODUCTS),
  productController.decreaseStock,
);

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: ثبت نظر برای محصول (هر کاربر فقط یک‌بار می‌تواند نظر بدهد)
 *     tags: [Products]
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
 *             required: [rating, comment]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: محصول بسیار خوب بود
 *     responses:
 *       201:
 *         description: نظر ثبت شد
 *       400:
 *         description: >
 *           id نامعتبر است یا کاربر قبلاً برای این محصول نظر ثبت کرده
 *           (You already reviewed this product)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: محصول پیدا نشد
 */
router.post("/:id/reviews", authMiddleware, productController.addReview);

/**
 * @swagger
 * /api/products/{id}/reviews/{reviewId}:
 *   patch:
 *     summary: ویرایش نظر (فقط صاحب نظر مجاز است)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: نظر ویرایش شد
 *       400:
 *         description: id محصول نامعتبر است
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: "کاربر صاحب این نظر نیست (Not authorized to update this review)"
 *       404:
 *         description: محصول یا نظر پیدا نشد
 */
router.patch(
  "/:id/reviews/:reviewId",
  authMiddleware,
  productController.updateReview,
);

/**
 * @swagger
 * /api/products/{id}/reviews/{reviewId}:
 *   delete:
 *     summary: حذف نظر (فقط صاحب نظر مجاز است)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: نظر حذف شد
 *       400:
 *         description: "id محصول یا reviewId نامعتبر است (Invalid product id / Invalid review id)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       403:
 *         description: "کاربر صاحب این نظر نیست (Not authorized to delete this review)"
 *       404:
 *         description: محصول یا نظر پیدا نشد
 */
router.delete(
  "/:id/reviews/:reviewId",
  authMiddleware,
  productController.deleteReview,
);

module.exports = router;
