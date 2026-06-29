
# مرحله ۱: از کدوم Node.js استفاده کنیم
FROM node:20-alpine

# مرحله ۲: پوشه کاری داخل container
WORKDIR /app

# مرحله ۳: اول فقط package.json کپی کن (برای cache بهتر)
COPY package*.json ./

# مرحله ۴: پکیج‌ها رو نصب کن
# از --omit=dev استفاده می‌کنیم تا jest و nodemon نصب نشن
RUN npm ci --omit=dev

# مرحله ۵: بقیه فایل‌های پروژه رو کپی کن
COPY . .

# مرحله ۶: پورت
EXPOSE 5000

# مرحله ۷: اجرا
CMD ["node", "src/server.js"]
