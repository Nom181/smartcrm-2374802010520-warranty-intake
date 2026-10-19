// LOẠI 3 - DỮ LIỆU SAI: hệ thống TỪ CHỐI đúng cách, không sập, không lộ lỗi thô.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { makeWorld, listen, call, loginAs } = require('./helpers/world');
const { UnavailableError } = require('../src/backend/errors');

describe('[DỮ LIỆU SAI] qua HTTP: mã lỗi đúng, có tên trường, không lộ chi tiết kỹ thuật', () => {
  let w; let server; let u; let staff; let manager;
  before(async () => {
    w = await makeWorld();
    server = await listen(w.app);
    u = server.baseUrl;
    staff = await loginAs(u, 'staff01');
    manager = await loginAs(u, 'manager01');
  });
  after(async () => { await server.close(); });

  const newCustomer = async (phone) =>
    (await call(u, 'POST', '/customers', { token: staff, body: { phone, fullName: 'Người Thử' } })).body.data;
  const newDevice = async (serialNo) =>
    (await call(u, 'POST', '/devices', { token: staff, body: { serialNo, modelName: 'Mekong X1' } })).body.data;
  const newRequest = async (phone, serial, issueDesc = 'Hỏng nguồn') => {
    const c = await newCustomer(phone); const d = await newDevice(serial);
    return (await call(u, 'POST', '/requests', { token: staff, body: { customerId: c.customerId, deviceId: d.deviceId, issueDesc } })).body.data;
  };

  test('thiếu trường bắt buộc -> 400 kèm TÊN trường thiếu', async () => {
    const r = await call(u, 'POST', '/customers', { token: staff, body: { phone: '0900000001' } });
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'DU_LIEU_KHONG_HOP_LE');
    assert.deepEqual(r.body.chi_tiet.map((x) => x.truong), ['fullName']);
  });

  test('nhiều trường sai cùng lúc -> báo một lần đủ cả hai trường', async () => {
    const r = await call(u, 'POST', '/customers', { token: staff, body: { phone: '123', fullName: '' } });
    assert.equal(r.status, 400);
    assert.deepEqual(r.body.chi_tiet.map((x) => x.truong).sort(), ['fullName', 'phone']);
  });

  test('số điện thoại sai định dạng khi tra cứu -> 400 và không tìm kiếm', async () => {
    const r = await call(u, 'GET', '/customers/lookup?phone=12345', { token: staff });
    assert.equal(r.status, 400);
  });

  test('tra cứu số chưa có -> 404 "Không tìm thấy khách hàng"', async () => {
    const r = await call(u, 'GET', '/customers/lookup?phone=0999999999', { token: staff });
    assert.equal(r.status, 404);
    assert.equal(r.body.error, 'KHONG_TIM_THAY_KHACH_HANG');
  });

  test('tạo khách trùng số điện thoại -> 409 (QT1)', async () => {
    await newCustomer('0900000002');
    const r = await call(u, 'POST', '/customers', { token: staff, body: { phone: '0900000002', fullName: 'Trùng' } });
    assert.equal(r.status, 409);
    assert.equal(r.body.error, 'SO_DIEN_THOAI_DA_TON_TAI');
  });

  test('thiết bị trùng số serial, kể cả khác chữ hoa/thường -> 409 (QT2)', async () => {
    await newDevice('SN-DUP-001');
    const r = await call(u, 'POST', '/devices', { token: staff, body: { serialNo: 'sn-dup-001', modelName: 'Mekong X1' } });
    assert.equal(r.status, 409);
    assert.equal(r.body.error, 'SERIAL_DA_TON_TAI');
  });

  test('phiếu cho khách hàng không tồn tại -> 404', async () => {
    const d = await newDevice('SN-NOCUST1');
    const r = await call(u, 'POST', '/requests', { token: staff, body: { customerId: 99999, deviceId: d.deviceId, issueDesc: 'x' } });
    assert.equal(r.status, 404);
    assert.equal(r.body.error, 'KHACH_KHONG_TON_TAI');
  });

  test('phân loại khi phiếu chưa có mô tả lỗi -> 422 và KHÔNG lưu phân loại (US4, ngoại lệ 2)', async () => {
    const req = await newRequest('0900000003', 'SN-NODESC1');
    w.repos.requestRepo.rows.find((x) => x.requestId === req.requestId).issueDesc = ''; // dữ liệu cũ bị rỗng
    const r = await call(u, 'PUT', `/requests/${req.requestId}/category`, { token: staff, body: { categoryId: 1 } });
    assert.equal(r.status, 422);
    assert.equal(r.body.error, 'CHUA_CO_MO_TA_LOI');
    const after = await call(u, 'GET', `/requests/${req.requestId}`, { token: staff });
    assert.equal(after.body.data.status, 'NEW');
    assert.equal(after.body.data.categoryId, null);
  });

  test('nhóm sự cố không có trong danh mục -> 422 (US4, ngoại lệ 3)', async () => {
    const req = await newRequest('0900000004', 'SN-BADCAT1');
    const r = await call(u, 'PUT', `/requests/${req.requestId}/category`, { token: staff, body: { categoryId: 999 } });
    assert.equal(r.status, 422);
    assert.equal(r.body.error, 'NHOM_SU_CO_KHONG_HOP_LE');
  });

  test('mức ưu tiên ngoài ba giá trị cho phép -> 400', async () => {
    const req = await newRequest('0900000005', 'SN-BADPRI1');
    const r = await call(u, 'PUT', `/requests/${req.requestId}/priority`, { token: staff, body: { priority: 'SIEU_KHAN' } });
    assert.equal(r.status, 400);
    assert.deepEqual(r.body.chi_tiet.map((x) => x.truong), ['priority']);
  });

  test('sinh hạn khi thiếu nhóm sự cố/mức ưu tiên -> 422 nói rõ thiếu gì (QT3, US6 ngoại lệ)', async () => {
    const req = await newRequest('0900000006', 'SN-NOPRI01');
    await call(u, 'PUT', `/requests/${req.requestId}/category`, { token: staff, body: { categoryId: 1 } });
    const r = await call(u, 'POST', `/requests/${req.requestId}/deadline`, { token: staff });
    assert.equal(r.status, 422);
    assert.equal(r.body.error, 'THIEU_THONG_TIN_PHAN_LOAI');
    assert.deepEqual(r.body.chi_tiet.map((x) => x.truong), ['priority']);
  });

  test('thiếu quy tắc SLA cho tổ hợp -> 422 THIEU_QUY_TAC_SLA, không sinh hạn sai', async () => {
    const req = await newRequest('0900000007', 'SN-NOSLA01');
    await call(u, 'PUT', `/requests/${req.requestId}/category`, { token: staff, body: { categoryId: 1 } });
    await call(u, 'PUT', `/requests/${req.requestId}/priority`, { token: staff, body: { priority: 'LOW' } });
    w.repos.catalogRepo.rules = w.repos.catalogRepo.rules.filter((x) => !(x.categoryId === 1 && x.priority === 'LOW'));
    const r = await call(u, 'POST', `/requests/${req.requestId}/deadline`, { token: staff });
    assert.equal(r.status, 422);
    assert.equal(r.body.error, 'THIEU_QUY_TAC_SLA');
    const after = await call(u, 'GET', `/requests/${req.requestId}`, { token: staff });
    assert.equal(after.body.data.committedDeadline, null);
    assert.equal(after.body.data.status, 'CLASSIFIED');
  });

  test('phiếu đã RECEIVED không sửa được và không sinh hạn lần hai -> 409 (QT5)', async () => {
    const req = await newRequest('0900000008', 'SN-DONE001');
    await call(u, 'PUT', `/requests/${req.requestId}/category`, { token: staff, body: { categoryId: 3 } });
    await call(u, 'PUT', `/requests/${req.requestId}/priority`, { token: staff, body: { priority: 'URGENT' } });
    assert.equal((await call(u, 'POST', `/requests/${req.requestId}/deadline`, { token: staff })).status, 200);
    for (const [method, path, body] of [
      ['POST', `/requests/${req.requestId}/deadline`, undefined],
      ['PUT', `/requests/${req.requestId}/category`, { categoryId: 1 }],
      ['PUT', `/requests/${req.requestId}/priority`, { priority: 'LOW' }],
      ['PATCH', `/requests/${req.requestId}`, { issueDesc: 'đổi' }],
    ]) {
      const r = await call(u, method, path, { token: staff, body });
      assert.equal(r.status, 409, `${method} ${path}`);
      assert.equal(r.body.error, 'PHIEU_DA_TIEP_NHAN');
    }
  });

  test('chỉ xoá được phiếu NEW; xoá khách/thiết bị đang có phiếu -> 409', async () => {
    const req = await newRequest('0900000009', 'SN-DELCHK1');
    await call(u, 'PUT', `/requests/${req.requestId}/category`, { token: staff, body: { categoryId: 1 } });
    assert.equal((await call(u, 'DELETE', `/requests/${req.requestId}`, { token: staff })).body.error, 'PHIEU_CHI_XOA_KHI_MOI');
    assert.equal((await call(u, 'DELETE', `/customers/${req.customerId}`, { token: staff })).body.error, 'KHACH_CO_PHIEU');
    assert.equal((await call(u, 'DELETE', `/devices/${req.deviceId}`, { token: staff })).body.error, 'THIET_BI_CO_PHIEU');
  });

  test('hai người sửa cùng lúc: bên đến sau nhận 409 PHIEU_DA_THAY_DOI, dữ liệu không bị ghi đè', async () => {
    const req = await newRequest('0900000010', 'SN-RACE0001');
    w.repos.requestRepo.forceConflict = true;
    const r = await call(u, 'PUT', `/requests/${req.requestId}/category`, { token: staff, body: { categoryId: 1 } });
    w.repos.requestRepo.forceConflict = false;
    assert.equal(r.status, 409);
    assert.equal(r.body.error, 'PHIEU_DA_THAY_DOI');
  });

  test('id trong đường dẫn không phải số nguyên dương -> 400', async () => {
    const r = await call(u, 'GET', '/requests/12abc', { token: staff });
    assert.equal(r.status, 400);
  });

  test('JSON bị hỏng -> 400 JSON_KHONG_HOP_LE, không phải lỗi 500', async () => {
    const r = await call(u, 'POST', '/customers', { token: staff, raw: '{"phone": ' });
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'JSON_KHONG_HOP_LE');
  });

  test('đường dẫn không tồn tại -> 404 dạng JSON', async () => {
    const r = await call(u, 'GET', '/khong-co-gi', { token: staff });
    assert.equal(r.status, 404);
    assert.equal(r.body.error, 'KHONG_TIM_THAY_DUONG_DAN');
  });
});

