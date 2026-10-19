// LOẠI 1 - LUỒNG ĐÚNG: chức năng chạy đúng trong điều kiện bình thường.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { makeWorld, listen, call, loginAs } = require('./helpers/world');

describe('[LUỒNG ĐÚNG] nghiệp vụ tiếp nhận phiếu bảo hành (tầng service)', () => {
  let w;
  before(async () => { w = await makeWorld(); });

  test('tra cứu khách hàng theo số điện thoại trả về đúng khách (FR1)', async () => {
    const created = await w.services.customers.create({ phone: '0912345678', fullName: 'Nguyễn Văn A', email: null });
    const found = await w.services.customers.lookupByPhone('0912345678');
    assert.equal(found.customerId, created.customerId);
    assert.equal(found.fullName, 'Nguyễn Văn A');
  });

  test('đi hết luồng NEW -> CLASSIFIED -> RECEIVED và hạn cam kết = tiếp nhận + giờ SLA (QT4, QT5)', async () => {
    const c = await w.services.customers.create({ phone: '0922222222', fullName: 'Trần Thị B', email: null });
    const d = await w.services.devices.create({ serialNo: 'SN-FLOW01', modelName: 'Mekong X1', purchaseDate: '2026-09-01' });
    const wr = w.services.warrantyRequests;

    const created = await wr.create({ customerId: c.customerId, deviceId: d.deviceId, issueDesc: '  Màn hình sọc  ' });
    assert.equal(created.status, 'NEW');
    assert.equal(created.issueDesc, 'Màn hình sọc', 'mô tả lỗi được cắt khoảng trắng hai đầu');

    w.clock.now = new Date('2026-10-20T03:10:00.000Z');
    const classified = await wr.setCategory(created.requestId, { categoryId: 1 }); // HARDWARE
    assert.equal(classified.status, 'CLASSIFIED');

    await wr.setPriority(created.requestId, { priority: 'NORMAL' });
    w.clock.now = new Date('2026-10-20T03:15:00.000Z');
    const received = await wr.generateDeadline(created.requestId);

    assert.equal(received.status, 'RECEIVED');
    // tiếp nhận 03:00 UTC + 72 giờ (HARDWARE / NORMAL) = 3 ngày sau, cùng giờ
    assert.equal(received.committedDeadline.toISOString(), '2026-10-23T03:00:00.000Z');
    assert.deepEqual(received.history.map((h) => h.toStatus), ['NEW', 'CLASSIFIED', 'RECEIVED']);
    assert.deepEqual(received.slaOptions.map((s) => s.slaHours), [24, 72, 120], 'có đủ ba mức SLA làm mốc so sánh');
  });

  test('đủ bốn thao tác CRUD trên khách hàng (S1)', async () => {
    const cs = w.services.customers;
    const created = await cs.create({ phone: '0933333333', fullName: 'Lê C', email: 'c@example.com' });         // C
    assert.equal((await cs.get(created.customerId)).phone, '0933333333');                                        // R
    const updated = await cs.update(created.customerId, { phone: '0933333333', fullName: 'Lê Văn C', email: null }); // U
    assert.equal(updated.fullName, 'Lê Văn C');
    await cs.remove(created.customerId);                                                                         // D
    await assert.rejects(() => cs.get(created.customerId), { code: 'KHACH_KHONG_TON_TAI' });
  });

  test('đủ bốn thao tác CRUD trên phiếu bảo hành (S1)', async () => {
    const c = await w.services.customers.create({ phone: '0944444444', fullName: 'Phạm D', email: null });
    const d = await w.services.devices.create({ serialNo: 'SN-CRUD01', modelName: 'Mekong A5', purchaseDate: null });
    const wr = w.services.warrantyRequests;
    const created = await wr.create({ customerId: c.customerId, deviceId: d.deviceId, issueDesc: 'Loa rè' }); // C
    assert.equal((await wr.get(created.requestId)).issueDesc, 'Loa rè');                                       // R
    const updated = await wr.updateDescription(created.requestId, { issueDesc: 'Loa rè và mất tiếng' });       // U
    assert.equal(updated.issueDesc, 'Loa rè và mất tiếng');
    await wr.remove(created.requestId);                                                                        // D
    await assert.rejects(() => wr.get(created.requestId), { code: 'PHIEU_KHONG_TON_TAI' });
  });

  test('đăng nhập đúng cấp token, token đọc lại ra đúng vai trò', async () => {
    const result = await w.services.auth.login({ username: 'staff01', password: 'Demo@2026' });
    const user = w.services.auth.verifyToken(result.token);
    assert.equal(user.username, 'staff01');
    assert.equal(user.role, 'STAFF');
  });
});

describe('[LUỒNG ĐÚNG] qua HTTP: routes -> service -> repository', () => {
  let w; let server; let staff; let manager;
  before(async () => {
    w = await makeWorld();
    server = await listen(w.app);
    staff = await loginAs(server.baseUrl, 'staff01');
    manager = await loginAs(server.baseUrl, 'manager01');
  });
  after(async () => { await server.close(); });

  test('nhân viên tạo khách, thiết bị, phiếu, phân loại, sinh hạn; quản lý xem danh sách', async () => {
    const u = server.baseUrl;
    const cust = await call(u, 'POST', '/customers', { token: staff, body: { phone: '0955555555', fullName: 'Hoàng E' } });
    assert.equal(cust.status, 201);
    const dev = await call(u, 'POST', '/devices', { token: staff, body: { serialNo: 'sn-http01', modelName: 'Mekong Tab 8' } });
    assert.equal(dev.status, 201);
    assert.equal(dev.body.data.serialNo, 'SN-HTTP01', 'số serial được chuẩn hoá chữ hoa');

    const req = await call(u, 'POST', '/requests', {
      token: staff, body: { customerId: cust.body.data.customerId, deviceId: dev.body.data.deviceId, issueDesc: 'Pin chai' },
    });
    assert.equal(req.status, 201);
    const id = req.body.data.requestId;
    assert.equal((await call(u, 'PUT', `/requests/${id}/category`, { token: staff, body: { categoryId: 2 } })).status, 200);
    assert.equal((await call(u, 'PUT', `/requests/${id}/priority`, { token: staff, body: { priority: 'URGENT' } })).status, 200);
    const done = await call(u, 'POST', `/requests/${id}/deadline`, { token: staff });
    assert.equal(done.status, 200);
    assert.equal(done.body.data.status, 'RECEIVED');

    const list = await call(u, 'GET', '/requests?status=RECEIVED', { token: manager });
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.meta.total, 1);
  });
});
