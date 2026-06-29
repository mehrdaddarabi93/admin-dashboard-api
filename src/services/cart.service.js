const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const validateObjectId = require("../utils/validateObjectId");
const calculateCartTotals = require("../utils/cartCalculator");

/**
 * افزودن محصول به سبد خرید
 *
 * @param {String} userId
 * @param {Object} data
 *
 * @returns {Object}
 */
const addToCart = async (userId, data) => {
  const { productId, quantity = 1 } = data;

  /**
   * اعتبارسنجی شناسه محصول
   */
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  /**
   * بررسی محصول
   */
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  /**
   * بررسی موجودی
   */
  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  /**
   * دریافت سبد خرید
   */
  let cart = await Cart.findOne({
    user: userId,
  });

  /**
   * اگر سبد خرید وجود ندارد
   */
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  /**
   * بررسی وجود محصول در سبد
   */
  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (existingItem) {
    /**
     * افزایش تعداد
     */
    existingItem.quantity += quantity;
  } else {
    /**
     * افزودن محصول جدید
     */
    cart.items.push({
      product: productId,
      quantity,
    });
  }

  await cart.save();

  return cart;
};
/**
 * دریافت سبد خرید کاربر
 *
 * @param {String} userId
 *
 * @returns {Object}
 */
const getCart = async (userId) => {
  const cart = await Cart.findOne({
    user: userId,
  })
    .populate("items.product", "title price images stock")
    .populate("coupon");

  if (!cart) {
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      totalPrice: 0,
    };
  }

  const totals = calculateCartTotals(cart.items, cart.coupon);

  return {
    ...cart.toObject(),
    ...totals,
  };
};

/**
 * بروزرسانی تعداد محصول در سبد خرید
 *
 * @param {String} userId
 * @param {String} productId
 * @param {Number} quantity
 *
 * @returns {Object}
 */
const updateCartItemQuantity = async (userId, productId, quantity) => {
  /**
   * اعتبارسنجی شناسه محصول
   */
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  /**
   * اعتبارسنجی تعداد
   */
  if (!quantity || quantity < 1) {
    throw new AppError("Quantity must be greater than 0", 400);
  }

  /**
   * دریافت محصول
   */
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  /**
   * بررسی موجودی
   */
  if (quantity > product.stock) {
    throw new AppError("Insufficient stock", 400);
  }

  /**
   * دریافت سبد خرید
   */
  const cart = await Cart.findOne({
    user: userId,
  });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  /**
   * پیدا کردن آیتم
   */
  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) {
    throw new AppError("Product not found in cart", 404);
  }

  /**
   * بروزرسانی تعداد
   */
  item.quantity = quantity;

  await cart.save();

  return cart;
};
/**
 * حذف محصول از سبد خرید
 *
 * @param {String} userId
 * @param {String} productId
 *
 * @returns {Object}
 */
const removeCartItem = async (userId, productId) => {
  /**
   * اعتبارسنجی شناسه محصول
   */
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  /**
   * دریافت سبد خرید
   */
  const cart = await Cart.findOne({
    user: userId,
  });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  /**
   * بررسی وجود محصول در سبد
   */
  const itemExists = cart.items.some(
    (item) => item.product.toString() === productId,
  );

  if (!itemExists) {
    throw new AppError("Product not found in cart", 404);
  }

  /**
   * حذف محصول از سبد
   */
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId,
  );

  await cart.save();

  return cart;
};

/**
 * پاک کردن کامل سبد خرید
 *
 * @param {String} userId
 *
 * @returns {Object}
 */
const clearCart = async (userId) => {
  /**
   * دریافت سبد خرید
   */
  const cart = await Cart.findOne({
    user: userId,
  });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  /**
   * حذف تمام آیتم‌ها
   */
  cart.items = [];

  await cart.save();

  return cart;
};

/**
 * تبدیل سبد خرید به سفارش
 *
 * @param {String} userId
 * @param {String} shippingAddress
 *
 * @returns {Object}
 */
const checkoutCart = async (userId, shippingAddress) => {
  const cart = await Cart.findOne({
    user: userId,
  })
    .populate("items.product")
    .populate("coupon");

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  if (cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const orderItems = [];

  /**
   * پردازش محصولات
   */
  for (const item of cart.items) {
    const product = item.product;

    if (product.stock < item.quantity) {
      throw new AppError(`${product.name} stock is insufficient`, 400);
    }

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
    });

    product.stock -= item.quantity;
    await product.save();
  }

  /**
   * محاسبه قیمت نهایی با تخفیف
   */
  const totals = calculateCartTotals(cart.items, cart.coupon);

  /**
   * ایجاد سفارش
   */
  const order = await Order.create({
    user: userId,
    orderItems,
    totalPrice: totals.totalPrice,
    shippingAddress,
  });

  /**
   * افزایش usedCount کوپن
   */
  if (cart.coupon) {
    await Coupon.findByIdAndUpdate(cart.coupon._id, {
      $inc: { usedCount: 1 },
    });
  }

  /**
   * پاک کردن سبد خرید
   */
  cart.items = [];
  cart.coupon = null; // ⭐ این مهم بود که قبلاً جا افتاده بود
  await cart.save();

  return order;
};

/**
 * اعمال کد تخفیف روی سبد خرید
 *
 * @param {String} userId
 * @param {String} code
 *
 * @returns {Object}
 */
const applyCoupon = async (userId, code) => {
  /**
   * دریافت سبد خرید
   */
  const cart = await Cart.findOne({
    user: userId,
  });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  /**
   * جلوگیری از دوباره اعمال شدن
   */
  if (cart.coupon) {
    throw new AppError("Coupon already applied to cart", 400);
  }

  /**
   * دریافت کوپن
   */
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
  });

  if (!coupon) {
    throw new AppError("Invalid coupon code", 404);
  }

  /**
   * بررسی فعال بودن
   */
  if (!coupon.isActive) {
    throw new AppError("Coupon is inactive", 400);
  }

  /**
   * بررسی تاریخ انقضا
   */
  if (coupon.expiresAt < new Date()) {
    throw new AppError("Coupon has expired", 400);
  }

  /**
   * بررسی محدودیت استفاده
   */
  if (coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  /**
   * اعمال کوپن
   */
  cart.coupon = coupon._id;

  await cart.save();

  return cart;
};
module.exports = {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  checkoutCart,
  applyCoupon,
};
