const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const Category = require("../models/Category");
const validateObjectId = require("../utils/validateObjectId");
const AppError = require("../utils/AppError");

/**
 * ایجاد محصول جدید
 *
 * @param {Object} productData
 * @param {string} productData.title
 * @param {string} productData.slug
 * @param {string} productData.description
 * @param {number} productData.price
 * @param {number} productData.stock
 * @param {string} productData.category
 *
 * @returns {Object} محصول ایجاد شده
 */
const createProduct = async (productData) => {
  const { title, slug, description, price, stock, category } = productData;

  const productExists = await Product.findOne({ slug });

  if (productExists) {
    throw new AppError("Product slug already exists", 409);
  }

  const categoryExists = await Category.findById(category);

  if (!categoryExists) {
    throw new AppError("Category not found", 404);
  }

  const product = await Product.create({
    title,
    slug,
    description,
    price,
    stock,
    category,
  });

  return product;
};

/**
 * دریافت لیست محصولات (Pagination)
 *
 * @param {number} page
 * @param {number} limit
 *
 * @returns {Object}
 */
const getAllProducts = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const total = await Product.countDocuments({
    isDeleted: false,
  });

  const products = await Product.find({
    isDeleted: false,
  })
    .populate("category", "title slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    products,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * دریافت محصول بر اساس ID
 *
 * @param {string} id
 * @returns {Object}
 */
const getProductById = async (id) => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("category", "title slug")
    .lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

/**
 * بروزرسانی محصول
 *
 * @param {string} id
 * @param {Object} updateData
 * @returns {Object}
 */
const updateProduct = async (id, updateData) => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (updateData.slug) {
    const slugExists = await Product.findOne({
      slug: updateData.slug,
      _id: { $ne: id },
    });

    if (slugExists) {
      throw new AppError("Product slug already exists", 409);
    }
  }

  if (updateData.category) {
    const categoryExists = await Category.findById(updateData.category);

    if (!categoryExists) {
      throw new AppError("Category not found", 404);
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate("category", "title slug")
    .lean();

  return updatedProduct;
};

/**
 * حذف نرم محصول (Soft Delete)
 *
 * @param {string} id
 * @returns {boolean}
 */
const deleteProduct = async (id) => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.isDeleted = true;

  await product.save();

  return true;
};

/**
 * بازیابی محصول حذف شده
 *
 * @param {string} id
 * @returns {Object}
 */
const restoreProduct = async (id) => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findOne({
    _id: id,
    isDeleted: true,
  });

  if (!product) {
    throw new AppError("Deleted product not found", 404);
  }

  product.isDeleted = false;

  await product.save();

  return product;
};

/**
 * دریافت محصولات حذف شده
 *
 * @returns {Array}
 */
const getDeletedProducts = async () => {
  return Product.find({ isDeleted: true })
    .populate("category", "title slug")
    .lean();
};

/**
 * آپلود تصویر اصلی محصول
 *
 * ⚠️ اصلاح شده: image → mainImage
 *
 * @param {string} productId
 * @param {string} imageName
 * @returns {Object}
 */
const uploadProductImage = async (productId, imageName) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.mainImage = imageName;

  await product.save();

  return product;
};

/**
 * آپلود چند تصویر برای محصول
 *
 * @param {string} productId
 * @param {string[]} imageNames
 * @returns {Object}
 */
const uploadProductImages = async (productId, imageNames) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.images.push(...imageNames);

  await product.save();

  return product;
};

/**
 * حذف تصویر از گالری محصول
 *
 * @param {string} productId
 * @param {string} imageName
 * @returns {Object}
 */
const deleteProductImage = async (productId, imageName) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.images.includes(imageName)) {
    throw new AppError("Image not found in gallery", 404);
  }

  product.images = product.images.filter((img) => img !== imageName);

  await product.save();

  const imagePath = path.join(process.cwd(), "uploads", "products", imageName);

  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  return product;
};

/**
 * تعیین تصویر اصلی محصول
 *
 * @param {string} productId
 * @param {string} imageName
 * @returns {Object}
 */
const setMainImage = async (productId, imageName) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.images.includes(imageName)) {
    throw new AppError("Image not found in gallery", 404);
  }

  product.mainImage = imageName;

  await product.save();

  return product;
};

/**
 * افزودن variant به محصول
 *
 * @param {string} productId
 * @param {Object} variantData
 * @returns {Object}
 */
const addProductVariant = async (productId, variantData) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.variants.push(variantData);

  await product.save();

  return product;
};

/**
 * کاهش موجودی محصول
 *
 * @param {string} productId
 * @param {number} quantity
 * @returns {Object}
 */
const decreaseStock = async (productId, quantity) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than zero", 400);
  }

  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  product.stock -= quantity;

  await product.save();

  return product;
};

/**
 * افزایش موجودی محصول
 *
 * @param {string} productId
 * @param {number} quantity
 * @returns {Object}
 */
