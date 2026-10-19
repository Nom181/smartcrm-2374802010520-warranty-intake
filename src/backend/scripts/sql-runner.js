// scripts/sql-runner.js - chạy lần lượt các tệp .sql trong một thư mục, theo thứ tự tên (001_, 002_, ...).
// Dùng chung cho migrate.js và seed.js.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { loadConfig } = require('../config');

async function runSqlDir(dirName, { createDatabase }) {
  const config = loadConfig();
  const dbName = config.db.database;
  if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
    throw new Error(`DB_NAME không hợp lệ: "${dbName}" (chỉ chữ, số, gạch dưới)`);
  }
  const dir = path.join(__dirname, '..', '..', '..', dirName);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (files.length === 0) throw new Error(`Không có tệp .sql nào trong ${dirName}/`);

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
    charset: 'utf8mb4',
    timezone: 'Z',
    connectTimeout: 5000,
  });
  try {
    if (createDatabase) {
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    }
    await conn.query(`USE \`${dbName}\``);
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await conn.query(sql);
      console.log(`  ✔ ${dirName}/${file}`);
    }
  } finally {
    await conn.end();
  }
  return files.length;
}

function main(dirName, options) {
  runSqlDir(dirName, options)
    .then((n) => console.log(`Xong ${n} tệp trong ${dirName}/ (CSDL: ${loadConfig().db.database}).`))
    .catch((err) => {
      console.error(`Lỗi khi chạy ${dirName}/: ${err.code || ''} ${err.message}`);
      console.error('Kiểm tra MySQL đã bật chưa và DB_HOST/DB_PORT/DB_USER/DB_PASSWORD trong .env.');
      process.exit(1);
    });
}

module.exports = { runSqlDir, main };
