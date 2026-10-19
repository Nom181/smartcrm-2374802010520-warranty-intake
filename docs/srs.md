# SRS rút gọn – Hệ thống Tiếp nhận và Phân loại Yêu cầu Bảo hành

**Sinh viên:** Võ Minh Triều – MSSV: 2374802010520
**Track:** SE – Luồng L2
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang

---

## 1. Giới thiệu và phạm vi

**Bối cảnh.** Trong case study Smart CRM – Mekong Mobile, trung tâm bảo hành tiếp nhận thiết bị do khách hàng mang đến. Tài liệu này đặc tả bước đầu tiên của quy trình đó.

**Luồng nghiệp vụ chọn (L2 – Tiếp nhận và phân loại yêu cầu bảo hành).** Nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, phân loại nhóm sự cố và mức ưu tiên, sau đó hệ thống sinh hạn cam kết xử lý cho phiếu bảo hành. Luồng kết thúc khi phiếu bảo hành có hạn cam kết xử lý.

**Chủ ý KHÔNG làm (mức WON'T):**
- Gán kỹ thuật viên cho phiếu (có trong danh mục luồng L2 của case study, em chủ ý không làm)
- Xử lý kỹ thuật, sửa chữa thiết bị thực tế
- Quản lý kho phụ tùng, linh kiện thay thế
- Thanh toán, xuất hóa đơn bảo hành
- Gửi thông báo tự động cho khách hàng (SMS, email)
- Màn hình quản trị danh mục nhóm sự cố và quy tắc SLA (việc này thực hiện bằng câu lệnh SQL)

**Bảng thuật ngữ** (dùng đúng một tên này trong SRS, sơ đồ, ERD và wireframe):

| Thuật ngữ | Định nghĩa | Tên trong CSDL |
|---|---|---|
| Phiếu bảo hành | Bản ghi một yêu cầu bảo hành của khách hàng | `warranty_request` |
| Khách hàng | Người mang thiết bị đến yêu cầu bảo hành, định danh bằng số điện thoại | `customer` |
| Thiết bị | Sản phẩm cần bảo hành, định danh bằng số serial | `device` |
| Nhóm sự cố | Loại lỗi: Lỗi phần cứng (HARDWARE), Lỗi phần mềm (SOFTWARE), Hao mòn tự nhiên (WEAR_AND_TEAR) | `issue_category` |
| Mức ưu tiên | Mức khẩn cấp xử lý: Khẩn cấp (URGENT), Bình thường (NORMAL), Thấp (LOW) | `priority` |
| Quy tắc SLA | Số giờ cam kết xử lý theo từng cặp (nhóm sự cố, mức ưu tiên) | `sla_rule` |
| Hạn cam kết xử lý | Thời điểm cam kết hoàn thành = thời điểm tiếp nhận + số giờ theo quy tắc SLA | `committed_deadline` |
| Trạng thái phiếu | Mới ghi nhận (NEW), Đã phân loại (CLASSIFIED), Đã tiếp nhận (RECEIVED) | `status` |

---

## 2. Các bên liên quan và vai trò

| Vai trò | Làm được | Không được làm |
|---|---|---|
| Nhân viên tiếp nhận (dùng hệ thống) | Tra cứu và tạo hồ sơ khách hàng; ghi nhận thiết bị và mô tả lỗi; phân loại nhóm sự cố; chọn mức ưu tiên; sinh hạn cam kết xử lý | Sửa quy tắc SLA hoặc danh mục nhóm sự cố; xem báo cáo tổng hợp của trung tâm |
| Quản lý trung tâm (dùng hệ thống) | Xem danh sách phiếu bảo hành và trạng thái, lọc theo trạng thái | Tạo hoặc sửa phiếu bảo hành; thay đổi nhóm sự cố, mức ưu tiên |
| Khách hàng (không dùng hệ thống trực tiếp) | Cung cấp thông tin cho nhân viên; nhận thông báo hạn cam kết xử lý từ nhân viên | Truy cập hệ thống |

---

## 3. Yêu cầu chức năng

### 3.1 Yêu cầu chức năng (FR)

| Mã | Yêu cầu (kiểm chứng được) |
|---|---|
| FR1 | Hệ thống cho phép nhập số điện thoại 10 chữ số và trả về thông tin khách hàng tương ứng, hoặc thông báo "Không tìm thấy khách hàng" nếu chưa có. |
| FR2 | Khi không tìm thấy khách hàng, hệ thống cho phép tạo hồ sơ mới gồm số điện thoại và họ tên (bắt buộc), email (không bắt buộc); từ chối nếu số điện thoại đã tồn tại. |
| FR3 | Hệ thống cho phép ghi nhận thiết bị (số serial, mẫu thiết bị – bắt buộc) và mô tả lỗi (bắt buộc, không rỗng) gắn với một phiếu bảo hành. |
| FR4 | Hệ thống cho phép chọn nhóm sự cố từ danh mục cho phiếu bảo hành; từ chối nếu phiếu chưa có mô tả lỗi. |
| FR5 | Hệ thống cho phép chọn mức ưu tiên (Khẩn cấp, Bình thường, Thấp) cho phiếu bảo hành. |
| FR6 | Hệ thống tự sinh hạn cam kết xử lý theo quy tắc SLA; từ chối và báo thiếu thông tin nếu phiếu chưa có nhóm sự cố hoặc mức ưu tiên. |
| FR7 | Hệ thống cho phép quản lý xem danh sách phiếu bảo hành kèm trạng thái và lọc theo trạng thái. |

### 3.2 User Story và mức MoSCoW

| Mã | User Story | MoSCoW |
|---|---|---|
| US1 | Là nhân viên tiếp nhận, tôi muốn tra cứu khách hàng theo số điện thoại và tạo hồ sơ mới nếu chưa có, để xác định đúng khách hàng cần lập phiếu bảo hành. | **MUST** |
| US2 | Là nhân viên tiếp nhận, tôi muốn ghi nhận thiết bị của khách hàng, để xác định đúng thiết bị cần bảo hành. | SHOULD |
| US3 | Là nhân viên tiếp nhận, tôi muốn ghi nhận mô tả lỗi của thiết bị, để có đủ thông tin phục vụ phân loại sự cố. | SHOULD |
| US4 | Là nhân viên tiếp nhận, tôi muốn phân loại nhóm sự cố dựa trên mô tả lỗi, để xác định hướng xử lý phù hợp. | **MUST** |
| US5 | Là nhân viên tiếp nhận, tôi muốn xác định mức ưu tiên của phiếu, để các trường hợp khẩn cấp được xử lý trước. | SHOULD |
| US6 | Là nhân viên tiếp nhận, tôi muốn hệ thống tự sinh hạn cam kết xử lý sau khi phân loại, để thông báo thời gian dự kiến hoàn thành cho khách hàng. | **MUST** |
| US7 | Là quản lý trung tâm, tôi muốn xem danh sách và trạng thái các phiếu bảo hành, để theo dõi tình hình xử lý của đội ngũ. | COULD |

### 3.3 Tiêu chí chấp nhận cho story MUST (Given – When – Then)

**US1 – Tra cứu và tạo hồ sơ khách hàng**
1. Given số điện thoại hợp lệ đã tồn tại, When nhân viên nhấn tra cứu, Then hệ thống hiển thị thông tin khách hàng tương ứng.
2. *(Ngoại lệ)* Given số điện thoại hợp lệ nhưng chưa có trong hệ thống, When nhân viên nhấn tra cứu, Then hệ thống báo "Không tìm thấy khách hàng" và cho phép tạo hồ sơ mới.
3. *(Ngoại lệ)* Given số điện thoại không đủ 10 chữ số, When nhân viên nhấn tra cứu, Then hệ thống báo lỗi định dạng và không thực hiện tìm kiếm.

**US4 – Phân loại nhóm sự cố**
1. Given phiếu đã có mô tả lỗi, When nhân viên chọn nhóm sự cố, Then hệ thống lưu nhóm sự cố và chuyển trạng thái phiếu sang "Đã phân loại".
2. *(Ngoại lệ)* Given phiếu chưa có mô tả lỗi, When nhân viên chọn nhóm sự cố, Then hệ thống yêu cầu nhập mô tả lỗi trước và không lưu phân loại.
3. *(Ngoại lệ)* Given nhóm sự cố được chọn không nằm trong danh mục, When nhân viên lưu, Then hệ thống từ chối và báo nhóm sự cố không hợp lệ.

**US6 – Sinh hạn cam kết xử lý**
1. Given phiếu đã có nhóm sự cố và mức ưu tiên, When hệ thống tính hạn, Then hạn cam kết được sinh theo quy tắc SLA và hiển thị cho nhân viên.
2. Given hai phiếu cùng nhóm sự cố, một phiếu "Khẩn cấp" và một phiếu "Bình thường", When hệ thống sinh hạn, Then hạn của phiếu "Khẩn cấp" sớm hơn.
3. *(Ngoại lệ)* Given phiếu chưa có nhóm sự cố hoặc mức ưu tiên, When hệ thống cố sinh hạn, Then hệ thống từ chối và báo thiếu thông tin phân loại.

---

## 4. Yêu cầu phi chức năng

| Mã | Yêu cầu | Ngưỡng đo được | Cách kiểm chứng |
|---|---|---|---|
| NFR1 | Hiệu năng tra cứu khách hàng | Trả kết quả **≤ 2 giây** với **≤ 10.000** khách hàng | Nạp 10.000 bản ghi mô phỏng, đo thời gian phản hồi của API tra cứu |
| NFR2 | Sinh hạn cam kết tự động | **100%** phiếu có đủ nhóm sự cố và mức ưu tiên được sinh hạn tự động, thời gian sinh **≤ 1 giây** | Chạy thử mọi tổ hợp (nhóm sự cố × mức ưu tiên) trong bảng SLA |
| NFR3 | Khả dụng | **≥ 99%** thời gian trong giờ hành chính (8h–18h) | Ghi nhận tỷ lệ phản hồi thành công trong thời gian chạy thử |
| NFR4 | Bảo mật cấu hình | **0** mật khẩu CSDL hoặc khóa bí mật trong mã nguồn; **0** file `.env` trong repo | Chạy `git ls-files` và tìm chuỗi mật khẩu trong repo |
| NFR5 | Dễ mở rộng danh mục | Thêm một nhóm sự cố mới cần **0 dòng mã** thay đổi, chỉ thêm **1 dòng dữ liệu** trong `issue_category` | Thêm thử một nhóm sự cố và chạy lại luồng phân loại |

---

## 5. Ràng buộc và quy tắc nghiệp vụ

**Ràng buộc kỹ thuật:** backend Node.js + Express.js; cơ sở dữ liệu MySQL; frontend React.js; không viết mã trong BT1 (chỉ tài liệu và sơ đồ).

**Quy tắc nghiệp vụ:**

| Mã | Quy tắc | Nguồn |
|---|---|---|
| QT1 | Số điện thoại gồm đúng 10 chữ số, bắt đầu bằng 0 và duy nhất cho mỗi khách hàng. | Phân tích của em |
| QT2 | Số serial thiết bị là duy nhất; mô tả lỗi không được rỗng trước khi phân loại. | Phân tích của em |
| QT3 | Phiếu phải có nhóm sự cố và mức ưu tiên trước khi sinh hạn cam kết. | Phân tích của em |
| QT4 | Hạn cam kết = thời điểm tiếp nhận + số giờ theo quy tắc SLA (bảng dưới). | Phân tích của em |
| QT5 | Trạng thái phiếu đi theo thứ tự NEW → CLASSIFIED → RECEIVED; mỗi lần đổi trạng thái ghi vào bảng lịch sử. | Phân tích của em |

**Quy tắc SLA mẫu** (số giờ do em đặt cho prototype, chưa phải số liệu thực tế của trung tâm):

| Nhóm sự cố | Khẩn cấp | Bình thường | Thấp |
|---|---|---|---|
| Lỗi phần cứng | 24 giờ | 72 giờ | 120 giờ |
| Lỗi phần mềm | 12 giờ | 48 giờ | 96 giờ |
| Hao mòn tự nhiên | 48 giờ | 96 giờ | 168 giờ |

---

## 6. Bảng truy vết yêu cầu

| FR | User Story | Use Case | MoSCoW |
|---|---|---|---|
| FR1 | US1 | UC1 – Tra cứu khách hàng theo số điện thoại | MUST |
| FR2 | US1 | UC2 – Tạo hồ sơ khách hàng mới | MUST |
| FR3 | US2, US3 | UC3 – Ghi nhận thiết bị cần bảo hành; UC4 – Ghi nhận mô tả lỗi | SHOULD |
| FR4 | US4 | UC5 – Phân loại nhóm sự cố | MUST |
| FR5 | US5 | UC6 – Xác định mức ưu tiên xử lý | SHOULD |
| FR6 | US6 | UC7 – Sinh hạn cam kết xử lý | MUST |
| FR7 | US7 | UC8 – Xem danh sách yêu cầu bảo hành | COULD |

---

## Ghi chú thay đổi so với bản Buổi 4

- Giảm từ 8 xuống **7 User Story** theo đề BT1 (5–7 story): gộp US1 và US2 cũ thành US1 vì UC2 chỉ là nhánh `<<extend>>` của UC1; US3–US8 cũ đổi thành US2–US7.
- Thêm mục **Các bên liên quan**, phần **WON'T**, bảng **quy tắc nghiệp vụ** và quy tắc SLA mẫu.
- Thêm **NFR5**; sửa **NFR4** từ "mã hóa số điện thoại khi lưu" (mâu thuẫn với tra cứu theo số điện thoại ở NFR1) thành yêu cầu đo được về cấu hình bí mật.
- Bảng thuật ngữ bổ sung tên bảng CSDL tương ứng để khớp với ERD.