describe('[DỮ LIỆU SAI] đăng nhập và phân quyền', () => {
  let w; let server; let u;
  before(async () => { w = await makeWorld(); server = await listen(w.app); u = server.baseUrl; });
  after(async () => { await server.close(); });

  test('không gửi token -> 401', async () => {
    const r = await call(u, 'GET', '/requests');
    assert.equal(r.status, 401);
    assert.equal(r.body.error, 'CHUA_DANG_NHAP');
  });

  test('token bị sửa một ký tự -> 401', async () => {
    const token = await loginAs(u, 'staff01');
    const forged = `${token.slice(0, -2)}${token.endsWith('A') ? 'B' : 'A'}${token.slice(-1)}`;
    const r = await call(u, 'GET', '/requests', { token: forged });
    assert.equal(r.status, 401);
  });

  test('sai mật khẩu và sai tên đăng nhập cho CÙNG một thông báo -> 401', async () => {
    const a = await call(u, 'POST', '/auth/login', { body: { username: 'staff01', password: 'sai-mat-khau' } });
    const b = await call(u, 'POST', '/auth/login', { body: { username: 'khong-ton-tai', password: 'x' } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.message, b.body.message);
  });

  test('đăng nhập thiếu mật khẩu -> 400 nêu tên trường', async () => {
    const r = await call(u, 'POST', '/auth/login', { body: { username: 'staff01' } });
    assert.equal(r.status, 400);
    assert.deepEqual(r.body.chi_tiet.map((x) => x.truong), ['password']);
  });

  test('quản lý (MANAGER) xem được nhưng KHÔNG tạo/sửa/xoá được phiếu -> 403', async () => {
    const manager = await loginAs(u, 'manager01');
    assert.equal((await call(u, 'GET', '/requests', { token: manager })).status, 200);
    assert.equal((await call(u, 'POST', '/requests', { token: manager, body: { customerId: 1, deviceId: 1, issueDesc: 'x' } })).status, 403);
    assert.equal((await call(u, 'DELETE', '/requests/1', { token: manager })).status, 403);
    assert.equal((await call(u, 'GET', '/customers', { token: manager })).status, 403);
  });
});

describe('[DỮ LIỆU SAI] sự cố hệ thống: không treo, không lộ lỗi thô', () => {
  let w; let server; let u; let staff;
  before(async () => {
    w = await makeWorld(); server = await listen(w.app); u = server.baseUrl;
    staff = await loginAs(u, 'staff01');
  });
  after(async () => { await server.close(); });

  test('CSDL không kết nối được -> 503 thông báo rõ ràng, không có vết ngăn xếp/SQL', async () => {
    w.repos.requestRepo.failWith = new UnavailableError(Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3306'), { code: 'ECONNREFUSED' }));
    const r = await call(u, 'GET', '/requests', { token: staff });
    w.repos.requestRepo.failWith = null;
    assert.equal(r.status, 503);
    assert.equal(r.body.error, 'CSDL_KHONG_KHA_DUNG');
    assert.doesNotMatch(r.text, /ECONNREFUSED|127\.0\.0\.1|at .*\.js|SELECT/);
  });

  test('lỗi không lường trước -> 500 thông báo chung, không lộ nội dung lỗi gốc', async () => {
    w.repos.requestRepo.failWith = new Error("ER_NO_SUCH_TABLE: Table 'warranty_intake.warranty_request' doesn't exist");
    const r = await call(u, 'GET', '/requests', { token: staff });
    w.repos.requestRepo.failWith = null;
    assert.equal(r.status, 500);
    assert.equal(r.body.error, 'LOI_HE_THONG');
    assert.doesNotMatch(r.text, /ER_NO_SUCH_TABLE|warranty_request|stack|\.js:/);
  });

  test('/api/health báo 503 "degraded" khi CSDL tắt, 200 "ok" khi bật', async () => {
    w.repos.healthRepo.down = true;
    const down = await call(u, 'GET', '/health');
    w.repos.healthRepo.down = false;
    const up = await call(u, 'GET', '/health');
    assert.equal(down.status, 503);
    assert.equal(down.body.db, 'down');
    assert.equal(up.status, 200);
  });
});
