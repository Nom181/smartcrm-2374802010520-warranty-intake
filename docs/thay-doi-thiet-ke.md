# Nhật ký thay đổi thiết kế

**Sinh viên:** Võ Minh Triều – MSSV 2374802010520 · Luồng L2 (Tiếp nhận và phân loại yêu cầu bảo hành) · Track SE

Quy ước: mỗi thay đổi có mã TD-xx, ba dòng bắt buộc: **thay đổi gì · vì sao · ảnh hưởng tới thành phần nào**.
Bảng thuật ngữ của SRS được giữ nguyên trong mã (`warranty_request`, `customer`, `device`, `issue_category`, `sla_rule`, `committed_deadline`).

## Sau phản hồi Bài tập 1

Điểm BT1: 7,5/10 (Đầy đủ 7,75 · Kỹ thuật 6,5 · Nhất quán 9,25 · Trình bày 7,5). Giữ nguyên các điểm tốt (bảng thuật ngữ có tên CSDL, ERD 6 bảng, NFR có ngưỡng). Bốn điểm cần khắc phục:

### TD-09 Thiếu 3 câu lập luận kiến trúc (mục 3)
- **Phản hồi của GV:** Mục 3 thiếu 3 câu theo khuôn "Vì NFRx yêu cầu…, tôi chọn…, đánh đổi là…"; điểm kỹ thuật bị giới hạn mức Khá.
- **Quyết định:** SỬA
- **Lý do:** Đây là mục kiểm chứng bắt buộc. Ba câu phải do em tự viết bằng lời của mình, dựa trên NFR1, NFR2, NFR5 và kiến trúc đã hiện thực (`docs/architecture-thuc-te.png`).
- **Ảnh hưởng:** `docs/design-notes.md` mục 1 và mục 3 của báo cáo BT1. **[Em tự điền]** viết xong và nộp bổ sung nếu giảng viên cho phép; bản nháp trong `design-notes.md` chỉ là điểm xuất phát, phải sửa lại cho đúng ý em.

### TD-10 Phụ lục AI thiếu dòng cam kết
- **Phản hồi của GV:** Thiếu dòng "Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp."
- **Quyết định:** SỬA
- **Lý do:** Khai báo AI là yêu cầu bắt buộc.
- **Ảnh hưởng:** `docs/ai-disclosure.md` và phụ lục báo cáo BT2 đã có dòng cam kết đúng câu này (em chỉ ký xác nhận khi đã thật sự đọc và hiểu mã).

### TD-11 Tên file nộp sai mẫu
- **Phản hồi của GV:** Phải theo mẫu `BT1_<MSSV>_<HoTen>.pdf`, không dùng tiền tố Buoi6.
- **Quyết định:** SỬA
- **Lý do:** Sai tên file bị trừ điểm hình thức.
- **Ảnh hưởng:** BT2 đặt tên `BT2_2374802010520_VoMinhTrieu.pdf`. Không còn tiền tố buổi học.

### TD-12 Repo thiếu tệp .drawio và ai-disclosure.md
- **Phản hồi của GV:** Repo chưa có usecase/architecture/erd.drawio và ai-disclosure.md dù bài ghi file gốc ở docs/.
- **Quyết định:** SỬA
- **Lý do:** Bài nộp tham chiếu tệp mà repo không có thì không truy vết được.
- **Ảnh hưởng:** Gói BT2 có đủ `docs/usecase.drawio`, `erd.drawio`, `architecture.drawio`, `architecture-thuc-te.drawio`, `ai-disclosure.md` và `db/schema.sql` (giữ làm bản tham chiếu BT1). Cần push trước khi gắn tag v0.2.

**Gợi ý cho BT2 (đã làm):** test đủ 9 tổ hợp SLA (3 nhóm × 3 mức) chứng minh NFR2 nằm ở `tests/02-gia-tri-bien.test.js`, ca "mọi tổ hợp … cho đúng số giờ trong bảng SLA".

## Thay đổi khi hiện thực hoá (Bài tập 2)

