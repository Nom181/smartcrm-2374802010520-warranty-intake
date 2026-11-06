# Test Report — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)

Sinh viên: Võ Minh Triều · MSSV 2374802010520 · Ngày chạy: 06/11/2026 · Máy: Windows, Node v24.13.0, MariaDB (XAMPP)

> Quy ước: cột **Kết quả thực tế** ghi bằng lời cụ thể những gì QUAN SÁT được khi chạy (mã trạng thái, thông báo, số bản ghi trước/sau).
> **PASS** chỉ khi khớp hoàn toàn với Kết quả mong đợi; khác ở bất kỳ điểm nào là **FAIL** (kèm mã BUG-xx trong `docs/bug-log.md`).
> Ảnh chụp mỗi test: `docs/screenshots/TC-xx.png`.

## Bảng tổng hợp

| Mã | Loại | Tầng | Ưu tiên | PASS/FAIL | Ảnh |
|---|---|---|---|---|---|
| TC-01 | Luồng đúng | API | Cao | PASS | docs/screenshots/TC-01.png |
| TC-02 | Luồng đúng | Integration | Cao | PASS | docs/screenshots/TC-02.png |
| TC-03 | Luồng đúng | Unit | Cao | PASS | docs/screenshots/TC-03.png |
| TC-04 | Luồng đúng | API | Trung bình | PASS | docs/screenshots/TC-04.png |
| TC-05 | Giá trị biên | Unit | Cao | PASS | docs/screenshots/TC-05.png |
| TC-06 | Giá trị biên | Unit | Cao | PASS | docs/screenshots/TC-06.png |
| TC-07 | Dữ liệu sai | API | Cao | PASS | docs/screenshots/TC-07.png |
| TC-08 | Dữ liệu sai | Unit | Trung bình | PASS | docs/screenshots/TC-08.png |
| TC-09 | Bảo mật | API | Cao | PASS | docs/screenshots/TC-09.png |
| TC-10 | Dữ liệu sai | Unit | Cao | PASS | docs/screenshots/TC-10.png |
| TC-11 | Chất lượng dữ liệu | Unit | Cao | PASS | docs/screenshots/TC-11.png |
| TC-12 | Tái lập | Integration | Cao | PASS | docs/screenshots/TC-12.png |

## Chi tiết từng test case (đủ 8 cột)

### TC-01 — Tạo phiếu hợp lệ (QT2, FR3)
- **1. Mã:** TC-01
- **2. Tiền điều kiện:** MariaDB bật; đã `npm run db:setup`; API chạy (`npm start`); tài khoản `staff01`.
- **3. Các bước:** (1) Đăng nhập `staff01`. (2) Lấy khách và thiết bị đầu tiên. (3) `POST /requests` với dữ liệu bên dưới. (4) Đọc tổng số phiếu trước và sau.
- **4. Dữ liệu thử:** `customerId = 29`, `deviceId = 29` (dòng đầu tiên theo API); `issueDesc = "TC-01: máy không lên nguồn"`.
- **5. Kết quả mong đợi:** HTTP 201; `status = NEW`; tổng số phiếu tăng đúng 1.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** `node tests/manual/run-tc.js TC-01`: HTTP 201; phiếu mới `requestId = 31`, `status = NEW`, `committedDeadline = null`, lịch sử có dòng NEW. Tổng số phiếu trước/sau: 30 → 31. Script báo KHỚP.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-01.png`

### TC-02 — Luồng đầy đủ trên CSDL thật, kèm lịch sử trạng thái (QT3, QT4, QT5)
- **1. Mã:** TC-02
- **2. Tiền điều kiện:** MariaDB bật. Test tự dựng CSDL riêng `warranty_intake_test` từ trạng thái trống.
- **3. Các bước:** (1) `npm run test:integration`. (2) Tìm dòng `TC-02` trong kết quả.
- **4. Dữ liệu thử:** khách `0907070707`, thiết bị `SN-INTEG-01`, nhóm HARDWARE (`categoryId = 1`), ưu tiên URGENT.
- **5. Kết quả mong đợi:** `status = RECEIVED`; hạn cam kết − thời điểm tiếp nhận = 24 giờ (HARDWARE/URGENT); lịch sử gồm NEW, CLASSIFIED, RECEIVED theo thứ tự.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** `npm run test:integration`: dòng ✔ TC-02 (106 ms). Các khẳng định về `status = RECEIVED`, chênh lệch 24 giờ và lịch sử NEW → CLASSIFIED → RECEIVED đều đạt. Tổng 5 test, pass 5, fail 0.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-02.png`

