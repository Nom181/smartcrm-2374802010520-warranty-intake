# Test Plan rút gọn — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)

Sinh viên: Võ Minh Triều · MSSV 2374802010520 · Phiên bản: v1.0 (BT3)

## 1. Phạm vi

**Kiểm:**
- Tạo phiếu bảo hành (QT2: mô tả lỗi không rỗng; QT9: tối đa 1000 ký tự).
- Phân loại phiếu NEW → CLASSIFIED → RECEIVED và ghi lịch sử trạng thái (QT5).
- Sinh hạn cam kết theo bảng `sla_rule` (QT4) và điều kiện đủ nhóm sự cố + mức ưu tiên (QT3).
- Kiểm tra dữ liệu vào: số điện thoại 10 chữ số (QT1), mã không tồn tại, thiếu trường.
- Phân quyền: STAFF được tạo/sửa, MANAGER chỉ xem (SRS mục 2).
- Phiếu đã RECEIVED không sửa được (khoá lạc quan trong `applyChange`).
- Tính tái lập: chạy migration và seed hai lần không lỗi, không nhân đôi dữ liệu.

**CỐ Ý KHÔNG kiểm:**
- Hiệu năng và tải (thuộc Chuyên đề tốt nghiệp 2).
- Giao diện React bằng test tự động: giao diện chỉ được kiểm bằng mắt và ảnh chụp ở Buổi 10, chưa có test tự động.
- Kiểm thử chấp nhận với người dùng thật (thuộc Chuyên đề tốt nghiệp 2).
- Bảo mật nâng cao (giới hạn tần suất, làm mới token): token đang lưu ở localStorage, giới hạn này đã ghi trong README mục 7.

## 2. Loại test và số lượng

Bộ test tự động hiện có: 56 test chạy bằng `npm test` (gồm 6 test mang mã TC trong `tests/05-test-report.test.js`) và 5 test tích hợp chạy bằng `npm run test:integration`.
Test Report của BT3 gồm **12 test case**, mỗi case có kết quả thực tế và ảnh chụp:

| Tầng | Số lượng | Test case | Cách chạy |
|---|---|---|---|
| Unit (service thật + repository giả, đồng hồ giả) | 6 | TC-03, TC-05, TC-06, TC-08, TC-10, TC-11 | `node --test --test-name-pattern="TC-xx" tests/05-test-report.test.js` |
| Integration (service + repository + MariaDB thật) | 2 | TC-02, TC-12 | `npm run test:integration` |
| API (HTTP vào hệ thống đang chạy, MariaDB thật) | 4 | TC-01, TC-04, TC-07, TC-09 | `node tests/manual/run-tc.js TC-xx` |

Phân bổ theo năm loại BT3: luồng đúng ×4 (TC-01..04) · giá trị biên ×2 (TC-05, TC-06) · dữ liệu sai ×3 (TC-07, TC-08, TC-10) · bảo mật / chất lượng dữ liệu ×2 (TC-09, TC-11) · tái lập ×1 (TC-12).

**Kỹ thuật chọn dữ liệu thử:**
- Giá trị biên: độ dài mô tả lỗi 1000 (hợp lệ) và 1001 (bị từ chối), hai bên cùng một ranh giới của QT9.
- Phân vùng tương đương: số điện thoại (đủ 10 chữ số / thiếu / chứa chữ), mã phiếu (tồn tại / không tồn tại).

## 3. Tiêu chí thành công (đặt trước khi chạy)

- 12/12 test case có kết quả thực tế ghi cụ thể (mã trạng thái, thông báo, đếm bản ghi trước/sau) và có ảnh chụp trong `docs/screenshots/`.
- Mỗi quy tắc nghiệp vụ đã hiện thực (QT1–QT5, QT9) có ít nhất 1 test.
- `npm test` chạy PASS bằng một lệnh, kể cả sau khi sửa bug.
- Không còn bug Critical đang mở; bug Major còn lại (nếu có) ghi rõ lý do và hướng xử lý trong `docs/bug-log.md`.
- Mỗi bug đã sửa có một commit riêng và link commit mở được.

## 4. Môi trường và dữ liệu thử

- Môi trường: Node 20+ trên Windows; MariaDB (XAMPP); sau khi đóng gói: `docker compose up` (xem Deployment Guide).
- Unit/API: repository giả và đồng hồ giả cố định (`tests/helpers/world.js`, `tests/helpers/fakes.js`), không phụ thuộc DB và ngày chạy.
- Integration: CSDL riêng `warranty_intake_test`, dựng bằng migration `001_init_schema.sql` và seed.
- Dữ liệu mẫu: `seeds/002_seed_demo.sql` (28 khách, 28 thiết bị, 28 phiếu); tài khoản `staff01` (STAFF), `manager01` (MANAGER).
- Dựng lại trước mỗi lần chạy tích hợp: `npm run db:setup` (idempotent: `IF NOT EXISTS`, `INSERT IGNORE`).
- Lệnh chạy: `npm test` và `npm run test:integration` ở thư mục gốc.
