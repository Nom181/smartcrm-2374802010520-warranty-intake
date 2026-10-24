// middleware/error-handler.js - điểm DUY NHẤT biến lỗi thành phản hồi HTTP.
// Quy tắc: không bao giờ để lọt vết ngăn xếp, tên bảng hay câu SQL ra ngoài.
const { AppError, UnavailableError } = require('../errors');
const { HTTP_BY_CODE } = require('../routes/http-error-map');

function notFoundHandler(req, res, next) {
  next(new AppError('KHONG_TIM_THAY_DUONG_DAN', `Không có chức năng ${req.method} ${req.path}.`));
}

function createErrorHandler(logger = console) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    // Nội dung JSON gửi lên bị hỏng (do express.json phát hiện)
    if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
      return res.status(400).json({ error: 'JSON_KHONG_HOP_LE', message: 'Nội dung gửi lên không phải JSON hợp lệ.' });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'DU_LIEU_QUA_LON', message: 'Nội dung gửi lên quá lớn.' });
    }
    if (err instanceof AppError) {
      const httpStatus = HTTP_BY_CODE[err.code];
      if (httpStatus) {
        const body = { error: err.code, message: err.message };
        if (err.chiTiet !== undefined) {
          body.chi_tiet = err.chiTiet; // giữ nguyên để bên gọi cũ không vỡ (bước "mở rộng" của TD-13)
          // Hợp đồng lỗi thống nhất: error + message + fields (tên trường -> lý do), theo tài liệu buổi 9.
          if (Array.isArray(err.chiTiet)) {
            body.fields = Object.fromEntries(err.chiTiet.map((x) => [x.truong, x.ly_do]));
          }
        }
        return res.status(httpStatus).json(body);
      }
    }
    // CSDL không kết nối được: báo rõ, không treo, không lộ chi tiết kết nối.
    if (err instanceof UnavailableError) {
      logger.error('[CSDL không khả dụng]', err.cause && err.cause.code);
      return res.status(503).json({
        error: 'CSDL_KHONG_KHA_DUNG',
        message: 'Không kết nối được cơ sở dữ liệu. Vui lòng thử lại sau ít phút.',
      });
    }
    // Lỗi không lường trước: ghi nhật ký ở máy chủ, trả thông báo chung cho người dùng.
    logger.error('[Lỗi không lường trước]', err);
    return res.status(500).json({
      error: 'LOI_HE_THONG',
      message: 'Hệ thống gặp sự cố. Vui lòng thử lại sau.',
    });
  };
}

module.exports = { createErrorHandler, notFoundHandler };