### TC-03 — Hạn cam kết SOFTWARE + URGENT (QT4)
- **1. Mã:** TC-03
- **2. Tiền điều kiện:** không cần CSDL; đồng hồ giả cố định 2026-10-20T03:00:00Z.
- **3. Các bước:** `node --test --test-reporter=spec --test-name-pattern="TC-03" tests/05-test-report.test.js`
- **4. Dữ liệu thử:** nhóm SOFTWARE (`categoryId = 2`), ưu tiên URGENT, SLA 12 giờ.
- **5. Kết quả mong đợi:** hạn cam kết = `2026-10-20T15:00:00.000Z` (tính tay: 03:00 + 12 giờ); `status = RECEIVED`.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** dòng ✔ TC-03; pass 1, fail 0. Hạn cam kết của phiếu SOFTWARE + URGENT bằng đúng `2026-10-20T15:00:00.000Z` và `status = RECEIVED`.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-03.png`

### TC-04 — Tra cứu khách theo số điện thoại (QT1, FR1)
- **1. Mã:** TC-04
- **2. Tiền điều kiện:** như TC-01.
- **3. Các bước:** `node tests/manual/run-tc.js TC-04`
- **4. Dữ liệu thử:** số điện thoại `0913827234` (khách đầu tiên theo API).
- **5. Kết quả mong đợi:** HTTP 200; trả đúng khách có số điện thoại đó.
- **6. Ưu tiên:** Trung bình
- **7. Kết quả thực tế:** `GET /customers/lookup?phone=0913827234` → HTTP 200; trả khách `customerId = 29`, `fullName = "Võ Trọng Khiêm"`, `phone = 0913827234`, `email = null`. Script báo KHỚP.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-04.png`

### TC-05 — Biên độ dài mô tả lỗi: đúng 1000 ký tự (QT9)
- **1. Mã:** TC-05
- **2. Tiền điều kiện:** không cần CSDL.
- **3. Các bước:** `node --test --test-reporter=spec --test-name-pattern="TC-05" tests/05-test-report.test.js`
- **4. Dữ liệu thử:** `issueDesc` gồm 1000 chữ `a`.
- **5. Kết quả mong đợi:** hợp lệ, không báo lỗi.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** dòng ✔ TC-05; pass 1, fail 0. Mô tả 1000 ký tự được chấp nhận, độ dài trả về là 1000.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-05.png`

### TC-06 — Biên độ dài mô tả lỗi: 1001 ký tự (QT9)
- **1. Mã:** TC-06
- **2. Tiền điều kiện:** không cần CSDL (cùng ranh giới với TC-05).
- **3. Các bước:** `node --test --test-reporter=spec --test-name-pattern="TC-06" tests/05-test-report.test.js`
- **4. Dữ liệu thử:** `issueDesc` gồm 1001 chữ `a`.
- **5. Kết quả mong đợi:** bị từ chối với mã `DU_LIEU_KHONG_HOP_LE`, chi tiết nêu trường `issueDesc`.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** dòng ✔ TC-06; pass 1, fail 0. Mô tả 1001 ký tự bị từ chối với mã `DU_LIEU_KHONG_HOP_LE`, chi tiết có trường `issueDesc`.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-06.png`

### TC-07 — Số điện thoại 9 chữ số (QT1)
- **1. Mã:** TC-07
- **2. Tiền điều kiện:** API chạy; đăng nhập `staff01`.
- **3. Các bước:** `node tests/manual/run-tc.js TC-07`
- **4. Dữ liệu thử:** `GET /customers/lookup?phone=091234567` (chỉ 9 chữ số).
- **5. Kết quả mong đợi:** HTTP 400; `error = DU_LIEU_KHONG_HOP_LE`; nêu đúng trường `phone`.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** HTTP 400; `error = "DU_LIEU_KHONG_HOP_LE"`; `message` nêu lỗi ở trường `phone`; `chi_tiet` và `fields` đều có `phone: "số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0"`. Script báo KHỚP.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-07.png`

### TC-08 — Mã phiếu không tồn tại
- **1. Mã:** TC-08
- **2. Tiền điều kiện:** không cần CSDL.
- **3. Các bước:** `node --test --test-reporter=spec --test-name-pattern="TC-08" tests/05-test-report.test.js`
- **4. Dữ liệu thử:** mã phiếu `999999`.
- **5. Kết quả mong đợi:** báo `PHIEU_KHONG_TON_TAI`, bảng lỗi dịch thành HTTP 404 (không phải 500).
- **6. Ưu tiên:** Trung bình
- **7. Kết quả thực tế:** dòng ✔ TC-08; pass 1, fail 0. Tra phiếu `999999` báo `PHIEU_KHONG_TON_TAI`; bảng lỗi ánh xạ mã này sang HTTP 404.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-08.png`

