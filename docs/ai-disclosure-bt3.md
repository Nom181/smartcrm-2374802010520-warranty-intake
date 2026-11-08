# Phụ lục – Khai báo sử dụng công cụ AI – Bài tập 3

**Sinh viên:** Võ Minh Triều – MSSV 2374802010520 · Repo: https://github.com/Nom181/smartcrm-2374802010520-warranty-intake

Công cụ AI duy nhất em dùng ở Bài tập 3 là Claude (Anthropic), Claude Sonnet 5.5, qua giao diện Claude Code. Cột "Em tự làm" chỉ ghi việc em đã tự chạy, tự chụp ảnh và tự thao tác trên máy em.

## Bảng khai báo

| # | Dùng cho phần nào (cụ thể) | AI làm gì | Em tự làm và kiểm chứng thế nào |
|---|---|---|---|
| 1 | Test Plan (`docs/test-plan.md`) và 12 test case của Test Report | Đề xuất cấu trúc Test Plan, chọn 12 test case đủ 5 loại; viết `tests/05-test-report.test.js` (6 test tầng unit) và `tests/manual/run-tc.js` (4 test mức API) | Em tự chạy cả 12 test case trên máy em (unit, integration với MariaDB thật, API với hệ thống đang chạy), tự chụp ảnh từng ca vào `docs/screenshots/`; kết quả trong `docs/test-report.md` lấy từ các lần chạy đó (12 PASS, 0 FAIL). Em chạy `npm test` được 60 PASS, 0 FAIL |
| 2 | Đóng gói Docker: `Dockerfile`, `src/frontend/Dockerfile`, `src/frontend/nginx.conf`, `docker-compose.yml`, `.dockerignore` | Viết các tệp trên | Em chạy `docker compose up -d --build` trên Docker Desktop; em tự thử "máy trắng" (clone repo vào thư mục mới, chạy đúng hai lệnh `cp .env.example .env` và `docker compose up -d --build`), `docker compose ps` cho thấy db, api, web chạy và `/api/health` trả `{"status":"ok","db":"up"}`; em chạy lại `restart api` và đếm dữ liệu trước/sau, không nhân đôi (29/29/9/2) |
| 3 | Tài liệu: `docs/deployment-guide.md`, `docs/api.md`, `docs/security-checklist.md`, README bản v1.0 | Soạn bản đầu từ mã nguồn và cấu hình | Em chạy các lệnh minh chứng cho checklist: `git log --all --oneline -- .env` không in gì, kiểm tra mật khẩu trong CSDL là chuỗi băm `scrypt$...`, kiểm tra cổng CSDL không mở ra máy; em đọc lại các tài liệu |
| 4 | BUG-004 (`aa76a67`): giới hạn 1000 ký tự đếm emoji là 2 | AI phát hiện khi rà soát mã nguồn và đề xuất cách sửa | Em tự tạo test hồi quy, chạy thấy FAIL trước khi sửa, tự sửa `common.js` và `NewRequestPage.jsx`, chạy lại thấy PASS, tự commit; ảnh trước/sau trong `docs/screenshots/` |
| 5 | BUG-005 (`1aba0de`): mô tả dài không có dấu cách tràn khung | Em phát hiện bằng cách thử tay trên giao diện Docker; AI chỉ ra nguyên nhân CSS (cột lưới `1fr` không co) và đề xuất dòng sửa | Em dán chuỗi 900 ký tự `a`, chụp ảnh lỗi, tự sửa `styles.css`, dựng lại `web`, chụp ảnh sau khi sửa, tự commit |
| 6 | BUG-006 (`020c02a`): `page` quá lớn trả HTTP 500 | AI nghi ngờ từ việc đọc mã `parsePaging` và đề xuất cách kiểm chứng và cách sửa | Em tự gọi API thật bằng `curl.exe`, thấy 500 trên hệ thống Docker (CSDL MariaDB thật); tự thêm test hồi quy, tự sửa, dựng lại `api`, gọi lại thấy 400, tự commit |
| 7 | Hướng dẫn thao tác từng bước (lệnh Git, PowerShell, Docker) | AI soạn lệnh và giải thích từng bước | Em tự gõ và chạy từng lệnh, gửi lại ảnh kết quả; lệnh nào lỗi em báo lại để sửa |

## Những chỗ AI sai hoặc em phải sửa

- `docker-compose.yml` bản đầu có lỗi cú pháp YAML ở dòng `AUTH_SECRET` (chuỗi có `chạy: cp` chứa dấu hai chấm kèm khoảng trắng); em chạy `docker compose ps` thấy lỗi `mapping values are not allowed`, AI sửa bằng cách đặt chuỗi trong dấu nháy kép.
- Cổng 3000 trên máy em bị chiếm nên Docker báo "ports are not available"; AI bổ sung biến `API_PORT` để đổi cổng. Sau đó có một lần `api` không tìm ra `db` (`EAI_AGAIN`), em chạy `docker compose down` rồi `up -d` để dựng lại mạng thì hết.
- Khi AI hướng dẫn thay đoạn `parsePaging` (BUG-006), em thay thừa nên khối kiểm tra `pageSize` bị mất; `npm test` báo 1 test FAIL, em dán lại khối đó và test trở lại 60 PASS. Nhờ có test nên lỗi này được phát hiện trước khi commit.
- AI nhận định mức độ BUG-006 là Major kèm lý do; em đã đọc lý do đó trước khi ghi vào Bug Log.

## Điều em xác nhận

- Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.
- Mọi kết quả test và ảnh chụp trong báo cáo là kết quả em tự chạy trên máy em; không có kết quả nào do AI tự điền.
- Không có khoá bí mật, mật khẩu thật hay chuỗi kết nối thật trong repo. `.env` không bao giờ được commit; `Demo@2026` chỉ là mật khẩu dữ liệu mẫu.

## Phần em tự viết bằng lời của mình (BẮT BUỘC điền trước khi nộp)

> Phần này AI không viết hộ. Em viết 2–3 câu cho mỗi ý, để giảng viên hỏi miệng em trả lời được.

- BUG-006 xảy ra vì:“page không có giới hạn trên nên số trang quá lớn làm OFFSET thành một số khổng lồ, câu SQL được viết dưới dạng 2e+21,kết quả là CSDL không hiểu cách viết này nên báo lỗi, lỗi không được lường trước nên hệ thống trả HTTP 500 thay vì 400. Em sửa bằng cách đặt giới hạn trang tối đa là 1.000.000, vượt thì từ chối ngay với 400 mà không hỏi sql.”
- Vì sao BUG-004 và BUG-006 cần test hồi quy, và test đó chứng minh được điều gì: “Test chạy trước khi sửa mà fail thì chứng minh lỗi có thật. Chạy sau khi sửa mà pass thì chứng minh vá có tác dụng. Test ở lại trong repo, nếu sau này lỗi quay lại thì nó fail ngay”
- Em hiểu vì sao Docker cần `DB_HOST=db` thay vì `127.0.0.1`: “Mỗi container là một căn phòng riêng, 127.0.0.1 nghĩa là chính nó, nên api phải gọi MariaDB bằng tên db của dịch vụ. MariaDB nằm ở container db, không nằm trong container api”
