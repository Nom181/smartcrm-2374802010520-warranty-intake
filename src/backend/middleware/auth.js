// middleware/auth.js - đọc token từ tiêu đề Authorization và kiểm quyền theo vai trò.
const { AppError } = require('../errors');

function requireAuth(authService) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const m = /^Bearer (.+)$/.exec(header);
      req.user = authService.verifyToken(m ? m[1] : null);
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Vai trò theo SRS mục 2: STAFF tạo/sửa phiếu; MANAGER chỉ xem.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('KHONG_DU_QUYEN', 'Tài khoản của bạn không được phép thực hiện thao tác này.'));
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