### TD-01 Thêm bảng `app_user` (tài khoản đăng nhập)
- **Thay đổi gì:** ERD từ 6 bảng thành 7 bảng; thêm bảng `app_user` (username, password_hash, full_name, role STAFF/MANAGER).
- **Vì sao:** Đề BT2 (SE) yêu cầu xác thực đăng nhập mức cơ bản; SRS mục 2 đã phân hai vai trò nhưng BT1 chưa có nơi lưu tài khoản. Mật khẩu chỉ lưu dạng băm scrypt.
- **Ảnh hưởng:** `migrations/002_create_app_user.sql`, `erd.drawio` (cần vẽ thêm bảng), SRS mục 2 (vai trò nay được kiểm tra bằng mã: MANAGER chỉ xem, STAFF tạo/sửa).

### TD-02 `schema.sql` của BT1 tách thành migration và seed
- **Thay đổi gì:** `db/schema.sql` (BT1) gộp lệnh tạo CSDL, tạo bảng và INSERT dữ liệu. Nay: `migrations/001_init_schema.sql` chỉ có `CREATE TABLE IF NOT EXISTS`; CSDL do `scripts/migrate.js` tạo; dữ liệu danh mục và dữ liệu mẫu nằm ở `seeds/` dùng `INSERT IGNORE` với khoá chính cố định.
- **Vì sao:** Đề yêu cầu dựng từ CSDL trống, chạy lại lần hai không lỗi và không nhân đôi dữ liệu (mục C5).
- **Ảnh hưởng:** `db/schema.sql` giữ lại như bản tham chiếu của BT1 nhưng không còn là nguồn dựng CSDL; README mục 3.

### TD-03 Cột và ràng buộc giữ nguyên, thêm hai chỉ mục
- **Thay đổi gì:** Thêm `idx_request_status_received (status, received_at)` trên `warranty_request` và `idx_log_request_changed (request_id, changed_at)` trên `request_status_log`. Các cột, kiểu dữ liệu và khoá ngoại khác giữ đúng DDL BT1.
- **Vì sao:** Màn hình danh sách (FR7) lọc theo trạng thái và sắp theo thời điểm tiếp nhận; màn hình chi tiết đọc lịch sử theo thứ tự thời gian.
- **Ảnh hưởng:** `migrations/001_init_schema.sql`; ghi chú chỉ mục trong ERD.

### TD-04 Tầng repository: gộp và bổ sung
- **Thay đổi gì:** Sơ đồ BT1 có `SlaRuleRepository`; thực tế `issue_category` và `sla_rule` cùng đọc từ `CatalogRepository`. Thêm `UserRepository` (đăng nhập), `HealthRepository` (kiểm tra CSDL). Tầng trình bày "Controller" của BT1 được hiện thực bằng `routes/` + `middleware/` + `validators/`. `DeadlineService` giữ đúng như thiết kế; thêm `AuthService`, `CatalogService`, `HealthService`.
- **Vì sao:** Hai bảng danh mục luôn được đọc cùng nhau và đều chỉ đọc; tách riêng chỉ thêm tệp mà không thêm giá trị. Đăng nhập và kiểm tra sức khoẻ là nhu cầu mới của BT2.
- **Ảnh hưởng:** `docs/architecture-thuc-te.drawio/.png` (sơ đồ ĐÃ hiện thực, thay cho sơ đồ dự kiến), thư mục `src/backend/`.

### TD-05 Quy tắc nghiệp vụ bổ sung ngoài QT1–QT5 của SRS
- **Thay đổi gì:** Hiện thực thêm các quy tắc sau (đề xuất đánh mã QT6–QT10 khi cập nhật SRS):
  - QT6: ngày mua thiết bị không được sau ngày hôm nay (tính theo múi giờ `APP_TIMEZONE`, mặc định Asia/Ho_Chi_Minh).
  - QT7: không xoá khách hàng hoặc thiết bị đã có phiếu bảo hành (giữ nguyên lịch sử).
  - QT8: chỉ xoá được phiếu ở trạng thái NEW; phiếu RECEIVED (đã có hạn cam kết) bị khoá, không sửa mô tả/nhóm/ưu tiên và không sinh hạn lần hai.
  - QT9: số serial được chuẩn hoá chữ hoa trước khi lưu; mô tả lỗi tối đa 1000 ký tự.
  - QT10: hai người cùng sửa một phiếu thì người đến sau nhận lỗi 409 (khoá lạc quan theo trạng thái), không ghi đè.
