/**
 * Jest Global Setup
 * =================
 * این فایل یک بار قبل از همه تست‌ها اجرا می‌شود.
 *
 * چرا از دیتابیس جداگانه استفاده می‌کنیم؟
 * چون تست‌ها داده می‌سازند، تغییر می‌دهند و حذف می‌کنند.
 * اگر روی dev DB اجرا شوند، داده‌های واقعی خراب می‌شود.
 */

const mongoose = require("mongoose");

module.exports = async () => {
  // اتصال به دیتابیس تست (جدا از dev)
  const MONGO_TEST_URI =
    process.env.MONGO_TEST_URI ||
    "mongodb://127.0.0.1:27017/admin-dashboard-test";

  await mongoose.connect(MONGO_TEST_URI);

  // ذخیره URI برای teardown
  global.__MONGO_URI__ = MONGO_TEST_URI;

  console.log("\n🧪 Test DB connected:", MONGO_TEST_URI);
};
