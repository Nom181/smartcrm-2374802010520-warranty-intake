# Smart CRM – Tiếp nhận và phân loại yêu cầu bảo hành (luồng L2, track SE)

**Sinh viên:** Võ Minh Triều – MSSV 2374802010520 · Chuyên đề Tốt nghiệp 1 – ĐH Văn Lang
**Phiên bản nộp Bài tập 2:** tag `v0.2`

## 1. Hệ thống làm gì

Nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại (tạo hồ sơ nếu chưa có), ghi nhận thiết bị và mô tả lỗi, chọn nhóm sự cố và mức ưu tiên; hệ thống tự sinh **hạn cam kết xử lý** = thời điểm tiếp nhận + số giờ theo quy tắc SLA. Quản lý trung tâm xem danh sách phiếu và lọc theo trạng thái.

Công nghệ: Node.js + Express (backend), MySQL/MariaDB, React + Vite (frontend). Kiến trúc ba tầng một chiều: `routes → services → repositories` (sơ đồ: `docs/architecture-thuc-te.png`).

## 2. Yêu cầu môi trường

- Node.js 20 trở lên và npm 10 trở lên (đã chạy trên Node 22)
- MySQL 8 hoặc MariaDB 10.x (XAMPP đi kèm MariaDB). Đã thử trên MariaDB 10.11
- Git
- Cổng trống: 3000 (API), 5173 (giao diện), 3306 (CSDL)
- Biến môi trường: xem `.env.example` (PORT, APP_TIMEZONE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, AUTH_SECRET, TOKEN_TTL_HOURS)

## 3. Dựng lại hệ thống từ đầu

Chạy lần lượt từng lệnh, từ thư mục gốc của repo. Không cần thao tác nào ngoài các lệnh này.

Bước 1 – Lấy mã nguồn đúng phiên bản nộp:

```
git clone https://github.com/Nom181/smartcrm-2374802010520-warranty-intake.git
cd smartcrm-2374802010520-warranty-intake
git checkout v0.2
```

Bước 2 – Tạo tệp cấu hình riêng (tệp `.env` không bao giờ được commit):

```
cp .env.example .env
```

