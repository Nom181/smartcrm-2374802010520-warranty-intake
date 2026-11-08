// BUG-006 (hồi quy): tham số page không có giới hạn trên làm câu SQL thành "OFFSET 2e+21" -> HTTP 500.
// Sau khi sửa: page vượt giới hạn bị từ chối bằng 400 DU_LIEU_KHONG_HOP_LE, nêu đúng trường page.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateListRequests } = require('../src/backend/validators/warranty-request.validator');

test('BUG-006: page = 99999999999999999999 bị TỪ CHỐI (400), không đi tiếp xuống CSDL', () => {
  assert.throws(
    () => validateListRequests({ page: '99999999999999999999' }),
    (e) => e.code === 'DU_LIEU_KHONG_HOP_LE' && e.chiTiet.some((x) => x.truong === 'page')
  );
});

test('BUG-006: biên của page: 1000000 hợp lệ, 1000001 bị từ chối', () => {
  assert.equal(validateListRequests({ page: '1000000' }).page, 1000000);
  assert.throws(() => validateListRequests({ page: '1000001' }), (e) => e.code === 'DU_LIEU_KHONG_HOP_LE');
});