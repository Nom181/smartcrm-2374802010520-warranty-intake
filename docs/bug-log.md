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