### TC-09 — Quản lý không được tạo phiếu (SRS mục 2)
- **1. Mã:** TC-09
- **2. Tiền điều kiện:** API chạy; có tài khoản `manager01` (MANAGER).
- **3. Các bước:** `node tests/manual/run-tc.js TC-09`
- **4. Dữ liệu thử:** `POST /requests` bằng token của `manager01`, `customerId = 29`, `deviceId = 29`, `issueDesc = "TC-09: quản lý thử tạo phiếu"`.
- **5. Kết quả mong đợi:** HTTP 403; `error = KHONG_DU_QUYEN`; tổng số phiếu KHÔNG đổi.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** HTTP 403; `error = "KHONG_DU_QUYEN"`, `message = "Tài khoản của bạn không được phép thực hiện thao tác này."`. Tổng số phiếu trước/sau: 31 → 31 (không có bản ghi mới). Script báo KHỚP.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-09.png`

### TC-10 — Sinh hạn khi chưa phân loại (QT3)
- **1. Mã:** TC-10
- **2. Tiền điều kiện:** không cần CSDL; có một phiếu ở trạng thái NEW, chưa có nhóm sự cố và mức ưu tiên.
- **3. Các bước:** `node --test --test-reporter=spec --test-name-pattern="TC-10" tests/05-test-report.test.js`
- **4. Dữ liệu thử:** gọi sinh hạn cho phiếu NEW.
- **5. Kết quả mong đợi:** bị từ chối `THIEU_THONG_TIN_PHAN_LOAI` (dịch thành HTTP 422), nêu đủ hai trường thiếu `categoryId` và `priority`; phiếu vẫn ở NEW.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** dòng ✔ TC-10; pass 1, fail 0. Sinh hạn bị từ chối với `THIEU_THONG_TIN_PHAN_LOAI`, nêu đủ `categoryId` và `priority`; bảng lỗi ánh xạ sang 422; phiếu vẫn ở trạng thái NEW.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-10.png`

### TC-11 — Phiếu đã RECEIVED không sửa được (khoá phiếu đã chốt)
- **1. Mã:** TC-11
- **2. Tiền điều kiện:** không cần CSDL; phiếu đã đi hết NEW → CLASSIFIED → RECEIVED, mô tả gốc "Mô tả gốc".
- **3. Các bước:** `node --test --test-reporter=spec --test-name-pattern="TC-11" tests/05-test-report.test.js`
- **4. Dữ liệu thử:** sửa mô tả thành "Sửa trộm".
- **5. Kết quả mong đợi:** bị từ chối `PHIEU_DA_TIEP_NHAN`; mô tả vẫn là "Mô tả gốc".
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** dòng ✔ TC-11; pass 1, fail 0. Sửa mô tả phiếu RECEIVED bị từ chối với `PHIEU_DA_TIEP_NHAN`; mô tả vẫn là "Mô tả gốc".
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-11.png`

### TC-12 — Tái lập: migration và seed chạy hai lần
- **1. Mã:** TC-12
- **2. Tiền điều kiện:** MariaDB bật; CSDL `warranty_intake_test` bị xoá và dựng lại từ trống.
- **3. Các bước:** `npm run test:integration`; tìm hai dòng `TC-12a` và `TC-12b`.
- **4. Dữ liệu thử:** chạy `migrate` hai lần, rồi `seed` hai lần.
- **5. Kết quả mong đợi:** cả hai lần đều thành công; số dòng mọi bảng sau lần seed thứ hai bằng lần thứ nhất; `sla_rule` = 9 dòng.
- **6. Ưu tiên:** Cao
- **7. Kết quả thực tế:** ✔ TC-12a (921 ms): migrate từ CSDL trống thành công, chạy lại lần hai không lỗi. ✔ TC-12b (644 ms): seed chạy hai lần, số dòng mọi bảng không đổi, `sla_rule` = 9. Tổng 5 test, pass 5, fail 0.
- **8. PASS/FAIL:** PASS — `docs/screenshots/TC-12.png`

## Kết luận
- Tổng: 12 PASS · 0 FAIL.
- Bug phát hiện trong 12 test case này: chưa có. Các bug đã gặp và sửa trong quá trình phát triển được ghi ở `docs/bug-log.md`.
