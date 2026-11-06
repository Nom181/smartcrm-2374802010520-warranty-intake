// tests/manual/run-tc.js - chạy MỘT test case mức API trên hệ thống ĐANG CHẠY (API + CSDL thật), in ra
// lệnh đã gửi, phản hồi thật, số phiếu trước/sau và so với kết quả mong đợi. Dùng để chụp ảnh minh chứng.
//
//   Điều kiện: đã chạy  npm run db:setup  và  npm start  (API ở cổng 3000).
//   Cách chạy: node tests/manual/run-tc.js TC-01     (TC-01, TC-04, TC-07, TC-09)
//   Đổi địa chỉ API (nếu cần): API_BASE=http://localhost:3000/api node tests/manual/run-tc.js TC-01
//
// Không đụng tới thư mục tests/ ở cấp trên: tên tệp không kết thúc bằng .test.js nên `npm test` bỏ qua.
const BASE = process.env.API_BASE || 'http://localhost:3000/api';
const PASSWORD = process.env.DEMO_PASSWORD || 'Demo@2026';

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { /* phản hồi không phải JSON */ }
  return { status: res.status, json, text };
}

const show = (label, r) => {
  const t = (r.text || '').length > 400 ? `${r.text.slice(0, 400)}...` : r.text;
  console.log(`   ${label} -> HTTP ${r.status}  ${t}`);
};

async function login(username) {
  const r = await call('POST', '/auth/login', { body: { username, password: PASSWORD } });
  if (r.status !== 200) throw new Error(`Đăng nhập ${username} thất bại (HTTP ${r.status}). Đã chạy db:setup và npm start chưa?`);
  return r.json.data.token;
}
const total = async (token) => (await call('GET', '/requests?pageSize=1', { token })).json.meta.total;

async function firstIds(token) {
  const c = await call('GET', '/customers?pageSize=1', { token });
  const d = await call('GET', '/devices?pageSize=1', { token });
  return { customer: c.json.data[0], device: d.json.data[0] };
}

const CASES = {
  'TC-01': {
    title: 'Luồng đúng: nhân viên (STAFF) tạo phiếu hợp lệ',
    pre: 'API chạy, đã seed; đăng nhập staff01',
    expect: 'HTTP 201, status = NEW, tổng số phiếu tăng đúng 1',
    async run() {
      const token = await login('staff01');
      const { customer, device } = await firstIds(token);
      const before = await total(token);
      const body = { customerId: customer.customerId, deviceId: device.deviceId, issueDesc: 'TC-01: máy không lên nguồn' };
      console.log(`   POST /requests  ${JSON.stringify(body)}`);
      const r = await call('POST', '/requests', { token, body });
      show('phản hồi', r);
      const after = await total(token);
      console.log(`   Tổng số phiếu trước/sau: ${before} -> ${after}`);
      return r.status === 201 && r.json.data.status === 'NEW' && after === before + 1;
    },
  },
  'TC-04': {
    title: 'Luồng đúng: tra cứu khách hàng theo số điện thoại',
    pre: 'API chạy, đã seed; đăng nhập staff01; lấy số điện thoại của khách đầu tiên',
    expect: 'HTTP 200, trả đúng khách có số điện thoại đó',
    async run() {
      const token = await login('staff01');
      const { customer } = await firstIds(token);
      console.log(`   GET /customers/lookup?phone=${customer.phone}`);
      const r = await call('GET', `/customers/lookup?phone=${customer.phone}`, { token });
      show('phản hồi', r);
      return r.status === 200 && r.json.data.phone === customer.phone;
    },
  },
  'TC-07': {
    title: 'Dữ liệu sai: số điện thoại 9 chữ số khi tra cứu khách',
    pre: 'API chạy; đăng nhập staff01',
    expect: 'HTTP 400, mã DU_LIEU_KHONG_HOP_LE, nêu đúng trường phone',
    async run() {
      const token = await login('staff01');
      console.log('   GET /customers/lookup?phone=091234567   (chỉ 9 chữ số)');
      const r = await call('GET', '/customers/lookup?phone=091234567', { token });
      show('phản hồi', r);
      return r.status === 400 && r.json && r.json.error === 'DU_LIEU_KHONG_HOP_LE'
        && JSON.stringify(r.json).includes('phone');
    },
  },
  'TC-09': {
    title: 'Bảo mật: quản lý (MANAGER) không được tạo phiếu',
    pre: 'API chạy, đã seed; đăng nhập manager01',
    expect: 'HTTP 403, mã KHONG_DU_QUYEN, tổng số phiếu KHÔNG đổi',
    async run() {
      const staff = await login('staff01');
      const { customer, device } = await firstIds(staff);
      const token = await login('manager01');
      const before = await total(token);
      const body = { customerId: customer.customerId, deviceId: device.deviceId, issueDesc: 'TC-09: quản lý thử tạo phiếu' };
      console.log(`   (manager01) POST /requests  ${JSON.stringify(body)}`);
      const r = await call('POST', '/requests', { token, body });
      show('phản hồi', r);
      const after = await total(token);
      console.log(`   Tổng số phiếu trước/sau: ${before} -> ${after}`);
      return r.status === 403 && r.json && r.json.error === 'KHONG_DU_QUYEN' && after === before;
    },
  },
};

(async () => {
  const id = (process.argv[2] || '').toUpperCase();
  const tc = CASES[id];
  if (!tc) {
    console.error(`Cách dùng: node tests/manual/run-tc.js <${Object.keys(CASES).join('|')}>`);
    process.exit(2);
  }
  console.log(`\n=== ${id} - ${tc.title}`);
  console.log(`   Tiền điều kiện : ${tc.pre}`);
  console.log(`   Mong đợi       : ${tc.expect}`);
  let ok;
  try { ok = await tc.run(); } catch (err) { console.log(`   LỖI KHI CHẠY: ${err.message}`); ok = false; }
  console.log(`   >>> KẾT QUẢ SO VỚI MONG ĐỢI: ${ok ? 'KHỚP (PASS)' : 'KHÁC (FAIL)'}\n`);
  process.exitCode = ok ? 0 : 1;
})();
