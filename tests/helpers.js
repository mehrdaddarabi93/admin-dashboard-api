/**
 * توابع کمکی مشترک برای تست‌ها
 * ==============================
 * به‌جای اینکه در هر فایل تست کد تکراری بنویسیم
 * (مثل ساخت کاربر، گرفتن توکن)، اینجا یک‌بار می‌نویسیم.
 */

const mongoose = require("mongoose");
const User = require("../src/models/User");
const bcrypt = require("bcryptjs");

/**
 * پاک کردن همه collection ها قبل از هر تست
 * چرا؟ تا تست‌ها روی هم تأثیر نگذارند (test isolation)
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * ساخت کاربر تستی مستقیم در دیتابیس (بدون API)
 * چرا مستقیم؟ چون نمی‌خواهیم تست auth به تست register وابسته باشد.
 *
 * @param {Object} overrides - فیلدهایی که می‌خواهیم override کنیم
 * @returns {Object} کاربر ساخته‌شده
 */
const createUser = async (overrides = {}) => {
  const defaults = {
    name: "Test User",
    email: "test@example.com",
    password: await bcrypt.hash("pass1234", 10),
    role: "user",
    isActive: true,
  };

  return User.create({ ...defaults, ...overrides });
};

/**
 * ساخت کاربر chiefadmin برای تست‌های RBAC
 */
const createChiefAdmin = async () => {
  return createUser({
    name: "Chief Admin",
    email: "chief@example.com",
    password: await bcrypt.hash("pass1234", 10),
    role: "chiefadmin",
  });
};

module.exports = {
  clearDatabase,
  createUser,
  createChiefAdmin,
};
