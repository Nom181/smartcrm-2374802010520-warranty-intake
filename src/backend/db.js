// db.js - kết nối MySQL/MariaDB và dịch lỗi kỹ thuật của thư viện thành lỗi của ứng dụng.
// Mọi câu SQL trong dự án đi qua hàm query() ở đây, luôn dùng tham số hoá (dấu ?).
const mysql = require('mysql2/promise');
const { DuplicateKeyError, UnavailableError } = require('./errors');

const UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'ECONNRESET',
  'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR', 'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR', 'POOL_CLOSED',
]);

function translateError(err) {
  if (err && err.errno === 1062) {
    // "Duplicate entry '0901' for key 'uq_customer_phone'" (MySQL 8: 'customer.uq_customer_phone')
    const m = /for key '([^']+)'/.exec(err.sqlMessage || '');
    const key = m ? m[1].split('.').pop() : 'unknown';
    return new DuplicateKeyError(key);
  }
  if (err && UNAVAILABLE_CODES.has(err.code)) return new UnavailableError(err);
  return err;
}

function wrap(executor) {
  return {
    async query(sql, params = []) {
      try {
        const [result] = await executor.query(sql, params);
        return result;
      } catch (err) {
        throw translateError(err);
      }
    },
  };
}

function createDb(dbConfig) {
  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 5000, // không treo quá 5 giây khi CSDL không trả lời
    charset: 'utf8mb4',
    timezone: 'Z',        // lưu và đọc DATETIME theo UTC; giao diện tự đổi sang giờ địa phương
  });
  const base = wrap(pool);
  return {
    query: base.query,
    // Chạy fn(tx) trong một giao dịch; lỗi thì ROLLBACK, xong thì COMMIT.
    async transaction(fn) {
      let conn;
      try {
        conn = await pool.getConnection();
      } catch (err) {
        throw translateError(err);
      }
      try {
        await conn.beginTransaction();
        const result = await fn(wrap(conn));
        await conn.commit();
        return result;
      } catch (err) {
        try { await conn.rollback(); } catch (_) { /* bỏ qua lỗi rollback */ }
        throw translateError(err);
      } finally {
        conn.release();
      }
    },
    close: () => pool.end(),
  };
}

module.exports = { createDb, translateError };
