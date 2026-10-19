// repositories/user.repository.js - đọc bảng app_user (tài khoản đăng nhập).
function toUser(row) {
  return row
    ? {
        userId: row.user_id,
        username: row.username,
        passwordHash: row.password_hash,
        fullName: row.full_name,
        role: row.role,
      }
    : null;
}

class UserRepository {
  constructor(db) { this.db = db; }

  async findByUsername(username) {
    const rows = await this.db.query('SELECT * FROM app_user WHERE username = ?', [username]);
    return toUser(rows[0]);
  }
}

module.exports = UserRepository;
