const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authLimiter = require("../middlewares/authLimiter");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");
const validate = require("../middlewares/validationMiddleware");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: احراز هویت و مدیریت حساب کاربری
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: ثبت‌نام کاربر جدید
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: علی رضایی
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ali@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 30
 *                 example: pass1234
 *     responses:
 *       201:
 *         description: ثبت‌نام موفق
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: >
 *           خطای Joi validation (می‌آید از validationMiddleware، نه از auth.service).
 *           شکل پاسخ متفاوت است: { success:false, errors:[...] }
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Password must be at least 6 characters"]
 *       409:
 *         description: "ایمیل تکراری است (Email already exists)"
 *       429:
 *         description: "تعداد درخواست بیش از حد مجاز (Too many attempts, please try again after 15 minutes.)"
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: ورود کاربر
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ali@example.com
 *               password:
 *                 type: string
 *                 example: pass1234
 *     responses:
 *       200:
 *         description: ورود موفق
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: "خطای Joi validation (email یا password ارسال نشده)"
 *       401:
 *         description: "ایمیل یا رمز اشتباه (Email or password is incorrect)"
 *       429:
 *         description: "تعداد درخواست بیش از حد مجاز (Too many attempts, please try again after 15 minutes.)"
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: دریافت Access Token جدید با استفاده از Refresh Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: توکن جدید صادر شد
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: >
 *           چهار حالت ممکن: Refresh token is required (خالی) /
 *           Expired refresh token (منقضی یا امضای نامعتبر JWT) /
 *           Invalid refresh token (در دیتابیس کاربر پیدا نشد - تطابق هش)
 *       404:
 *         description: "کاربر صاحب توکن پیدا نشد (User not found)"
 *       429:
 *         description: "تعداد درخواست بیش از حد مجاز (Too many attempts, please try again after 15 minutes.)"
 */
router.post("/refresh-token", authLimiter, authController.refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: دریافت اطلاعات کاربر لاگین شده
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: اطلاعات کاربر
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: >
 *           از authMiddleware (نه از سرویس): توکن ارسال نشده
 *           (Access denied. No token provided.) / فرمت نادرست
 *           (Invalid token format.) / منقضی یا نامعتبر
 *           (Invalid or expired token.) / کاربر حذف شده (User not found.)
 */
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

/**
 * @swagger
 * /api/auth/admin-test:
 *   get:
 *     summary: تست دسترسی ادمین
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: دسترسی ادمین تایید شد
 *       401:
 *         description: "از authMiddleware: توکن نامعتبر یا ارسال نشده"
 *       403:
 *         description: "از adminMiddleware: نقش کاربر admin نیست (Access denied. Admin only.)"
 */
router.get("/admin-test", authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({ success: true, message: "Welcome Admin" });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: خروج از حساب کاربری (حذف یک refresh token مشخص)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: خروج موفق
 *       400:
 *         description: "Refresh token در body ارسال نشده (Refresh token is required)"
 *       401:
 *         description: >
 *           از authMiddleware (access token نامعتبر) یا از auth.service
 *           (Invalid refresh token - امضا نامعتبر یا در دیتابیس پیدا نشد)
 *       404:
 *         description: کاربر پیدا نشد
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: درخواست بازیابی رمز عبور
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ali@example.com
 *     responses:
 *       200:
 *         description: >
 *           همیشه پیام موفقیت برمی‌گردد (حتی اگر ایمیل وجود نداشته باشد)
 *           تا از User Enumeration جلوگیری شود.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: If this email is registered, a reset link has been sent.
 *       400:
 *         description: "خطای Joi validation (ایمیل ارسال نشده یا نامعتبر)"
 *       429:
 *         description: "تعداد درخواست بیش از حد مجاز (Too many attempts)"
 */
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: تنظیم رمز عبور جدید با استفاده از توکن بازیابی
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: توکن بازیابی دریافت‌شده از لینک ایمیل
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 30
 *                 example: newpass1234
 *     responses:
 *       200:
 *         description: رمز عبور با موفقیت تغییر کرد
 *       400:
 *         description: >
 *           خطای Joi validation (رمز کوتاه‌تر از 6 کاراکتر) یا
 *           توکن نامعتبر/منقضی‌شده (Invalid or expired reset token)
 *       429:
 *         description: تعداد درخواست بیش از حد مجاز
 */
router.post(
  "/reset-password/:token",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: تغییر رمز عبور (کاربر لاگین‌شده)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: pass1234
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 30
 *                 example: newpass5678
 *     responses:
 *       200:
 *         description: رمز عبور تغییر کرد - همه نشست‌های قبلی باطل شدند
 *       400:
 *         description: >
 *           خطای Joi validation یا رمز جدید با رمز فعلی یکسان است
 *           (New password must be different from current password)
 *       401:
 *         description: >
 *           توکن نامعتبر یا رمز فعلی اشتباه است
 *           (Current password is incorrect)
 *       404:
 *         description: کاربر پیدا نشد
 */
router.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword,
);
module.exports = router;
