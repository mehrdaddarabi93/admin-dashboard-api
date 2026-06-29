/**
 * تست‌های Order Endpoints
 * =======================
 * POST / GET(all) / GET(my-orders) / GET(:id) / PATCH(:id/status)
 *
 * نکته مهم — state machine:
 * pending → [processing, cancelled]
 * processing → [shipped, cancelled]
 * shipped → [delivered]
 * delivered → []  (نهایی)
 * cancelled → []  (نهایی)
 *
 * تست state machine یعنی هم مسیرهای مجاز و هم مسیرهای ممنوع رو چک کنیم.
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
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
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

// ─── تابع کمکی: login ────────────────────────────────────────────────────────
const login = async (email, password = "pass1234") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.data?.accessToken;
};

// ─── تابع کمکی: ساخت محصول مستقیم در DB ─────────────────────────────────────
const createProduct = async (overrides = {}) => {
  // Product نیاز به category دارد — یه category موقت می‌سازیم
  const category = await Category.create({
    title: "دسته تستی",
    slug: `cat-${Date.now()}`,
  });

  return Product.create({
    title: overrides.title || "محصول تستی",
    slug: overrides.slug || `product-${Date.now()}`,
    price: overrides.price || 100000,
    stock: overrides.stock ?? 10,
    description: "توضیح تستی",
    category: category._id,
  });
};

// ─── تابع کمکی: ساخت سفارش از طریق API ──────────────────────────────────────
const createOrder = async (token, productId, quantity = 1) => {
  return request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderItems: [{ product: productId, quantity }],
      shippingAddress: "تهران، خیابان ولیعصر",
    });
};

// =============================================================================
// POST /api/orders — ساخت سفارش
// =============================================================================
describe("POST /api/orders", () => {
  test("ساخت سفارش موفق → 201 + status=pending", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");
    const product = await createProduct();

    const res = await createOrder(token, product._id);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.totalPrice).toBe(100000);
  });

  test("ساخت سفارش موجودی را کاهش می‌دهد", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");
    const product = await createProduct({ stock: 5 });

    await createOrder(token, product._id, 3);

    // موجودی باید از 5 به 2 رسیده باشه
    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(2);
  });

  test("موجودی ناکافی → 400", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");
    const product = await createProduct({ stock: 2 });

    // سفارش 5 تا ولی موجودی فقط 2 تاست
    const res = await createOrder(token, product._id, 5);

    expect(res.status).toBe(400);
  });

  test("orderItems خالی → 400", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        orderItems: [],
        shippingAddress: "تهران",
      });

    expect(res.status).toBe(400);
  });

  test("product ناموجود → 404", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        orderItems: [{ product: "64f1a2b3c4d5e6f7a8b9c0d1", quantity: 1 }],
        shippingAddress: "تهران",
      });

    expect(res.status).toBe(404);
  });

  test("بدون توکن → 401", async () => {
    const product = await createProduct();
    const res = await request(app)
      .post("/api/orders")
      .send({
        orderItems: [{ product: product._id, quantity: 1 }],
        shippingAddress: "تهران",
      });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// GET /api/orders/my-orders
// =============================================================================
describe("GET /api/orders/my-orders", () => {
  test("کاربر فقط سفارش‌های خودش را می‌بیند", async () => {
    await createUser({ email: "user1@example.com" });
    await createUser({ email: "user2@example.com" });
    const token1 = await login("user1@example.com");
    const token2 = await login("user2@example.com");
    const product = await createProduct();

    // user1 یه سفارش می‌ده
    await createOrder(token1, product._id);
    // user2 دو سفارش می‌ده
    await createOrder(token2, product._id);
    await createOrder(token2, product._id);

    const res = await request(app)
      .get("/api/orders/my-orders")
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    // user1 فقط یه سفارش داره
    expect(res.body.data).toHaveLength(1);
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app).get("/api/orders/my-orders");
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// GET /api/orders — همه سفارش‌ها (فقط admin)
// =============================================================================
describe("GET /api/orders", () => {
  test("admin می‌تواند همه سفارش‌ها را ببیند → 200", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("کاربر عادی نمی‌تواند همه سفارش‌ها را ببیند → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// GET /api/orders/:id
// =============================================================================
describe("GET /api/orders/:id", () => {
  test("صاحب سفارش می‌تواند سفارش خودش را ببیند → 200", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");
    const product = await createProduct();

    const order = await createOrder(token, product._id);
    const orderId = order.body.data._id;

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("کاربر دیگر نمی‌تواند سفارش کاربر اول را ببیند → 403", async () => {
    await createUser({ email: "user1@example.com" });
    await createUser({ email: "user2@example.com" });
    const token1 = await login("user1@example.com");
    const token2 = await login("user2@example.com");
    const product = await createProduct();

    const order = await createOrder(token1, product._id);
    const orderId = order.body.data._id;

    // user2 سعی می‌کنه سفارش user1 رو ببینه
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(403);
  });

  test("admin می‌تواند سفارش هر کسی را ببیند → 200", async () => {
    await createUser({ email: "user@example.com" });
    await createUser({ email: "admin@example.com", role: "admin" });
    const userToken = await login("user@example.com");
    const adminToken = await login("admin@example.com");
    const product = await createProduct();

    const order = await createOrder(userToken, product._id);
    const orderId = order.body.data._id;

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("chiefadmin می‌تواند سفارش دیگران را ببیند → 200", async () => {
    /**
     * بعد از اصلاح order.service.js:
     * به‌جای چک role === "admin"، از roleHasPermission(MANAGE_ORDERS) استفاده می‌کنیم.
     * support، admin، chiefadmin همه این مجوز را دارند.
     */
    await createUser({ email: "user@example.com" });
    await createUser({ email: "chief@example.com", role: "chiefadmin" });
    const userToken = await login("user@example.com");
    const chiefToken = await login("chief@example.com");
    const product = await createProduct();

    const order = await createOrder(userToken, product._id);
    const orderId = order.body.data._id;

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${chiefToken}`);

    expect(res.status).toBe(200);
  });

  test("support می‌تواند سفارش دیگران را ببیند → 200", async () => {
    await createUser({ email: "user@example.com" });
    await createUser({ email: "support@example.com", role: "support" });
    const userToken = await login("user@example.com");
    const supportToken = await login("support@example.com");
    const product = await createProduct();

    const order = await createOrder(userToken, product._id);
    const orderId = order.body.data._id;

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${supportToken}`);

    expect(res.status).toBe(200);
  });
});

