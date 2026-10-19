// services/device.service.js - TẦNG 2: quy tắc nghiệp vụ của thiết bị. Không biết gì về HTTP.
const { AppError, DuplicateKeyError } = require('../errors');
const { toLimitOffset, pageMeta } = require('./paging');

class DeviceService {
  // clock: hàm trả về thời điểm hiện tại (tiêm vào để kiểm thử được ngày biên).
  constructor(deviceRepo, requestRepo, { clock = () => new Date(), timezone = 'Asia/Ho_Chi_Minh' } = {}) {
    this.devices = deviceRepo;
    this.requests = requestRepo;
    this.clock = clock;
    this.timezone = timezone;
  }

  // Ngày hôm nay theo múi giờ của trung tâm, dạng YYYY-MM-DD.
  today() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(this.clock());
  }

  // Ngày mua không được ở tương lai: hôm nay còn hợp lệ, ngày mai thì không (so chuỗi YYYY-MM-DD).
  assertPurchaseDate(purchaseDate) {
    if (purchaseDate && purchaseDate > this.today()) {
      throw new AppError('NGAY_MUA_TRONG_TUONG_LAI',
        'Ngày mua không được sau ngày hôm nay.', [{ truong: 'purchaseDate', ly_do: 'không được ở tương lai' }]);
    }
  }

  async get(id) {
    const device = await this.devices.findById(id);
    if (!device) throw new AppError('THIET_BI_KHONG_TON_TAI', 'Không tìm thấy thiết bị với mã đã cho.');
    return device;
  }

  async lookupBySerial(serialNo) {
    const device = await this.devices.findBySerial(serialNo);
    if (!device) throw new AppError('KHONG_TIM_THAY_THIET_BI', 'Không tìm thấy thiết bị với số serial này.');
    return device;
  }

  async list(query) {
    const { items, total } = await this.devices.list({ q: query.q, ...toLimitOffset(query) });
    return { items, meta: pageMeta(query, total) };
  }

  // QT2: số serial là duy nhất.
  async create(input) {
    this.assertPurchaseDate(input.purchaseDate);
    await this.assertSerialFree(input.serialNo, null);
    try {
      return await this.devices.insert(input);
    } catch (err) {
      throw this.translateDuplicate(err, input.serialNo);
    }
  }

  async update(id, input) {
    await this.get(id);
    this.assertPurchaseDate(input.purchaseDate);
    await this.assertSerialFree(input.serialNo, id);
    try {
      return await this.devices.update(id, input);
    } catch (err) {
      throw this.translateDuplicate(err, input.serialNo);
    }
  }

  async remove(id) {
    await this.get(id);
    const n = await this.requests.countByDevice(id);
    if (n > 0) {
      throw new AppError('THIET_BI_CO_PHIEU',
        `Thiết bị đang có ${n} phiếu bảo hành nên không thể xoá.`);
    }
    await this.devices.delete(id);
  }

  async assertSerialFree(serialNo, ownId) {
    const existing = await this.devices.findBySerial(serialNo);
    if (existing && existing.deviceId !== ownId) {
      throw new AppError('SERIAL_DA_TON_TAI', `Số serial ${serialNo} đã được ghi nhận.`,
        { deviceId: existing.deviceId });
    }
  }

  translateDuplicate(err, serialNo) {
    if (err instanceof DuplicateKeyError) {
      return new AppError('SERIAL_DA_TON_TAI', `Số serial ${serialNo} đã được ghi nhận.`);
    }
    return err;
  }
}

module.exports = DeviceService;
