// KIỂM THỬ HỢP ĐỒNG ở ranh giới (buổi 9–10): tên trường, kiểu, giá trị null và định dạng lỗi API.
// Nếu ai đổi tên cột hoặc đổi định dạng lỗi mà quên cập nhật hợp đồng, kiểm thử này vỡ NGAY, không đợi tới lúc người dùng mở trang.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { toRequest } = require('../src/backend/repositories/warranty-request.repository');
const { makeWorld, listen, call, loginAs } = require('./helpers/world');

const ROW = {
  request_id: 7, customer_id: 3, device_id: 5, issue_desc: 'Máy không lên nguồn',
  category_id: 1, priority: 'URGENT', status: 'RECEIVED',
  received_at: new Date('2026-06-01T03:00:00Z'), committed_deadline: new Date('2026-06-02T03:00:00Z'),
  customer_name: 'Nguyễn Văn A', customer_phone: '0910000001',
  serial_no: 'SN-100001', model_name: 'Mekong X1', category_code: 'HARDWARE', category_name: 'Lỗi phần cứng',
};

describe('[HỢP ĐỒNG] hàm chuyển đổi toRequest (repository -> tầng trên)', () => {
  test('phiếu đầy đủ: đúng tên trường, đúng kiểu, lồng customer/device/category', () => {
    const r = toRequest(ROW);
    assert.deepEqual(Object.keys(r).sort(), [
      'category', 'categoryId', 'committedDeadline', 'customer', 'customerId', 'device', 'deviceId',
      'issueDesc', 'priority', 'receivedAt', 'requestId', 'status']);
    assert.equal(typeof r.requestId, 'number');
    assert.equal(r.status, 'RECEIVED');
    assert.deepEqual(r.customer, { fullName: 'Nguyễn Văn A', phone: '0910000001' });
    assert.deepEqual(r.device, { serialNo: 'SN-100001', modelName: 'Mekong X1' });
    assert.deepEqual(r.category, { code: 'HARDWARE', name: 'Lỗi phần cứng' });
    assert.ok(r.committedDeadline instanceof Date);
  });

  test('phiếu chưa phân loại: category/priority/hạn là null (không phải chuỗi rỗng, không phải undefined)', () => {
    const r = toRequest({ ...ROW, category_id: null, category_code: null, category_name: null,
      priority: null, status: 'NEW', received_at: null, committed_deadline: null });
    assert.equal(r.category, null);
    assert.equal(r.categoryId, null);
    assert.equal(r.priority, null);
    assert.equal(r.receivedAt, null);
    assert.equal(r.committedDeadline, null);
  });

  test('không có dòng dữ liệu -> trả null thay vì ném lỗi thô', () => {
    assert.equal(toRequest(null), null);
    assert.equal(toRequest(undefined), null);
  });

  test('không để lọt tên cột SQL ra ngoài hợp đồng', () => {
    const json = JSON.stringify(toRequest(ROW));
    for (const col of ['request_id', 'customer_name', 'serial_no', 'category_code']) {
      assert.ok(!json.includes(col), `tên cột ${col} lọt ra hợp đồng`);
    }
  });
});

describe('[HỢP ĐỒNG] định dạng lỗi API: error + message + fields', () => {
  let w; let server; let u; let staff;
  before(async () => {
    w = await makeWorld();
    server = await listen(w.app);
    u = server.baseUrl;
    staff = await loginAs(u, 'staff01');
  });
  after(async () => { await server.close(); });

  test('lỗi định dạng: 400 kèm fields là bản đồ tên trường -> lý do (tiếng Việt)', async () => {
    const r = await call(u, 'POST', '/customers', { token: staff, body: { phone: '123' } });
    assert.equal(r.status, 400);
    assert.equal(typeof r.body.error, 'string');
    assert.equal(typeof r.body.message, 'string');
    assert.deepEqual(Object.keys(r.body.fields).sort(), ['fullName', 'phone']);
    for (const lyDo of Object.values(r.body.fields)) assert.equal(typeof lyDo, 'string');
    // bước "mở rộng": trường cũ chi_tiet vẫn còn nên giao diện hiện tại không vỡ
    assert.equal(r.body.chi_tiet.length, 2);
  });

  test('lỗi nghiệp vụ không có trường: có error + message, không có fields, mã 4xx (không phải 500)', async () => {
    const r = await call(u, 'GET', '/requests/999999', { token: staff });
    assert.equal(r.status, 404);
    assert.equal(typeof r.body.error, 'string');
    assert.equal(typeof r.body.message, 'string');
    assert.equal(r.body.fields, undefined);
  });

  test('chưa đăng nhập: 401 với error + message, giao diện dựa vào error để xoá token', async () => {
    const r = await call(u, 'GET', '/requests');
    assert.equal(r.status, 401);
    assert.equal(typeof r.body.error, 'string');
    assert.equal(typeof r.body.message, 'string');
  });
});
