# Bug Log – Bài tập 2

Ba lỗi đã gỡ trong Giai đoạn 2, mỗi mục đủ bảy dòng theo mẫu của Buổi 11. Dòng 5 là NGUYÊN NHÂN, không phải triệu chứng.

## BUG-001 · Major – Tắt máy chủ API, giao diện báo "phản hồi không hợp lệ"

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-001 · Major (người dùng không biết phải làm gì khi máy chủ không chạy) |
| 2. Phát hiện bởi | Phép thử suy giảm có kiểm soát: tắt máy chủ API rồi mở trang danh sách phiếu |
| 3. Triệu chứng | Trang hiện "Máy chủ trả về phản hồi không hợp lệ.", không nói nguyên nhân và không có hướng xử lý |
| 4. Cách tái lập | Tắt `npm start`, mở `http://localhost:5173/requests` (giao diện vẫn chạy bằng `npm run start:web`) |
| 5. Nguyên nhân | Khi API tắt, máy chủ phát triển của Vite trả mã 5xx với thân KHÔNG phải JSON; `client.js` chỉ nhận lỗi có trường `error` nên rơi vào nhánh "phản hồi không hợp lệ" |
| 6. Cách sửa | `src/frontend/src/api/client.js`: nếu mã ≥ 500 và thân không có `error` thì ném `MAY_CHU_KHONG_PHAN_HOI` kèm thông báo tiếng Việt "Máy chủ API không phản hồi. Hãy kiểm tra máy chủ đã chạy chưa rồi thử lại." |
| 7. Commit và xác nhận | https://github.com/Nom181/smartcrm-2374802010520-warranty-intake/commit/58a4e80 · chạy lại phép thử: trang hiện đúng thông báo trên kèm nút Thử lại, bật API lại thì dữ liệu hiện lại (ảnh `docs/anh/10-trang-thai-loi-api-tat.png`, `11-thu-lai-thanh-cong.png`) |

## BUG-002 · Minor – Bảng danh sách tràn ngang ở khung 375 px

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-002 · Minor |
| 2. Phát hiện bởi | Checklist tự kiểm Buổi 9 (mục "thử khung hẹp khoảng 375 px, bảng không bị tràn ngang") |
| 3. Triệu chứng | Trên khung 375 px, cả trang phải kéo ngang mới thấy hết bảng phiếu |
| 4. Cách tái lập | Mở `/requests` ở khung rộng 375 px; đo `document.documentElement.scrollWidth` |
| 5. Nguyên nhân | Bảng 7 cột có độ rộng tối thiểu lớn hơn khung và nằm thẳng trong trang, không có khung cuộn riêng; kích thước trang bị bảng kéo giãn lên 528 px |
| 6. Cách sửa | Bọc bảng trong `<div className="table-wrap">` có `overflow-x: auto` (`RequestListPage.jsx`, `styles.css`) để bảng cuộn trong khung của nó |
| 7. Commit và xác nhận | https://github.com/Nom181/smartcrm-2374802010520-warranty-intake/commit/a2f4ac0 · đo lại: `scrollWidth` = 375 ở 4 màn hình (danh sách, tạo phiếu, hai trang chi tiết); ảnh `docs/anh/13-khung-hep-375px.png` |

## BUG-003 · Minor – Migration dùng `DELIMITER` không chạy với `mysql2`

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-003 · Minor (chặn lệnh `npm run migrate` trên máy sạch) |
| 2. Phát hiện bởi | Chạy thử `npm run migrate` trong lúc phát triển, khi thêm chỉ mục cho bảng |
| 3. Triệu chứng | `npm run migrate` báo lỗi cú pháp SQL ở tệp tạo chỉ mục |
| 4. Cách tái lập | Chạy `npm run migrate` với tệp migration có dòng `DELIMITER //` |
| 5. Nguyên nhân | `DELIMITER` là lệnh của chương trình dòng lệnh `mysql`, không phải câu SQL; thư viện `mysql2` gửi nguyên văn lên máy chủ nên máy chủ không hiểu |
| 6. Cách sửa | Bỏ `DELIMITER`; khai báo chỉ mục ngay trong `CREATE TABLE` của `migrations/001_init_schema.sql` (vẫn `IF NOT EXISTS`, chạy lại không lỗi) |
| 7. Commit và xác nhận | https://github.com/Nom181/smartcrm-2374802010520-warranty-intake/commit/58a4e80 · `npm run migrate` chạy hai lần không lỗi; `tests/integration/01-migration-seed-repo.test.js` (migration hai lần, seed hai lần không nhân đôi) PASS |


