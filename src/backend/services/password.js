// services/password.js - băm và kiểm mật khẩu bằng scrypt có sẵn của Node (không cần thư viện ngoài).
// Định dạng lưu: scrypt$<muối hex>$<băm hex>
const crypto = require('crypto');

const KEY_LENGTH = 64;

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

async function hashPassword(password, saltHex = crypto.randomBytes(16).toString('hex')) {
  const key = await scrypt(password, Buffer.from(saltHex, 'hex'));
  return `scrypt$${saltHex}$${key.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const expected = Buffer.from(parts[2], 'hex');
  const actual = await scrypt(password, Buffer.from(parts[1], 'hex'));
  // So sánh thời gian cố định để không lộ thông tin qua độ trễ
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
