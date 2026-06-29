/**
 * تست‌های Dashboard Endpoint
 * ==========================
 * GET /api/dashboard/stats
 *
 * نکته RBAC:
 * - نیاز به VIEW_DASHBOARD — فقط admin و chiefadmin
 * - support و editor دسترسی ندارند
 *
 * نکته مهم تست:
 * dashboard آمار واقعی دیتابیس رو برمی‌گردونه.
 * پس باید داده بسازیم و بعد چک کنیم که اعداد درست هستن.
 */

process.env.PORT = "5001";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/admin-dashboard-test";
process.env.JWT_SECRET = "test_jwt_secret_32_chars_minimum!";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_32_chars_min!";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.ALLOWED_ORIGINS = "http://localhost:3000";
process.env.NODE_ENV = "test";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const { clearDatabase, createUser } = require("./helpers");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

// helpers
const login = async (email, password = "pass1234") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.data?.accessToken;
};

const createCategory = async () => {
  return Category.create({ title: "دسته تستی", slug: `cat-${Date.now()}` });
};

const createProduct = async (categoryId, overrides = {}) => {
  return Product.create({
    title: overrides.title || "محصول تستی",
    slug: overrides.slug || `product-${Date.now()}`,
    price: overrides.price || 100000,
    stock: overrides.stock ?? 10,
    description: "توضیح",
    category: categoryId,
  });
};

const createOrder = async (token, productId, quantity = 1) => {
  return request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderItems: [{ product: productId, quantity }],
      shippingAddress: "تهران",
    });
};

// =============================================================================
// RBAC
// =============================================================================
describe("GET /api/dashboard/stats — دسترسی", () => {
  test("admin می‌تواند آمار را ببیند → 200", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");
    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("chiefadmin می‌تواند آمار را ببیند → 200", async () => {
    await createUser({ email: "chief@example.com", role: "chiefadmin" });
    const token = await login("chief@example.com");
    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test("کاربر عادی نمی‌تواند آمار را ببیند → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");
    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("editor نمی‌تواند آمار را ببیند → 403", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("support نمی‌تواند آمار را ببیند → 403", async () => {
    await createUser({ email: "support@example.com", role: "support" });
    const token = await login("support@example.com");
    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app).get("/api/dashboard/stats");
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// ساختار پاسخ
// =============================================================================
describe("GET /api/dashboard/stats — ساختار پاسخ", () => {
  test("پاسخ شامل همه بخش‌های مورد انتظار است", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    const { data } = res.body;

    expect(data).toHaveProperty("users.totalUsers");
    expect(data).toHaveProperty("users.totalAdmins");
    expect(data).toHaveProperty("users.totalCustomers");
    expect(data).toHaveProperty("products.totalProducts");
    expect(data).toHaveProperty("products.deletedProducts");
    expect(data).toHaveProperty("products.totalCategories");
    expect(data).toHaveProperty("orders.totalOrders");
    expect(data).toHaveProperty("orders.totalRevenue");
    expect(data).toHaveProperty("orders.avgOrderValue");
    expect(Array.isArray(data.analytics.bestSellingProducts)).toBe(true);
    expect(Array.isArray(data.analytics.salesByCategory)).toBe(true);
  });
});

// =============================================================================
// دقت اعداد
// =============================================================================
describe("GET /api/dashboard/stats — دقت اعداد", () => {
  test("تعداد کاربران درست شمارش می‌شود", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    await createUser({ email: "user1@example.com", role: "user" });
    await createUser({ email: "user2@example.com", role: "user" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.users.totalUsers).toBe(3);
    expect(res.body.data.users.totalAdmins).toBe(1);
    expect(res.body.data.users.totalCustomers).toBe(2);
  });

  test("تعداد محصولات و دسته‌بندی‌ها درست شمارش می‌شود", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");
    const cat1 = await createCategory();
    const cat2 = await createCategory();
    await createProduct(cat1._id, { slug: "p1" });
    await createProduct(cat1._id, { slug: "p2" });
    await createProduct(cat2._id, { slug: "p3" });

    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.products.totalProducts).toBe(3);
    expect(res.body.data.products.deletedProducts).toBe(0);
    expect(res.body.data.products.totalCategories).toBe(2);
  });

  test("محصولات حذف‌شده در deletedProducts شمارش می‌شوند", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");
    const cat = await createCategory();
    const p1 = await createProduct(cat._id, { slug: "p1" });
    await createProduct(cat._id, { slug: "p2" });

    await request(app)
      .delete(`/api/products/${p1._id}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.products.totalProducts).toBe(1);
    expect(res.body.data.products.deletedProducts).toBe(1);
  });

  test("آمار سفارش‌ها درست محاسبه می‌شود", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    await createUser({ email: "user@example.com", role: "user" });
    const adminToken = await login("admin@example.com");
    const userToken = await login("user@example.com");
    const cat = await createCategory();
    const product = await createProduct(cat._id, { price: 200000, slug: "p1" });

    await createOrder(userToken, product._id, 1);
    await createOrder(userToken, product._id, 1);

    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.body.data.orders.totalOrders).toBe(2);
    expect(res.body.data.orders.totalRevenue).toBe(400000);
    expect(res.body.data.orders.avgOrderValue).toBe(200000);
  });

  test("دیتابیس خالی → همه اعداد صفر هستند", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.users.totalCustomers).toBe(0);
    expect(res.body.data.products.totalProducts).toBe(0);
    expect(res.body.data.orders.totalOrders).toBe(0);
    expect(res.body.data.orders.totalRevenue).toBe(0);
    expect(res.body.data.analytics.bestSellingProducts).toHaveLength(0);
  });
});
