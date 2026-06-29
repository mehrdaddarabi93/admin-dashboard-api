const mongoose = require("mongoose");

/**
 * اتصال به دیتابیس MongoDB
 */
const connectDB = async () => {
  try {
    // اتصال به مونگو
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.log("❌ MongoDB Error");
    console.log(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;
