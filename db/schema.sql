-- =====================================================================
-- schema.sql - Tiep nhan va phan loai yeu cau bao hanh (luong L2, track SE)
-- CSDL: MySQL / MariaDB (XAMPP). Thuat ngu: "phieu bao hanh" = warranty_request
-- =====================================================================

CREATE DATABASE IF NOT EXISTS warranty_intake
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE warranty_intake;

-- 1. Khach hang (US1) ------------------------------------------
CREATE TABLE customer (
  customer_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone        CHAR(10)        NOT NULL,
  full_name    VARCHAR(100)    NOT NULL,
  email        VARCHAR(100)    NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id),
  -- NFR1: tra cuu theo so dien thoai <= 2 giay voi <= 10.000 khach hang
  UNIQUE KEY uq_customer_phone (phone)
) ENGINE=InnoDB;

-- 2. Thiet bi (US2) -------------------------------------------------
CREATE TABLE device (
  device_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  serial_no      VARCHAR(50)     NOT NULL,
  model_name     VARCHAR(100)    NOT NULL,
  purchase_date  DATE            NULL,
  PRIMARY KEY (device_id),
  UNIQUE KEY uq_device_serial (serial_no)
) ENGINE=InnoDB;

-- 3. Nhom su co (US4) - danh muc nam trong CSDL, khong viet cung trong ma
CREATE TABLE issue_category (
  category_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(30)       NOT NULL,   -- HARDWARE, SOFTWARE, WEAR_AND_TEAR
  name         VARCHAR(100)      NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_issue_category_code (code)
) ENGINE=InnoDB;

-- 4. Quy tac SLA (US6) - gio cam ket theo (nhom su co, muc uu tien) ---
CREATE TABLE sla_rule (
  sla_rule_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id  SMALLINT UNSIGNED NOT NULL,
  priority     ENUM('URGENT','NORMAL','LOW') NOT NULL,
  sla_hours    SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (sla_rule_id),
  -- NFR2: tra quy tac SLA va sinh han cam ket tu dong, moi to hop chi co 1 quy tac
  UNIQUE KEY uq_sla_category_priority (category_id, priority),
  CONSTRAINT fk_sla_category
    FOREIGN KEY (category_id) REFERENCES issue_category (category_id)
) ENGINE=InnoDB;

-- 5. Phieu bao hanh (US2-US6) ----------------------------------------
CREATE TABLE warranty_request (
  request_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id         BIGINT UNSIGNED NOT NULL,
  device_id           BIGINT UNSIGNED NOT NULL,
  issue_desc          TEXT            NOT NULL,
  category_id         SMALLINT UNSIGNED NULL,      -- gan o buoc phan loai
  priority            ENUM('URGENT','NORMAL','LOW') NULL,
  status              ENUM('NEW','CLASSIFIED','RECEIVED') NOT NULL DEFAULT 'NEW',
  received_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  committed_deadline  DATETIME        NULL,        -- han cam ket xu ly (US6)
  PRIMARY KEY (request_id),
  CONSTRAINT fk_request_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id),
  CONSTRAINT fk_request_device   FOREIGN KEY (device_id)   REFERENCES device (device_id),
  CONSTRAINT fk_request_category  FOREIGN KEY (category_id) REFERENCES issue_category (category_id)
) ENGINE=InnoDB;

-- 6. Lich su trang thai phieu (US7 - xem trang thai) -----------------
CREATE TABLE request_status_log (
  log_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id  BIGINT UNSIGNED NOT NULL,
  to_status   ENUM('NEW','CLASSIFIED','RECEIVED') NOT NULL,
  changed_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  CONSTRAINT fk_log_request FOREIGN KEY (request_id) REFERENCES warranty_request (request_id)
) ENGINE=InnoDB;

-- Du lieu mau toi thieu de thu quy tac SLA ----------------------------
INSERT INTO issue_category (code, name) VALUES
  ('HARDWARE', 'Loi phan cung'),
  ('SOFTWARE', 'Loi phan mem'),
  ('WEAR_AND_TEAR', 'Hao mon tu nhien');

INSERT INTO sla_rule (category_id, priority, sla_hours) VALUES
  (1, 'URGENT', 24), (1, 'NORMAL', 72), (1, 'LOW', 120),
  (2, 'URGENT', 12), (2, 'NORMAL', 48), (2, 'LOW', 96),
  (3, 'URGENT', 48), (3, 'NORMAL', 96), (3, 'LOW', 168);
