# Khai báo sử dụng công cụ AI – Bài tập 2

**Sinh viên:** Võ Minh Triều – MSSV 2374802010520

> Các ô đánh dấu **[Em tự điền]** là phần chỉ sinh viên mới biết (em đã tự sửa gì, em đã hiểu và chạy lại thế nào). Không để trống khi nộp.

## Bảng khai báo

| # | Công cụ | Dùng cho phần nào (cụ thể) | Đã kiểm chứng thế nào | Phần em tự quyết định / tự sửa |
|---|---|---|---|---|
| 1 | Claude (Anthropic), Claude Sonnet 5.5 | Viết mã backend: `errors.js`, `config.js`, `db.js`, `validators/*`, `repositories/*`, `services/*`, `routes/*`, `middleware/*`, `app.js`, `container.js`, `server.js` | Chạy thật với MariaDB 10.11 bằng curl (tra cứu, tạo, phân loại, sinh hạn, các lỗi 400/401/403/404/409/422/503); đọc lại phép thử 30 giây (`grep -nw "req\|res\|SELECT" src/backend/services/*.js` không ra kết quả) | **[Em tự điền]** |
| 2 | Claude | Viết `migrations/001–002`, `seeds/001–002` (tệp seed sinh bằng một script ngẫu nhiên có hạt giống cố định, 28 bản ghi/bảng) | Chạy migrate và seed hai lần, đếm dòng không đổi (kiểm thử tích hợp `tests/integration/`) | **[Em tự điền]** |
| 3 | Claude | Viết bộ kiểm thử `tests/` (43 ca: luồng đúng, giá trị biên, dữ liệu sai; 5 ca tích hợp) và repository giả `tests/helpers/` | Chạy `npm test` PASS; cố ý phá mã ba chỗ (nhân đôi giờ SLA, bỏ kiểm tra thiếu ưu tiên, nới regex số điện thoại) để xác nhận test chuyển FAIL, rồi khôi phục | **[Em tự điền]** |
| 4 | Claude | Viết frontend React: `pages/*`, `components/*`, `hooks/useResource.js`, `api/client.js`, `auth/*`, `styles.css` | Chạy trình duyệt tự động trên dữ liệu thật; chụp đủ ba trạng thái (đang tải, rỗng hai loại, lỗi có nút Thử lại) trong `docs/anh/` | **[Em tự điền]** |
| 5 | Claude | Soạn `README.md`, `docs/thay-doi-thiet-ke.md`, `docs/architecture-thuc-te.*`, `docs/ai-disclosure.md` | Đối chiếu từng lệnh trong README bằng phép thử "thư mục trống" (clone mới, làm đúng README) | **[Em tự điền]** |

## Điều em xác nhận

- **[Em tự điền]** Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.
- **[Em tự điền]** Em đã đọc và hiểu từng dòng mã nộp, kể cả phần có AI hỗ trợ, và có thể chỉ ra dòng chịu trách nhiệm cho từng quy tắc nghiệp vụ (QT1–QT5) khi giảng viên hỏi ở buổi 12.
- Phần lập luận thiết kế (lý do chọn kiến trúc phân lớp, đánh đổi) nằm ở báo cáo PDF và `docs/design-notes.md`; **[Em tự điền]** em tự viết các lập luận đó bằng lời của mình.
- Không có khoá bí mật, mật khẩu thật hay chuỗi kết nối thật trong repo. Mật khẩu `Demo@2026` của hai tài khoản mẫu chỉ là dữ liệu thử, nằm trong seed dưới dạng băm.

## Những chỗ AI sai hoặc em phải sửa (nếu có)

**[Em tự điền]** Ghi lại ít nhất một chỗ em đã phát hiện AI làm sai hoặc chưa tốt và cách em xử lý. Gợi ý từ lịch sử làm bài: lần đầu cấu hình kiểm thử `node --test <thư mục>` không chạy trên Node 22 nên đã đổi sang `tests/run-all.js`; thông báo lỗi khi máy chủ API tắt ban đầu hiện "phản hồi không hợp lệ" nên đã sửa thành thông báo rõ ràng.
