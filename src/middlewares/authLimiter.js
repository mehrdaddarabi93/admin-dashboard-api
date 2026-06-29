const rateLimit = require("express-rate-limit");

/**
 * تعداد تلاش مجاز بسته به محیط اجرا متفاوت است:
 * - در production باید سخت‌گیرانه باشد (مقابله با brute-force واقعی)
 * - در development باید بازتر باشد، چون توسعه‌دهنده و اسکریپت‌های
 *   تست به‌طور مکرر روی همین چند مسیر درخواست می‌زنند
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: process.env.NODE_ENV === "production" ? 5 : 50,
  message: {
    success: false,
    message: "Too many attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = authLimiter;
