/**
 * تست‌های Product Endpoints
 * =========================
 * GET / POST / PATCH / DELETE / restore / trash
 * stock increase/decrease
 * reviews (add / update / delete)
 *
 * رد شده (نیاز به فایل واقعی):
 * - POST /:id/image
 * - POST /:id/gallery
 * - PATCH /:id/images/:name/main
 * - DELETE /:id/images/:name
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

const createCategory = async () => {
  return Category.create({ title: "دسته تستی", slug: `cat-${Date.now()}` });
};

const createProduct = async (token, categoryId, overrides = {}) => {
  return request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: overrides.title || "محصول تستی",
      slug: overrides.slug || `product-${Date.now()}`,
      price: overrides.price || 100000,
      stock: overrides.stock ?? 10,
      category: categoryId,
      description: "توضیح تستی",
    });
};

// =============================================================================
// GET /api/products
// =============================================================================
describe("GET /api/products", () => {
  test("بدون توکن → 200 (عمومی)", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
  });

  test("محصولات حذف‌شده در لیست عمومی نمایش داده نمی‌شوند", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();

    const product = await createProduct(token, cat._id);
    const id = product.body.data._id;

    // حذف نرم
    await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app).get("/api/products");
    const ids = res.body.data.map((p) => p._id);
    expect(ids).not.toContain(id);
  });
});

// =============================================================================
// GET /api/products/search
// =============================================================================
describe("GET /api/products/search", () => {
  test("جستجو با q → فقط محصولات مرتبط", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();

    await createProduct(token, cat._id, {
      title: "لپ‌تاپ ایسوس",
      slug: "asus-laptop",
    });
    await createProduct(token, cat._id, {
      title: "موبایل سامسونگ",
      slug: "samsung-mobile",
    });

    const res = await request(app).get("/api/products/search?q=لپ‌تاپ");
    expect(res.status).toBe(200);
    expect(
      res.body.data.products.every((p) => p.title.includes("لپ‌تاپ")),
    ).toBe(true);
  });

  test("فیلتر با minPrice و maxPrice", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();

    await createProduct(token, cat._id, {
      title: "ارزان",
      slug: "cheap",
      price: 50000,
    });
    await createProduct(token, cat._id, {
      title: "گران",
      slug: "expensive",
      price: 500000,
    });

    const res = await request(app).get(
      "/api/products/search?minPrice=100000&maxPrice=600000",
    );
    expect(res.status).toBe(200);
    res.body.data.products.forEach((p) => {
      expect(p.price).toBeGreaterThanOrEqual(100000);
      expect(p.price).toBeLessThanOrEqual(600000);
    });
  });

  test("فیلتر inStock=true فقط محصولات موجود را برمی‌گرداند", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();

    await createProduct(token, cat._id, { slug: "in-stock", stock: 5 });
    await createProduct(token, cat._id, { slug: "out-stock", stock: 0 });

    const res = await request(app).get("/api/products/search?inStock=true");
    expect(res.status).toBe(200);
    res.body.data.products.forEach((p) => {
      expect(p.stock).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// POST /api/products
// =============================================================================
describe("POST /api/products", () => {
  test("editor می‌تواند محصول بسازد → 201", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();

    const res = await createProduct(token, cat._id);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("slug");
  });

  test("کاربر عادی نمی‌تواند محصول بسازد → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");
    const cat = await createCategory();

    const res = await createProduct(token, cat._id);
    expect(res.status).toBe(403);
  });

  test("category ناموجود → 404", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "تستی",
        slug: "test-slug",
        price: 100000,
        stock: 5,
        category: "64f1a2b3c4d5e6f7a8b9c0d1",
      });

    expect(res.status).toBe(404);
  });

  test("slug تکراری → 409", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();

    await createProduct(token, cat._id, { slug: "same-slug" });
    const res = await createProduct(token, cat._id, {
      slug: "same-slug",
      title: "تکراری",
    });

    expect(res.status).toBe(409);
  });

  test("بدون title → 400 (Joi)", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ slug: "no-title", price: 100000, stock: 5, category: cat._id });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// GET /api/products/:id
// =============================================================================
describe("GET /api/products/:id", () => {
  test("دریافت محصول موجود → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    const res = await request(app).get(`/api/products/${id}`);
    expect(res.status).toBe(200);
  });

  test("محصول حذف‌شده قابل دسترسی نیست → 404", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app).get(`/api/products/${id}`);
    expect(res.status).toBe(404);
  });

  test("id نامعتبر → 400", async () => {
    const res = await request(app).get("/api/products/invalid-id");
    expect(res.status).toBe(400);
  });

  test("id معتبر ولی ناموجود → 404", async () => {
    const res = await request(app).get(
      "/api/products/64f1a2b3c4d5e6f7a8b9c0d1",
    );
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// PATCH /api/products/:id
// =============================================================================
describe("PATCH /api/products/:id", () => {
  test("editor می‌تواند محصول را ویرایش کند → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "عنوان جدید" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("عنوان جدید");
  });

  test("کاربر عادی نمی‌تواند ویرایش کند → 403", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    await createUser({ email: "user@example.com" });
    const editorToken = await login("editor@example.com");
    const userToken = await login("user@example.com");
    const cat = await createCategory();
    const created = await createProduct(editorToken, cat._id);
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/products/${id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "هک" });

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// DELETE + restore + trash
// =============================================================================
describe("DELETE /api/products/:id (Soft Delete)", () => {
  test("حذف نرم موفق → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("حذف مجدد → 404", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/products/:id/restore", () => {
  test("بازیابی محصول حذف‌شده → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/products/${id}/restore`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("بازیابی محصول حذف‌نشده → 404", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/products/${id}/restore`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/products/trash", () => {
  test("editor می‌تواند لیست حذف‌شده‌ها را ببیند → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");

    const res = await request(app)
      .get("/api/products/trash")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("کاربر عادی نمی‌تواند لیست حذف‌شده‌ها را ببیند → 403", async () => {
    await createUser({ email: "user@example.com" });
    const token = await login("user@example.com");

    const res = await request(app)
      .get("/api/products/trash")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// Stock Management
// =============================================================================
describe("PATCH /api/products/:id/stock", () => {
  test("افزایش موجودی → 200 + stock درست محاسبه می‌شود", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id, { stock: 10 });
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/products/${id}/stock/increase`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(15);
  });

  test("کاهش موجودی → 200 + stock درست محاسبه می‌شود", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id, { stock: 10 });
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/products/${id}/stock/decrease`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(7);
  });

  test("کاهش موجودی بیشتر از موجودی فعلی → 400", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id, { stock: 3 });
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/products/${id}/stock/decrease`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(400);
  });

  test("quantity صفر → 400", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const token = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(token, cat._id);
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/products/${id}/stock/increase`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 0 });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// Reviews
// =============================================================================
describe("POST /api/products/:id/reviews", () => {
  test("کاربر می‌تواند نظر ثبت کند → 201", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    await createUser({ email: "user@example.com" });
    const editorToken = await login("editor@example.com");
    const userToken = await login("user@example.com");
    const cat = await createCategory();
    const created = await createProduct(editorToken, cat._id);
    const id = created.body.data._id;

    const res = await request(app)
      .post(`/api/products/${id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 4, comment: "محصول خوبی بود" });

    expect(res.status).toBe(201);
  });

  test("ثبت نظر تکراری → 400", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    await createUser({ email: "user@example.com" });
    const editorToken = await login("editor@example.com");
    const userToken = await login("user@example.com");
    const cat = await createCategory();
    const created = await createProduct(editorToken, cat._id);
    const id = created.body.data._id;

    await request(app)
      .post(`/api/products/${id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 4, comment: "اول" });

    const res = await request(app)
      .post(`/api/products/${id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5, comment: "دوم" });

    expect(res.status).toBe(400);
  });

  test("بدون توکن → 401", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    const editorToken = await login("editor@example.com");
    const cat = await createCategory();
    const created = await createProduct(editorToken, cat._id);
    const id = created.body.data._id;

    const res = await request(app)
      .post(`/api/products/${id}/reviews`)
      .send({ rating: 4, comment: "تست" });

    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/products/:id/reviews/:reviewId", () => {
  test("صاحب نظر می‌تواند نظر را ویرایش کند → 200", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    await createUser({ email: "user@example.com" });
    const editorToken = await login("editor@example.com");
    const userToken = await login("user@example.com");
    const cat = await createCategory();
    const created = await createProduct(editorToken, cat._id);
    const productId = created.body.data._id;

    const reviewRes = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 3, comment: "متوسط" });

    const reviewId = reviewRes.body.data.reviews?.at(-1)?._id;

    const res = await request(app)
      .patch(`/api/products/${productId}/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5, comment: "عالی بود" });

    expect(res.status).toBe(200);
  });

  test("کاربر دیگر نمی‌تواند نظر را ویرایش کند → 403", async () => {
    await createUser({ email: "editor@example.com", role: "editor" });
    await createUser({ email: "user1@example.com" });
    await createUser({ email: "user2@example.com" });
    const editorToken = await login("editor@example.com");
    const user1Token = await login("user1@example.com");
    const user2Token = await login("user2@example.com");
    const cat = await createCategory();
    const created = await createProduct(editorToken, cat._id);
    const productId = created.body.data._id;

    const reviewRes = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ rating: 3, comment: "نظر user1" });

    const reviewId = reviewRes.body.data.reviews?.at(-1)?._id;

    const res = await request(app)
      .patch(`/api/products/${productId}/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ rating: 1, comment: "هک" });

    expect(res.status).toBe(403);
  });
});
