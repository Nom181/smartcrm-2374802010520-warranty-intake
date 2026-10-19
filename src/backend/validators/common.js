// validators/common.js - hàm dùng chung của TẦNG 1 (kiểm định dạng và kiểu, CHƯA tra CSDL).
const { AppError } = require('../errors');

const PRIORITIES = ['URGENT', 'NORMAL', 'LOW'];
const STATUSES = ['NEW', 'CLASSIFIED', 'RECEIVED'];

// Gom TẤT CẢ lỗi rồi báo một lần để người dùng sửa một lượt là xong.
function throwIfErrors(loi) {
  if (loi.length === 0) return;
  throw new AppError(
    'DU_LIEU_KHONG_HOP_LE',
    `Dữ liệu vào không hợp lệ ở các trường: ${loi.map((l) => l.truong).join(', ')}`,
    loi
  );
}

function ensureObject(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Nội dung gửi lên phải là một đối tượng JSON.', [
      { truong: 'body', ly_do: 'phải là đối tượng JSON' },
    ]);
  }
  return body;
}

// Chuỗi bắt buộc: cắt khoảng trắng hai đầu, độ dài trong [min, max].
function requiredString(body, field, { min = 1, max, label }, loi) {
  const raw = body[field];
  if (typeof raw !== 'string' || raw.trim().length < min) {
    loi.push({ truong: field, ly_do: min <= 1 ? `${label} là bắt buộc` : `${label} phải có ít nhất ${min} ký tự` });
    return undefined;
  }
  const value = raw.trim();
  if (value.length > max) {
    loi.push({ truong: field, ly_do: `${label} tối đa ${max} ký tự` });
    return undefined;
  }
  return value;
}

// Chuỗi không bắt buộc: thiếu/rỗng/null thì trả null.
function optionalString(body, field, { max, label, pattern, patternMessage }, loi) {
  const raw = body[field];
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') {
    loi.push({ truong: field, ly_do: `${label} phải là chuỗi` });
    return null;
  }
  const value = raw.trim();
  if (value === '') return null;
  if (value.length > max) {
    loi.push({ truong: field, ly_do: `${label} tối đa ${max} ký tự` });
    return null;
  }
  if (pattern && !pattern.test(value)) {
    loi.push({ truong: field, ly_do: patternMessage });
    return null;
  }
  return value;
}

function positiveInt(value, field, loi) {
  if (!Number.isInteger(value) || value <= 0) {
    loi.push({ truong: field, ly_do: 'phải là số nguyên dương' });
    return undefined;
  }
  return value;
}

// Mã trong đường dẫn, ví dụ /customers/:id. Chuỗi "12abc" bị từ chối.
function parseId(raw, field = 'id') {
  const loi = [];
  const n = typeof raw === 'string' && /^[1-9]\d{0,17}$/.test(raw) ? Number(raw) : NaN;
  positiveInt(n, field, loi);
  throwIfErrors(loi);
  return n;
}

// Phân trang: page >= 1, pageSize trong [1, 100].
function parsePaging(query, loi, defaults = { page: 1, pageSize: 20 }) {
  let page = defaults.page;
  let pageSize = defaults.pageSize;
  if (query.page !== undefined) {
    page = /^\d+$/.test(String(query.page)) ? Number(query.page) : NaN;
    if (!(page >= 1)) { loi.push({ truong: 'page', ly_do: 'phải là số nguyên từ 1' }); page = defaults.page; }
  }
  if (query.pageSize !== undefined) {
    pageSize = /^\d+$/.test(String(query.pageSize)) ? Number(query.pageSize) : NaN;
    if (!(pageSize >= 1 && pageSize <= 100)) {
      loi.push({ truong: 'pageSize', ly_do: 'phải là số nguyên từ 1 đến 100' });
      pageSize = defaults.pageSize;
    }
  }
  return { page, pageSize };
}

function parseSearch(query, loi) {
  if (query.q === undefined) return null;
  if (typeof query.q !== 'string' || query.q.trim().length > 50) {
    loi.push({ truong: 'q', ly_do: 'từ khoá tìm kiếm tối đa 50 ký tự' });
    return null;
  }
  return query.q.trim() || null;
}

module.exports = {
  PRIORITIES, STATUSES,
  throwIfErrors, ensureObject, requiredString, optionalString, positiveInt,
  parseId, parsePaging, parseSearch,
};
