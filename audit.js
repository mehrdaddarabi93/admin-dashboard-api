/**
 * Swagger Audit Script
 * ====================
 * این اسکریپت تمام endpoint های مستندشده در Swagger را به صورت واقعی
 * صدا می‌زند و status code واقعی سرور را با چیزی که در کامنت‌های
 * @swagger نوشته شده مقایسه می‌کند.
 *
 * نحوه اجرا:
 *   1. سرور پروژه را اجرا کن (npm run dev) - باید روی پورت 5000 باشد
 *   2. این فایل را کنار پوشه src پروژه (یا هرجای دلخواه) قرار بده
 *   3. در ترمینال بزن: node audit.js
 *
 * نکته: این اسکریپت داده‌های تستی (کاربر، دسته‌بندی، محصول و ...) در
 * دیتابیس واقعی شما می‌سازد. بهتر است روی دیتابیس development اجرا شود،
 * نه روی دیتابیس production.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// رنگ‌های ساده برای خروجی ترمینال
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const results = [];
let passCount = 0;
let failCount = 0;

/**
 * یک تست را اجرا می‌کند و نتیجه را با status code مورد انتظار مقایمه می‌کند
 */
async function runTest({
  name,
  method,
  path,
  body,
  token,
  expectedStatuses,
  formData,
}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let fetchOptions = { method, headers };

  if (formData) {
    // multipart/form-data درخواست‌ها (آپلود عکس) را نادیده می‌گیریم چون نیاز به فایل واقعی دارند
    results.push({
      name,
      skipped: true,
      reason: "نیاز به فایل واقعی برای آپلود دارد - دستی تست کن",
    });
    return null;
  }

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  } else {
    delete headers["Content-Type"];
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, fetchOptions);
    let json = null;
    try {
      json = await res.json();
    } catch {
      // ممکن است بدنه خالی باشد
    }

    const ok = expectedStatuses.includes(res.status);

    results.push({
      name,
      method,
      path,
      expectedStatuses,
      actualStatus: res.status,
      ok,
      responseBody: json,
    });

    if (ok) passCount++;
    else failCount++;

    return { status: res.status, body: json };
  } catch (err) {
    results.push({
      name,
      method,
      path,
      expectedStatuses,
      actualStatus: "ERROR",
      ok: false,
      error: err.message,
    });
    failCount++;
    return null;
  }
}

function printReport() {
  console.log("\n" + colors.bold("=".repeat(70)));
  console.log(colors.bold("  گزارش تست Swagger در مقابل رفتار واقعی سرور"));
  console.log(colors.bold("=".repeat(70)) + "\n");

  for (const r of results) {
    if (r.skipped) {
      console.log(colors.yellow(`⏭️  SKIP`) + `  ${r.name}`);
      console.log(`    ${colors.yellow(r.reason)}`);
      continue;
    }

    const icon = r.ok ? colors.green("✅ PASS") : colors.red("❌ FAIL");
    console.log(`${icon}  ${r.method} ${r.path}  —  ${r.name}`);

    if (!r.ok) {
      console.log(
        `    انتظار: ${colors.cyan(r.expectedStatuses.join(" یا "))}`,
      );
      console.log(`    واقعی: ${colors.red(r.actualStatus)}`);
      if (r.error) console.log(`    خطا: ${colors.red(r.error)}`);
      if (r.responseBody) {
        console.log(`    پاسخ سرور: ${JSON.stringify(r.responseBody)}`);
      }
    }
  }

  console.log("\n" + colors.bold("-".repeat(70)));
  console.log(
    colors.bold(`نتیجه نهایی: `) +
      colors.green(`${passCount} موفق`) +
      "  /  " +
      colors.red(`${failCount} ناموفق`) +
      "  /  " +
      colors.yellow(
        `${results.filter((r) => r.skipped).length} رد شده (نیاز به تست دستی)`,
      ),
  );
  console.log(colors.bold("-".repeat(70)) + "\n");

  if (failCount > 0) {
    console.log(
      colors.yellow(
        "نکته: موارد FAIL را برای Claude بفرست (متن همین خروجی کافی است) تا مستندات Swagger را دقیقاً مطابق رفتار واقعی پروژه اصلاح کند.\n",
      ),
    );
  }
}

