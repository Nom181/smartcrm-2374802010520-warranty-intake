# Khai báo sử dụng công cụ AI – Bài tập 2

**Sinh viên:** Võ Minh Triều – MSSV 2374802010520

> Cột cuối là phần em tự làm, tự chạy lại và tự quyết định sau khi AI soạn bản đầu.

## Bảng khai báo

| # | Công cụ | Dùng cho phần nào (cụ thể) | Đã kiểm chứng thế nào | Phần em tự quyết định / tự sửa |
|---|---|---|---|---|
| 1 | Claude (Anthropic), Claude Sonnet 5.5 | Viết mã backend: `errors.js`, `config.js`, `db.js`, `validators/*`, `repositories/*`, `services/*`, `routes/*`, `middleware/*`, `app.js`, `container.js`, `server.js` | Chạy thật với MariaDB 10.11 bằng curl (tra cứu, tạo, phân loại, sinh hạn, các lỗi 400/401/403/404/409/422/503); đọc lại phép thử 30 giây (`grep -nw "req\|res\|SELECT" src/backend/services/*.js` không ra kết quả) | Em đọc luồng tính hạn SLA trong `deadline.service.js`, hiểu hạn = thời điểm tiếp nhận + số giờ SLA. Em giữ cách tách routes → services → repositories để lớp nghiệp vụ không phụ thuộc HTTP. |
| 2 | Claude | Viết `migrations/001–002`, `seeds/001–002` (tệp seed sinh bằng một script ngẫu nhiên có hạt giống cố định, 28 bản ghi/bảng) | Chạy migrate và seed hai lần, đếm dòng không đổi (kiểm thử tích hợp `tests/integration/`) | Em chạy migrate và seed hai lần, số dòng giữ nguyên (customer 28, device 28, issue_category 3, sla_rule 9, warranty_request 28). Em hiểu seed dùng `INSERT IGNORE` với khoá chính cố định nên chạy lại không nhân đôi. |
| 3 | Claude | Viết bộ kiểm thử `tests/` (50 ca: luồng đúng, giá trị biên, dữ liệu sai, hợp đồng ở ranh giới; 5 ca tích hợp) và repository giả `tests/helpers/` | Chạy `npm test` PASS; cố ý phá mã ba chỗ (nhân đôi giờ SLA, bỏ kiểm tra thiếu ưu tiên, nới regex số điện thoại) để xác nhận test chuyển FAIL, rồi khôi phục | Em chạy `npm test` được 50 PASS, 0 FAIL và `npm run test:integration` được 5 PASS, 0 FAIL. Em sửa `slaHours` thành `slaHours + 1` thì 3 test FAIL, trong đó có test hạn cam kết theo SLA; khôi phục lại thì PASS. Em hiểu test này bảo vệ QT4 và NFR2. |
| 4 | Claude | Viết frontend React: `pages/*`, `components/*`, `hooks/useResource.js`, `api/client.js`, `auth/*`, `styles.css` | Chạy trình duyệt tự động trên dữ liệu thật; chụp đủ ba trạng thái (đang tải, rỗng hai loại, lỗi có nút Thử lại) trong `docs/anh/` | Em tắt API thì trang hiện "Không tải được dữ liệu. Máy chủ API không phản hồi. Hãy kiểm tra máy chủ đã chạy chưa rồi thử lại.", bật lại và bấm Thử lại thì dữ liệu hiện lại. Em hiểu 3 trạng thái là đang tải, lỗi và có dữ liệu. |
| 5 | Claude | Soạn `README.md`, `docs/thay-doi-thiet-ke.md`, `docs/architecture-thuc-te.*`, `docs/ai-disclosure.md` | Đối chiếu từng lệnh trong README bằng phép thử "thư mục trống" (clone mới, làm đúng README) | Em chạy theo các bước trong README (setup, db:setup, migrate, seed, test, start) trên máy em và trên bản clone mới ở `Desktop\thu-clone`, đều chạy được. |

## Điều em xác nhận

- Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.
- Em đã đọc và hiểu từng dòng mã nộp, kể cả phần có AI hỗ trợ, và có thể chỉ ra dòng chịu trách nhiệm cho từng quy tắc nghiệp vụ (QT1–QT5) khi giảng viên hỏi ở buổi 12.
- Phần lập luận thiết kế (lý do chọn kiến trúc phân lớp, đánh đổi) nằm ở báo cáo PDF và `docs/design-notes.md`; bản nháp do AI hỗ trợ soạn, em đọc lại và chịu trách nhiệm về nội dung đó.
- Không có khoá bí mật, mật khẩu thật hay chuỗi kết nối thật trong repo. Mật khẩu `Demo@2026` của hai tài khoản mẫu chỉ là dữ liệu thử, nằm trong seed dưới dạng băm.

## Những chỗ AI sai hoặc em phải sửa (nếu có)

- Lần đầu cấu hình kiểm thử `node --test <thư mục>` không chạy trên Node 22 nên đã đổi sang `tests/run-all.js` (AI phát hiện khi chạy thử, em đã đọc lại cách sửa).
- Thông báo lỗi khi máy chủ API tắt ban đầu hiện "phản hồi không hợp lệ" nên đã sửa thành thông báo rõ ràng (BUG-001 trong `docs/bug-log.md`).
- Cách chia migration bằng `DELIMITER` không chạy được với `mysql2` nên chỉ mục được chuyển vào lệnh `CREATE TABLE` (BUG-003).
- Bảng danh sách tràn ngang ở khung 375 px, đã bọc bảng trong khung cuộn (BUG-002).
