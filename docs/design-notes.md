# Ghi chú thiết kế – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)

**Sinh viên:** Võ Minh Triều – MSSV: 2374802010520

Thuật ngữ dùng thống nhất trong mọi sơ đồ: **phiếu bảo hành** (bảng `warranty_request`), **nhóm sự cố** (`issue_category`), **mức ưu tiên** (`priority`), **hạn cam kết xử lý** (`committed_deadline`), **quy tắc SLA** (`sla_rule`).

---

## 1. Ba câu lập luận lựa chọn kiến trúc

1. **Vì NFR1 yêu cầu** tra cứu khách hàng theo số điện thoại trả kết quả trong **≤ 2 giây** với **≤ 10.000 khách hàng**, **tôi chọn** đặt chỉ mục UNIQUE trên `customer.phone` và để lớp truy cập dữ liệu tìm trực tiếp theo chỉ mục, thay vì tải toàn bộ danh sách khách hàng lên lớp nghiệp vụ rồi lọc. **Đánh đổi là** mỗi lần thêm khách hàng mới tốn thêm một chút chi phí ghi để cập nhật chỉ mục, chấp nhận được vì tra cứu xảy ra thường xuyên hơn nhiều so với tạo khách hàng mới.

2. **Vì NFR2 yêu cầu** **100%** phiếu bảo hành đã phân loại đầy đủ được sinh hạn cam kết xử lý tự động, **tôi chọn** lưu quy tắc SLA trong bảng `sla_rule` (nhóm sự cố + mức ưu tiên → số giờ) và gom việc tính hạn vào một `DeadlineService` duy nhất ở lớp nghiệp vụ, thay vì viết cứng số giờ trong mã. **Đánh đổi là** phải thêm một bảng và nạp sẵn dữ liệu SLA ban đầu; nếu thiếu một tổ hợp thì hệ thống rơi vào luồng ngoại lệ nhập tay (UC7, ngoại lệ tại bước 3).

3. **Vì NFR5 yêu cầu** thêm một nhóm sự cố mới mà **không phải sửa dòng mã nguồn nào**, **tôi chọn** lưu nhóm sự cố trong bảng `issue_category` thay vì định nghĩa cứng bằng ENUM trong mã. **Đánh đổi là** cần thêm một thao tác thêm dữ liệu danh mục; ở BT1 việc này làm bằng câu lệnh SQL, màn hình quản trị danh mục xếp ngoài phạm vi (WON'T).

> Lưu ý: NFR5 chưa có trong SRS hiện tại, cần bổ sung khi chỉnh lại SRS (xem mục 4).

---

## 2. Đối chiếu wireframe với ERD

| # | Trên màn hình | Cột trong ERD | Nguồn |
|---|---|---|---|
| 1 | Số điện thoại | `customer.phone` (UNIQUE) | FR1 · US1 |
| 2 | Họ tên khách | `customer.full_name` | FR1/FR2 · US1 |
| 3 | Số serial thiết bị | `device.serial_no` (UNIQUE) | FR3 · US2 |
| 4 | Mẫu thiết bị | `device.model_name` | FR3 · US2 |
| 5 | Mô tả lỗi | `warranty_request.issue_desc` | FR3 · US3 |
| 6 | Nhóm sự cố | `warranty_request.category_id` → `issue_category.name` | FR4 · US4 |
| 7 | Mức ưu tiên | `warranty_request.priority` | FR5 · US5 |
| 8 | Thông báo không tìm thấy khách hàng | — (không lưu) | UC1 · luồng ngoại lệ |
| 9 | Nút "Tạo phiếu" | INSERT `warranty_request` + `request_status_log` | UC1–UC6 |
| 10 | Mã phiếu | `warranty_request.request_id` | FR7 |
| 11 | Khách hàng | `customer.full_name`, `customer.phone` | FR7 |
| 12 | Thiết bị | `device.model_name`, `device.serial_no` | FR7 |
| 13 | Nhóm sự cố | `issue_category.name` | FR4 |
| 14 | Mức ưu tiên | `warranty_request.priority` | FR5 |
| 15 | Trạng thái | `warranty_request.status` (NEW / CLASSIFIED / RECEIVED) | FR7 |
| 16 | Hạn cam kết xử lý | `warranty_request.committed_deadline` | FR6 · US6 |
| 17 | Thông báo thiếu phân loại | — (không lưu) | UC7 · ngoại lệ tại bước 2 |
| 18 | Lọc theo trạng thái | `warranty_request.status` | FR7 · US7 |
| 19 | Bấm một dòng mở chi tiết | — | UC8 |

**Kiểm hai chiều:** mọi trường trên màn hình đều có cột trong ERD. Ngược lại, các cột NOT NULL đều được nhập hoặc tự sinh: `customer` (phone, full_name nhập; created_at tự sinh), `device` (serial_no, model_name nhập), `warranty_request` (customer_id, device_id từ bước tra cứu và ghi nhận thiết bị; issue_desc nhập; status, received_at tự sinh).

Nhãn trạng thái hiển thị: NEW = "Mới ghi nhận", CLASSIFIED = "Đã phân loại", RECEIVED = "Đã tiếp nhận".

---

## 3. Kiểm tra ERD theo năm lỗi thường gặp

| Lỗi | Kết quả |
|---|---|
| Bảng cô lập | Không có. Cả 6 bảng đều nối với `warranty_request` (trực tiếp hoặc qua `issue_category`). |
| Thiếu bảng lịch sử | Đã có `request_status_log` thay vì ghi đè một cột trạng thái. |
| Lưu giá trị tính được | Không lưu. Hạn cam kết là kết quả sinh ra từ SLA, không phải số ngày xử lý tính lại được. |
| Thiếu index gắn NFR | `uq_customer_phone` (NFR1), `uq_sla_category_priority` (NFR2). |
| Khóa nghiệp vụ làm khóa chính | Không. `customer_id` là khóa nhân tạo, `phone` chỉ UNIQUE. |

Chuẩn 3NF: `customer`, `device`, `issue_category` là các thực thể độc lập; `warranty_request` chỉ giữ khóa ngoại tới chúng; thông tin khách hàng và thiết bị không bị lặp trong phiếu.

---

## 4. Việc cần chỉnh trong SRS để khớp với thiết kế

1. Bổ sung **NFR5**: thêm nhóm sự cố mới không cần sửa mã nguồn (ngưỡng: 0 dòng mã thay đổi, chỉ thêm 1 dòng dữ liệu).
2. Sửa **NFR4** thành yêu cầu đo được và khả thi, ví dụ: không có mật khẩu CSDL hoặc khóa bí mật trong mã nguồn (0 file `.env` trong repo). Lý do: "mã hóa số điện thoại khi lưu trữ" mâu thuẫn với việc tra cứu theo số điện thoại bằng chỉ mục (NFR1).
3. Thêm vào bảng thuật ngữ: *phiếu bảo hành = `warranty_request`*, *quy tắc SLA = `sla_rule`*.
4. Bổ sung trạng thái phiếu (NEW, CLASSIFIED, RECEIVED) vào mục thuật ngữ hoặc yêu cầu chức năng FR7.
