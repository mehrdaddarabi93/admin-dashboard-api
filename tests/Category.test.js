/**
 * تست‌های Category Endpoints
 * ==========================
 * GET / POST / GET:id / PATCH:id / DELETE:id
 *
 * نکته RBAC:
 * - GET /categories و GET /categories/:id — عمومی (بدون توکن)
 * - POST / PATCH / DELETE — نیاز به MANAGE_CATEGORIES
 *   (editor، admin، chiefadmin این مجوز را دارند)
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

// ─── تابع کمکی: login و گرفتن accessToken ────────────────────────────────────
const login = async (email, password = "pass1234") => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.data?.accessToken;
};

// ─── تابع کمکی: ساخت category مستقیم از طریق API ────────────────────────────
const createCategory = async (token, overrides = {}) => {
  const res = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: overrides.title || "الکترونیک",
      slug: overrides.slug || "electronics",
      description: overrides.description || "محصولات الکترونیکی",
    });
  return res;
};

// =============================================================================
// GET /api/categories — عمومی
// =============================================================================
describe("GET /api/categories", () => {
  test("بدون توکن → 200 (عمومی است)", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  test("لیست خالی وقتی هیچ دسته‌بندی نیست", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test("جستجو با search query", async () => {
    const editor = await createUser({
      email: "editor@example.com",
      role: "editor",
    });
    const token = await login("editor@example.com");

    await createCategory(token, { title: "موبایل", slug: "mobile" });
    await createCategory(token, { title: "لپ‌تاپ", slug: "laptop" });

    const res = await request(app).get("/api/categories?search=موبایل");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("موبایل");
  });

  test("pagination درست کار می‌کند", async () => {
    // ساخت editor برای ایجاد دسته‌بندی‌ها
    await createUser({ email: "editor@example.com", role: "editor" });
    const editorToken = await login("editor@example.com");

    await createCategory(editorToken, { title: "موبایل", slug: "mobile" });
    await createCategory(editorToken, { title: "لپ‌تاپ", slug: "laptop" });
    await createCategory(editorToken, { title: "تبلت", slug: "tablet" });

    const res = await request(app).get("/api/categories?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.totalPages).toBe(2);
  });
});

// =============================================================================
// POST /api/categories
// =============================================================================
describe("POST /api/categories", () => {
  test("editor می‌تواند دسته‌بندی بسازد → 201", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const res = await createCategory(token);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("slug", "electronics");
  });

  test("کاربر عادی نمی‌تواند دسته‌بندی بسازد → 403", async () => {
    await createUser({ email: "user@example.com", role: "user" });
    const token = await login("user@example.com");

    const res = await createCategory(token);

    expect(res.status).toBe(403);
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ title: "الکترونیک", slug: "electronics" });

    expect(res.status).toBe(401);
  });

  test("slug تکراری → 409", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    await createCategory(token, { slug: "electronics" });

    // دوباره با همان slug
    const res = await createCategory(token, {
      slug: "electronics",
      title: "الکترونیک ۲",
    });

    expect(res.status).toBe(409);
  });

  test("بدون title → 400 (Joi)", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ slug: "electronics" });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// GET /api/categories/:id
// =============================================================================
describe("GET /api/categories/:id", () => {
  test("دریافت دسته‌بندی موجود → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const created = await createCategory(token);
    const id = created.body.data._id;

    const res = await request(app).get(`/api/categories/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe("electronics");
  });

  test("id نامعتبر → 400", async () => {
    const res = await request(app).get("/api/categories/not-valid-id");
    expect(res.status).toBe(400);
  });

  test("id معتبر ولی ناموجود → 404", async () => {
    const res = await request(app).get(
      "/api/categories/64f1a2b3c4d5e6f7a8b9c0d1",
    );
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/categories/:id
// =============================================================================
describe("PATCH /api/categories/:id", () => {
  test("editor می‌تواند دسته‌بندی را ویرایش کند → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const created = await createCategory(token);
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/categories/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "الکترونیک ویرایش‌شده" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("الکترونیک ویرایش‌شده");
  });

  test("کاربر عادی نمی‌تواند ویرایش کند → 403", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const editorToken = await login("editor@example.com");
    const created = await createCategory(editorToken);
    const id = created.body.data._id;

    await createUser({ email: "user@example.com", role: "user" });
    const userToken = await login("user@example.com");

    const res = await request(app)
      .patch(`/api/categories/${id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "هک" });

    expect(res.status).toBe(403);
  });

  test("slug تکراری در ویرایش → 409", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    await createCategory(token, { title: "موبایل", slug: "mobile" });
    const second = await createCategory(token, {
      title: "لپ‌تاپ",
      slug: "laptop",
    });
    const id = second.body.data._id;

    // تلاش برای تغییر slug لپ‌تاپ به mobile که قبلاً وجود داره
    const res = await request(app)
      .patch(`/api/categories/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ slug: "mobile" });

    expect(res.status).toBe(409);
  });

  test("id ناموجود → 404", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const res = await request(app)
      .patch("/api/categories/64f1a2b3c4d5e6f7a8b9c0d1")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "تست" });

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/categories/:id
// =============================================================================
describe("DELETE /api/categories/:id", () => {
  test("editor می‌تواند دسته‌بندی را حذف کند → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const created = await createCategory(token);
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/categories/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("بعد از حذف، دسته‌بندی دیگر پیدا نمی‌شود → 404", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const created = await createCategory(token);
    const id = created.body.data._id;

    await request(app)
      .delete(`/api/categories/${id}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app).get(`/api/categories/${id}`);
    expect(res.status).toBe(404);
  });

  test("کاربر عادی نمی‌تواند حذف کند → 403", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const editorToken = await login("editor@example.com");
    const created = await createCategory(editorToken);
    const id = created.body.data._id;

    await createUser({ email: "user@example.com", role: "user" });
    const userToken = await login("user@example.com");

    const res = await request(app)
      .delete(`/api/categories/${id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  test("id ناموجود → 404", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const res = await request(app)
      .delete("/api/categories/64f1a2b3c4d5e6f7a8b9c0d1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
