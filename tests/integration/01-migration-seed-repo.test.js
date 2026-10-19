// KIỂM THỬ TÍCH HỢP (cần MySQL/MariaDB đang chạy) - chạy bằng:  npm run test:integration
// Dùng CSDL riêng tên kết thúc bằng _test, KHÔNG đụng tới CSDL làm việc.
// Chứng minh: migration dựng từ CSDL trống, chạy lại lần hai không lỗi và không nhân đôi dữ liệu (C5),
// và repository MySQL thật hoạt động đúng với toàn bộ luồng nghiệp vụ.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadConfig } = require('../../src/backend/config');
const { createDb } = require('../../src/backend/db');
const { buildServices } = require('../../src/backend/container');

const TEST_DB = process.env.TEST_DB_NAME || 'warranty_intake_test';
assert.match(TEST_DB, /_test$/, 'Tên CSDL kiểm thử phải kết thúc bằng _test để tránh xoá nhầm dữ liệu thật');

const env = { ...process.env, DB_NAME: TEST_DB };
const script = (name) => path.join(__dirname, '..', '..', 'src', 'backend', 'scripts', name);
const run = (name) => spawnSync(process.execPath, [script(name)], { env, encoding: 'utf8' });

describe('[TÍCH HỢP] migration + seed + repository MySQL thật', () => {
  let db; let services; let config;
  before(async () => {
    process.env.DB_NAME = TEST_DB;
    config = loadConfig({ ...process.env, DB_NAME: TEST_DB, AUTH_SECRET: 'khoa-kiem-thu-tich-hop-0123456789' });
    // Xoá sạch CSDL kiểm thử để chứng minh "dựng từ trạng thái trống"
    const raw = createDb({ ...config.db, database: undefined });
    await raw.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await raw.close();
  });
  after(async () => { if (db) await db.close(); });

  test('migrate từ CSDL trống thành công, rồi chạy lại lần hai không lỗi', () => {
    const first = run('migrate.js');
    assert.equal(first.status, 0, first.stderr);
    const second = run('migrate.js');
    assert.equal(second.status, 0, second.stderr);
  });

  test('seed chạy hai lần: số dòng không đổi (không nhân đôi dữ liệu)', async () => {
    assert.equal(run('seed.js').status, 0);
    db = createDb(config.db);
    const count = async (table) => Number((await db.query(`SELECT COUNT(*) AS n FROM ${table}`))[0].n);
    const tables = ['customer', 'device', 'warranty_request', 'request_status_log', 'issue_category', 'sla_rule', 'app_user'];
    const before1 = {};
    for (const t of tables) before1[t] = await count(t);

    assert.equal(run('seed.js').status, 0);
    for (const t of tables) assert.equal(await count(t), before1[t], `bảng ${t} bị nhân đôi sau lần seed thứ hai`);

    assert.ok(before1.customer >= 20 && before1.device >= 20 && before1.warranty_request >= 20,
      'mỗi bảng chính có ít nhất 20 bản ghi mẫu');
    assert.equal(before1.sla_rule, 9);
  });

  test('luồng đầy đủ trên repository MySQL thật: tạo -> phân loại -> ưu tiên -> sinh hạn, kèm lịch sử', async () => {
    services = buildServices(db, config);
    const c = await services.customers.create({ phone: '0907070707', fullName: 'Kiểm Thử Tích Hợp', email: null });
    const d = await services.devices.create({ serialNo: 'SN-INTEG-01', modelName: 'Mekong X1', purchaseDate: '2026-01-15' });
    const wr = services.warrantyRequests;
    const created = await wr.create({ customerId: c.customerId, deviceId: d.deviceId, issueDesc: 'Không lên nguồn' });
    await wr.setCategory(created.requestId, { categoryId: 1 });
    await wr.setPriority(created.requestId, { priority: 'URGENT' });
    const done = await wr.generateDeadline(created.requestId);
    assert.equal(done.status, 'RECEIVED');
    assert.equal(done.committedDeadline.getTime() - done.receivedAt.getTime(), 24 * 3600 * 1000);
    assert.deepEqual(done.history.map((h) => h.toStatus), ['NEW', 'CLASSIFIED', 'RECEIVED']);
  });

  test('ràng buộc CSDL là lưới an toàn: trùng số điện thoại bị chặn kể cả khi qua mặt service', async () => {
    const { DuplicateKeyError } = require('../../src/backend/errors');
    const CustomerRepository = require('../../src/backend/repositories/customer.repository');
    const repo = new CustomerRepository(db);
    await assert.rejects(() => repo.insert({ phone: '0907070707', fullName: 'Trùng', email: null }), DuplicateKeyError);
  });

  test('khoá lạc quan: cập nhật với trạng thái cũ không ghi đè, trả về false', async () => {
    const WarrantyRequestRepository = require('../../src/backend/repositories/warranty-request.repository');
    const repo = new WarrantyRequestRepository(db);
    const c = await services.customers.create({ phone: '0907070708', fullName: 'Khoá Lạc Quan', email: null });
    const d = await services.devices.create({ serialNo: 'SN-INTEG-02', modelName: 'Mekong X1', purchaseDate: null });
    const r = await repo.insert({ customerId: c.customerId, deviceId: d.deviceId, issueDesc: 'thử', receivedAt: new Date() });
    assert.equal(await repo.applyChange(r.requestId, 'NEW', { categoryId: 2 }, 'CLASSIFIED', new Date()), true);
    assert.equal(await repo.applyChange(r.requestId, 'NEW', { categoryId: 3 }, 'CLASSIFIED', new Date()), false,
      'người đến sau vẫn tin phiếu đang NEW nên không được ghi');
    assert.equal((await repo.findById(r.requestId)).categoryId, 2);
  });
});
