// middleware/async-handler.js - Express 4 không tự bắt lỗi của hàm async; bọc lại để chuyển lỗi cho error-handler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
