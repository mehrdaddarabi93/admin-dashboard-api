const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const userRoutes = require("./routes/user.routes");
const orderRoutes = require("./routes/order.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const errorHandler = require("./middlewares/errorHandler");
const cartRoutes = require("./routes/cart.routes");
const couponRoutes = require("./routes/coupon.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configs/swagger");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        /**
         * اجازه دادن به Swagger UI برای ارسال درخواست به همین سرور.
         * در production این مقدار باید به دامنه واقعی محدود شود.
         */
        connectSrc: [
          "'self'",
          process.env.NODE_ENV === "production" ? "" : "http://localhost:5000",
        ],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

/**
 * لیست کلیدهای خطرناک که می‌توانند باعث Prototype Pollution شوند.
 * اگر این کلیدها فیلتر نشوند، مهاجم می‌تواند prototype اشیای
 * جاوااسکریپت را در کل پروژه آلوده کند.
 */
const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];

function sanitizeValue(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value)) {
      // رد کردن کلیدهای خطرناکی که می‌توانند prototype را آلوده کنند
      if (DANGEROUS_KEYS.includes(key)) continue;

      const safeKey = key.replace(/^\$/, "_").replace(/\./g, "_");
      result[safeKey] = sanitizeValue(value[key]);
    }
    return result;
  }
  return value;
}

app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  // req.query در Express 5 read-only است، مستقیماً مقادیر آن را sanitize می‌کنیم
  if (req.query) {
    const sanitized = sanitizeValue({ ...req.query });
    Object.keys(sanitized).forEach((key) => {
      req.query[key] = sanitized[key];
    });
  }
  next();
});
/**
 * تنظیمات CORS
 *
 * در محیط توسعه: همه‌ی درخواست‌های localhost (هر پورتی) مجاز هستند
 * تا Swagger UI، Postman و فرانت‌اند بدون مشکل کار کنند.
 * در محیط production: فقط دامنه‌های مشخص‌شده در ALLOWED_ORIGINS مجاز هستند.
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // در محیط توسعه، همه‌ی درخواست‌های localhost مجاز هستند
      if (process.env.NODE_ENV !== "production") {
        if (!origin || origin.startsWith("http://localhost")) {
          return callback(null, true);
        }
      }

      // origin خالی یعنی درخواست از Postman/curl - اجازه می‌دهیم
      if (!origin) {
        return callback(null, true);
      }

      // در production فقط دامنه‌های لیست‌شده مجاز هستند
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "API Running" });
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);

/**
 * Swagger Docs
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Global Error Handler - همیشه آخرین middleware
 */
app.use(errorHandler);

module.exports = app;
