/**
 * تعریف مرکزی نقش‌ها و مجوزهای پنل ادمین (RBAC)
 *
 * چرا این فایل جدا است؟
 * به‌جای اینکه در هر route مستقیم اسم نقش (مثل "admin") را چک کنیم،
 * هر route را بر اساس "مجوز" (permission) چک می‌کنیم. این یعنی اگر
 * فردا یک نقش جدید اضافه شد یا مجوزهای یک نقش تغییر کرد، فقط همین
 * فایل را ویرایش می‌کنیم و نیازی به دست‌زدن به route ها نیست.
 */

/**
 * لیست تمام نقش‌های موجود در سیستم.
 * این آرایه همان enum ای است که در مدل User استفاده می‌شود.
 */
const ROLES = {
  USER: "user",
  SUPPORT: "support",
  EDITOR: "editor",
  ADMIN: "admin",
  CHIEF_ADMIN: "chiefadmin",
};

/**
 * لیست تمام مجوزهای ممکن در سیستم.
 * هر مجوز معادل یک دسته از عملیات حساس در پنل ادمین است.
 */
const PERMISSIONS = {
  VIEW_USERS: "view_users",
  MANAGE_ORDERS: "manage_orders",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_CATEGORIES: "manage_categories",
  MANAGE_COUPONS: "manage_coupons",
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_ADMINS: "manage_admins", // فقط chiefadmin: تغییر نقش بقیه
};

/**
 * نگاشت هر نقش به لیست مجوزهایی که دارد.
 * نکته: نقش‌های بالاتر، مجوزهای نقش‌های پایین‌تر را هم به ارث می‌برند
 * (به‌صورت دستی لیست شده‌اند تا خواناتر و قابل ردیابی باشد).
 */
const ROLE_PERMISSIONS = {
  [ROLES.USER]: [],

  [ROLES.SUPPORT]: [PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_ORDERS],

  [ROLES.EDITOR]: [PERMISSIONS.MANAGE_PRODUCTS, PERMISSIONS.MANAGE_CATEGORIES],

  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_COUPONS,
    PERMISSIONS.VIEW_DASHBOARD,
  ],

  [ROLES.CHIEF_ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_COUPONS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_ADMINS,
  ],
};

/**
 * بررسی می‌کند که آیا یک نقش، مجوز مشخصی را دارد یا نه.
 *
 * @param {string} role نقش کاربر (مثلا "admin")
 * @param {string} permission مجوز موردنیاز (مثلا "manage_products")
 * @returns {boolean}
 */
function roleHasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasPermission,
};
