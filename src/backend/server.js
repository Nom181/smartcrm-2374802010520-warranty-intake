// server.js - điểm khởi động: đọc cấu hình, nối CSDL, mở cổng.
const { loadConfig, assertRunnable } = require('./config');
const { createDb } = require('./db');
const { buildServices } = require('./container');
const { createApp } = require('./app');

const config = loadConfig();
try {
  assertRunnable(config);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const db = createDb(config.db);
const app = createApp(buildServices(db, config));

const server = app.listen(config.port, () => {
  console.log(`API đang chạy tại http://localhost:${config.port}/api  (kiểm tra: /api/health)`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${config.port} đang bị chương trình khác dùng. Đổi PORT trong .env hoặc tắt chương trình đó.`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => db.close().finally(() => process.exit(0))));
}
