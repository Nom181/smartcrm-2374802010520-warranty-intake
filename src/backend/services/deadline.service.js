// services/deadline.service.js - TẦNG 2: sinh hạn cam kết xử lý (QT4) từ quy tắc SLA trong CSDL.
const { AppError } = require('../errors');

const MS_PER_HOUR = 3600 * 1000;

class DeadlineService {
  constructor(catalogRepo) {
    this.catalog = catalogRepo;
  }

  // QT4: hạn cam kết = thời điểm tiếp nhận + số giờ SLA. Hàm thuần, dễ kiểm thử.
  static compute(receivedAt, slaHours) {
    return new Date(new Date(receivedAt).getTime() + slaHours * MS_PER_HOUR);
  }

  // Tra số giờ SLA theo (nhóm sự cố, mức ưu tiên). Thiếu quy tắc thì từ chối rõ ràng.
  async forClassification(categoryId, priority, receivedAt) {
    const rule = await this.catalog.findSlaRule(categoryId, priority);
    if (!rule) {
      throw new AppError('THIEU_QUY_TAC_SLA',
        'Chưa có quy tắc SLA cho tổ hợp nhóm sự cố và mức ưu tiên này.',
        [{ truong: 'categoryId/priority', ly_do: 'không có dòng nào trong bảng sla_rule' }]);
    }
    return { slaHours: rule.slaHours, deadline: DeadlineService.compute(receivedAt, rule.slaHours) };
  }
}

module.exports = DeadlineService;