// =============================================================================
// PATCH /api/orders/:id/status — state machine
// =============================================================================
describe("PATCH /api/orders/:id/status (state machine)", () => {
  let adminToken;
  let orderId;

  beforeEach(async () => {
    await createUser({ email: "user@example.com" });
    await createUser({ email: "admin@example.com", role: "admin" });
    const userToken = await login("user@example.com");
    adminToken = await login("admin@example.com");
    const product = await createProduct();

    const order = await createOrder(userToken, product._id);
    orderId = order.body.data._id;
  });

  // ─── مسیرهای مجاز ────────────────────────────────────────────────────────
  test("pending → processing (مجاز) → 200", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "processing" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("processing");
  });

  test("pending → cancelled (مجاز) → 200", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  test("pending → shipped (غیرمجاز) → 400", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "shipped" });

    expect(res.status).toBe(400);
  });

  test("pending → delivered (غیرمجاز) → 400", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "delivered" });

    expect(res.status).toBe(400);
  });

  test("processing → shipped → delivered (مسیر کامل موفق)", async () => {
    // pending → processing
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "processing" });

    // processing → shipped
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "shipped" });

    // shipped → delivered
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "delivered" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("delivered");
  });

  test("delivered → هر وضعیتی (غیرمجاز) → 400", async () => {
    // رساندن به delivered
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "processing" });
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "shipped" });
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "delivered" });

    // تلاش برای تغییر از delivered
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });

    expect(res.status).toBe(400);
  });

  test("cancelled → هر وضعیتی (غیرمجاز) → 400", async () => {
    // لغو سفارش
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });

    // تلاش برای تغییر از cancelled
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "processing" });

    expect(res.status).toBe(400);
  });

  test("status نامعتبر → 400", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "flying" });

    expect(res.status).toBe(400);
  });

  test("کاربر عادی نمی‌تواند وضعیت را تغییر دهد → 403", async () => {
    await createUser({ email: "user2@example.com" });
    const userToken = await login("user2@example.com");

    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "processing" });

    expect(res.status).toBe(403);
  });
});
