# API Contract – Track SE – Luồng L2 (Tiếp nhận và Phân loại Yêu cầu Bảo hành)

**Sinh viên:** Võ Minh Triều – MSSV: 2374802010520

Các endpoint dưới đây phục vụ 3 User Story MUST: US1, US5, US7.

---

## Danh sách endpoint

| Endpoint | Method | Mục đích | Truy vết |
|---|---|---|---|
| `/api/customers/search?phone=...` | GET | Tra cứu khách hàng theo số điện thoại | US1 |
| `/api/warranty-requests/:id/classify` | PATCH | Phân loại nhóm sự cố cho phiếu bảo hành | US5 |
| `/api/warranty-requests/:id/commit-deadline` | POST | Sinh hạn cam kết xử lý | US7 |

---

## 1. GET /api/customers/search?phone=0901234567

Tra cứu khách hàng theo số điện thoại.

**Response 200 OK (tìm thấy):**
```json
{
  "id": 101,
  "name": "Nguyen Van A",
  "phone": "0901234567",
  "email": "a.nguyen@gmail.com"
}
```

**Response 404 Not Found (không tìm thấy):**
```json
{
  "error": "CUSTOMER_NOT_FOUND",
  "message": "Khong tim thay khach hang voi so dien thoai nay"
}
```

**Response 400 Bad Request (sai định dạng SĐT):**
```json
{
  "error": "INVALID_PHONE_FORMAT",
  "message": "So dien thoai phai gom 10 chu so"
}
```

---

## 2. PATCH /api/warranty-requests/15/classify

Phân loại nhóm sự cố cho một phiếu bảo hành đã tồn tại (id = 15 là ví dụ).

**Request body:**
```json
{
  "issueCategory": "HARDWARE"
}
```

**Response 200 OK:**
```json
{
  "id": 15,
  "issueCategory": "HARDWARE",
  "status": "CLASSIFIED"
}
```

**Response 400 Bad Request (thiếu mô tả lỗi trước đó):**
```json
{
  "error": "MISSING_ISSUE_DESCRIPTION",
  "message": "Can nhap mo ta loi truoc khi phan loai"
}
```

**Response 404 Not Found:**
```json
{
  "error": "REQUEST_NOT_FOUND",
  "message": "Khong tim thay phieu bao hanh"
}
```

---

## 3. POST /api/warranty-requests/15/commit-deadline

Sinh hạn cam kết xử lý cho phiếu bảo hành đã được phân loại (id = 15 là ví dụ). Request không cần body, hệ thống tự tính dựa trên nhóm sự cố và mức ưu tiên đã lưu.

**Response 201 Created:**
```json
{
  "id": 15,
  "priority": "URGENT",
  "issueCategory": "HARDWARE",
  "committedDeadline": "2026-10-05T17:00:00Z"
}
```

**Response 409 Conflict (chưa phân loại trước đó):**
```json
{
  "error": "CLASSIFICATION_REQUIRED",
  "message": "Phieu bao hanh chua duoc phan loai, khong the sinh han cam ket"
}
```

---

## Bảng quy tắc validation

| Trường | Bắt buộc | Kiểu | Độ dài / Dải giá trị |
|---|---|---|---|
| `phone` | Có | string | Đúng 10 chữ số, bắt đầu bằng 0 |
| `issueCategory` | Có | enum | `HARDWARE`, `SOFTWARE`, `WEAR_AND_TEAR` |
| `priority` | Có (trước khi sinh hạn cam kết) | enum | `URGENT`, `NORMAL`, `LOW` |
| `id` (warranty request) | Có | integer | > 0, phải tồn tại trong CSDL |

---

## Tự kiểm tra truy vết

| Endpoint | User Story |
|---|---|
| GET /api/customers/search | US1 |
| PATCH /api/warranty-requests/:id/classify | US5 |
| POST /api/warranty-requests/:id/commit-deadline | US7 |

Mỗi endpoint đều truy vết được về đúng 1 User Story MUST trong bảng truy vết của SRS.