async function main() {
  console.log(colors.cyan(`در حال اتصال به ${BASE_URL} ...`));

  const uniqueSuffix = Date.now();
  const testEmail = `audit_${uniqueSuffix}@example.com`;
  const testPassword = "pass1234";

  // ===================== AUTH =====================
  await runTest({
    name: "ثبت‌نام موفق",
    method: "POST",
    path: "/api/auth/register",
    body: { name: "Audit User", email: testEmail, password: testPassword },
    expectedStatuses: [201],
  });

  await runTest({
    name: "ثبت‌نام با ایمیل تکراری",
    method: "POST",
    path: "/api/auth/register",
    body: { name: "Audit User", email: testEmail, password: testPassword },
    expectedStatuses: [409],
  });

  await runTest({
    name: "ثبت‌نام با رمز کوتاه (خطای Joi)",
    method: "POST",
    path: "/api/auth/register",
    body: {
      name: "Audit User",
      email: `short_${uniqueSuffix}@example.com`,
      password: "123",
    },
    expectedStatuses: [400],
  });

  const loginRes = await runTest({
    name: "ورود موفق",
    method: "POST",
    path: "/api/auth/login",
    body: { email: testEmail, password: testPassword },
    expectedStatuses: [200],
  });

  await runTest({
    name: "ورود با رمز اشتباه",
    method: "POST",
    path: "/api/auth/login",
    body: { email: testEmail, password: "wrongpassword" },
    expectedStatuses: [401],
  });

  const accessToken = loginRes?.body?.data?.accessToken;
  const refreshToken = loginRes?.body?.data?.refreshToken;
  const testUserRole = loginRes?.body?.data?.role;

  if (!accessToken) {
    console.log(
      colors.red(
        "\n⚠️  accessToken از پاسخ login استخراج نشد. ساختار پاسخ واقعی:",
      ),
    );
    console.log(JSON.stringify(loginRes?.body, null, 2));
    console.log(
      colors.yellow(
        "این یعنی مسیر data.accessToken در کد سرویس فرق دارد با چیزی که در Swagger نوشته شده — این خودش یک یافته مهمه.\n",
      ),
    );
  }

  /**
   * هشدار آلودگی دیتابیس:
   * اگر این کاربر تستی از اجرای قبلی audit در دیتابیس مانده و نقشش
   * تغییر کرده باشد، تست‌های permission اشتباه نتیجه می‌دهند.
   * کاربر تستی باید همیشه role=user داشته باشد.
   */
  if (accessToken && testUserRole && testUserRole !== "user") {
    console.log(
      colors.red(
        `\n🚨 هشدار: کاربر تستی نقش "${testUserRole}" دارد (باید "user" باشد).`,
      ),
    );
    console.log(
      colors.yellow(
        `   دیتابیس آلوده است — کاربر audit قبلی باقی مانده و نقشش تغییر کرده.`,
      ),
    );
    console.log(
      colors.yellow(`   قبل از ادامه، این دستور را در mongosh اجرا کن:`),
    );
    console.log(colors.cyan(`   db.users.deleteMany({ email: /^audit_/ })\n`));
    console.log(
      colors.yellow(
        `   تست‌های permission (403) با نقش "${testUserRole}" نتیجه اشتباه می‌دهند و قابل اعتماد نیستند.\n`,
      ),
    );
  }

  await runTest({
    name: "دریافت اطلاعات کاربر (me) بدون توکن",
    method: "GET",
    path: "/api/auth/me",
    expectedStatuses: [401],
  });

  await runTest({
    name: "دریافت اطلاعات کاربر (me) با توکن معتبر",
    method: "GET",
    path: "/api/auth/me",
    token: accessToken,
    expectedStatuses: [200],
  });

  await runTest({
    name: "تست دسترسی ادمین (کاربر معمولی - باید 403 بگیرد)",
    method: "GET",
    path: "/api/auth/admin-test",
    token: accessToken,
    expectedStatuses: [403],
  });

  await runTest({
    name: "رفرش توکن با مقدار خالی",
    method: "POST",
    path: "/api/auth/refresh-token",
    body: {},
    expectedStatuses: [401],
  });

  await runTest({
    name: "رفرش توکن با مقدار جعلی",
    method: "POST",
    path: "/api/auth/refresh-token",
    body: { refreshToken: "fake.token.value" },
    expectedStatuses: [401],
  });

  if (refreshToken) {
    await runTest({
      name: "رفرش توکن معتبر",
      method: "POST",
      path: "/api/auth/refresh-token",
      body: { refreshToken },
      expectedStatuses: [200],
    });
  }

  // ===================== CATEGORIES (بدون نیاز به ادمین برای GET) =====================
  await runTest({
    name: "دریافت لیست دسته‌بندی‌ها (عمومی)",
    method: "GET",
    path: "/api/categories",
    expectedStatuses: [200],
  });

  await runTest({
    name: "دریافت دسته‌بندی با id نامعتبر",
    method: "GET",
    path: "/api/categories/not-a-valid-id",
    expectedStatuses: [400],
  });

  await runTest({
    name: "دریافت دسته‌بندی با id معتبر ولی ناموجود",
    method: "GET",
    path: "/api/categories/64f1a2b3c4d5e6f7a8b9c0d1",
    expectedStatuses: [404],
  });

  await runTest({
    name: "ایجاد دسته‌بندی بدون توکن",
    method: "POST",
    path: "/api/categories",
    body: { title: "تست", slug: `test-cat-${uniqueSuffix}` },
    expectedStatuses: [401],
  });

  await runTest({
    name: "ایجاد دسته‌بندی با کاربر غیرادمین (باید 403)",
    method: "POST",
    path: "/api/categories",
    token: accessToken,
    body: { title: "تست", slug: `test-cat-${uniqueSuffix}` },
    expectedStatuses: [403],
  });

  // ===================== PRODUCTS (GET عمومی) =====================
  await runTest({
    name: "دریافت لیست محصولات (عمومی)",
    method: "GET",
    path: "/api/products",
    expectedStatuses: [200],
  });

  await runTest({
    name: "جستجوی محصولات",
    method: "GET",
    path: "/api/products/search?q=test",
    expectedStatuses: [200],
  });

  await runTest({
    name: "دریافت محصول با id نامعتبر",
    method: "GET",
    path: "/api/products/not-a-valid-id",
    expectedStatuses: [400],
  });

  await runTest({
    name: "دریافت محصول با id معتبر ولی ناموجود",
    method: "GET",
    path: "/api/products/64f1a2b3c4d5e6f7a8b9c0d1",
    expectedStatuses: [404],
  });

  await runTest({
    name: "ایجاد محصول بدون توکن",
    method: "POST",
    path: "/api/products",
    body: {
      title: "تست",
      slug: `test-prod-${uniqueSuffix}`,
      price: 1000,
      stock: 1,
      category: "64f1a2b3c4d5e6f7a8b9c0d1",
    },
    expectedStatuses: [401],
  });

  // ===================== CART =====================
  await runTest({
    name: "دریافت سبد خرید بدون توکن",
    method: "GET",
    path: "/api/cart",
    expectedStatuses: [401],
  });

  await runTest({
    name: "دریافت سبد خرید با توکن (سبد ممکن است خالی باشد)",
    method: "GET",
    path: "/api/cart",
    token: accessToken,
    expectedStatuses: [200, 404],
  });

  await runTest({
    name: "افزودن به سبد با productId نامعتبر",
    method: "POST",
    path: "/api/cart",
    token: accessToken,
    body: { productId: "not-a-valid-id", quantity: 1 },
    expectedStatuses: [400],
  });

  // ===================== ORDERS =====================
  await runTest({
    name: "دریافت سفارشات من بدون توکن",
    method: "GET",
    path: "/api/orders/my-orders",
    expectedStatuses: [401],
  });

  await runTest({
    name: "دریافت سفارشات من با توکن",
    method: "GET",
    path: "/api/orders/my-orders",
    token: accessToken,
    expectedStatuses: [200],
  });

  await runTest({
    name: "دریافت تمام سفارشات با کاربر غیرادمین (باید 403)",
    method: "GET",
    path: "/api/orders",
    token: accessToken,
    expectedStatuses: [403],
  });

  await runTest({
    name: "ایجاد سفارش با orderItems خالی",
    method: "POST",
    path: "/api/orders",
    token: accessToken,
    body: { orderItems: [], shippingAddress: "تهران" },
    expectedStatuses: [400],
  });

  // ===================== COUPONS =====================
  await runTest({
    name: "دریافت کدهای تخفیف بدون توکن",
    method: "GET",
    path: "/api/coupons",
    expectedStatuses: [401],
  });

  await runTest({
    name: "دریافت کدهای تخفیف با کاربر غیرادمین (باید 403)",
    method: "GET",
    path: "/api/coupons",
    token: accessToken,
    expectedStatuses: [403],
  });

  // ===================== USERS =====================
  await runTest({
    name: "دریافت لیست کاربران با کاربر غیرادمین (باید 403)",
    method: "GET",
    path: "/api/users",
    token: accessToken,
    expectedStatuses: [403],
  });

  await runTest({
    name: "افزودن به wishlist با productId نامعتبر",
    method: "POST",
    path: "/api/users/wishlist/not-a-valid-id",
    token: accessToken,
    expectedStatuses: [400],
  });

  await runTest({
    name: "دریافت wishlist با توکن",
    method: "GET",
    path: "/api/users/wishlist",
    token: accessToken,
    expectedStatuses: [200],
  });

  // ===================== DASHBOARD =====================
  await runTest({
    name: "دریافت آمار داشبورد بدون توکن",
    method: "GET",
    path: "/api/dashboard/stats",
    expectedStatuses: [401],
  });

  await runTest({
    name: "دریافت آمار داشبورد با کاربر غیرادمین (باید 403)",
    method: "GET",
    path: "/api/dashboard/stats",
    token: accessToken,
    expectedStatuses: [403],
  });

  // ===================== LOGOUT (در انتها، چون توکن را باطل می‌کند) =====================
  await runTest({
    name: "خروج بدون refreshToken در body",
    method: "POST",
    path: "/api/auth/logout",
    token: accessToken,
    body: {},
    expectedStatuses: [400],
  });

  if (refreshToken && accessToken) {
    await runTest({
      name: "خروج موفق با refreshToken معتبر",
      method: "POST",
      path: "/api/auth/logout",
      token: accessToken,
      body: { refreshToken },
      expectedStatuses: [200],
    });

    await runTest({
      name: "خروج دوباره با همان refreshToken (دیگر معتبر نیست)",
      method: "POST",
      path: "/api/auth/logout",
      token: accessToken,
      body: { refreshToken },
      expectedStatuses: [401],
    });
  }

  // ===================== RBAC: ساخت کاربر با نقش دلخواه (chiefadmin) =====================
  // این بخش نیاز به یک حساب chiefadmin واقعی دارد که از قبل در دیتابیس
  // ساخته شده باشد (طبق راهنمای قبلی، با mongosh دستی role آن را
  // chiefadmin کرده‌اید). ایمیل/رمز آن حساب را از متغیر محیطی می‌خوانیم
  // تا داخل کد هاردکد نشود.
  const chiefEmail = process.env.CHIEF_ADMIN_EMAIL;
  const chiefPassword = process.env.CHIEF_ADMIN_PASSWORD;

  if (!chiefEmail || !chiefPassword) {
    console.log(
      colors.yellow(
        "\n⏭️  تست‌های RBAC رد شدند: متغیرهای CHIEF_ADMIN_EMAIL و CHIEF_ADMIN_PASSWORD ست نشده‌اند.",
      ),
    );
    console.log(
      colors.yellow(
        "   برای اجرای این بخش: CHIEF_ADMIN_EMAIL=ali@example.com CHIEF_ADMIN_PASSWORD=pass1234 node audit.js\n",
      ),
    );
  } else {
    const chiefLoginRes = await runTest({
      name: "ورود با حساب chiefadmin",
      method: "POST",
      path: "/api/auth/login",
      body: { email: chiefEmail, password: chiefPassword },
      expectedStatuses: [200],
    });

    const chiefToken = chiefLoginRes?.body?.data?.accessToken;

    if (!chiefToken) {
      console.log(
        colors.red(
          "\n⚠️  ورود chiefadmin ناموفق بود یا accessToken استخراج نشد. بقیه تست‌های RBAC رد می‌شوند.\n",
        ),
      );
    } else {
      const editorEmail = `editor_${uniqueSuffix}@example.com`;
      const editorPassword = "pass1234";

      await runTest({
        name: "ساخت کاربر جدید با نقش editor (توسط chiefadmin)",
        method: "POST",
        path: "/api/users",
        token: chiefToken,
        body: {
          name: "Audit Editor",
          email: editorEmail,
          password: editorPassword,
          role: "editor",
        },
        expectedStatuses: [201],
      });

      await runTest({
        name: "ساخت کاربر با role نامعتبر (باید خطای Joi بدهد)",
        method: "POST",
        path: "/api/users",
        token: chiefToken,
        body: {
          name: "Wrong Role",
          email: `wrongrole_${uniqueSuffix}@example.com`,
          password: "pass1234",
          role: "superhero",
        },
        expectedStatuses: [400],
      });

      await runTest({
        name: "ساخت کاربر بدون مجوز chiefadmin (با کاربر عادی - باید 403 بگیرد)",
        method: "POST",
        path: "/api/users",
        token: accessToken, // توکن کاربر عادی audit که اول اسکریپت ساختیم
        body: {
          name: "Should Fail",
          email: `shouldfail_${uniqueSuffix}@example.com`,
          password: "pass1234",
          role: "editor",
        },
        expectedStatuses: [403],
      });

      // ورود با حساب editor تازه‌ساخته‌شده برای تست محدوده مجوزهایش
      const editorLoginRes = await runTest({
        name: "ورود با حساب editor تازه‌ساخته‌شده",
        method: "POST",
        path: "/api/auth/login",
        body: { email: editorEmail, password: editorPassword },
        expectedStatuses: [200],
      });

      const editorToken = editorLoginRes?.body?.data?.accessToken;

      if (editorToken) {
        await runTest({
          name: "editor می‌تواند دسته‌بندی بسازد (مجوز manage_categories)",
          method: "POST",
          path: "/api/categories",
          token: editorToken,
          body: {
            title: "دسته تست Editor",
            slug: `editor-cat-${uniqueSuffix}`,
          },
          expectedStatuses: [201],
        });

        await runTest({
          name: "editor نمی‌تواند کوپن بسازد (فاقد مجوز manage_coupons)",
          method: "POST",
          path: "/api/coupons",
          token: editorToken,
          body: {
            code: `EDITORTEST${uniqueSuffix}`,
            discountPercentage: 10,
            expiresAt: "2026-12-31",
            usageLimit: 10,
          },
          expectedStatuses: [403],
        });

        await runTest({
          name: "editor نمی‌تواند کاربر بسازد (فاقد مجوز manage_admins)",
          method: "POST",
          path: "/api/users",
          token: editorToken,
          body: {
            name: "Should Also Fail",
            email: `shouldalsofail_${uniqueSuffix}@example.com`,
            password: "pass1234",
            role: "user",
          },
          expectedStatuses: [403],
        });
      }
    }
  }

  // ===================== فاز ۲.۵: User Management حرفه‌ای =====================
  // این بخش نیاز به حساب chiefadmin دارد (همان متغیرهای محیطی بخش RBAC)
  // اگر chiefToken از بخش قبل موجود نباشد، این تست‌ها رد می‌شوند

  if (!chiefEmail || !chiefPassword) {
    console.log(
      colors.yellow(
        "\n⏭️  تست‌های فاز ۲.۵ (Soft Delete / Restore / Search) رد شدند: chiefadmin ست نشده.",
      ),
    );
  } else {
    // دوباره login می‌کنیم تا chiefToken تازه داشته باشیم
    // (ممکن است بخش RBAC بالا آن را استفاده کرده باشد)
    const chiefLoginRes2 = await runTest({
      name: "[فاز ۲.۵] ورود chiefadmin برای تست‌های User Management",
      method: "POST",
      path: "/api/auth/login",
      body: { email: chiefEmail, password: chiefPassword },
      expectedStatuses: [200],
    });

    const chiefToken2 = chiefLoginRes2?.body?.data?.accessToken;

    if (chiefToken2) {
      // ─── بررسی lastLogin ───────────────────────────────────────────────────
      // اثبات: بعد از login موفق، فیلد lastLogin باید پر شده باشد
      const meRes = await runTest({
        name: "[فاز ۲.۵] بررسی ثبت lastLogin پس از ورود",
        method: "GET",
        path: "/api/auth/me",
        token: chiefToken2,
        expectedStatuses: [200],
      });

      if (meRes?.body?.data?.lastLogin) {
        // این تست اضافه می‌کنیم به نتایج به عنوان pass دستی
        results.push({
          name: "[فاز ۲.۵] تأیید: فیلد lastLogin در پاسخ /me وجود دارد",
          method: "GET",
          path: "/api/auth/me",
          expectedStatuses: [200],
          actualStatus: 200,
          ok: true,
        });
        passCount++;
      } else {
        results.push({
          name: "[فاز ۲.۵] تأیید: فیلد lastLogin در پاسخ /me وجود دارد",
          method: "GET",
          path: "/api/auth/me",
          expectedStatuses: ["lastLogin باید پر باشد"],
          actualStatus: "فیلد lastLogin خالی یا مفقود است",
          ok: false,
        });
        failCount++;
      }

      // ─── جستجوی پیشرفته کاربران ──────────────────────────────────────────
      await runTest({
        name: "[فاز ۲.۵] جستجوی کاربران بدون فیلتر (پیش‌فرض)",
        method: "GET",
        path: "/api/users",
        token: chiefToken2,
        expectedStatuses: [200],
      });

      await runTest({
        name: "[فاز ۲.۵] جستجوی کاربران با فیلتر role=user",
        method: "GET",
        path: "/api/users?role=user&page=1&limit=5",
        token: chiefToken2,
        expectedStatuses: [200],
      });

      await runTest({
        name: "[فاز ۲.۵] جستجوی کاربران با فیلتر isActive=true",
        method: "GET",
        path: "/api/users?isActive=true",
        token: chiefToken2,
        expectedStatuses: [200],
      });

      await runTest({
        name: "[فاز ۲.۵] جستجوی کاربران با includeDeleted=true",
        method: "GET",
        path: "/api/users?includeDeleted=true",
        token: chiefToken2,
        expectedStatuses: [200],
      });

      // ─── ساخت یک کاربر تستی برای Soft Delete ─────────────────────────────
      const deleteTargetEmail = `delete_target_${uniqueSuffix}@example.com`;

      const createTargetRes = await runTest({
        name: "[فاز ۲.۵] ساخت کاربر تستی برای عملیات Soft Delete",
        method: "POST",
        path: "/api/users",
        token: chiefToken2,
        body: {
          name: "Delete Target",
          email: deleteTargetEmail,
          password: "pass1234",
          role: "user",
        },
        expectedStatuses: [201],
      });

      const deleteTargetId = createTargetRes?.body?.data?.id;

      if (deleteTargetId) {
        // ─── تغییر نقش ────────────────────────────────────────────────────
        await runTest({
          name: "[فاز ۲.۵] تغییر نقش کاربر به support",
          method: "PATCH",
          path: `/api/users/${deleteTargetId}/role`,
          token: chiefToken2,
          body: { role: "support" },
          expectedStatuses: [200],
        });

        await runTest({
          name: "[فاز ۲.۵] تغییر نقش با مقدار نامعتبر (باید 400 بدهد)",
          method: "PATCH",
          path: `/api/users/${deleteTargetId}/role`,
          token: chiefToken2,
          body: { role: "superhero" },
          expectedStatuses: [400],
        });

        // ─── toggle وضعیت ─────────────────────────────────────────────────
        await runTest({
          name: "[فاز ۲.۵] غیرفعال کردن کاربر (toggle status)",
          method: "PATCH",
          path: `/api/users/${deleteTargetId}/status`,
          token: chiefToken2,
          expectedStatuses: [200],
        });

        await runTest({
          name: "[فاز ۲.۵] فعال کردن مجدد کاربر (toggle status دوباره)",
          method: "PATCH",
          path: `/api/users/${deleteTargetId}/status`,
          token: chiefToken2,
          expectedStatuses: [200],
        });

        // ─── Soft Delete ──────────────────────────────────────────────────
        await runTest({
          name: "[فاز ۲.۵] Soft Delete کاربر (با دلیل)",
          method: "DELETE",
          path: `/api/users/${deleteTargetId}`,
          token: chiefToken2,
          body: { reason: "تست audit - حذف نرم" },
          expectedStatuses: [200],
        });

        // بعد از حذف، دوباره حذف کردن باید خطا بدهد
        await runTest({
          name: "[فاز ۲.۵] Soft Delete مجدد همان کاربر (باید 404 بدهد)",
          method: "DELETE",
          path: `/api/users/${deleteTargetId}`,
          token: chiefToken2,
          body: { reason: "تکراری" },
          expectedStatuses: [404],
        });

        // ─── دریافت لیست حذف‌شده‌ها ───────────────────────────────────────
        await runTest({
          name: "[فاز ۲.۵] دریافت لیست کاربران حذف‌شده (باید کاربر بالا باشد)",
          method: "GET",
          path: "/api/users/deleted",
          token: chiefToken2,
          expectedStatuses: [200],
        });

        // ─── Restore ──────────────────────────────────────────────────────
        await runTest({
          name: "[فاز ۲.۵] بازیابی کاربر حذف‌شده",
          method: "PATCH",
          path: `/api/users/${deleteTargetId}/restore`,
          token: chiefToken2,
          expectedStatuses: [200],
        });

        // بعد از restore، بازیابی مجدد باید خطا بدهد
        await runTest({
          name: "[فاز ۲.۵] بازیابی مجدد کاربر بازیابی‌شده (باید 404 بدهد)",
          method: "PATCH",
          path: `/api/users/${deleteTargetId}/restore`,
          token: chiefToken2,
          expectedStatuses: [404],
        });
      } else {
        console.log(
          colors.yellow(
            "\n⚠️  ID کاربر تستی دریافت نشد - تست‌های Soft Delete/Restore رد شدند.",
          ),
        );
      }

      // ─── تست دسترسی کاربر عادی به مسیرهای محافظت‌شده ────────────────────
      await runTest({
        name: "[فاز ۲.۵] کاربر عادی نمی‌تواند لیست حذف‌شده‌ها را ببیند (403)",
        method: "GET",
        path: "/api/users/deleted",
        token: accessToken, // توکن کاربر عادی که اول اسکریپت ساختیم
        expectedStatuses: [403],
      });

      await runTest({
        name: "[فاز ۲.۵] کاربر بدون توکن نمی‌تواند لیست حذف‌شده‌ها را ببیند (401)",
        method: "GET",
        path: "/api/users/deleted",
        expectedStatuses: [401],
      });
    }
  }

  printReport();
}

main().catch((err) => {
  console.error(colors.red("خطای کلی در اجرای اسکریپت:"), err);
  process.exit(1);
});
