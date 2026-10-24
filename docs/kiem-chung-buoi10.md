# Kiểm chứng Buổi 10 – Workshop module mở rộng & Giao diện (Sprint 2)

## 1. Thử clone repo mới và chạy theo README mục 3

Bản clone sạch từ GitHub (`git clone` + `git checkout v0.2`), CSDL riêng, cổng riêng, làm đúng từng bước README mục 3 (thực hiện bằng công cụ AI trong môi trường thử, ngày 23/10/2026):

| Bước README | Lệnh | Kết quả |
|---|---|---|
| 2 | `cp .env.example .env` rồi chỉnh `.env` | Chạy được |
| 4 | `npm run setup` | Cài xong thư viện |
| 5 | `npm run db:setup` (chạy 2 lần) | Cả hai lần đều xong; số dòng không đổi: customer 28, device 28, issue_category 3, sla_rule 9, warranty_request 28 |
| 6 | `npm test` | 43 PASS, 0 FAIL |
| – | `npm run test:integration` | 5 PASS, 0 FAIL |
| 7 | `npm start` | `GET /api/health` trả `{"status":"ok","db":"up"}`; đăng nhập `staff01` trả token |

Lưu ý khi thử: `db:setup` cần tài khoản MySQL có quyền tạo CSDL (XAMPP dùng `root`, mật khẩu trống là đủ).

**[Em tự điền]** Lần em tự clone và chạy trên máy em: ngày ___, bước nào lỗi hoặc phải đoán: ___

## 2. Đối chiếu checklist 10 mục

| # | Mục | Tình trạng |
|---|---|---|
| 1 | Module mở rộng (SE) chạy được | Đạt: giao diện React 3 màn hình gọi API thật |
| 2 | Luồng chính end-to-end | Đạt: tạo phiếu → phân loại → sinh hạn → tiếp nhận |
| 3 | Dữ liệu mẫu thật | Đạt: seed 28 khách/thiết bị/phiếu |
| 4 | Ảnh kết quả trong `docs/` | Đạt: `docs/anh/` |
| 5 | ≥ 5 unit test PASS | Đạt: 50 test (+5 tích hợp); bản v0.2 có 43 |
| 6 | ≥ 1 test biên/ngoại lệ | Đạt: `tests/02-gia-tri-bien.test.js`; thêm `tests/04-hop-dong.test.js` (hợp đồng ở ranh giới) |
| 7 | Ba trạng thái | Đạt: `AsyncView` (đang tải, rỗng, lỗi) |
| 8 | README mục 3 đủ, mỗi bước một lệnh | Đạt |
| 9 | Đã thử clone ở thư mục mới | Đạt (mục 1 ở trên) |
| 10 | Commit theo quy ước, ≥ 8 | Đạt khi commit tài liệu này được đẩy lên |

Kiểm tra giao diện: không có `fetch(` trong `src/frontend/src/pages/` và `components/`; mọi lời gọi API đi qua `src/api/client.js`; phản hồi 401 (trừ trang đăng nhập) xoá token và về trang đăng nhập.

## 3. Việc bổ sung theo tài liệu Buổi 9 (tự học) và slide Buổi 10

| Yêu cầu | Việc đã làm |
|---|---|
| Hợp đồng dữ liệu tường minh | Comment hợp đồng ở `toRequest`, `docs/hop-dong-du-lieu.md` |
| Test hợp đồng | `tests/04-hop-dong.test.js` (7 test) |
| Lỗi API thống nhất `error` + `message` + `fields` | Thêm `fields`, giữ `chi_tiet` (TD-13) |
| Base URL từ biến môi trường, có `.env.example` | `src/frontend/.env.example` (`VITE_API_BASE`) |
| Ghi cách lưu token và hạn chế | README mục 7 |
| Thử khung hẹp 375px, bảng không tràn ngang | Bọc bảng trong `.table-wrap`; trước khi sửa trang rộng 528px, sau khi sửa 375px ở 4 màn hình; ảnh `docs/anh/13-khung-hep-375px.png` |
| `package-lock.json` đã commit, README ghi backend chạy trước | Đã có |

## 4. Phạm vi đã cắt

Không cắt tính năng nào so với phạm vi BT2 (xem `docs/thay-doi-thiet-ke.md`).

## 4. Peer review

**[Em tự điền]** Bạn cùng lớp: ___ ; ngày: ___
- Điều chạy tốt: ___
- Bước README cần sửa: ___
- Rủi ro cho BT2: ___
- Em đã xử lý thế nào: ___