## BUG-004 · Minor – Giới hạn 1000 ký tự của mô tả lỗi đếm emoji là 2 ký tự

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-004 · Minor (dữ liệu không sai, người dùng có cách khác là rút ngắn nội dung) |
| 2. Phát hiện bởi | Rà soát mã nguồn khi chuẩn bị BT3, rồi tái hiện bằng test tự động ở biên QT9 |
| 3. Triệu chứng | Mô tả lỗi 501 emoji (501 ký tự, còn xa mức 1000) bị từ chối với thông báo "tối đa 1000 ký tự"; 1000 emoji cũng bị từ chối. Trên giao diện, ô nhập dừng ở 500 emoji |
| 4. Cách tái lập | `node --test tests/06-bug-issue-desc-emoji.test.js` trước khi sửa: test "1000 emoji là HỢP LỆ" FAIL (ảnh `docs/screenshots/BUG-004-before.png`) |
| 5. Nguyên nhân | Validator và giao diện đo độ dài bằng `String.length`, tính theo đơn vị UTF-16; một emoji gồm 2 đơn vị nên bị tính là 2 ký tự, trong khi QT9 nói "tối đa 1000 ký tự" |
| 6. Cách sửa | `validators/common.js`: thêm `charLength()` đếm theo code point (`[...str].length`), dùng trong `requiredString` và `optionalString`; `NewRequestPage.jsx`: bỏ `maxLength`, cắt và đếm theo code point; thêm test hồi quy `tests/06-bug-issue-desc-emoji.test.js` |
| 7. Commit và xác nhận | https://github.com/Nom181/smartcrm-2374802010520-warranty-intake/commit/aa76a6707f2e272120fcddcbef6884a0b573ac39 · sau khi sửa 2/2 test mới PASS và toàn bộ `npm test` đạt 58/58 (ảnh `docs/screenshots/BUG-004-after.png`) |


## BUG-005 · Minor – Mô tả lỗi dài không có dấu cách tràn ra ngoài khung ở trang chi tiết

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-005 · Minor (dữ liệu đúng, chỉ trình bày sai; đọc được bằng cách cuộn ngang) |
| 2. Phát hiện bởi | Kiểm thử khám phá bằng tay trên giao diện Docker (http://localhost:8080): tạo phiếu với mô tả 900 chữ `a` liền nhau |
| 3. Triệu chứng | Ở trang chi tiết phiếu, chuỗi dài đi xuyên qua mép phải của khung trắng và làm trang rộng ra ngoài màn hình (ảnh `docs/screenshots/BUG-005-before.png`) |
| 4. Cách tái lập | Đăng nhập `staff01`, tạo phiếu với mô tả là 900 chữ `a` không có dấu cách (dán bằng Ctrl+V), mở trang chi tiết của phiếu đó |
| 5. Nguyên nhân | Trang chi tiết dùng lưới `.facts` có cột phải là `1fr`, mà cột lưới mặc định không co nhỏ hơn độ rộng nội dung; `.pre { white-space: pre-wrap }` chỉ xuống dòng ở dấu cách nên một "từ" dài 900 ký tự kéo cột và cả trang rộng ra |
| 6. Cách sửa | `src/frontend/src/styles.css`: thêm `min-width: 0` và `overflow-wrap: anywhere` cho `.facts dd` để cột được phép co lại và chuỗi dài tự xuống dòng |
| 7. Commit và xác nhận | https://github.com/Nom181/smartcrm-2374802010520-warranty-intake/commit/1aba0de · dựng lại `docker compose up -d --build web`, mở lại cùng phiếu: chuỗi xuống dòng gọn trong khung (ảnh `docs/screenshots/BUG-005-after.png`) |


## BUG-006 · Major – `page` quá lớn làm các danh sách trả HTTP 500

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-006 · Major (đầu vào sai của người gọi gây lỗi máy chủ 500 ở cả ba danh sách; dùng bình thường vẫn được nên chưa phải Critical) |
| 2. Phát hiện bởi | Rà soát mã nguồn thấy `page` không có giới hạn trên, rồi kiểm chứng trên hệ thống Docker chạy CSDL MariaDB thật |
| 3. Triệu chứng | `GET /api/requests?page=99999999999999999999` trả `HTTP/1.1 500` với `{"error":"LOI_HE_THONG"}`; cùng danh sách với `page=100000` trả 200 và danh sách rỗng (ảnh `docs/screenshots/BUG-006-before.png`, `BUG-006-reference-200.png`) |
| 4. Cách tái lập | Đăng nhập `staff01` lấy token, gọi `GET /api/requests?page=99999999999999999999` kèm `Authorization: Bearer <token>`; lỗi tương tự ở `/customers` và `/devices` vì cùng dùng `parsePaging` |
| 5. Nguyên nhân | `parsePaging` chỉ kiểm tra `page` là số nguyên ≥ 1, không có giới hạn trên; `(page − 1) × pageSize` thành `2e+21`, câu SQL thành `LIMIT 20 OFFSET 2e+21` mà MariaDB không chấp nhận, nên lỗi rơi vào nhánh "lỗi không lường trước" (500) |
| 6. Cách sửa | `src/backend/validators/common.js`: thêm hằng `MAX_PAGE = 1000000`; `page` ngoài `[1, MAX_PAGE]` bị từ chối bằng `400 DU_LIEU_KHONG_HOP_LE` nêu đúng trường `page`; thêm test hồi quy `tests/07-bug-paging-overflow.test.js` |
| 7. Commit và xác nhận | https://github.com/Nom181/smartcrm-2374802010520-warranty-intake/commit/020c02a · test mới FAIL 2/2 trước khi sửa (`BUG-006-test-before.png`) và PASS 2/2 sau khi sửa, toàn bộ `npm test` 60/60 (`BUG-006-test-after.png`); gọi lại cùng lệnh trên hệ thống Docker trả 400 `DU_LIEU_KHONG_HOP_LE` trường `page` (`BUG-006-after.png`) |