- **Vì sao:** Đề yêu cầu CRUD đủ bốn thao tác trên ≥ 2 thực thể mà không phá toàn vẹn dữ liệu; các quy tắc trên là cách an toàn nhất cho thao tác sửa/xoá. SRS BT1 chỉ nói về luồng tạo.
- **Ảnh hưởng:** `docs/srs.md` mục 5 (cần thêm QT6–QT10 – **[Em tự điền]** khi cập nhật SRS), `services/*.service.js`, `tests/`.

### TD-06 Hợp đồng API thực tế
- **Thay đổi gì:** Danh sách endpoint thực tế nằm ở README mục 5 (đăng nhập, khách hàng, thiết bị, phiếu, danh mục, sức khoẻ). Bổ sung `GET /api/requests/summary` (số phiếu theo trạng thái và số phiếu quá hạn) và `GET /api/customers/lookup?phone=`, `GET /api/devices/lookup?serial=`.
- **Vì sao:** Màn hình danh sách cần số liệu có mốc so sánh (đề BT2 mục 2.3); màn hình tạo phiếu cần tra cứu theo số điện thoại và serial (FR1, FR3).
- **Ảnh hưởng:** `docs/api-contract.md` của BT1 chưa phản ánh các endpoint này. **[Em tự điền]** cập nhật hoặc thay bằng liên kết tới README mục 5. Tài liệu API hoàn chỉnh không thuộc phạm vi BT2.

### TD-07 Màn hình thực tế khác wireframe BT1
- **Thay đổi gì:** Thêm màn hình Đăng nhập. Màn hình "Tạo phiếu" gồm ba bước (khách hàng → thiết bị → mô tả lỗi) thay vì một biểu mẫu duy nhất. Màn hình "Danh sách" thêm bốn ô số liệu (mới / đã phân loại / đã tiếp nhận / quá hạn), mỗi ô ghi kèm mẫu số. Màn hình "Chi tiết" thêm bảng SLA của nhóm làm mốc so sánh cho hạn cam kết.
- **Vì sao:** Đề BT2 yêu cầu có đăng nhập và mọi con số phải có ngữ cảnh so sánh.
- **Ảnh hưởng:** `docs/wireframe.png` (BT1) chỉ còn đúng cho ba màn hình gốc; ảnh chụp màn hình thật nằm trong `docs/anh/`.

### TD-08 Múi giờ và cơ sở dữ liệu phát triển
- **Thay đổi gì:** `DATETIME` lưu theo UTC; giao diện đổi sang giờ địa phương của trình duyệt. Môi trường phát triển dùng MariaDB (đi kèm XAMPP); câu lệnh SQL dùng cú pháp chung của MySQL/MariaDB.
- **Vì sao:** Tránh sai lệch giờ giữa máy chủ và trình duyệt khi cộng giờ SLA.
- **Ảnh hưởng:** `src/backend/db.js` (`timezone: 'Z'`), README mục 2. Chỉ đã thử trên MariaDB 10.11; chưa thử trên MySQL 8.

## Điều chỉnh sau tài liệu Buổi 9–10

### TD-13 Thêm trường `fields` vào lỗi API
- **Thay đổi gì:** Lỗi định dạng trả thêm `fields` (tên trường → lý do) theo hợp đồng lỗi của tài liệu buổi 9. Trường cũ `chi_tiet` vẫn giữ.
- **Vì sao:** Thống nhất `error` + `message` + `fields` cho mọi bên gọi; làm theo quy trình mở rộng → chuyển → thu hẹp để giao diện hiện tại không vỡ.
- **Ảnh hưởng:** `middleware/error-handler.js`, `tests/04-hop-dong.test.js`, `docs/hop-dong-du-lieu.md`. Bước "chuyển" (giao diện đọc `fields`) và bước "thu hẹp" (bỏ `chi_tiet`) để lại cho Sprint sau; giao diện hiện vẫn đọc `chi_tiet`.

### TD-14 Viết hợp đồng dữ liệu tường minh và cách lưu token
- **Thay đổi gì:** Thêm comment hợp đồng (hình dạng, ý nghĩa, hành vi khi sai) ở `toRequest`; thêm `docs/hop-dong-du-lieu.md`, `src/frontend/.env.example`, và ghi cách lưu token cùng hạn chế vào README mục 7.
- **Vì sao:** Biến hợp đồng ngầm thành hợp đồng tường minh; đổi tên một cột chỉ phải sửa một chỗ.
- **Ảnh hưởng:** `warranty-request.repository.js` (xuất thêm `toRequest` để kiểm thử), README mục 5 và 7.
