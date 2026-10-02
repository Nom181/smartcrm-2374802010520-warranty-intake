# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành

**Sinh viên:** Võ Minh Triều – MSSV: 2374802010520
**Track:** SE
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang

## 1. Mô tả bài toán
Nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, phân loại nhóm sự cố và mức ưu tiên, sau đó sinh hạn cam kết xử lý cho yêu cầu bảo hành.

## 2. Phạm vi
- Làm: tra cứu khách hàng, tạo mới khách hàng (nếu chưa có), ghi nhận thiết bị, ghi nhận mô tả lỗi, phân loại nhóm sự cố, xác định mức ưu tiên, sinh hạn cam kết xử lý
- Không làm: xử lý kỹ thuật thực tế, quản lý kho phụ tùng, thanh toán/hóa đơn

## 3. Công nghệ sử dụng
| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | JavaScript |
| Frontend | React.js |
| Backend | Node.js + Express.js |
| CSDL | MySQL |

## 4. Cấu trúc thư mục
docs/          # SRS, sơ đồ, khai báo AI
  diagrams/
src/
  backend/
  frontend/
tests/
.env.example
.gitignore
README.md

## 5. Hướng dẫn cài đặt & chạy
Chạy các lệnh sau trong thư mục src/backend:
1. npm install
2. cp .env.example .env
3. Điền thông tin CSDL thật vào .env
4. node server.js

Sau đó truy cập http://localhost:3000 để kiểm tra.

## 6. Khai báo sử dụng công cụ AI
| Công cụ | Dùng vào việc gì | Cách tự kiểm chứng |
|---|---|---|
| Claude | Hỗ trợ soạn User Story, hướng dẫn cấu hình Git/backend | Đã tự chạy lại từng lệnh, kiểm tra kết quả thực tế trên máy |
