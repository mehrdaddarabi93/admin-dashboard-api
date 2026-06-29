const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order"); // ⭐ اضافه شد

/**
 * دریافت آمار کامل داشبورد
 *
 * شامل:
 * - آمار کاربران
 * - آمار محصولات
 * - آمار دسته‌بندی‌ها
 * - آمار فروش و تحلیل‌ها
 */
const getDashboardStats = async () => {
  /* =========================
     👤 USER STATS
  ========================= */
  const totalUsers = await User.countDocuments();

  const totalAdmins = await User.countDocuments({
    role: "admin",
  });

  const totalCustomers = await User.countDocuments({
    role: "user",
  });

  /* =========================
     📦 PRODUCT STATS
  ========================= */
  const totalProducts = await Product.countDocuments({
    isDeleted: false,
  });

  const deletedProducts = await Product.countDocuments({
    isDeleted: true,
  });

  const totalCategories = await Category.countDocuments();

  /* =========================
     💰 ORDER + REVENUE ANALYTICS
  ========================= */

  const orderStats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
        avgOrderValue: { $avg: "$totalPrice" },
      },
    },
  ]);

  const totalOrders = orderStats[0]?.totalOrders || 0;
  const totalRevenue = orderStats[0]?.totalRevenue || 0;
  const avgOrderValue = orderStats[0]?.avgOrderValue || 0;

  /* =========================
     🔥 BEST SELLING PRODUCTS
  ========================= */

  const bestSellingProducts = await Order.aggregate([
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.product",
        totalSold: { $sum: "$orderItems.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  /* =========================
     📊 SALES BY CATEGORY
  ========================= */

  const salesByCategory = await Order.aggregate([
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.category",
        totalSales: { $sum: "$orderItems.quantity" },
      },
    },
    { $sort: { totalSales: -1 } },
  ]);

  /* =========================
     📦 FINAL RESPONSE
  ========================= */

  return {
    users: {
      totalUsers,
      totalAdmins,
      totalCustomers,
    },

    products: {
      totalProducts,
      deletedProducts,
      totalCategories,
    },

    orders: {
      totalOrders,
      totalRevenue,
      avgOrderValue,
    },

    analytics: {
      bestSellingProducts,
      salesByCategory,
    },
  };
};

module.exports = {
  getDashboardStats,
};
