// config.js - đọc cấu hình từ biến môi trường (.env). Không có giá trị bí mật nào trong mã.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) ? n : fallback;
}

function loadConfig(env = process.env) {
  return {
    port: toInt(env.PORT, 3000),
    timezone: env.APP_TIMEZONE || 'Asia/Ho_Chi_Minh',
    db: {
      host: env.DB_HOST || '127.0.0.1',
      port: toInt(env.DB_PORT, 3306),
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      database: env.DB_NAME || 'warranty_intake',
    },
    auth: {
      secret: env.AUTH_SECRET || '',
      ttlHours: toInt(env.TOKEN_TTL_HOURS, 8),
    },
  };
}

// Dừng sớm, nói rõ thiếu gì, thay vì để hệ thống chạy với khoá ký rỗng.
function assertRunnable(config) {
  if (!config.auth.secret || config.auth.secret.length < 16) {
    throw new Error(
      'Thiếu AUTH_SECRET (tối thiểu 16 ký tự). Sao chép .env.example thành .env rồi đặt giá trị.'
    );
  }
}

module.exports = { loadConfig, assertRunnable };
