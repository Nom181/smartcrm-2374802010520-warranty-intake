// services/customer.service.js - TẦNG 2: quy tắc nghiệp vụ của khách hàng. Không biết gì về HTTP.
const { AppError, DuplicateKeyError } = require('../errors');
const { toLimitOffset, pageMeta } = require('./paging');

class CustomerService {
  constructor(customerRepo, requestRepo) {
    this.customers = customerRepo;
    this.requests = requestRepo;
  }

  // FR1: trả khách hàng hoặc báo "Không tìm thấy khách hàng".
  async lookupByPhone(phone) {
    const customer = await this.customers.findByPhone(phone);
    if (!customer) {
      throw new AppError('KHONG_TIM_THAY_KHACH_HANG', 'Không tìm thấy khách hàng.');
    }
    return customer;
  }

  async get(id) {
    const customer = await this.customers.findById(id);
    if (!customer) throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng với mã đã cho.');
    return customer;
  }

  async list(query) {
    const { items, total } = await this.customers.list({ q: query.q, ...toLimitOffset(query) });
    return { items, meta: pageMeta(query, total) };
  }

  // QT1: số điện thoại là duy nhất. Kiểm trước để báo lỗi rõ; chỉ mục UNIQUE là lưới an toàn khi hai người tạo cùng lúc.
  async create(input) {
    await this.assertPhoneFree(input.phone, null);
    try {
      return await this.customers.insert(input);
    } catch (err) {
      throw this.translateDuplicate(err, input.phone);
    }
  }

  async update(id, input) {
    await this.get(id);
    await this.assertPhoneFree(input.phone, id);
    try {
      return await this.customers.update(id, input);
    } catch (err) {
      throw this.translateDuplicate(err, input.phone);
    }
  }

  // Không xoá khách hàng đã có phiếu bảo hành: sẽ làm mất dấu vết lịch sử bảo hành.
  async remove(id) {
    await this.get(id);
    const n = await this.requests.countByCustomer(id);
    if (n > 0) {
      throw new AppError('KHACH_CO_PHIEU',
        `Khách hàng đang có ${n} phiếu bảo hành nên không thể xoá.`);
    }
    await this.customers.delete(id);
  }

  async assertPhoneFree(phone, ownId) {
    const existing = await this.customers.findByPhone(phone);
    if (existing && existing.customerId !== ownId) {
      throw new AppError('SO_DIEN_THOAI_DA_TON_TAI',
        `Số điện thoại ${phone} đã thuộc về một khách hàng khác.`,
        { customerId: existing.customerId });
    }
  }

  translateDuplicate(err, phone) {
    if (err instanceof DuplicateKeyError) {
      return new AppError('SO_DIEN_THOAI_DA_TON_TAI', `Số điện thoại ${phone} đã thuộc về một khách hàng khác.`);
    }
    return err;
  }
}

module.exports = CustomerService;
