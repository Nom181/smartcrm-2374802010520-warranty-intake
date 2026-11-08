# Security Checklist

Smart CRM – Warranty request intake · Student: Vo Minh Trieu · ID 2374802010520

Seven items, each with one line of evidence that can be re-checked. Repository: https://github.com/Nom181/smartcrm-2374802010520-warranty-intake

| # | Item | Status | Evidence (one line) |
|---|---|---|---|
| 1 | No secrets in the repository or its history | Done | `.env` is in `.gitignore`; `git log --all --oneline -- .env` prints nothing; only `.env.example` (placeholder values) is committed. |
| 2 | Secrets come from environment variables, not from code | Done | `config.js` reads `AUTH_SECRET` and `DB_*` from the environment and the API refuses to start if `AUTH_SECRET` is shorter than 16 characters; `docker-compose.yml` takes values from `.env`. |
| 3 | Passwords are stored hashed, and login does not reveal which part was wrong | Done | `app_user.password_hash` holds `scrypt$<salt>$<hash>` (not readable); unknown user and wrong password return the same `401 SAI_THONG_TIN_DANG_NHAP` message. |
| 4 | Access control: each role can only do what it is allowed to | Done | TC-09: `manager01` creating a request gets `403 KHONG_DU_QUYEN` and the request count is unchanged (screenshot `docs/screenshots/TC-09.png`); no token gets `401`. |
| 5 | Input is validated and every SQL statement is parameterised | Done | All queries go through `db.query(sql, [params])` with `?` placeholders; LIKE wildcards are escaped (search `%` finds nothing, see screenshot); TC-06/TC-07 and BUG-006 show invalid input is rejected with 400. |
| 6 | Errors do not leak internals (stack trace, SQL, table names) | Done | Unexpected errors return only `{"error":"LOI_HE_THONG","message":"..."}` (screenshot `docs/screenshots/BUG-006-before.png`); TC-08 returns 404, not 500. |
| 7 | Least privilege in deployment: non-root container and database not exposed | Done | `Dockerfile` has `USER node`; `docker-compose.yml` publishes no port for `db` (`docker compose ps` shows `3306/tcp` only inside Docker). |

## Known limitations (not hidden)

- The login token is kept in the browser `localStorage`; there is no rate limiting or token refresh (out of scope for this phase, listed in the README).
- The demo password `Demo@2026` is for seed data only; the database root password and `AUTH_SECRET` must be changed for any real deployment.
- The `web` (nginx) container runs with the default image user; only the API container was hardened.
