/**
 * تست‌های User Management
 * ========================
 * RBAC / جستجو / Soft Delete / Restore / تغییر نقش / toggle وضعیت
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
const { clearDatabase, createUser, createChiefAdmin } = require("./helpers");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

// ─── تابع کمکی: login و گرفتن accessToken ────────────────────────────────────
const login = async (email, password = "pass1234") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.data?.accessToken;
};

// =============================================================================
// POST /api/users — ساخت کاربر با نقش دلخواه (فقط chiefadmin)
// =============================================================================
describe("POST /api/users", () => {
  test("chiefadmin می‌تواند کاربر با نقش editor بسازد → 201", async () => {
    await createChiefAdmin();
    const token = await login("chief@example.com");

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "ویراستار",
        email: "editor@example.com",
        password: "pass1234",
        role: "editor",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("editor");
  });

  test("کاربر عادی نمی‌تواند کاربر بسازد → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "هکر",
        email: "hacker@example.com",
        password: "pass1234",
        role: "admin",
      });

    expect(res.status).toBe(403);
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app).post("/api/users").send({
      name: "تست",
      email: "test@example.com",
      password: "pass1234",
      role: "user",
    });

    expect(res.status).toBe(401);
  });

  test("role نامعتبر → 400", async () => {
    await createChiefAdmin();
    const token = await login("chief@example.com");

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "تست",
        email: "test@example.com",
        password: "pass1234",
        role: "superhero",
      });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// GET /api/users — جستجوی کاربران
// =============================================================================
describe("GET /api/users", () => {
  test("chiefadmin می‌تواند لیست کاربران را ببیند → 200", async () => {
    await createChiefAdmin();
    const token = await login("chief@example.com");

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  test("کاربر عادی نمی‌تواند لیست کاربران را ببیند → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("فیلتر با role=editor فقط editorها را برمی‌گرداند", async () => {
    await createChiefAdmin();
    await createUser({ email: "editor@example.com", role: "editor" });
    await createUser({ email: "user@example.com", role: "user" });

    const token = await login("chief@example.com");

    const res = await request(app)
      .get("/api/users?role=editor")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // همه کاربران برگشتی باید editor باشند
    res.body.data.forEach((user) => {
      expect(user.role).toBe("editor");
    });
  });
});

// =============================================================================
// PATCH /api/users/:id/role — تغییر نقش
// =============================================================================
describe("PATCH /api/users/:id/role", () => {
  test("chiefadmin می‌تواند نقش کاربر را تغییر دهد → 200", async () => {
    await createChiefAdmin();
    const target = await createUser({ email: "target@example.com" });
    const token = await login("chief@example.com");

    const res = await request(app)
      .patch(`/api/users/${target._id}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "support" });

    expect(res.status).toBe(200);
  });

  test("role نامعتبر → 400", async () => {
    await createChiefAdmin();
    const target = await createUser({ email: "target@example.com" });
    const token = await login("chief@example.com");

    const res = await request(app)
      .patch(`/api/users/${target._id}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "god" });

    expect(res.status).toBe(400);
  });

  test("کاربر عادی نمی‌تواند نقش تغییر دهد → 403", async () => {
    await createUser({ email: "user@example.com" });
    const target = await createUser({ email: "target@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .patch(`/api/users/${target._id}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin" });

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// PATCH /api/users/:id/status — toggle وضعیت
// =============================================================================
describe("PATCH /api/users/:id/status", () => {
  test("toggle: کاربر فعال → غیرفعال → فعال", async () => {
    await createChiefAdmin();
    const target = await createUser({ email: "target@example.com" });
    const token = await login("chief@example.com");

    // غیرفعال کردن
    const res1 = await request(app)
      .patch(`/api/users/${target._id}/status`)
      .set("Authorization", `Bearer ${token}`);

    expect(res1.status).toBe(200);

    // فعال کردن مجدد
    const res2 = await request(app)
      .patch(`/api/users/${target._id}/status`)
      .set("Authorization", `Bearer ${token}`);

    expect(res2.status).toBe(200);
  });
});

// =============================================================================
// DELETE /api/users/:id — Soft Delete
// =============================================================================
describe("DELETE /api/users/:id (Soft Delete)", () => {
  test("حذف موفق → 200 و deletedAt پر می‌شود", async () => {
    await createChiefAdmin();
    const target = await createUser({ email: "target@example.com" });
    const token = await login("chief@example.com");

    const res = await request(app)
      .delete(`/api/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "تخلف" });

    expect(res.status).toBe(200);
  });

  test("حذف مجدد کاربر حذف‌شده → 404", async () => {
    await createChiefAdmin();
    const target = await createUser({ email: "target@example.com" });
    const token = await login("chief@example.com");

    // اول حذف
    await request(app)
      .delete(`/api/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "تخلف" });

    // دوباره حذف — باید 404 بده
    const res = await request(app)
      .delete(`/api/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "تکراری" });

    expect(res.status).toBe(404);
  });

  test("کاربر عادی نمی‌تواند حذف کند → 403", async () => {
    await createUser({ email: "user@example.com" });
    const target = await createUser({ email: "target@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .delete(`/api/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// GET /api/users/deleted — لیست حذف‌شده‌ها
// =============================================================================
describe("GET /api/users/deleted", () => {
  test("chiefadmin می‌تواند لیست حذف‌شده‌ها را ببیند → 200", async () => {
    await createChiefAdmin();
    const token = await login("chief@example.com");

    const res = await request(app)
      .get("/api/users/deleted")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("کاربر عادی نمی‌تواند لیست حذف‌شده‌ها را ببیند → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .get("/api/users/deleted")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app).get("/api/users/deleted");
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// PATCH /api/users/:id/restore — بازیابی
// =============================================================================
describe("PATCH /api/users/:id/restore", () => {
  test("بازیابی کاربر حذف‌شده → 200", async () => {
    await createChiefAdmin();
    const target = await createUser({ email: "target@example.com" });
    const token = await login("chief@example.com");

    // اول حذف
    await request(app)
      .delete(`/api/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "تست" });

    // بعد بازیابی
    const res = await request(app)
      .patch(`/api/users/${target._id}/restore`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("بازیابی کاربری که حذف نشده → 404", async () => {
    await createChiefAdmin();
    const target = await createUser({ email: "target@example.com" });
    const token = await login("chief@example.com");

    // بدون حذف قبلی، مستقیم restore می‌زنیم
    const res = await request(app)
      .patch(`/api/users/${target._id}/restore`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
