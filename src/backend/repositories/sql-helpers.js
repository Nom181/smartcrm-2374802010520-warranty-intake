// repositories/sql-helpers.js - tiện ích SQL thuần kỹ thuật (không chứa quy tắc nghiệp vụ).

// Thoát ký tự đặc biệt của LIKE để "50%" tìm đúng chuỗi "50%", không phải "50 + bất kỳ".
function likePattern(text) {
  return `%${String(text).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

module.exports = { likePattern };
