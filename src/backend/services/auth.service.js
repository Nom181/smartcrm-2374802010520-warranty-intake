// services/auth.service.js - đăng nhập cơ bản: kiểm mật khẩu, cấp và kiểm token có chữ ký.
// Token = base64url(payload JSON) + '.' + HMAC-SHA256(payload, AUTH_SECRET). Không cần thư viện ngoài.
const crypto = require('crypto');
const { AppError } = require('../errors');
const { verifyPassword } = require('./password');

// Băm giả để thời gian phản hồi khi tên đăng nhập sai gần bằng khi mật khẩu sai.
const DUMMY_HASH = `scrypt$${'00'.repeat(16)}$${'00'.repeat(64)}`;

class AuthService {
  constructor(userRepo, { secret, ttlHours = 8 }, clock = () => new Date()) {
    if (!secret) throw new Error('AuthService cần secret');
    this.users = userRepo;
    this.secret = secret;
    this.ttlMs = ttlHours * 3600 * 1000;
    this.clock = clock;
  }

  sign(payloadB64) {
    return crypto.createHmac('sha256', this.secret).update(payloadB64).digest('base64url');
  }

  async login({ username, password }) {
    const user = await this.users.findByUsername(username);
    const passwordOk = await verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !passwordOk) {
      // Cùng một thông báo cho cả hai trường hợp, để không lộ tên đăng nhập nào tồn tại.
      throw new AppError('SAI_THONG_TIN_DANG_NHAP', 'Tên đăng nhập hoặc mật khẩu không đúng.');
    }
    const expiresAt = new Date(this.clock().getTime() + this.ttlMs);
    const payload = {
      sub: user.userId, username: user.username, name: user.fullName, role: user.role,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return {
      token: `${body}.${this.sign(body)}`,
      expiresAt,
      user: { userId: user.userId, username: user.username, fullName: user.fullName, role: user.role },
    };
  }

  // Trả về người dùng trong token, hoặc ném CHUA_DANG_NHAP nếu token thiếu/sai chữ ký/hết hạn.
  verifyToken(token) {
    const fail = () => new AppError('CHUA_DANG_NHAP', 'Cần đăng nhập để thực hiện thao tác này.');
    if (typeof token !== 'string') throw fail();
    const parts = token.split('.');
    if (parts.length !== 2) throw fail();
    const expected = Buffer.from(this.sign(parts[0]));
    const actual = Buffer.from(parts[1]);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw fail();
    let payload;
    try {
      payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch (_) {
      throw fail();
    }
    if (!payload.exp || payload.exp * 1000 <= this.clock().getTime()) throw fail();
    return { userId: payload.sub, username: payload.username, fullName: payload.name, role: payload.role };
  }
}

module.exports = AuthService;
