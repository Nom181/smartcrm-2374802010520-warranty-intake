// format.js - nhãn hiển thị và định dạng. Nhãn chỉ là cách ĐỌC các giá trị enum của hệ thống (SRS mục 1);
// dữ liệu thật (danh sách phiếu, nhóm sự cố, hạn cam kết) luôn lấy từ API.
export const STATUS_LABEL = { NEW: 'Mới ghi nhận', CLASSIFIED: 'Đã phân loại', RECEIVED: 'Đã tiếp nhận' };
export const PRIORITY_LABEL = { URGENT: 'Khẩn cấp', NORMAL: 'Bình thường', LOW: 'Thấp' };
export const PRIORITIES = ['URGENT', 'NORMAL', 'LOW'];

const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
export function formatDateTime(value) {
  return value ? dateTime.format(new Date(value)) : '—';
}

// "còn 5 giờ" / "quá hạn 3 giờ" so với thời điểm hiện tại
export function describeRemaining(deadline, now = Date.now()) {
  const hours = Math.round((new Date(deadline).getTime() - now) / 3600000);
  if (hours >= 0) return `còn ${hours} giờ`;
  return `quá hạn ${Math.abs(hours)} giờ`;
}

export function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
