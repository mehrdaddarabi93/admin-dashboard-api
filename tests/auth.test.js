/**
 * تست‌های Auth Endpoints
 * ======================
 * register / login / me / refresh-token / logout
 *
 * چرا از supertest استفاده می‌کنیم؟
 * supertest سرور رو داخل حافظه بالا میاره (بدون listen روی port)
 * و درخواست HTTP واقعی می‌زنه — یعنی همه لایه‌ها (route, middleware,
 * controller, service, DB) با هم تست می‌شن.
 */

// متغیرهای محیطی لازم برای app.js و validateEnv
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

// ─── اتصال به test DB قبل از همه تست‌های این فایل ───────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

// ─── پاک کردن دیتابیس قبل از هر تست (test isolation) ───────────────────────
beforeEach(async () => {
  await clearDatabase();
});

// ─── قطع اتصال بعد از همه تست‌های این فایل ──────────────────────────────────
afterAll(async () => {
  await mongoose.disconnect();
});

// =============================================================================
// POST /api/auth/register
// =============================================================================
describe("POST /api/auth/register", () => {
  test("ثبت‌نام موفق با داده‌های معتبر → 201", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "علی احمدی",
      email: "ali@example.com",
      password: "pass1234",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.email).toBe("ali@example.com");
    // پسورد نباید در پاسخ برگردد
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("ثبت‌نام با ایمیل تکراری → 409", async () => {
    // اول یه کاربر می‌سازیم
    await createUser({ email: "ali@example.com" });

    const res = await request(app).post("/api/auth/register").send({
      name: "علی دیگر",
      email: "ali@example.com",
      password: "pass1234",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("ثبت‌نام با رمز کمتر از ۸ کاراکتر → 400 (Joi)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "علی",
      email: "ali@example.com",
      password: "123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("ثبت‌نام بدون ایمیل → 400 (Joi)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "علی",
      password: "pass1234",
    });

    expect(res.status).toBe(400);
  });

  test("تزریق role در register رد می‌شود — validator فیلد اضافه را reject می‌کند", async () => {
    /**
     * registerSchema در Joi فیلد role ندارد.
     * ارسال هر فیلد اضافه‌ای → 400
     * این رفتار امن‌تر از نادیده گرفتن role است.
     */
    const res = await request(app).post("/api/auth/register").send({
      name: "هکر",
      email: "hacker@example.com",
      password: "pass1234",
      role: "chiefadmin",
    });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// POST /api/auth/login
// =============================================================================
describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    // یه کاربر آماده برای تست login
    await createUser({ email: "ali@example.com" });
  });

  test("ورود موفق → 200 + accessToken + refreshToken", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ali@example.com",
      password: "pass1234",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
  });

  test("ورود با رمز اشتباه → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ali@example.com",
      password: "wrongpass",
    });

    expect(res.status).toBe(401);
  });

  test("ورود با ایمیل ناموجود → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "pass1234",
    });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// GET /api/auth/me
// =============================================================================
describe("GET /api/auth/me", () => {
  let accessToken;

  beforeEach(async () => {
    await createUser({ email: "ali@example.com" });

    const res = await request(app).post("/api/auth/login").send({
      email: "ali@example.com",
      password: "pass1234",
    });
    accessToken = res.body.data.accessToken;
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("با توکن معتبر → 200 + اطلاعات کاربر", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("ali@example.com");
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("با توکن جعلی → 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer fake.token.here");

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// POST /api/auth/logout
// =============================================================================
describe("POST /api/auth/logout", () => {
  /**
   * چرا در هر تست logout مستقیماً register + login می‌کنیم؟
   * چون logout نیاز به refreshToken واقعی (امضاشده با JWT_REFRESH_SECRET) داره.
   * helpers.js کاربر رو مستقیم در DB می‌سازه و refreshToken نمی‌ده.
   * پس باید از طریق API ورود کنیم تا توکن واقعی بگیریم.
   */

  test("خروج موفق با refreshToken معتبر → 200", async () => {
    /**
     * logout نیاز به authMiddleware داره — یعنی باید:
     * 1. accessToken در Authorization header
     * 2. refreshToken در body
     * هر دو با هم ارسال بشن.
     */
    await request(app).post("/api/auth/register").send({
      name: "علی",
      email: "ali@example.com",
      password: "pass1234",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "ali@example.com",
      password: "pass1234",
    });

    const accessToken = loginRes.body.data.accessToken;
    const refreshToken = loginRes.body.data.refreshToken;

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
  });

  test("استفاده مجدد از همان refreshToken بعد از logout → 401", async () => {
    await request(app).post("/api/auth/register").send({
      name: "علی",
      email: "ali@example.com",
      password: "pass1234",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "ali@example.com",
      password: "pass1234",
    });

    const accessToken = loginRes.body.data.accessToken;
    const refreshToken = loginRes.body.data.refreshToken;

    // اول logout با accessToken + refreshToken
    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    // بعد تلاش برای refresh با همان توکن — باید reject بشه
    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// POST /api/auth/change-password
// =============================================================================
describe("POST /api/auth/change-password", () => {
  /**
   * این endpoint نیاز به authMiddleware داره:
   * - accessToken در Authorization header
   * - currentPassword + newPassword در body
   *
   * رفتارهای مهم:
   * 1. رمز فعلی باید درست باشه
   * 2. رمز جدید نباید با رمز فعلی یکسان باشه
   * 3. بعد از تغییر رمز، همه refreshToken ها باطل می‌شن (logout همه دستگاه‌ها)
   */

  let accessToken;
  let refreshToken;

  beforeEach(async () => {
    await createUser({ email: "ali@example.com" });

    const res = await request(app).post("/api/auth/login").send({
      email: "ali@example.com",
      password: "pass1234",
    });

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test("تغییر رمز موفق → 200", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "pass1234",
        newPassword: "newpass1234",
      });

    expect(res.status).toBe(200);
  });

  test("بدون توکن → 401", async () => {
    const res = await request(app).post("/api/auth/change-password").send({
      currentPassword: "pass1234",
      newPassword: "newpass1234",
    });

    expect(res.status).toBe(401);
  });

  test("رمز فعلی اشتباه → 401", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "wrongpassword",
        newPassword: "newpass1234",
      });

    expect(res.status).toBe(401);
  });

  test("رمز جدید همان رمز فعلی است → 400", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "pass1234",
        newPassword: "pass1234",
      });

    expect(res.status).toBe(400);
  });

  test("رمز جدید کمتر از ۶ کاراکتر → 400 (Joi)", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "pass1234",
        newPassword: "123",
      });

    expect(res.status).toBe(400);
  });

  test("بعد از تغییر رمز، refreshToken قدیمی باطل می‌شود → 401", async () => {
    /**
     * این تست یه رفتار امنیتی مهم رو تأیید می‌کنه:
     * وقتی کاربر رمزش رو عوض می‌کنه، همه session های دیگه باید
     * باطل بشن. مثلاً اگه کسی به گوشی کاربر دسترسی داشته باشه،
     * با تغییر رمز از لپ‌تاپ، گوشی هم logout می‌شه.
     */
    await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "pass1234",
        newPassword: "newpass1234",
      });

    // حالا با refreshToken قدیمی نباید بشه توکن جدید گرفت
    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });

  test("بعد از تغییر رمز، با رمز جدید می‌توان login کرد", async () => {
    await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "pass1234",
        newPassword: "newpass1234",
      });

    const res = await request(app).post("/api/auth/login").send({
      email: "ali@example.com",
      password: "newpass1234",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
  });
});
