# API Documentation

Smart CRM – Warranty request intake (flow L2, track SE) · Student: Vo Minh Trieu · ID 2374802010520

REST API over HTTP, JSON bodies. Base URL: `http://localhost:3000/api` (Docker: host port `API_PORT`, default 3000; the web UI also proxies it at `http://localhost:8080/api`).

## 1. Conventions

**Authentication.** Log in with `POST /auth/login`, then send the token on every other request (except `/health`):

```
Authorization: Bearer <token>
```

Tokens are HMAC-signed and expire after `TOKEN_TTL_HOURS` (default 8).

**Roles.** `STAFF` can read and change data. `MANAGER` can only read requests (`GET /requests*`) and the catalog. The `/customers` and `/devices` endpoints are `STAFF` only.

**Success body.** `{ "data": ... }`; lists add `"meta"` with paging information. `DELETE` returns `204` without a body.

**Error body.** Every error has the same shape (no stack traces, no SQL):

```json
{ "error": "DU_LIEU_KHONG_HOP_LE", "message": "...", "chi_tiet": [ { "truong": "phone", "ly_do": "..." } ] }
```

| HTTP | Meaning | Example `error` codes |
|---|---|---|
| 400 | Malformed input | `DU_LIEU_KHONG_HOP_LE`, `JSON_KHONG_HOP_LE` |
| 401 | Missing, invalid or expired token; wrong credentials | `CHUA_DANG_NHAP`, `SAI_THONG_TIN_DANG_NHAP` |
| 403 | Role not allowed | `KHONG_DU_QUYEN` |
| 404 | Resource does not exist | `PHIEU_KHONG_TON_TAI`, `KHONG_TIM_THAY_KHACH_HANG`, `KHONG_TIM_THAY_THIET_BI` |
| 409 | Conflicts with current state | `SO_DIEN_THOAI_DA_TON_TAI`, `SERIAL_DA_TON_TAI`, `PHIEU_DA_TIEP_NHAN`, `PHIEU_CHI_XOA_KHI_MOI`, `PHIEU_DA_THAY_DOI` |
| 413 | Body larger than 100 KB | `DU_LIEU_QUA_LON` |
| 422 | Valid syntax but breaks a business rule | `THIEU_THONG_TIN_PHAN_LOAI`, `THIEU_QUY_TAC_SLA`, `NHOM_SU_CO_KHONG_HOP_LE` |
| 503 | Database unavailable | – |

**Paging.** `page` ≥ 1 (default 1), `pageSize` 1–100 (default 20). `q` (search) is at most 50 characters.

## 2. Request lifecycle

A warranty request moves `NEW → CLASSIFIED → RECEIVED`. A request that is `RECEIVED` can no longer be edited or deleted (`409`).

1. `POST /requests` → `NEW`
2. `PUT /requests/{id}/category` and `PUT /requests/{id}/priority` → `CLASSIFIED`
3. `POST /requests/{id}/deadline` → `RECEIVED`; `committedDeadline = receivedAt + sla_hours` from the `sla_rule` table (category + priority). It needs both category and priority, otherwise `422 THIEU_THONG_TIN_PHAN_LOAI`.

Concurrent changes are protected by optimistic locking: if the status changed in between, the API answers `409 PHIEU_DA_THAY_DOI`.

## 3. Endpoints

### Health and authentication

| Method & path | Role | Description |
|---|---|---|
| `GET /health` | public | `200 {"status":"ok","db":"up"}`; `503` if the database is down |
| `POST /auth/login` | public | Body `{ "username", "password" }` → `200 { data: { token, expiresAt, user } }`; wrong credentials → `401` (same message for unknown user and wrong password) |
| `GET /auth/me` | any | Current user from the token |

### Warranty requests

| Method & path | Role | Description |
|---|---|---|
| `GET /requests/summary` | STAFF, MANAGER | `{ total, byStatus: {NEW, CLASSIFIED, RECEIVED}, pastDeadline }` |
| `GET /requests?status=&q=&page=&pageSize=` | STAFF, MANAGER | Paged list. `status` ∈ `NEW`, `CLASSIFIED`, `RECEIVED`; `q` searches customer phone, customer name and device serial |
| `GET /requests/{id}` | STAFF, MANAGER | One request, or `404 PHIEU_KHONG_TON_TAI` |
| `POST /requests` | STAFF | Body `{ customerId, deviceId, issueDesc }` (`issueDesc` 1–1000 chars) → `201`, status `NEW` |
| `PATCH /requests/{id}` | STAFF | Body `{ issueDesc }`; only while not `RECEIVED` |
| `PUT /requests/{id}/category` | STAFF | Body `{ categoryId }` → status `CLASSIFIED` |
| `PUT /requests/{id}/priority` | STAFF | Body `{ priority }`, one of `URGENT`, `NORMAL`, `LOW` |
| `POST /requests/{id}/deadline` | STAFF | Generates `committedDeadline`, status → `RECEIVED` |
| `DELETE /requests/{id}` | STAFF | `204`; only while `NEW` (`409 PHIEU_CHI_XOA_KHI_MOI` otherwise) |

Request object:

```json
{
  "requestId": 29, "customerId": 3, "deviceId": 5, "issueDesc": "Does not power on",
  "categoryId": null, "priority": null, "status": "NEW",
  "receivedAt": null, "committedDeadline": null,
  "customer": { "fullName": "...", "phone": "0912345678" },
  "device": { "serialNo": "SN-...", "modelName": "..." },
  "category": null
}
```

### Customers (STAFF only)

| Method & path | Description |
|---|---|
| `GET /customers/lookup?phone=` | Find by phone: exactly 10 digits starting with 0, else `400`; not found → `404` |
| `GET /customers?q=&page=&pageSize=` | Paged list |
| `GET /customers/{id}` | One customer |
| `POST /customers` | Body `{ phone, fullName (2–100), email? }` → `201`; duplicate phone → `409` |
| `PUT /customers/{id}` | Same body as create |
| `DELETE /customers/{id}` | `204`; `409 KHACH_CO_PHIEU` if the customer has requests |

### Devices (STAFF only)

| Method & path | Description |
|---|---|
| `GET /devices/lookup?serial=` | Find by serial (6–50 chars: letters, digits, hyphen; stored upper-case) |
| `GET /devices`, `GET /devices/{id}` | Paged list / one device |
| `POST /devices` | Body `{ serialNo, modelName (2–100), purchaseDate? (YYYY-MM-DD, not in the future) }` → `201`; duplicate serial → `409` |
| `PUT /devices/{id}` | Same body as create |
| `DELETE /devices/{id}` | `204`; `409 THIET_BI_CO_PHIEU` if the device has requests |

### Catalog (any logged-in user)

| Method & path | Description |
|---|---|
| `GET /categories` | List of issue categories |
| `GET /sla-rules` | SLA hours per category and priority |

## 4. Example session

```
curl -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"staff01\",\"password\":\"Demo@2026\"}"
curl localhost:3000/api/requests?status=NEW -H "Authorization: Bearer <token>"
```

Business rules covered by automated tests: QT1 (phone format), QT2/QT9 (description 1–1000 chars), QT3 (category + priority required before a deadline), QT4 (SLA hours), QT5 (status history). See `docs/test-report.md`.
