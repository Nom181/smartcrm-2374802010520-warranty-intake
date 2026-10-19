-- =====================================================================
-- 002_create_app_user.sql - Bảng tài khoản đăng nhập (MỚI ở Bài tập 2)
-- Lý do: đề BT2 (SE) yêu cầu xác thực đăng nhập mức cơ bản. Xem TD-03
-- trong docs/thay-doi-thiet-ke.md.
-- Mật khẩu KHÔNG lưu nguyên văn: cột password_hash chứa chuỗi băm scrypt.
-- =====================================================================
CREATE TABLE IF NOT EXISTS app_user (
  user_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username       VARCHAR(50)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  role           ENUM('STAFF','MANAGER') NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_app_user_username (username)
) ENGINE=InnoDB;
