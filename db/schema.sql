-- =====================================================================
-- schema.sql – Tiếp nhận và phân loại yêu cầu bảo hành (luồng L2, track SE)
-- CSDL: MySQL / MariaDB. Thuật ngữ: "phiếu bảo hành" = warranty_request
-- =====================================================================

CREATE DATABASE IF NOT EXISTS warranty_intake
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE warranty_intake;

-- 1. Khách hàng (US1) ------------------------------------------------
CREATE TABLE customer (
  customer_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone        CHAR(10)        NOT NULL,
  full_name    VARCHAR(100)    NOT NULL,
  email        VARCHAR(100)    NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id),
  -- NFR1: tra cứu theo số điện thoại <= 2 giây với <= 10.000 khách hàng
  UNIQUE KEY uq_customer_phone (phone)
) ENGINE=InnoDB;

-- 2. Thiết bị (US2) --------------------------------------------------
CREATE TABLE device (
  device_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  serial_no      VARCHAR(50)     NOT NULL,
  model_name     VARCHAR(100)    NOT NULL,
  purchase_date  DATE            NULL,
  PRIMARY KEY (device_id),
  UNIQUE KEY uq_device_serial (serial_no)
) ENGINE=InnoDB;

-- 3. Nhóm sự cố (US4) – danh mục nằm trong CSDL, không viết cứng trong mã (NFR5)
CREATE TABLE issue_category (
  category_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(30)       NOT NULL,  -- HARDWARE, SOFTWARE, WEAR_AND_TEAR
  name         VARCHAR(100)      NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_issue_category_code (code)
) ENGINE=InnoDB;

-- 4. Quy tắc SLA (US6) – số giờ cam kết theo (nhóm sự cố, mức ưu tiên) ---
CREATE TABLE sla_rule (
  sla_rule_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id  SMALLINT UNSIGNED NOT NULL,
  priority     ENUM('URGENT','NORMAL','LOW') NOT NULL,
  sla_hours    SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (sla_rule_id),
  -- NFR2: mỗi tổ hợp chỉ có một quy tắc, tra cứu để sinh hạn tự động
  UNIQUE KEY uq_sla_category_priority (category_id, priority),
  CONSTRAINT fk_sla_category
    FOREIGN KEY (category_id) REFERENCES issue_category (category_id)
) ENGINE=InnoDB;

-- 5. Phiếu bảo hành (US2–US6) ----------------------------------------
CREATE TABLE warranty_request (
  request_id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  customer_id         BIGINT UNSIGNED   NOT NULL,
  device_id           BIGINT UNSIGNED   NOT NULL,
  issue_desc          TEXT              NOT NULL,
  category_id         SMALLINT UNSIGNED NULL,      -- gán ở bước phân loại
  priority            ENUM('URGENT','NORMAL','LOW') NULL,
  status              ENUM('NEW','CLASSIFIED','RECEIVED') NOT NULL DEFAULT 'NEW',
  received_at         DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  committed_deadline  DATETIME          NULL,      -- hạn cam kết xử lý (US6)
  PRIMARY KEY (request_id),
  CONSTRAINT fk_request_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id),
  CONSTRAINT fk_request_device   FOREIGN KEY (device_id)   REFERENCES device (device_id),
  CONSTRAINT fk_request_category FOREIGN KEY (category_id) REFERENCES issue_category (category_id)
) ENGINE=InnoDB;

-- 6. Lịch sử trạng thái phiếu (US7 – xem trạng thái) -----------------
CREATE TABLE request_status_log (
  log_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id  BIGINT UNSIGNED NOT NULL,
  to_status   ENUM('NEW','CLASSIFIED','RECEIVED') NOT NULL,
  changed_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  CONSTRAINT fk_log_request FOREIGN KEY (request_id) REFERENCES warranty_request (request_id)
) ENGINE=InnoDB;

-- Dữ liệu mẫu tối thiểu cho quy tắc SLA ------------------------------
INSERT INTO issue_category (code, name) VALUES
  ('HARDWARE', 'Lỗi phần cứng'),
  ('SOFTWARE', 'Lỗi phần mềm'),
  ('WEAR_AND_TEAR', 'Hao mòn tự nhiên');

INSERT INTO sla_rule (category_id, priority, sla_hours) VALUES
  (1, 'URGENT', 24), (1, 'NORMAL', 72), (1, 'LOW', 120),
  (2, 'URGENT', 12), (2, 'NORMAL', 48), (2, 'LOW', 96),
  (3, 'URGENT', 48), (3, 'NORMAL', 96), (3, 'LOW', 168);
