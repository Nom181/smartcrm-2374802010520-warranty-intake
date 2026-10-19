// tests/run-all.js - chạy toàn bộ kiểm thử bằng MỘT lệnh:  npm test
// Dùng trình chạy kiểm thử có sẵn của Node (node:test), không cần cài thêm thư viện.
// Không dùng "node --test <thư mục>" vì cách ghi đó khác nhau giữa các bản Node.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const sub = process.argv[2]; // 'integration' để chạy thêm kiểm thử cần CSDL
const dir = sub ? path.join(__dirname, sub) : __dirname;
const files = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.test.js'))
  .sort()
  .map((f) => path.join(dir, f));

if (files.length === 0) {
  console.error('Không tìm thấy tệp *.test.js nào.');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], { stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
