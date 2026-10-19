// validators/auth.validator.js - TẦNG 1 cho đăng nhập.
const { throwIfErrors, ensureObject } = require('./common');

function validateLogin(body) {
  const b = ensureObject(body);
  const loi = [];
  const username = typeof b.username === 'string' ? b.username.trim() : '';
  if (username.length < 1 || username.length > 50) {
    loi.push({ truong: 'username', ly_do: 'tên đăng nhập là bắt buộc (tối đa 50 ký tự)' });
  }
  const password = typeof b.password === 'string' ? b.password : '';
  if (password.length < 1 || password.length > 200) {
    loi.push({ truong: 'password', ly_do: 'mật khẩu là bắt buộc (tối đa 200 ký tự)' });
  }
  throwIfErrors(loi);
  return { username, password };
}

module.exports = { validateLogin };
