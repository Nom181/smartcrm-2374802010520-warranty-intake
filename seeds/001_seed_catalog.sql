-- =====================================================================
-- 001_seed_catalog.sql - Danh mục bắt buộc để nghiệp vụ chạy được
-- (3 nhóm sự cố + 9 quy tắc SLA theo SRS mục 5). Chạy lại không nhân đôi:
-- khoá chính cố định + INSERT IGNORE.
-- Thêm nhóm sự cố mới (NFR5) chỉ cần thêm MỘT dòng vào issue_category
-- và các dòng SLA tương ứng; không sửa dòng mã nào.
-- =====================================================================
INSERT IGNORE INTO issue_category (category_id, code, name) VALUES
  (1, 'HARDWARE',      'Lỗi phần cứng'),
  (2, 'SOFTWARE',      'Lỗi phần mềm'),
  (3, 'WEAR_AND_TEAR', 'Hao mòn tự nhiên');

INSERT IGNORE INTO sla_rule (sla_rule_id, category_id, priority, sla_hours) VALUES
  (1, 1, 'URGENT', 24), (2, 1, 'NORMAL', 72), (3, 1, 'LOW', 120),
  (4, 2, 'URGENT', 12), (5, 2, 'NORMAL', 48), (6, 2, 'LOW', 96),
  (7, 3, 'URGENT', 48), (8, 3, 'NORMAL', 96), (9, 3, 'LOW', 168);
