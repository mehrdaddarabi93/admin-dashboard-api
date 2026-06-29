/**
 * Jest Global Teardown
 * ====================
 * این فایل یک بار بعد از همه تست‌ها اجرا می‌شود.
 * دیتابیس تست را پاک و اتصال را قطع می‌کند.
 */

const mongoose = require("mongoose");

module.exports = async () => {
  // پاک کردن کل دیتابیس تست
  await mongoose.connection.dropDatabase();

  // قطع اتصال
  await mongoose.disconnect();

  console.log("\n🧹 Test DB cleaned and disconnected.");
};
