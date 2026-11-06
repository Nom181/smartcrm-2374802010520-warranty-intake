# Dockerfile - API (Node.js + Express). Dựng từ thư mục trống: docker compose up -d --build
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Cài thư viện trước để Docker cache lớp này khi mã nguồn thay đổi
COPY src/backend/package.json src/backend/package-lock.json ./src/backend/
RUN npm --prefix src/backend ci --omit=dev

COPY src/backend ./src/backend
COPY migrations ./migrations
COPY seeds ./seeds

# Chạy bằng người dùng thường, không dùng root
USER node
EXPOSE 3000
# Tạo bảng + nạp dữ liệu mẫu (idempotent) rồi mới bật API
CMD ["sh", "-c", "node src/backend/scripts/migrate.js && node src/backend/scripts/seed.js && node src/backend/server.js"]
