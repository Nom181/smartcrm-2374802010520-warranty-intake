# Security Checklist

Smart CRM – Warranty request intake · Student: Vo Minh Trieu · ID 2374802010520

Seven items, each with a status (DONE / NOT YET DONE / NOT APPLICABLE) and one line of evidence that can be re-checked. Repository: https://github.com/Nom181/smartcrm-2374802010520-warranty-intake

| # | Item | Status | Evidence (one line) |
|---|---|---|---|
| 1 | No secrets in the repository or its history | DONE | `git log --all --oneline -- .env` prints nothing; `.env` is in `.gitignore`; only `.env.example` (placeholder values) is committed. |
| 2 | Input is validated at the application layer | DONE | Every route validates its body (`src/backend/validators/`); invalid data returns 400/422 (TC-06, TC-07, BUG-006 test PASS); SQL values always go through `?` placeholders, and the only template strings in queries are fixed fragments such as `WHERE phone LIKE ?`. |
| 3 | Access control: each role can only do what it is allowed to | DONE (role-based) | TC-09: `manager01` creating a request gets `403 KHONG_DU_QUYEN` and the request count is unchanged (`docs/screenshots/TC-09.png`); no token gets `401`. |
| 4 | Passwords are stored hashed | DONE | `app_user.password_hash` holds `scrypt$<salt>$<hash>`, not readable (`docs/screenshots/SEC-03-password-hash.png`). |
| 5 | Error messages do not leak internals | DONE | Unexpected errors return only `{"error":"LOI_HE_THONG",...}`; unit tests "unexpected error -> 500 generic" and "DB unreachable -> 503 clear message" PASS; screenshot `docs/screenshots/BUG-006-before.png`. |
| 6 | Logs do not record secrets or personal data | DONE | After creating a request and a failed login, `docker compose logs api \| Select-String -Pattern "password\|token\|0[0-9]{9}"` prints nothing (`docs/screenshots/SEC-06-logs-grep.png`); the code only logs start-up lines and unexpected errors, never request bodies. |
| 7 | Dependencies are pinned and checked for known vulnerabilities | NOT YET DONE (partly) | Both `package-lock.json` files are committed and the API image uses `npm ci`. Backend: `npm audit` shows 0 vulnerabilities after upgrading `body-parser` 1.20.8 → 1.20.9. Frontend: 5 advisories remain (2 moderate in `react-router-dom`, 3 in dev-only tools `vite`/`esbuild`); fixing them needs major upgrades (react-router 7, vite 8). Plan: upgrade on a separate branch and re-run all tests after BT3. Screenshots: `docs/screenshots/SEC-07-npm-audit-backend.png`, `docs/screenshots/SEC-07-npm-audit-frontend.png`. |

## Known limitations (not hidden)

- The login token is kept in the browser `localStorage`; there is no rate limiting or token refresh (out of scope for this phase, listed in the README).
- Access control is by role (STAFF / MANAGER). Customers have no login, and staff can see every request, because the SRS treats staff as shared service-centre employees.
- There is no per-request access log (no request id), so the logs only show start-up lines and unexpected errors.
- The demo password `Demo@2026` is for seed data only; the database root password and `AUTH_SECRET` must be changed for any real deployment.
- The API container runs as the non-root user `node` and the database port is not published to the host; the `web` (nginx) container uses the default image user.
