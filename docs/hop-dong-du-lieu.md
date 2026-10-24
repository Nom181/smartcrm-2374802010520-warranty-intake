# Hợp đồng dữ liệu ở các ranh giới (Buổi 9–10)

Mỗi ranh giới ghi đủ ba thứ: **hình dạng**, **ý nghĩa**, **hành vi khi sai**.

| Ranh giới | Hợp đồng viết ở đâu | Thi hành bằng | Nếu bỏ qua |
|---|---|---|---|
| Giao diện ↔ API | Mục "Định dạng lỗi" dưới đây, README mục 5 | `src/frontend/src/api/client.js` (một chỗ duy nhất gọi API) | Giao diện vỡ khi backend đổi tên trường |
| Controller ↔ Service | `validators/*.validator.js` (tầng 1: định dạng, 400 + tên trường) | Hàm kiểm tra gọi ở route, không rải `if` trong service | Dữ liệu bẩn lọt vào nghiệp vụ |
| Service ↔ Repository | Comment đầu hàm `toRequest` trong `warranty-request.repository.js` | `toRequest()` là chỗ DUY NHẤT biết tên cột SQL | Đổi tên cột phải sửa nhiều màn hình |

## 1. Một phiếu bảo hành (đầu ra của `toRequest`)

| Trường | Kiểu | Ý nghĩa / quy tắc | Khi chưa có |
|---|---|---|---|
| `requestId`, `customerId`, `deviceId` | số nguyên | Khoá | luôn có |
| `issueDesc` | chuỗi ≤ 1000 ký tự | Mô tả lỗi (QT9) | luôn có |
| `categoryId`, `category` | số / `{code, name}` | Nhóm sự cố | `null` khi chưa phân loại |
| `priority` | `URGENT` \| `NORMAL` \| `LOW` | Mức ưu tiên | `null` khi chưa chọn |
| `status` | `NEW` \| `CLASSIFIED` \| `RECEIVED` | Trạng thái (QT5) | luôn có |
| `receivedAt`, `committedDeadline` | thời điểm UTC (ISO 8601 khi ra JSON) | Lúc tiếp nhận; hạn cam kết = tiếp nhận + giờ SLA (QT4) | `null` khi chưa tiếp nhận |
| `customer` | `{fullName, phone}` | Khách hàng | luôn có |
| `device` | `{serialNo, modelName}` | Thiết bị | luôn có |

Hành vi khi sai: không tìm thấy phiếu → service ném `KHONG_TIM_THAY_PHIEU` → API trả 404.

## 2. Định dạng lỗi của toàn bộ API

Ba trường cố định; giao diện dựa vào `error` để rẽ nhánh, không dựa vào câu chữ của `message`.

```json
{ "error": "DU_LIEU_KHONG_HOP_LE", "message": "Dữ liệu gửi lên chưa hợp lệ.",
  "fields": { "phone": "số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0" },
  "chi_tiet": [ { "truong": "phone", "ly_do": "số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0" } ] }
```

| HTTP | Khi nào | Bên gọi làm gì |
|---|---|---|
| 200 / 201 | Thành công, thân `{ "data": ... }` | Hiển thị dữ liệu |
| 400 | Sai định dạng đầu vào; có `fields` | Hiện lỗi cạnh từng ô nhập |
| 401 | Chưa đăng nhập hoặc token hết hạn | Xoá token, về trang đăng nhập |
| 403 | Không đủ quyền | Báo không đủ quyền |
| 404 / 409 | Không tìm thấy / vi phạm quy tắc nghiệp vụ | Hiện thông điệp, gợi ý bước tiếp |
| 500 / 503 | Lỗi hệ thống / CSDL không sẵn sàng | Thông báo chung và nút Thử lại; không lộ chi tiết kỹ thuật |

`chi_tiet` là trường cũ (giữ để bên gọi cũ không vỡ); `fields` là trường mới theo tài liệu buổi 9. Xem TD-13.

## 3. Kiểm thử hợp đồng

`tests/04-hop-dong.test.js`: kiểm tra tên trường, kiểu và giá trị `null` của `toRequest`, và định dạng lỗi `error` + `message` + `fields`.

## 4. Quy trình đổi hợp đồng

1. **Mở rộng**: thêm trường mới song song với trường cũ. 2. **Chuyển**: mỗi commit chuyển một bên gọi. 3. **Thu hẹp**: chỉ xoá trường cũ khi không còn ai dùng. Không đổi tên tại chỗ trong một commit. Cập nhật comment hợp đồng, kiểm thử và tài liệu này trong CÙNG commit với mã.
