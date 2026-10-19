// LOẠI 2 - GIÁ TRỊ BIÊN: trường hợp ở ĐÚNG ranh giới của một quy tắc.
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { makeWorld } = require('./helpers/world');
const { validateLookupPhone } = require('../src/backend/validators/customer.validator');
const { validateCreateRequest, MAX_DESC } = require('../src/backend/validators/warranty-request.validator');
const { validateListRequests } = require('../src/backend/validators/warranty-request.validator');
const DeadlineService = require('../src/backend/services/deadline.service');

describe('[GIÁ TRỊ BIÊN] số điện thoại (QT1): đúng 10 chữ số, bắt đầu bằng 0', () => {
  test('9 chữ số bị từ chối, 10 chữ số được nhận, 11 chữ số bị từ chối', () => {
    assert.throws(() => validateLookupPhone({ phone: '091234567' }), { code: 'DU_LIEU_KHONG_HOP_LE' });
    assert.deepEqual(validateLookupPhone({ phone: '0912345678' }), { phone: '0912345678' });
    assert.throws(() => validateLookupPhone({ phone: '09123456789' }), { code: 'DU_LIEU_KHONG_HOP_LE' });
  });
  test('10 chữ số nhưng không bắt đầu bằng 0 bị từ chối', () => {
    assert.throws(() => validateLookupPhone({ phone: '1912345678' }), { code: 'DU_LIEU_KHONG_HOP_LE' });
  });
});

describe('[GIÁ TRỊ BIÊN] độ dài mô tả lỗi (QT2)', () => {
  const base = { customerId: 1, deviceId: 1 };
  test('đúng 1 ký tự và đúng 1000 ký tự được nhận', () => {
    assert.equal(validateCreateRequest({ ...base, issueDesc: 'x' }).issueDesc, 'x');
    assert.equal(validateCreateRequest({ ...base, issueDesc: 'x'.repeat(MAX_DESC) }).issueDesc.length, 1000);
  });
  test('1001 ký tự, chuỗi rỗng và chuỗi toàn khoảng trắng bị từ chối', () => {
    assert.throws(() => validateCreateRequest({ ...base, issueDesc: 'x'.repeat(MAX_DESC + 1) }), { code: 'DU_LIEU_KHONG_HOP_LE' });
    assert.throws(() => validateCreateRequest({ ...base, issueDesc: '' }), { code: 'DU_LIEU_KHONG_HOP_LE' });
    assert.throws(() => validateCreateRequest({ ...base, issueDesc: '    ' }), { code: 'DU_LIEU_KHONG_HOP_LE' });
  });
});

describe('[GIÁ TRỊ BIÊN] ngày mua thiết bị không ở tương lai', () => {
  let w;
  before(async () => { w = await makeWorld(); }); // đồng hồ giả: 20/10/2026 10:00 giờ Việt Nam
  const input = (purchaseDate) => ({ serialNo: `SN-${purchaseDate}`, modelName: 'Mekong X1', purchaseDate });

  test('ngày hôm nay hợp lệ, ngày mai bị từ chối', async () => {
    await w.services.devices.create(input('2026-10-20'));
    await assert.rejects(() => w.services.devices.create(input('2026-10-21')), { code: 'NGAY_MUA_TRONG_TUONG_LAI' });
  });
  test('tính "hôm nay" theo giờ Việt Nam: 02:00 sáng 21/10 giờ VN (19:00 UTC ngày 20) thì 21/10 đã là hôm nay', async () => {
    w.clock.now = new Date('2026-10-20T19:00:00.000Z');
    await w.services.devices.create({ serialNo: 'SN-TZ-0001', modelName: 'Mekong X1', purchaseDate: '2026-10-21' });
    await assert.rejects(
      () => w.services.devices.create({ serialNo: 'SN-TZ-0002', modelName: 'Mekong X1', purchaseDate: '2026-10-22' }),
      { code: 'NGAY_MUA_TRONG_TUONG_LAI' });
  });
});

