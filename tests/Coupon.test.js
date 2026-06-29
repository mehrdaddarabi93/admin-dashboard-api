/**
 * تست‌های Coupon Endpoints
 * ========================
 * POST / GET / GET:id / PATCH / PATCH:toggle-status / DELETE
 *
 * نکته RBAC:
 * همه endpoint های coupon نیاز به MANAGE_COUPONS دارند
 * که فقط admin و chiefadmin این مجوز را دارند.
 * support و editor دسترسی ندارند.
 *
 * نکته تجاری:
 * - code به صورت خودکار uppercase می‌شود
 * - code بعد از ساخت قابل تغییر نیست
 * - toggle-status وضعیت isActive را معکوس می‌کند
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

// ─── helpers ─────────────────────────────────────────────────────────────────
const login = async (email, password = "pass1234") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.data?.accessToken;
};

const createCoupon = async (token, overrides = {}) => {
  return request(app)
    .post("/api/coupons")
    .set("Authorization", `Bearer ${token}`)
    .send({
      code: overrides.code || "SUMMER20",
      discountPercentage: overrides.discountPercentage || 20,
      expiresAt: overrides.expiresAt || "2027-12-31",
      usageLimit: overrides.usageLimit || 100,
    });
};

// =============================================================================
// POST /api/coupons
// =============================================================================
describe("POST /api/coupons", () => {
  test("admin می‌تواند کوپن بسازد → 201", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await createCoupon(token);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("code");
  });

  test("code به uppercase تبدیل می‌شود", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await createCoupon(token, { code: "summer20" });

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe("SUMMER20");
  });

  test("کد تکراری → 400", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    await createCoupon(token, { code: "SAME10" });
    const res = await createCoupon(token, { code: "SAME10" });

    expect(res.status).toBe(400);
  });

  test("کد تکراری case-insensitive → 400", async () => {
    /**
     * چون code همیشه uppercase ذخیره می‌شه،
     * "summer10" و "SUMMER10" یکی هستند.
     */
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    await createCoupon(token, { code: "SUMMER10" });
    const res = await createCoupon(token, { code: "summer10" });

    expect(res.status).toBe(400);
  });

  test("کاربر عادی نمی‌تواند کوپن بسازد → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await createCoupon(token);

    expect(res.status).toBe(403);
  });

  test("editor نمی‌تواند کوپن بسازد → 403", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const res = await createCoupon(token);

    expect(res.status).toBe(403);
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app).post("/api/coupons").send({
      code: "TEST10",
      discountPercentage: 10,
      expiresAt: "2027-12-31",
      usageLimit: 50,
    });

    expect(res.status).toBe(401);
  });

  test("discountPercentage بیشتر از 100 → 400", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await createCoupon(token, { discountPercentage: 150 });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// GET /api/coupons
// =============================================================================
describe("GET /api/coupons", () => {
  test("admin می‌تواند لیست کوپن‌ها را ببیند → 200", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .get("/api/coupons")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("coupons");
  });

  test("کاربر عادی نمی‌تواند لیست کوپن‌ها را ببیند → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .get("/api/coupons")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("فیلتر isActive=true فقط کوپن‌های فعال را برمی‌گرداند", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    // ساخت دو کوپن
    await createCoupon(token, { code: "ACTIVE10" });
    const inactive = await createCoupon(token, { code: "INACTIVE20" });
    const inactiveId = inactive.body.data._id;

    // غیرفعال کردن یکی
    await request(app)
      .patch(`/api/coupons/${inactiveId}/toggle-status`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/coupons?isActive=true")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.coupons.forEach((c) => {
      expect(c.isActive).toBe(true);
    });
  });
});

// =============================================================================
// GET /api/coupons/:id
// =============================================================================
describe("GET /api/coupons/:id", () => {
  test("دریافت کوپن موجود → 200", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const created = await createCoupon(token);
    const id = created.body.data._id;

    const res = await request(app)
      .get(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe("SUMMER20");
  });

  test("id نامعتبر → 400", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .get("/api/coupons/invalid-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test("id معتبر ولی ناموجود → 404", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .get("/api/coupons/64f1a2b3c4d5e6f7a8b9c0d1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/coupons/:id
// =============================================================================
describe("PATCH /api/coupons/:id", () => {
  test("بروزرسانی discountPercentage → 200", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const created = await createCoupon(token);
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ discountPercentage: 35 });

    expect(res.status).toBe(200);
    expect(res.body.data.discountPercentage).toBe(35);
  });

  test("تغییر code نادیده گرفته می‌شود", async () => {
    /**
     * طبق swagger: "فیلد code قابل تغییر نیست و نادیده گرفته می‌شود"
     * یعنی 200 برمی‌گرده ولی code تغییر نمی‌کنه.
     */
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const created = await createCoupon(token, { code: "ORIGINAL" });
    const id = created.body.data._id;

    await request(app)
      .patch(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "CHANGED", discountPercentage: 25 });

    const res = await request(app)
      .get(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.code).toBe("ORIGINAL");
  });

  test("id ناموجود → 404", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const res = await request(app)
      .patch("/api/coupons/64f1a2b3c4d5e6f7a8b9c0d1")
      .set("Authorization", `Bearer ${token}`)
      .send({ discountPercentage: 10 });

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/coupons/:id/toggle-status
// =============================================================================
describe("PATCH /api/coupons/:id/toggle-status", () => {
  test("toggle: فعال → غیرفعال → فعال", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const created = await createCoupon(token);
    const id = created.body.data._id;
    const originalStatus = created.body.data.isActive;

    // toggle اول
    const res1 = await request(app)
      .patch(`/api/coupons/${id}/toggle-status`)
      .set("Authorization", `Bearer ${token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data.isActive).toBe(!originalStatus);

    // toggle دوم
    const res2 = await request(app)
      .patch(`/api/coupons/${id}/toggle-status`)
      .set("Authorization", `Bearer ${token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.isActive).toBe(originalStatus);
  });
});

// =============================================================================
// DELETE /api/coupons/:id
// =============================================================================
describe("DELETE /api/coupons/:id", () => {
  test("حذف کوپن موجود → 200", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const created = await createCoupon(token);
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("بعد از حذف، کوپن دیگر پیدا نمی‌شود → 404", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const token = await login("admin@example.com");

    const created = await createCoupon(token);
    const id = created.body.data._id;

    await request(app)
      .delete(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("کاربر عادی نمی‌تواند حذف کند → 403", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    await createUser({ email: "user@example.com" });
    const adminToken = await login("admin@example.com");
    const userToken = await login("user@example.com");

    const created = await createCoupon(adminToken);
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});
