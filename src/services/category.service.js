const Category = require("../models/Category");
const validateObjectId = require("../utils/validateObjectId");
const AppError = require("../utils/AppError");

/**
 * ایجاد دسته‌بندی جدید
 *
 * @param {Object} categoryData
 * @param {string} categoryData.title - عنوان دسته‌بندی
 * @param {string} categoryData.slug - شناسه یکتا (URL-friendly)
 * @param {string} [categoryData.description] - توضیحات اختیاری
 *
 * @returns {Object} دسته‌بندی ایجاد شده
 */
const createCategory = async (categoryData) => {
  const { title, slug, description } = categoryData;

  const categoryExists = await Category.findOne({ slug });

  if (categoryExists) {
    throw new AppError("Category slug already exists", 409);
  }

  const category = await Category.create({
    title,
    slug,
    description,
  });

  return category;
};

/**
 * دریافت لیست دسته‌بندی‌ها با قابلیت‌های:
 * - Pagination
 * - Search
 * - Filter
 * - Sort
 *
 * @param {number} page - شماره صفحه
 * @param {number} limit - تعداد آیتم در هر صفحه
 * @param {string} search - جستجو بر اساس title
 * @param {boolean|undefined} isActive - فیلتر وضعیت فعال بودن
 * @param {string} sort - مرتب‌سازی (مثلاً: createdAt یا -createdAt)
 *
 * @returns {Object} لیست دسته‌بندی‌ها + اطلاعات pagination
 */
const getAllCategories = async (
  page = 1,
  limit = 10,
  search = "",
  isActive,
  sort = "-createdAt",
) => {
  const skip = (page - 1) * limit;

  const query = {};

  if (search) {
    query.title = {
      $regex: search,
      $options: "i",
    };
  }

  if (typeof isActive !== "undefined") {
    query.isActive = isActive;
  }

  const allowedSortFields = ["title", "slug", "createdAt"];

  const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

  if (!allowedSortFields.includes(sortField)) {
    sort = "-createdAt";
  }

  let sortOption = {};

  if (sort.startsWith("-")) {
    sortOption[sort.substring(1)] = -1;
  } else {
    sortOption[sort] = 1;
  }

  const total = await Category.countDocuments(query);

  const categories = await Category.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    categories,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * دریافت یک دسته‌بندی بر اساس ID
 *
 * @param {string} id - شناسه MongoDB
 * @returns {Object} دسته‌بندی
 */
const getCategoryById = async (id) => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid category id", 400);
  }

  const category = await Category.findById(id).lean();

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};

/**
 * بروزرسانی دسته‌بندی
 *
 * @param {string} id
 * @param {Object} updateData
 * @returns {Object} دسته‌بندی بروزرسانی شده
 */
const updateCategory = async (id, updateData) => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid category id", 400);
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (updateData.slug) {
    const slugExists = await Category.findOne({
      slug: updateData.slug,
      _id: { $ne: id },
    });

    if (slugExists) {
      throw new AppError("Slug already exists", 409);
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

  return updatedCategory;
};

/**
 * حذف دسته‌بندی
 *
 * @param {string} id
 * @returns {boolean}
 */
const deleteCategory = async (id) => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid category id", 400);
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await Category.findByIdAndDelete(id);

  return true;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
