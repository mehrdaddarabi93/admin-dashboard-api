require("dotenv").config();
const validateEnv = require("./configs/validateEnv");
validateEnv();
const app = require("./app");
const connectDB = require("./configs/db");

/**
 * اتصال به دیتابیس
 */
connectDB();

const PORT = process.env.PORT || 5000;

/**
 * اجرای سرور
 */
app.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
});
