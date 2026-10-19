// services/warranty-request.service.js - TẦNG 2: toàn bộ quy tắc nghiệp vụ của phiếu bảo hành.
// Không biết gì về HTTP: lỗi được báo bằng AppError có MÃ NGHIỆP VỤ.
//
// Vòng đời (QT5):  NEW --chọn nhóm sự cố--> CLASSIFIED --sinh hạn cam kết--> RECEIVED
const { AppError } = require('../errors');
const { toLimitOffset, pageMeta } = require('./paging');

const NEW = 'NEW';
const CLASSIFIED = 'CLASSIFIED';
const RECEIVED = 'RECEIVED';

class WarrantyRequestService {
  constructor({ requests, customers, devices, catalog, deadline, clock = () => new Date() }) {
    this.requests = requests;
    this.customers = customers;
    this.devices = devices;
    this.catalog = catalog;
    this.deadline = deadline;
    this.clock = clock;
  }

  // Thời điểm hiện tại, cắt phần mili-giây (cột DATETIME chỉ lưu đến giây).
  now() {
    const d = this.clock();
    return new Date(Math.floor(d.getTime() / 1000) * 1000);
  }

  async mustFind(id) {
    const request = await this.requests.findById(id);
    if (!request) throw new AppError('PHIEU_KHONG_TON_TAI', 'Không tìm thấy phiếu bảo hành.');
    return request;
  }

  // Phiếu đã sinh hạn cam kết (RECEIVED) là phiếu đã chốt: không sửa nữa.
  assertEditable(request) {
    if (request.status === RECEIVED) {
      throw new AppError('PHIEU_DA_TIEP_NHAN',
        'Phiếu đã sinh hạn cam kết (Đã tiếp nhận) nên không thể thay đổi.');
    }
  }

  // QT2: mô tả lỗi không được rỗng trước khi phân loại.
  assertHasDescription(request) {
    if (!request.issueDesc || request.issueDesc.trim() === '') {
      throw new AppError('CHUA_CO_MO_TA_LOI',
        'Phiếu chưa có mô tả lỗi. Hãy nhập mô tả lỗi trước khi phân loại.',
        [{ truong: 'issueDesc', ly_do: 'mô tả lỗi đang rỗng' }]);
    }
  }

  // Phản hồi chi tiết: phiếu + lịch sử trạng thái + các mức SLA của nhóm (làm mốc so sánh).
  async get(id) {
    const request = await this.mustFind(id);
    const history = await this.requests.listLogs(id);
    const slaOptions = request.categoryId
      ? await this.catalog.listSlaRulesByCategory(request.categoryId)
      : [];
    return { ...request, history, slaOptions };
  }

  async list(query) {
    const { items, total } = await this.requests.list({
      status: query.status, q: query.q, ...toLimitOffset(query),
    });
    return { items, meta: pageMeta(query, total) };
  }

  // Số liệu tổng hợp kèm mẫu số để người đọc có mốc so sánh (tổng số phiếu).
  async summary() {
    const byStatus = await this.requests.countByStatus();
    const total = byStatus.NEW + byStatus.CLASSIFIED + byStatus.RECEIVED;
    const pastDeadline = await this.requests.countPastDeadline(this.now());
    return { total, byStatus, pastDeadline };
  }

  // US2/US3 (FR3): tạo phiếu ở trạng thái NEW.
  async create({ customerId, deviceId, issueDesc }) {
    const customer = await this.customers.findById(customerId);
    if (!customer) throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng với mã đã cho.');
    const device = await this.devices.findById(deviceId);
    if (!device) throw new AppError('THIET_BI_KHONG_TON_TAI', 'Không tìm thấy thiết bị với mã đã cho.');
    const desc = (issueDesc || '').trim();
    if (desc === '') {
      throw new AppError('CHUA_CO_MO_TA_LOI', 'Mô tả lỗi là bắt buộc.',
        [{ truong: 'issueDesc', ly_do: 'mô tả lỗi đang rỗng' }]);
    }
    const created = await this.requests.insert({
      customerId, deviceId, issueDesc: desc, receivedAt: this.now(),
    });
    return this.get(created.requestId);
  }

  async updateDescription(id, { issueDesc }) {
    const request = await this.mustFind(id);
    this.assertEditable(request);
    const ok = await this.requests.applyChange(
      id, request.status, { issueDesc: issueDesc.trim() }, request.status, this.now());
    if (!ok) throw this.changedByOther();
    return this.get(id);
  }

  // US4 (FR4): chọn nhóm sự cố. NEW -> CLASSIFIED (ghi lịch sử). Chọn lại khi đã CLASSIFIED thì chỉ đổi nhóm.
  async setCategory(id, { categoryId }) {
    const request = await this.mustFind(id);
    this.assertEditable(request);
    this.assertHasDescription(request);
    const category = await this.catalog.findCategoryById(categoryId);
    if (!category) {
      throw new AppError('NHOM_SU_CO_KHONG_HOP_LE',
        'Nhóm sự cố được chọn không nằm trong danh mục.',
        [{ truong: 'categoryId', ly_do: 'không có trong danh mục issue_category' }]);
    }
    const ok = await this.requests.applyChange(
      id, request.status, { categoryId }, CLASSIFIED, this.now());
    if (!ok) throw this.changedByOther();
    return this.get(id);
  }

  // US5 (FR5): chọn mức ưu tiên. Không đổi trạng thái.
  async setPriority(id, { priority }) {
    const request = await this.mustFind(id);
    this.assertEditable(request);
    const ok = await this.requests.applyChange(
      id, request.status, { priority }, request.status, this.now());
    if (!ok) throw this.changedByOther();
    return this.get(id);
  }

  // US6 (FR6): sinh hạn cam kết. CLASSIFIED -> RECEIVED (ghi lịch sử).
  // QT3: phải có đủ nhóm sự cố VÀ mức ưu tiên. QT4: hạn = tiếp nhận + giờ SLA.
  async generateDeadline(id) {
    const request = await this.mustFind(id);
    this.assertEditable(request);

    const thieu = [];
    if (!request.categoryId) thieu.push({ truong: 'categoryId', ly_do: 'phiếu chưa có nhóm sự cố' });
    if (!request.priority) thieu.push({ truong: 'priority', ly_do: 'phiếu chưa có mức ưu tiên' });
    if (thieu.length > 0) {
      throw new AppError('THIEU_THONG_TIN_PHAN_LOAI',
        `Phiếu chưa đủ thông tin phân loại: thiếu ${thieu.map((t) => t.truong).join(', ')}.`, thieu);
    }

    const { deadline } = await this.deadline.forClassification(
      request.categoryId, request.priority, request.receivedAt);
    const ok = await this.requests.applyChange(
      id, request.status, { committedDeadline: deadline }, RECEIVED, this.now());
    if (!ok) throw this.changedByOther();
    return this.get(id);
  }

  // Chỉ xoá được phiếu còn ở trạng thái NEW (chưa phân loại).
  async remove(id) {
    const request = await this.mustFind(id);
    if (request.status !== NEW) {
      throw new AppError('PHIEU_CHI_XOA_KHI_MOI',
        'Chỉ xoá được phiếu ở trạng thái Mới ghi nhận.');
    }
    const ok = await this.requests.deleteIfStatus(id, NEW);
    if (!ok) throw this.changedByOther();
  }

  changedByOther() {
    return new AppError('PHIEU_DA_THAY_DOI',
      'Phiếu vừa được người khác thay đổi. Hãy tải lại rồi thử lại.');
  }
}

module.exports = WarrantyRequestService;
