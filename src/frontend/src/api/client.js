// api/client.js - LỚP CLIENT DUY NHẤT gọi API. Mọi màn hình đi qua đây, không nơi nào khác dùng fetch.
// Nhiệm vụ: gắn token, đọc JSON, đổi mọi lỗi (kể cả mất kết nối) thành ApiError có mã và thông báo tiếng Việt.

const BASE = import.meta.env.VITE_API_BASE || '/api';
const TOKEN_KEY = 'warranty.token';

export class ApiError extends Error {
  constructor({ code, message, status, details }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details; // danh sách { truong, ly_do } khi lỗi định dạng
  }
}

// localStorage có thể bị chặn (chế độ riêng tư) nên luôn bọc try/catch.
export function getToken() {
  try { return window.localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch (_) { /* bỏ qua */ }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

async function request(method, path, { query, body } = {}) {
  const qs = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''))}`
    : '';
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}${qs}`, {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (_) {
    throw new ApiError({
      code: 'MAT_KET_NOI', status: 0,
      message: 'Không kết nối được máy chủ. Hãy kiểm tra máy chủ đã chạy chưa rồi thử lại.',
    });
  }

  if (res.status === 204) return null;
  let payload = null;
  try { payload = await res.json(); } catch (_) { /* phản hồi không phải JSON */ }

  // Máy chủ API tắt: bộ chuyển tiếp (proxy) trả 5xx mà không có nội dung JSON của ứng dụng.
  if (!res.ok && !(payload && payload.error) && res.status >= 500) {
    throw new ApiError({
      code: 'MAY_CHU_KHONG_PHAN_HOI', status: res.status,
      message: 'Máy chủ API không phản hồi. Hãy kiểm tra máy chủ đã chạy chưa rồi thử lại.',
    });
  }

  if (!res.ok) {
    const err = new ApiError({
      code: (payload && payload.error) || 'LOI_KHONG_XAC_DINH',
      message: (payload && payload.message) || 'Máy chủ trả về phản hồi không hợp lệ.',
      status: res.status,
      details: payload && payload.chi_tiet,
    });
    if (res.status === 401 && path !== '/auth/login') onUnauthorized(err);
    throw err;
  }
  return payload;
}

const data = (p) => p.data;

export const api = {
  login: (username, password) => request('POST', '/auth/login', { body: { username, password } }).then(data),

  lookupCustomer: (phone) => request('GET', '/customers/lookup', { query: { phone } }).then(data),
  createCustomer: (body) => request('POST', '/customers', { body }).then(data),

  lookupDevice: (serial) => request('GET', '/devices/lookup', { query: { serial } }).then(data),
  createDevice: (body) => request('POST', '/devices', { body }).then(data),

  listCategories: () => request('GET', '/categories').then(data),

  requestSummary: () => request('GET', '/requests/summary').then(data),
  listRequests: (query) => request('GET', '/requests', { query }), // giữ cả meta phân trang
  getRequest: (id) => request('GET', `/requests/${id}`).then(data),
  createRequest: (body) => request('POST', '/requests', { body }).then(data),
  setCategory: (id, categoryId) => request('PUT', `/requests/${id}/category`, { body: { categoryId } }).then(data),
  setPriority: (id, priority) => request('PUT', `/requests/${id}/priority`, { body: { priority } }).then(data),
  generateDeadline: (id) => request('POST', `/requests/${id}/deadline`).then(data),
  deleteRequest: (id) => request('DELETE', `/requests/${id}`),
};
