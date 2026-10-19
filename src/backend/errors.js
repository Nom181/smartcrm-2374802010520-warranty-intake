// errors.js - các lớp lỗi dùng chung cho mọi tầng.
// QUY ƯỚC: AppError mang MÃ NGHIỆP VỤ, KHÔNG mang mã HTTP.
// Chỉ tầng routes (routes/http-error-map.js) mới dịch mã nghiệp vụ sang mã HTTP.

class AppError extends Error {
  // code: mã nghiệp vụ, ví dụ 'SO_DIEN_THOAI_DA_TON_TAI'
  // chiTiet: thông tin thêm (danh sách trường sai, ...), có thể bỏ trống
  constructor(code, message, chiTiet = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (chiTiet !== undefined) this.chiTiet = chiTiet;
  }
}

// Lỗi KỸ THUẬT do tầng repositories ném ra khi CSDL báo trùng khoá UNIQUE.
// Service bắt lỗi này và đổi thành AppError có mã nghiệp vụ.
class DuplicateKeyError extends Error {
  constructor(key) {
    super(`Duplicate key: ${key}`);
    this.name = 'DuplicateKeyError';
    this.key = key; // tên chỉ mục, ví dụ 'uq_customer_phone'
  }
}

// Lỗi KỸ THUẬT: không kết nối được CSDL (tắt máy chủ, sai cổng, mất mạng).
class UnavailableError extends Error {
  constructor(cause) {
    super('Dependency unavailable');
    this.name = 'UnavailableError';
    this.cause = cause;
  }
}

module.exports = { AppError, DuplicateKeyError, UnavailableError };
