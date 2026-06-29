const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { roleHasPermission, PERMISSIONS } = require("../configs/permissions");

/**
 * ایجاد سفارش جدید
 *
 * @param {String} userId
 * @param {Object} data
 *
 * @returns {Object}
 */
const createOrder = async (userId, data) => {
  const { orderItems, shippingAddress } = data;

  /**
   * اعتبارسنجی آیتم‌ها
   */
  if (!orderItems || orderItems.length === 0) {
    throw new AppError("Order items are required", 400);
  }

  let totalPrice = 0;

  const items = [];

  /**
   * پردازش محصولات سفارش
   */
  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    /**
     * بررسی موجودی
     */
    if (product.stock < item.quantity) {
      throw new AppError(`${product.name} stock is insufficient`, 400);
    }

    /**
     * محاسبه مبلغ
     */
    totalPrice += product.price * item.quantity;

    items.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
    });

    /**
     * کاهش موجودی
     */
    product.stock -= item.quantity;

    await product.save();
  }

  /**
   * ایجاد سفارش
   */
  const order = await Order.create({
    user: userId,

    orderItems: items,

    totalPrice,

    shippingAddress,
  });

  return order;
};
/**
 * دریافت سفارش‌های کاربر
 *
 * @param {String} userId
 * @returns {Array}
 */
const getMyOrders = async (userId) => {
  const orders = await Order.find({
    user: userId,
  })
    .populate("orderItems.product", "name price images")
    .sort({
      createdAt: -1,
    });

  return orders;
};

const validateObjectId = require("../utils/validateObjectId");

/**
 * دریافت جزئیات سفارش
 *
 * @param {String} orderId
 * @param {Object} user
 *
 * @returns {Object}
 */
const getOrderById = async (orderId, user) => {
  /**
   * اعتبارسنجی شناسه سفارش
   */
  if (!validateObjectId(orderId)) {
    throw new AppError("Invalid order id", 400);
  }

  /**
   * دریافت سفارش
   */
  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("orderItems.product", "name price images");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  /**
   * بررسی دسترسی
   */
  const isOwner = order.user._id.toString() === user._id.toString();

  // بررسی مجوز MANAGE_ORDERS به‌جای چک مستقیم role
  // support، admin و chiefadmin همه این مجوز را دارند
  const canManageOrders = roleHasPermission(
    user.role,
    PERMISSIONS.MANAGE_ORDERS,
  );

  if (!isOwner && !canManageOrders) {
    throw new AppError("Not authorized", 403);
  }

  return order;
};

/**
 * دریافت تمام سفارش‌ها
 *
 * @returns {Array}
 */
const getAllOrders = async () => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("orderItems.product", "name")
    .sort({
      createdAt: -1,
    });

  return orders;
};

/**
 * بروزرسانی وضعیت سفارش
 *
 * @param {String} orderId
 * @param {String} status
 *
 * @returns {Object}
 */
const updateOrderStatus = async (orderId, status) => {
  /**
   * اعتبارسنجی شناسه
   */
  if (!validateObjectId(orderId)) {
    throw new AppError("Invalid order id", 400);
  }

  /**
   * وضعیت‌های مجاز
   */
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }

  /**
   * دریافت سفارش
   */
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  /**
   * قوانین تغییر وضعیت
   */
  const transitions = {
    pending: ["processing", "cancelled"],

    processing: ["shipped", "cancelled"],

    shipped: ["delivered"],

    delivered: [],

    cancelled: [],
  };

  /**
   * بررسی مجاز بودن تغییر وضعیت
   */
  const allowedStatuses = transitions[order.status];

  if (!allowedStatuses.includes(status)) {
    throw new AppError(
      `Cannot change status from ${order.status} to ${status}`,
      400,
    );
  }

  /**
   * بروزرسانی وضعیت
   */
  order.status = status;

  await order.save();

  return order;
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
