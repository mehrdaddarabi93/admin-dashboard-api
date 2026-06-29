const categoryService = require("../services/category.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ایجاد دسته‌بندی جدید
 *
 * @route POST /api/categories
 * @access Private (Admin)
 *
 * @param {Object} req.body اطلاعات دسته‌بندی
 * @param {string} req.body.name نام دسته‌بندی
 * @param {string} [req.body.description] توضیحات دسته‌بندی
 * @param {boolean} [req.body.isActive=true] وضعیت دسته‌بندی
 *
 * @returns {Object} دسته‌بندی ایجاد شده
 */
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

/**
 * دریافت لیست دسته‌بندی‌ها
 *
 * قابلیت‌ها:
 * - Pagination
 * - Search
 * - Filter
 * - Sorting
 *
 * @route GET /api/categories
 * @access Public
 *
 * @query {number} page شماره صفحه
 * @query {number} limit تعداد آیتم در هر صفحه
 * @query {string} search عبارت جستجو
 * @query {boolean} isActive فیلتر وضعیت فعال/غیرفعال
 * @query {string} sort فیلد مرتب‌سازی
 *
 * @returns {Object} لیست دسته‌بندی‌ها به همراه اطلاعات صفحه‌بندی
 */
exports.getAllCategories = asyncHandler(async (req, res) => {
  /**
   * Pagination
   */
  let page = parseInt(req.query.page) || 1;

  let limit = parseInt(req.query.limit) || 10;

  /**
   * جلوگیری از مقادیر نامعتبر
   */
  if (page < 1) page = 1;

  if (limit < 1) limit = 1;

  if (limit > 100) limit = 100;

  /**
   * Search
   */
  const search = req.query.search || "";

  /**
   * Filter
   */
  let isActive;

  if (typeof req.query.isActive !== "undefined") {
    isActive = req.query.isActive === "true";
  }

  /**
   * Sorting
   */
  const sort = req.query.sort || "-createdAt";

  /**
   * Service Call
   */
  const result = await categoryService.getAllCategories(
    page,
    limit,
    search,
    isActive,
    sort,
  );

  res.status(200).json({
    success: true,

    total: result.total,

    page: result.page,

    limit: result.limit,

    totalPages: result.totalPages,

    hasNextPage: result.hasNextPage,

    hasPrevPage: result.hasPrevPage,

    data: result.categories,
  });
});

/**
 * دریافت اطلاعات یک دسته‌بندی
 *
 * @route GET /api/categories/:id
 * @access Public
 *
 * @param {string} req.params.id شناسه دسته‌بندی
 *
 * @returns {Object} اطلاعات دسته‌بندی
 */
exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * بروزرسانی دسته‌بندی
 *
 * @route PUT /api/categories/:id
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه دسته‌بندی
 * @param {Object} req.body اطلاعات جدید دسته‌بندی
 *
 * @returns {Object} دسته‌بندی بروزرسانی شده
 */
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

/**
 * حذف دسته‌بندی
 *
 * @route DELETE /api/categories/:id
 * @access Private (Admin)
 *
 * @param {string} req.params.id شناسه دسته‌بندی
 *
 * @returns {Object} پیام موفقیت
 */
exports.deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
