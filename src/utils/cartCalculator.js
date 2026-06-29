/**
 * محاسبه اطلاعات مالی سبد خرید
 *
 * @param {Array} items
 * @param {Object|null} coupon
 *
 * @returns {Object}
 */
const calculateCartTotals = (items, coupon = null) => {
  /**
   * مبلغ خام
   */
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  /**
   * مبلغ تخفیف
   */
  let discount = 0;

  if (coupon) {
    discount = (subtotal * coupon.discountPercentage) / 100;
  }

  /**
   * مبلغ نهایی
   */
  const totalPrice = subtotal - discount;

  return {
    subtotal,

    discount,

    totalPrice,
  };
};

module.exports = calculateCartTotals;