describe('[GIÁ TRỊ BIÊN] hạn cam kết theo SLA (QT4, NFR2)', () => {
  test('cộng đúng số giờ, kể cả qua nửa đêm và qua tháng', () => {
    const d = DeadlineService.compute(new Date('2026-10-31T23:30:00.000Z'), 24);
    assert.equal(d.toISOString(), '2026-11-01T23:30:00.000Z');
  });

  test('mọi tổ hợp (3 nhóm x 3 mức) cho đúng số giờ trong bảng SLA của SRS', async () => {
    const w = await makeWorld();
    const expected = {
      HARDWARE: { URGENT: 24, NORMAL: 72, LOW: 120 },
      SOFTWARE: { URGENT: 12, NORMAL: 48, LOW: 96 },
      WEAR_AND_TEAR: { URGENT: 48, NORMAL: 96, LOW: 168 },
    };
    const c = await w.services.customers.create({ phone: '0966666666', fullName: 'Kiểm SLA', email: null });
    const received = new Date('2026-10-20T03:00:00.000Z');
    let n = 0;
    for (const cat of await w.services.catalog.listCategories()) {
      for (const priority of ['URGENT', 'NORMAL', 'LOW']) {
        n += 1;
        const d = await w.services.devices.create({ serialNo: `SN-SLA-${n}00`, modelName: 'Mekong X1', purchaseDate: null });
        const r = await w.services.warrantyRequests.create({ customerId: c.customerId, deviceId: d.deviceId, issueDesc: 'thử' });
        await w.services.warrantyRequests.setCategory(r.requestId, { categoryId: cat.categoryId });
        await w.services.warrantyRequests.setPriority(r.requestId, { priority });
        const done = await w.services.warrantyRequests.generateDeadline(r.requestId);
        const hours = expected[cat.code][priority];
        assert.equal(done.committedDeadline.getTime() - received.getTime(), hours * 3600 * 1000,
          `${cat.code}/${priority} phải cách tiếp nhận đúng ${hours} giờ`);
      }
    }
    assert.equal(n, 9);
  });

  test('cùng nhóm sự cố, phiếu Khẩn cấp có hạn sớm hơn phiếu Bình thường (US6, tiêu chí 2)', async () => {
    const w = await makeWorld();
    const c = await w.services.customers.create({ phone: '0977777777', fullName: 'So sánh', email: null });
    const make = async (serial, priority) => {
      const d = await w.services.devices.create({ serialNo: serial, modelName: 'Mekong X1', purchaseDate: null });
      const r = await w.services.warrantyRequests.create({ customerId: c.customerId, deviceId: d.deviceId, issueDesc: 'thử' });
      await w.services.warrantyRequests.setCategory(r.requestId, { categoryId: 1 });
      await w.services.warrantyRequests.setPriority(r.requestId, { priority });
      return w.services.warrantyRequests.generateDeadline(r.requestId);
    };
    const urgent = await make('SN-CMP-URG1', 'URGENT');
    const normal = await make('SN-CMP-NOR1', 'NORMAL');
    assert.ok(urgent.committedDeadline < normal.committedDeadline);
  });
});

describe('[GIÁ TRỊ BIÊN] token đăng nhập hết hạn và phân trang', () => {
  test('token còn hiệu lực 1 giây trước hạn, hết hiệu lực đúng thời điểm hết hạn', async () => {
    const w = await makeWorld();
    const { token, expiresAt } = await w.services.auth.login({ username: 'staff01', password: 'Demo@2026' });
    w.clock.now = new Date(expiresAt.getTime() - 1000);
    assert.equal(w.services.auth.verifyToken(token).username, 'staff01');
    w.clock.now = new Date(expiresAt.getTime());
    assert.throws(() => w.services.auth.verifyToken(token), { code: 'CHUA_DANG_NHAP' });
  });

  test('pageSize = 100 được nhận, 101 và 0 bị từ chối', () => {
    assert.equal(validateListRequests({ pageSize: '100' }).pageSize, 100);
    assert.throws(() => validateListRequests({ pageSize: '101' }), { code: 'DU_LIEU_KHONG_HOP_LE' });
    assert.throws(() => validateListRequests({ pageSize: '0' }), { code: 'DU_LIEU_KHONG_HOP_LE' });
  });
});
