// TEST REPORT (BT3) - các test case TẦNG UNIT, tên bắt đầu bằng mã TC-xx để chạy lại từng case:
//   node --test --test-name-pattern="TC-05" tests/05-test-report.test.js
// Service THẬT + repository GIẢ + đồng hồ giả cố định (xem tests/helpers/world.js), không cần CSDL.
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { makeWorld } = require('./helpers/world');
const { validateCreateRequest } = require('../src/backend/validators/warranty-request.validator');
const { HTTP_BY_CODE } = require('../src/backend/routes/http-error-map');

describe('[TEST REPORT - UNIT] nghiệp vụ phiếu bảo hành', () => {
  let w; let c; let d;
  before(async () => {
    w = await makeWorld();
    c = await w.services.customers.create({ phone: '0944444401', fullName: 'Khách Báo Cáo', email: null });
    d = await w.services.devices.create({ serialNo: 'SN-TC-REPORT', modelName: 'Mekong X1', purchaseDate: '2026-09-01' });
  });

  const newRequest = (issueDesc = 'Không lên nguồn') =>
    w.services.warrantyRequests.create({ customerId: c.customerId, deviceId: d.deviceId, issueDesc });

  test('TC-03 QT4: SOFTWARE + URGENT thì hạn cam kết = tiếp nhận + 12 giờ', async () => {
    const wr = w.services.warrantyRequests;
    const created = await newRequest();
    await wr.setCategory(created.requestId, { categoryId: 2 }); // SOFTWARE
    await wr.setPriority(created.requestId, { priority: 'URGENT' });
    const done = await wr.generateDeadline(created.requestId);
    assert.equal(done.status, 'RECEIVED');
    // tiếp nhận 2026-10-20T03:00:00Z + 12 giờ = 15:00:00Z cùng ngày (tính tay)
    assert.equal(done.committedDeadline.toISOString(), '2026-10-20T15:00:00.000Z');
  });

  test('TC-05 QT9 biên: mô tả lỗi dài đúng 1000 ký tự là HỢP LỆ', () => {
    const out = validateCreateRequest({ customerId: 1, deviceId: 1, issueDesc: 'a'.repeat(1000) });
    assert.equal(out.issueDesc.length, 1000);
  });

  test('TC-06 QT9 biên: mô tả lỗi dài 1001 ký tự bị TỪ CHỐI, nêu đúng trường issueDesc', () => {
    assert.throws(
      () => validateCreateRequest({ customerId: 1, deviceId: 1, issueDesc: 'a'.repeat(1001) }),
      (err) => err.code === 'DU_LIEU_KHONG_HOP_LE' && err.chiTiet.some((x) => x.truong === 'issueDesc')
    );
  });

  test('TC-08 mã phiếu không tồn tại: báo PHIEU_KHONG_TON_TAI và dịch thành 404, KHÔNG phải 500', async () => {
    await assert.rejects(() => w.services.warrantyRequests.get(999999), { code: 'PHIEU_KHONG_TON_TAI' });
    assert.equal(HTTP_BY_CODE.PHIEU_KHONG_TON_TAI, 404);
  });

  test('TC-10 QT3: sinh hạn khi chưa phân loại bị từ chối, nêu đủ trường thiếu, phiếu vẫn ở NEW', async () => {
    const wr = w.services.warrantyRequests;
    const created = await newRequest();
    await assert.rejects(
      () => wr.generateDeadline(created.requestId),
      (err) => err.code === 'THIEU_THONG_TIN_PHAN_LOAI'
        && err.chiTiet.map((x) => x.truong).sort().join() === 'categoryId,priority'
    );
    assert.equal(HTTP_BY_CODE.THIEU_THONG_TIN_PHAN_LOAI, 422);
    assert.equal((await wr.get(created.requestId)).status, 'NEW', 'tác dụng phụ: trạng thái không đổi');
  });

  test('TC-11 phiếu đã RECEIVED không sửa được và dữ liệu không đổi', async () => {
    const wr = w.services.warrantyRequests;
    const created = await newRequest('Mô tả gốc');
    await wr.setCategory(created.requestId, { categoryId: 1 });
    await wr.setPriority(created.requestId, { priority: 'LOW' });
    await wr.generateDeadline(created.requestId);
    await assert.rejects(
      () => wr.updateDescription(created.requestId, { issueDesc: 'Sửa trộm' }),
      { code: 'PHIEU_DA_TIEP_NHAN' }
    );
    assert.equal((await wr.get(created.requestId)).issueDesc, 'Mô tả gốc');
  });
});
