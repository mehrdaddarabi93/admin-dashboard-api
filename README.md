# Admin Dashboard API

REST API برای پنل ادمین فروشگاه آنلاین — ساخته‌شده با Node.js، Express 5، MongoDB و JWT

## تکنولوژی‌ها

- **Runtime:** Node.js 20
- **Framework:** Express 5
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Access Token + Refresh Token)
- **Validation:** Joi
- **Documentation:** Swagger UI
- **Testing:** Jest + Supertest (147 تست)
- **Containerization:** Docker + Docker Compose

## قابلیت‌ها

- 🔐 احراز هویت با JWT و Refresh Token rotation
- 👥 سیستم RBAC پنج‌سطحی (user / support / editor / admin / chiefadmin)
- 📦 مدیریت محصولات با Soft Delete و gallery تصاویر
- 🛒 سبد خرید و سیستم سفارش با State Machine
- 🏷️ کوپن تخفیف
- 📊 داشبورد آماری با Aggregate
- 🔍 جستجوی پیشرفته با pagination
- 🛡️ امنیت: Helmet، CORS، Rate Limiting، NoSQL Injection Protection

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js 20+
- MongoDB
- یا Docker

### روش اول — اجرای مستقیم

```bash
# نصب dependencies
npm install

# کپی فایل env
cp .env.example .env
# مقادیر .env را تنظیم کنید

# اجرا در حالت development
npm run dev
```

### روش دوم — Docker

```bash
# ساخت و اجرای containers
docker compose up -d

# مشاهده لاگ‌ها
docker compose logs -f api

# خاموش کردن
docker compose down
```

## متغیرهای محیطی

فایل `.env.example` را به `.env` کپی کنید و مقادیر را تنظیم کنید:

| متغیر | توضیح |
|-------|-------|
| `PORT` | پورت سرور (پیش‌فرض: 5000) |
| `MONGO_URI` | آدرس اتصال به MongoDB |
| `JWT_SECRET` | کلید امضای Access Token |
| `JWT_REFRESH_SECRET` | کلید امضای Refresh Token |
| `ALLOWED_ORIGINS` | آدرس‌های مجاز CORS |

## مستندات API

بعد از اجرا، Swagger UI در این آدرس در دسترس است:

```
http://localhost:5000/api-docs
```

## تست‌ها

```bash
npm test
```

147 تست integration با Jest + Supertest روی دیتابیس جداگانه.

## ساختار پروژه

```
src/
├── configs/       ← تنظیمات (DB، Swagger، permissions)
├── controllers/   ← کنترلرها
├── middlewares/   ← میان‌افزارها (auth، RBAC، validation)
├── models/        ← مدل‌های Mongoose
├── routes/        ← مسیرها
├── services/      ← منطق کسب‌وکار
├── utils/         ← ابزارهای کمکی
└── validators/    ← اعتبارسنجی Joi
tests/             ← تست‌های integration
```

## Endpoints

| Resource | Methods |
|----------|---------|
| `/api/auth` | register, login, logout, refresh, me, change-password |
| `/api/users` | CRUD + soft delete + restore + RBAC |
| `/api/products` | CRUD + soft delete + stock + reviews |
| `/api/categories` | CRUD |
| `/api/orders` | ایجاد + state machine + مدیریت |
| `/api/cart` | مدیریت سبد خرید |
| `/api/coupons` | CRUD + toggle status |
| `/api/dashboard` | آمار و تحلیل |