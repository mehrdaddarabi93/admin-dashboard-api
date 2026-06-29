const asyncHandler = require("../utils/asyncHandler");

const orderService = require("../services/order.service");

/**
 * ایجاد سفارش
 *
 * @route POST /api/orders
 * @access Private
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);

  res.status(201).json({
    success: true,

    message: "Order created successfully",

    data: order,
  });
});

/**
 * دریافت سفارش‌های کاربر
 *
 * @route GET /api/orders/my-orders
 * @access Private
 */
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user._id);

  res.status(200).json({
    success: true,

    count: orders.length,

    data: orders,
  });
});
/**
 * دریافت جزئیات سفارش
 *
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * دریافت تمام سفارش‌ها
 *
 * @route GET /api/orders
 * @access Admin
 */
exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();

  res.status(200).json({
    success: true,

    count: orders.length,

    data: orders,
  });
});

/**
 * بروزرسانی وضعیت سفارش
 *
 * @route PATCH /api/orders/:id/status
 * @access Admin
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
  );

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: order,
  });
});