const increaseStock = async (productId, quantity) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than zero", 400);
  }

  product.stock += quantity;

  await product.save();

  return product;
};

/**
 * ثبت نظر برای محصول
 *
 * @param {string} productId
 * @param {string} userId
 * @param {Object} reviewData
 * @returns {Object}
 */
const addReview = async (productId, userId, reviewData) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === userId,
  );

  if (alreadyReviewed) {
    throw new AppError("You already reviewed this product", 400);
  }

  product.reviews.push({
    user: userId,
    rating: reviewData.rating,
    comment: reviewData.comment,
  });
  /**
   * بروزرسانی تعداد نظرات
   */
  product.ratingsCount = product.reviews.length;
  /**
   * بروزرسانی میانگین امتیاز
   */
  product.averageRating =
    product.reviews.reduce((sum, review) => sum + review.rating, 0) /
    product.reviews.length;

  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);

  product.averageRating = totalRating / product.reviews.length;

  await product.save();

  return product;
};

/**
 * دریافت نظرات محصول
 *
 * @param {string} productId
 * @returns {Array}
 */
const getProductReviews = async (productId) => {
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(productId)
    .populate("reviews.user", "name email")
    .lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product.reviews;
};

/**
 * ویرایش نظر محصول
 *
 * @param {string} productId شناسه محصول
 * @param {string} reviewId شناسه نظر
 * @param {string} userId شناسه کاربر
 * @param {Object} data اطلاعات جدید
 *
 * @returns {Object} محصول بروزرسانی شده
 */
const updateReview = async (productId, reviewId, userId, data) => {
  /**
   * اعتبارسنجی شناسه محصول
   */
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  /**
   * دریافت محصول
   */
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  /**
   * یافتن نظر
   */
  const review = product.reviews.id(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  /**
   * فقط صاحب نظر
   */
  if (review.user.toString() !== userId.toString()) {
    throw new AppError("Not authorized to update this review", 403);
  }

  /**
   * بروزرسانی داده‌ها
   */
  review.rating = data.rating ?? review.rating;

  review.comment = data.comment ?? review.comment;

  /**
   * محاسبه مجدد میانگین
   */
  product.averageRating =
    product.reviews.reduce((sum, item) => sum + item.rating, 0) /
    product.reviews.length;

  await product.save();

  return review;
};

/**
 * حذف نظر محصول
 *
 * @param {string} productId شناسه محصول
 * @param {string} reviewId شناسه نظر
 * @param {string} userId شناسه کاربر
 *
 * @returns {Object} محصول بروزرسانی شده
 */
const deleteReview = async (productId, reviewId, userId) => {
  /**
   * اعتبارسنجی شناسه محصول
   */
  if (!validateObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }

  /**
   * اعتبارسنجی شناسه نظر
   */
  if (!validateObjectId(reviewId)) {
    throw new AppError("Invalid review id", 400);
  }

  /**
   * دریافت محصول
   */
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  /**
   * دریافت نظر
   */
  const review = product.reviews.id(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  /**
   * بررسی مالکیت
   */
  if (review.user.toString() !== userId.toString()) {
    throw new AppError("Not authorized to delete this review", 403);
  }

  /**
   * حذف نظر
   */
  review.deleteOne();

  /**
   * محاسبه مجدد میانگین امتیاز
   */
  if (product.reviews.length > 0) {
    product.averageRating =
      product.reviews.reduce((sum, item) => sum + item.rating, 0) /
      product.reviews.length;
  } else {
    product.averageRating = 0;
  }

  await product.save();

  return;
};

/**
 * جستجوی محصولات
 *
 * @param {Object} query
 *
 * @returns {Object}
 */
const searchProducts = async (query = {}) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    inStock,
    minRating,
    page,
    limit,
    sort,
  } = query;

  const safeNumber = (value, defaultValue) => {
    const num = Number(value);
    return Number.isNaN(num) ? defaultValue : num;
  };

  const pageNumber = safeNumber(page, 1);
  const limitNumber = safeNumber(limit, 10);

  const filter = {
    isDeleted: false,
  };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (inStock === "true") {
    filter.stock = { $gt: 0 };
  }

  if (minRating) {
    filter.averageRating = { $gte: Number(minRating) };
  }

  let sortOption = {};

  switch (sort) {
    case "price_asc":
      sortOption.price = 1;
      break;
    case "price_desc":
      sortOption.price = -1;
      break;
    case "rating_desc":
      sortOption.averageRating = -1;
      break;
    default:
      sortOption.createdAt = -1;
  }

  const skip = (pageNumber - 1) * limitNumber;

  const products = await Product.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNumber);

  const total = await Product.countDocuments(filter);

  return {
    products,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(total / limitNumber),
    },
  };
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getDeletedProducts,
  uploadProductImage,
  uploadProductImages,
  deleteProductImage,
  setMainImage,
  addProductVariant,
  decreaseStock,
  increaseStock,
  addReview,
  getProductReviews,
  updateReview,
  deleteReview,
  searchProducts,
};
