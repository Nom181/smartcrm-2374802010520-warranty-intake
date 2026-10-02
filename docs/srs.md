# SRS Rút Gọn – Hệ thống Tiếp nhận và Phân loại Yêu cầu Bảo hành

**Sinh viên:** Võ Minh Triều – MSSV: 2374802010520
**Track:** SE – Luồng L2
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang

---

## 1. Giới thiệu & Bảng thuật ngữ

**Mục đích:** Hệ thống hỗ trợ nhân viên trung tâm bảo hành tiếp nhận yêu cầu bảo hành từ khách hàng, phân loại sự cố và tự động sinh hạn cam kết xử lý.

**Bảng thuật ngữ (dùng thống nhất trong toàn bộ tài liệu, sơ đồ, wireframe):**

| Thuật ngữ | Định nghĩa |
|---|---|
| Phiếu bảo hành | Bản ghi một yêu cầu bảo hành của khách hàng, gồm thông tin thiết bị, lỗi, phân loại và hạn xử lý |
| Nhóm sự cố | Danh mục phân loại lỗi (ví dụ: phần cứng, phần mềm, hao mòn tự nhiên) |
| Mức ưu tiên | Mức độ khẩn cấp xử lý phiếu bảo hành: Khẩn cấp / Bình thường / Thấp |
| Hạn cam kết xử lý | Thời điểm hệ thống cam kết hoàn thành xử lý phiếu bảo hành, tính theo quy tắc SLA |
| SLA | Quy tắc tính thời gian cam kết xử lý theo nhóm sự cố và mức ưu tiên |

---

## 2. Phạm vi

**Trong phạm vi:**
- Tra cứu/tạo hồ sơ khách hàng theo số điện thoại
- Ghi nhận thiết bị và mô tả lỗi
- Phân loại nhóm sự cố và mức ưu tiên
- Tự động sinh hạn cam kết xử lý
- Xem danh sách và trạng thái phiếu bảo hành (vai trò quản lý)

**Ngoài phạm vi:**
- Xử lý kỹ thuật thực tế (sửa chữa thiết bị)
- Quản lý kho phụ tùng thay thế
- Thanh toán, xuất hóa đơn bảo hành

---

## 3. Yêu cầu chức năng (FR)

| Mã | Mô tả yêu cầu chức năng |
|---|---|
| FR1 | Hệ thống phải cho phép tra cứu khách hàng theo số điện thoại |
| FR2 | Hệ thống phải cho phép tạo hồ sơ khách hàng mới khi tra cứu không có kết quả |
| FR3 | Hệ thống phải cho phép ghi nhận thiết bị và mô tả lỗi của khách hàng |
| FR4 | Hệ thống phải cho phép phân loại nhóm sự cố cho phiếu bảo hành |
| FR5 | Hệ thống phải cho phép xác định mức ưu tiên xử lý cho phiếu bảo hành |
| FR6 | Hệ thống phải tự động sinh hạn cam kết xử lý dựa trên nhóm sự cố và mức ưu tiên |
| FR7 | Hệ thống phải cho phép xem danh sách và trạng thái các phiếu bảo hành |

---

## 4. Yêu cầu phi chức năng (NFR)

| Mã | Mô tả | Ngưỡng đo được |
|---|---|---|
| NFR1 | Hiệu năng tra cứu khách hàng | Trả kết quả tra cứu trong vòng **≤ 2 giây** với dữ liệu ≤ 10.000 khách hàng |
| NFR2 | Độ chính xác sinh hạn cam kết | **100%** phiếu bảo hành đã phân loại đầy đủ phải được sinh hạn cam kết tự động, không yêu cầu nhập tay |
| NFR3 | Khả dụng hệ thống | Hệ thống backend phải khả dụng **≥ 99%** thời gian trong giờ hành chính (8h–18h) |
| NFR4 | Bảo mật dữ liệu khách hàng | Thông tin số điện thoại và thông tin cá nhân khách hàng phải được **mã hóa khi lưu trữ**, không commit vào mã nguồn dưới dạng plaintext |

---

## 5. Ràng buộc & Giả định

**Ràng buộc:**
- Backend: Node.js + Express.js
- CSDL: MySQL
- Frontend: React.js

**Giả định:**
- Mỗi khách hàng có duy nhất 1 số điện thoại định danh trong hệ thống
- Quy tắc SLA theo nhóm sự cố và mức ưu tiên được admin cấu hình sẵn trước khi vận hành
- Nhân viên tiếp nhận đã được cấp tài khoản đăng nhập hợp lệ

---

## 6. Bảng truy vết (Traceability Matrix)

| FR | User Story | Use Case | MoSCoW |
|---|---|---|---|
| FR1 | US1 | UC1 – Tra cứu khách hàng theo số điện thoại | MUST |
| FR2 | US2 | UC2 – Tạo hồ sơ khách hàng mới | SHOULD |
| FR3 | US3, US4 | UC3 – Ghi nhận thiết bị cần bảo hành; UC4 – Ghi nhận mô tả lỗi | SHOULD |
| FR4 | US5 | UC5 – Phân loại nhóm sự cố | MUST |
| FR5 | US6 | UC6 – Xác định mức ưu tiên xử lý | SHOULD |
| FR6 | US7 | UC7 – Sinh hạn cam kết xử lý | MUST |
| FR7 | US8 | UC8 – Xem danh sách yêu cầu bảo hành | COULD |

*Không có ô trống — mọi FR đều truy vết được về đúng 1 User Story và 1 Use Case.*
