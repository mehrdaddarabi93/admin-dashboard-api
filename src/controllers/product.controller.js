const productService = require("../services/product.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ایجاد محصول جدید
 *
 * @route POST /api/products
 * @access Private (Admin)
 *
 * @param {Object} req.body اطلاعات محصول
 * @param {string} req.body.name نام محصول
 * @param {string} req.body.description توضیحات محصول
 * @param {number} req.body.price قیمت محصول
 * @param {string} req.body.category دسته‌بندی محصول
 *
 * @returns {Object} محصول ایجاد شده
 */
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

/**
 * دریافت لیست محصولات به همراه صفحه‌بندی
 *
 * @route GET /api/products
 * @access Public
 *
 * @query {number} page شماره صفحه
 * @query {number} limit تعداد آیتم در هر صفحه
 *
 * @returns {Object} لیست محصولات و اطلاعات صفحه‌بندی
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;

  // جلوگیری از مقادیر نامعتبر
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const result = await productService.getAllProducts(page, limit);

  res.status(200).json({
    success: true,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    data: result.products,
  });
});

/**
 * دریافت اطلاعات یک محصول
 *
 * @route GET /api/products/:id
 * @access Public
 *
 * @param {string} req.params.id شناسه محصول
 *
 * @returns {Object} اطلاعات محصول
 */
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * بروزرسانی محصول
 *
 * @route PUT /api/products/:id
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {Object} req.body اطلاعات جدید محصول
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

/**
 * حذف نرم محصول
 *
 * @route DELETE /api/products/:id
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 *
 * @returns {Object} پیام موفقیت
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

/**
 * بازیابی محصول حذف شده
 *
 * @route PATCH /api/products/:id/restore
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 *
 * @returns {Object} محصول بازیابی شده
 */
exports.restoreProduct = asyncHandler(async (req, res) => {
  const product = await productService.restoreProduct(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product restored successfully",
    data: product,
  });
});

/**
 * دریافت محصولات حذف شده
 *
 * @route GET /api/products/deleted
 * @access Private (Admin)
 *
 * @returns {Array} لیست محصولات حذف شده
 */
exports.getDeletedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getDeletedProducts();

  res.status(200).json({
    success: true,
    data: products,
  });
});

/**
 * آپلود تصویر اصلی محصول
 *
 * @route POST /api/products/:id/image
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {File} req.file فایل تصویر
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.uploadProductImage = asyncHandler(async (req, res) => {
  const product = await productService.uploadProductImage(
    req.params.id,
    req.file.filename,
  );

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    data: product,
  });
});

/**
 * آپلود چند تصویر برای گالری محصول
 *
 * @route POST /api/products/:id/gallery
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {File[]} req.files تصاویر گالری
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.uploadProductImages = asyncHandler(async (req, res) => {
  const imageNames = req.files.map((file) => file.filename);

  const product = await productService.uploadProductImages(
    req.params.id,
    imageNames,
  );

  res.status(200).json({
    success: true,
    message: "Images uploaded successfully",
    data: product,
  });
});

/**
 * حذف تصویر از گالری محصول
 *
 * @route DELETE /api/products/:id/images/:imageName
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {string} req.params.imageName نام فایل تصویر
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.deleteProductImage = asyncHandler(async (req, res) => {
  const product = await productService.deleteProductImage(
    req.params.id,
    req.params.imageName,
  );

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
    data: product,
  });
});

/**
 * تعیین تصویر اصلی محصول
 *
 * @route PATCH /api/products/:id/main-image/:imageName
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {string} req.params.imageName نام تصویر
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.setMainImage = asyncHandler(async (req, res) => {
  const product = await productService.setMainImage(
    req.params.id,
    req.params.imageName,
  );

  res.status(200).json({
    success: true,
    message: "Main image updated successfully",
    data: product,
  });
});

/**
 * افزودن Variant به محصول
 *
 * @route POST /api/products/:id/variants
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {Object} req.body اطلاعات Variant
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.addProductVariant = asyncHandler(async (req, res) => {
  const product = await productService.addProductVariant(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Variant added successfully",
    data: product,
  });
});

/**
 * کاهش موجودی محصول
 *
 * @route PATCH /api/products/:id/stock/decrease
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {number} req.body.quantity مقدار کاهش
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.decreaseStock = asyncHandler(async (req, res) => {
  const product = await productService.decreaseStock(
    req.params.id,
    Number(req.body.quantity),
  );

  res.status(200).json({
    success: true,
    message: "Stock decreased successfully",
    data: product,
  });
});

/**
 * افزایش موجودی محصول
 *
 * @route PATCH /api/products/:id/stock/increase
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {number} req.body.quantity مقدار افزایش
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.increaseStock = asyncHandler(async (req, res) => {
  const product = await productService.increaseStock(
    req.params.id,
    Number(req.body.quantity),
  );

  res.status(200).json({
    success: true,
    message: "Stock increased successfully",
    data: product,
  });
});

/**
 * ثبت نظر برای محصول
 *
 * @route POST /api/products/:id/reviews
 * @access Private (User)
 *
 * @param {string} req.params.id شناسه محصول
 * @param {string} req.user.id شناسه کاربر
 * @param {Object} req.body اطلاعات نظر
 *
 * @returns {Object} محصول بروزرسانی شده
 */
exports.addReview = asyncHandler(async (req, res) => {
  const product = await productService.addReview(
    req.params.id,
    req.user.id,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Review added successfully",
    data: product,
  });
});

/**
 * دریافت نظرات یک محصول
 *
 * @route GET /api/products/:id/reviews
 * @access Public
 *
 * @param {string} req.params.id شناسه محصول
 *
 * @returns {Array} لیست نظرات محصول
 */
exports.getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await productService.getProductReviews(req.params.id);

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});
/**
 * ویرایش نظر محصول
 *
 * @route PATCH /api/products/:id/reviews/:reviewId
 * @access Private
 */
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await productService.updateReview(
    req.params.id,
    req.params.reviewId,
    req.user._id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    data: review,
  });
});

/**
 * حذف نظر محصول
 *
 * @route DELETE /api/products/:id/reviews/:reviewId
 * @access Private
 */
exports.deleteReview = asyncHandler(async (req, res) => {
  await productService.deleteReview(
    req.params.id,
    req.params.reviewId,
    req.user._id,
  );

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

/**
 * جستجوی محصولات
 *
 * @route GET /api/products/search
 * @access Public
 */
exports.searchProducts = asyncHandler(async (req, res) => {
  const result = await productService.searchProducts(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});