Mở `.env`, đặt `AUTH_SECRET` thành chuỗi ngẫu nhiên (lấy bằng lệnh `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Nếu MySQL của em có mật khẩu cho `root`, điền vào `DB_PASSWORD` (XAMPP mặc định để trống).

Bước 3 – Bật MySQL (XAMPP Control Panel → Start ở dòng MySQL).

Bước 4 – Cài thư viện (có tệp khoá phiên bản `package-lock.json` ở backend và frontend):

```
npm run setup
```

Bước 5 – Tạo CSDL, bảng và nạp dữ liệu mẫu (có thể chạy lại bao nhiêu lần cũng không lỗi, không nhân đôi dữ liệu):

```
npm run db:setup
```

Bước 6 – Chạy kiểm thử (không cần CSDL):

```
npm test
```

Bước 7 – Chạy hệ thống, mỗi lệnh một cửa sổ terminal:

```
npm start
```

```
npm run start:web
```

Mở http://localhost:5173 và đăng nhập (mật khẩu chung của dữ liệu mẫu: `Demo@2026`):

| Tài khoản | Vai trò | Được làm |
|---|---|---|
| `staff01` | Nhân viên tiếp nhận | Tạo phiếu, phân loại, sinh hạn, sửa, xoá phiếu mới |
| `manager01` | Quản lý trung tâm | Chỉ xem danh sách và chi tiết phiếu |

Kiểm tra nhanh API còn sống: `curl localhost:3000/api/health` → `{"status":"ok","db":"up"}`.

## 4. Kiểm thử

| Lệnh | Làm gì |
|---|---|
| `npm test` | 50 kiểm thử, bốn nhóm: **luồng đúng**, **giá trị biên**, **dữ liệu sai** (`tests/01-…`, `02-…`, `03-…`) và **hợp đồng ở ranh giới** (`tests/04-…`). Dùng repository giả nên không cần CSDL và không phụ thuộc dữ liệu trên máy |
| `npm run test:integration` | 5 kiểm thử cần MySQL đang chạy, dùng CSDL riêng `warranty_intake_test` (kiểm tra migration hai lần, seed hai lần không nhân đôi, repository MySQL thật). Tài khoản trong `.env` cần quyền tạo/xoá CSDL đó |

Phép thử ranh giới tầng (30 giây) – lệnh sau không được in ra dòng nào:

```
grep -nwE "req|res|SELECT" src/backend/services/*.js
```

## 5. Cấu trúc thư mục và API

```
docs/            srs.md, thay-doi-thiet-ke.md, ai-disclosure.md, architecture-thuc-te.*, anh/ (ảnh chụp minh chứng)
migrations/      001_init_schema.sql, 002_create_app_user.sql   (chạy theo thứ tự số, IF NOT EXISTS)
seeds/           001_seed_catalog.sql (nhóm sự cố + SLA), 002_seed_demo.sql (28 khách/thiết bị/phiếu, 2 tài khoản)
tests/           01-luong-dung, 02-gia-tri-bien, 03-du-lieu-sai, integration/, helpers/ (repository giả)
src/backend/
  routes/        TẦNG 1 – nhận HTTP, không có logic nghiệp vụ
  middleware/    xác thực token, phân quyền, xử lý lỗi (AppError → mã HTTP)
  validators/    kiểm định dạng dữ liệu vào, trả 400 kèm tên trường sai
  services/      TẦNG 2 – quy tắc nghiệp vụ, không biết HTTP
  repositories/  TẦNG 3 – SQL tham số hoá, không có quy tắc nghiệp vụ
  app.js         ghép routes + middleware; container.js ghép repository + service
src/frontend/    React: pages/, components/, hooks/, auth/, api/client.js (lớp client duy nhất)
```

Quy tắc nghiệp vụ nằm ở: `services/customer.service.js` (QT1), `services/device.service.js` (QT2, ngày mua), `services/warranty-request.service.js` (QT2–QT5, khoá, xoá), `services/deadline.service.js` (QT4).

Mọi phản hồi lỗi có dạng `{ "error": "MA_LOI", "message": "…", "chi_tiet": [{ "truong": "…", "ly_do": "…" }] }`, không bao giờ chứa vết ngăn xếp hay câu SQL.

| Phương thức và đường dẫn | Vai trò | Mô tả |
|---|---|---|
| `POST /api/auth/login` | — | Đăng nhập, trả token (gửi kèm `Authorization: Bearer <token>`) |
| `GET /api/auth/me` | đã đăng nhập | Thông tin người dùng của token |
| `GET /api/health` | — | Tình trạng API và CSDL (503 nếu CSDL tắt) |
| `GET /api/customers/lookup?phone=` | STAFF | FR1: tra cứu theo số điện thoại (404 nếu chưa có) |
| `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/:id` | STAFF | CRUD khách hàng (FR2) |
| `GET /api/devices/lookup?serial=` | STAFF | Tra cứu thiết bị theo serial |
| `GET/POST /api/devices`, `GET/PUT/DELETE /api/devices/:id` | STAFF | CRUD thiết bị |
| `GET /api/requests?status=&q=&page=&pageSize=` | STAFF, MANAGER | FR7: danh sách và lọc |
| `GET /api/requests/summary` | STAFF, MANAGER | Số phiếu theo trạng thái, số phiếu quá hạn |
| `GET /api/requests/:id` | STAFF, MANAGER | Chi tiết + lịch sử + bảng SLA của nhóm |
| `POST /api/requests` | STAFF | Tạo phiếu (NEW) |
| `PATCH /api/requests/:id` | STAFF | Sửa mô tả lỗi (khi chưa RECEIVED) |
| `PUT /api/requests/:id/category` | STAFF | FR4: chọn nhóm sự cố → CLASSIFIED |
| `PUT /api/requests/:id/priority` | STAFF | FR5: chọn mức ưu tiên |
| `POST /api/requests/:id/deadline` | STAFF | FR6: sinh hạn cam kết → RECEIVED |
| `DELETE /api/requests/:id` | STAFF | Xoá phiếu (chỉ khi NEW) |
| `GET /api/categories`, `GET /api/sla-rules` | đã đăng nhập | Danh mục nhóm sự cố và quy tắc SLA |

Ví dụ gọi thử bằng curl (sau khi `npm start`):

```
curl -s -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"staff01","password":"Demo@2026"}'
```

```
curl -i "localhost:3000/api/customers/lookup?phone=091234567" -H "Authorization: Bearer <token>"
```

Lệnh thứ hai gửi số điện thoại 9 chữ số nên nhận `400 DU_LIEU_KHONG_HOP_LE` kèm tên trường `phone`.

**Định dạng lỗi chung của API:** mọi lỗi có `error` (mã máy đọc), `message` (câu tiếng Việt cho người dùng) và, với lỗi định dạng, `fields` (tên trường → lý do). Lỗi người dùng trả 4xx, lỗi hệ thống trả 500/503 với thông báo chung, không lộ chi tiết kỹ thuật. Bảng đầy đủ và hợp đồng dữ liệu của phiếu: `docs/hop-dong-du-lieu.md`.

**Cấu hình giao diện:** địa chỉ API đọc từ biến `VITE_API_BASE` (mẫu ở `src/frontend/.env.example`). Mặc định `/api`, Vite chuyển sang `http://localhost:3000`, nên chạy theo mục 3 không cần chỉnh gì. Backend phải chạy trước giao diện.

## 6. Trạng thái hiện tại (v0.2)

- [x] Migration dựng được CSDL từ trống; chạy lại lần hai không lỗi; seed không nhân đôi
- [x] CRUD khách hàng, thiết bị, phiếu bảo hành qua ba tầng routes / services / repositories
- [x] Quy tắc nghiệp vụ: QT1 (số điện thoại), QT2 (serial, mô tả lỗi), QT3 (đủ phân loại mới sinh hạn), QT4 (hạn = tiếp nhận + giờ SLA), QT5 (NEW → CLASSIFIED → RECEIVED + lịch sử)
- [x] Đăng nhập cơ bản, phân quyền STAFF / MANAGER
- [x] Bốn màn hình React gọi API thật qua `api/client.js`; ba trạng thái đang tải / rỗng (chưa có dữ liệu, bộ lọc không ra kết quả) / lỗi có nút Thử lại
- [x] 50 kiểm thử PASS bằng một lệnh (`npm test`) + 5 kiểm thử tích hợp
- [ ] Chưa có Dockerfile / docker-compose (mức "được đánh giá cao" của đề, không bắt buộc)
- [ ] Chưa làm (ngoài phạm vi BT2): tài liệu API hoàn chỉnh, tối ưu hiệu năng, rà soát bảo mật đầy đủ, triển khai công khai

Ghi chú: thay đổi so với thiết kế BT1 nằm ở `docs/thay-doi-thiet-ke.md`; khai báo AI ở `docs/ai-disclosure.md`.

## 7. Hạn chế đã biết

- `npm audit` ở `src/frontend` báo lỗ hổng mức vừa liên quan tới máy chủ phát triển của Vite/esbuild và `react-router`; sửa dứt điểm cần nâng Vite lên phiên bản lớn, để dành cho Bài tập 3. Giao diện chỉ chạy ở chế độ phát triển, không triển khai công khai.
- **Cách lưu token và hạn chế:** token đăng nhập lưu trong `localStorage` (khoá `warranty.token`). Đủ cho mức prototype nhưng mã JavaScript chèn vào trang (XSS) đọc được token; giao diện này không hiển thị nội dung người dùng nhập mà chưa được React thoát ký tự, nên rủi ro được giữ ở mức thấp. Hướng cải thiện: cookie HttpOnly do máy chủ đặt (cần cấu hình CORS), để dành cho Bài tập 3. Khi nhận 401, giao diện tự xoá token và chuyển về trang đăng nhập.
- Chưa thử trên MySQL 8 (chỉ MariaDB 10.11).
