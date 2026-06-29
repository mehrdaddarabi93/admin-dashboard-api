const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  checkoutCart,
  applyCoupon,
} = require("../controllers/cart.controller");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: مدیریت سبد خرید
 */

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: افزودن محصول به سبد خرید (در صورت نبود سبد، ساخته می‌شود)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 64f1a2b3c4d5e6f7a8b9c0d1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: محصول به سبد اضافه شد
 *       400:
 *         description: >
 *           productId نامعتبر (Invalid product id) /
 *           موجودی کافی نیست (Insufficient stock)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: محصول پیدا نشد
 */
router.post("/", authMiddleware, addToCart);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: دریافت سبد خرید کاربر
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "سبد خرید کاربر (اگر سبد وجود نداشته باشد، آرایه/سبد خالی برگردانده می‌شود نه خطا)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 */
router.get("/", authMiddleware, getCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: پاک کردن کامل سبد خرید
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: سبد خرید پاک شد
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: "سبد خرید پیدا نشد (Cart not found)"
 */
router.delete("/", authMiddleware, clearCart);

/**
 * @swagger
 * /api/cart/checkout:
 *   post:
 *     summary: تبدیل سبد خرید به سفارش نهایی و خالی کردن سبد
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               shippingAddress:
 *                 type: string
 *                 example: تهران، خیابان ولیعصر، پلاک ۱۲
 *     responses:
 *       201:
 *         description: سفارش ثبت شد
 *       400:
 *         description: >
 *           سبد خرید خالی است (Cart is empty) /
 *           موجودی یکی از محصولات کافی نیست (... stock is insufficient)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: "سبد خرید پیدا نشد (Cart not found)"
 */
router.post("/checkout", authMiddleware, checkoutCart);

/**
 * @swagger
 * /api/cart/apply-coupon:
 *   post:
 *     summary: اعمال کد تخفیف روی سبد خرید
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: SUMMER20
 *     responses:
 *       200:
 *         description: کد تخفیف اعمال شد
 *       400:
 *         description: >
 *           کوپن قبلاً روی این سبد اعمال شده (Coupon already applied to cart) /
 *           کوپن غیرفعال است (Coupon is inactive) /
 *           کوپن منقضی شده (Coupon has expired) /
 *           سقف استفاده از کوپن پر شده (Coupon usage limit reached)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: >
 *           سبد خرید پیدا نشد (Cart not found) /
 *           کد تخفیف معتبر نیست (Invalid coupon code)
 */
router.post("/apply-coupon", authMiddleware, applyCoupon);

/**
 * @swagger
 * /api/cart/{productId}:
 *   patch:
 *     summary: بروزرسانی تعداد یک محصول در سبد خرید
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *                 example: 3
 *     responses:
 *       200:
 *         description: تعداد محصول بروز شد
 *       400:
 *         description: >
 *           productId نامعتبر (Invalid product id) /
 *           quantity صفر یا منفی (Quantity must be greater than 0) /
 *           موجودی کافی نیست (Insufficient stock)
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: >
 *           سبد خرید پیدا نشد (Cart not found) /
 *           محصول در سبد خرید پیدا نشد (Product not found in cart) /
 *           محصول پیدا نشد (Product not found)
 */
router.patch("/:productId", authMiddleware, updateCartItemQuantity);

/**
 * @swagger
 * /api/cart/{productId}:
 *   delete:
 *     summary: حذف یک محصول از سبد خرید
 *     tags: [Cart]
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
 *         description: محصول از سبد حذف شد
 *       400:
 *         description: "productId نامعتبر است (Invalid product id)"
 *       401:
 *         description: توکن نامعتبر یا ارسال نشده
 *       404:
 *         description: >
 *           سبد خرید پیدا نشد (Cart not found) /
 *           محصول در سبد خرید پیدا نشد (Product not found in cart)
 */
router.delete("/:productId", authMiddleware, removeCartItem);

module.exports = router;
