/**
 * اعتبارسنجی متغیرهای محیطی حیاتی هنگام راه‌اندازی سرور.
 *
 * چرا این فایل لازم است؟
 * بدون این بررسی، اگر یکی از متغیرهای حیاتی (مثل JWT_SECRET) در
 * فایل .env تعریف نشده باشد، سرور بدون خطا بالا می‌آید ولی با
 * رفتار ناامن کار می‌کند (مثلاً jsonwebtoken با secret برابر
 * رشته "undefined" توکن امضا می‌کند که هرکسی می‌تواند جعلش کند).
 *
 * با این تابع، اگر یکی از متغیرهای ضروری غایب باشد، سرور اصلاً
 * بالا نمی‌آید و پیام خطای واضح نمایش می‌دهد (Fail Fast).
 */

const REQUIRED_ENV_VARS = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "FRONTEND_URL",
];
function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ متغیرهای محیطی ضروری زیر در فایل .env تعریف نشده‌اند:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("سرور متوقف شد. لطفاً فایل .env را تکمیل کنید.");
    process.exit(1);
  }

  // هشدار (نه توقف) برای حالتی که secret خیلی کوتاه و ضعیف انتخاب شده
  if (process.env.JWT_SECRET.length < 16) {
    console.warn(
      "⚠️  هشدار: JWT_SECRET کوتاه‌تر از حد امن است (حداقل 16 کاراکتر پیشنهاد می‌شود).",
    );
  }

  console.log("✅ تمام متغیرهای محیطی ضروری بررسی و تایید شدند.");
}

module.exports = validateEnv;
