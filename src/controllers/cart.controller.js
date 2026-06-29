const cartService = require("../services/cart.service");

const asyncHandler = require("../utils/asyncHandler");

/**
 * افزودن محصول به سبد خرید
 *
 * @route POST /api/cart
 * @access Private
 */
exports.addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Product added to cart",
    data: cart,
  });
});

/**
 * دریافت سبد خرید کاربر
 *
 * @route GET /api/cart
 * @access Private
 */
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);

  res.status(200).json({
    success: true,
    data: cart,
  });
});

/**
 * بروزرسانی تعداد محصول
 *
 * @route PATCH /api/cart/:productId
 * @access Private
 */
exports.updateCartItemQuantity = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItemQuantity(
    req.user._id,
    req.params.productId,
    req.body.quantity,
  );

  res.status(200).json({
    success: true,

    message: "Cart item updated successfully",

    data: cart,
  });
});

/**
 * حذف محصول از سبد خرید
 *
 * @route DELETE /api/cart/:productId
 * @access Private
 */
exports.removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(
    req.user._id,
    req.params.productId,
  );

  res.status(200).json({
    success: true,

    message: "Product removed from cart successfully",

    data: cart,
  });
});
/**
 * پاک کردن کامل سبد خرید
 *
 * @route DELETE /api/cart
 * @access Private
 */
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);

  res.status(200).json({
    success: true,

    message: "Cart cleared successfully",

    data: cart,
  });
});

/**
 * تبدیل سبد خرید به سفارش
 *
 * @route POST /api/cart/checkout
 * @access Private
 */
exports.checkoutCart = asyncHandler(async (req, res) => {
  const order = await cartService.checkoutCart(
    req.user._id,
    req.body.shippingAddress,
  );

  res.status(201).json({
    success: true,

    message: "Order created successfully",

    data: order,
  });
});

/**
 * اعمال کد تخفیف
 *
 * @route POST /api/cart/apply-coupon
 * @access Private
 */
exports.applyCoupon = asyncHandler(async (req, res) => {
  const cart = await cartService.applyCoupon(req.user._id, req.body.code);

  res.status(200).json({
    success: true,

    message: "Coupon applied successfully",

    data: cart,
  });
});
