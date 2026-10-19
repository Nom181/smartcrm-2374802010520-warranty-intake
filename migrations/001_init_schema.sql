-- =====================================================================
-- 001_init_schema.sql - Dựng 6 bảng theo DDL nộp ở Bài tập 1 (schema.sql)
-- Chạy được nhiều lần: mọi bảng dùng CREATE TABLE IF NOT EXISTS.
-- Cơ sở dữ liệu do scripts/migrate.js tạo (CREATE DATABASE IF NOT EXISTS).
-- =====================================================================

-- 1. Khách hàng (US1)
CREATE TABLE IF NOT EXISTS customer (
  customer_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone        CHAR(10)        NOT NULL,
  full_name    VARCHAR(100)    NOT NULL,
  email        VARCHAR(100)    NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id),
  -- NFR1: tra cứu theo số điện thoại <= 2 giây với <= 10.000 khách hàng
  UNIQUE KEY uq_customer_phone (phone)
) ENGINE=InnoDB;

-- 2. Thiết bị (US2)
CREATE TABLE IF NOT EXISTS device (
  device_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  serial_no      VARCHAR(50)     NOT NULL,
  model_name     VARCHAR(100)    NOT NULL,
  purchase_date  DATE            NULL,
  PRIMARY KEY (device_id),
  UNIQUE KEY uq_device_serial (serial_no)
) ENGINE=InnoDB;

-- 3. Nhóm sự cố (US4) - danh mục nằm trong CSDL, không viết cứng trong mã (NFR5)
CREATE TABLE IF NOT EXISTS issue_category (
  category_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(30)       NOT NULL,
  name         VARCHAR(100)      NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_issue_category_code (code)
) ENGINE=InnoDB;

-- 4. Quy tắc SLA (US6) - số giờ cam kết theo (nhóm sự cố, mức ưu tiên)
CREATE TABLE IF NOT EXISTS sla_rule (
  sla_rule_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id  SMALLINT UNSIGNED NOT NULL,
  priority     ENUM('URGENT','NORMAL','LOW') NOT NULL,
  sla_hours    SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (sla_rule_id),
  UNIQUE KEY uq_sla_category_priority (category_id, priority),
  CONSTRAINT fk_sla_category
    FOREIGN KEY (category_id) REFERENCES issue_category (category_id)
) ENGINE=InnoDB;

-- 5. Phiếu bảo hành (US2-US6)
CREATE TABLE IF NOT EXISTS warranty_request (
  request_id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  customer_id         BIGINT UNSIGNED   NOT NULL,
  device_id           BIGINT UNSIGNED   NOT NULL,
  issue_desc          TEXT              NOT NULL,
  category_id         SMALLINT UNSIGNED NULL,
  priority            ENUM('URGENT','NORMAL','LOW') NULL,
  status              ENUM('NEW','CLASSIFIED','RECEIVED') NOT NULL DEFAULT 'NEW',
  received_at         DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  committed_deadline  DATETIME          NULL,
  PRIMARY KEY (request_id),
  -- Thêm ở BT2 (TD-04): danh sách phiếu lọc theo status, sắp theo received_at (FR7)
  KEY idx_request_status_received (status, received_at),
  CONSTRAINT fk_request_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id),
  CONSTRAINT fk_request_device   FOREIGN KEY (device_id)   REFERENCES device (device_id),
  CONSTRAINT fk_request_category FOREIGN KEY (category_id) REFERENCES issue_category (category_id)
) ENGINE=InnoDB;

-- 6. Lịch sử trạng thái phiếu (US7)
CREATE TABLE IF NOT EXISTS request_status_log (
  log_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id  BIGINT UNSIGNED NOT NULL,
  to_status   ENUM('NEW','CLASSIFIED','RECEIVED') NOT NULL,
  changed_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  -- Thêm ở BT2 (TD-04): đọc lịch sử của một phiếu theo thứ tự thời gian
  KEY idx_log_request_changed (request_id, changed_at),
  CONSTRAINT fk_log_request FOREIGN KEY (request_id) REFERENCES warranty_request (request_id)
) ENGINE=InnoDB;
