# Deployment Guide

Smart CRM – Warranty request intake (flow L2, track SE) · Student: Vo Minh Trieu · ID 2374802010520

The whole system (MariaDB + API + web UI) starts with **two commands** on a clean machine.

## 1. Prerequisites

| Requirement | Version / note |
|---|---|
| Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin (Linux) | Compose v2 or later (tested with v5.6.1) |
| Git | any recent version |
| Free TCP ports | 8080 (web UI) and 3000 (API). The database port is **not** published to the host. |

Node.js is **not** required on the host; it runs inside the containers.

## 2. Configuration

All settings come from environment variables. The real `.env` file is never committed (it is in `.gitignore`).

```
git clone https://github.com/Nom181/smartcrm-2374802010520-warranty-intake.git
cd smartcrm-2374802010520-warranty-intake
cp .env.example .env
```

| Variable | Meaning | Default in `.env.example` |
|---|---|---|
| `AUTH_SECRET` | Key used to sign login tokens (min. 16 characters). **Change it** for any real deployment. | sample placeholder |
| `DB_PASSWORD` | MariaDB root password. If empty, a sample password from `docker-compose.yml` is used. | empty |
| `DB_NAME` | Database name | `warranty_intake` |
| `API_PORT` | Host port for the API | `3000` |
| `TOKEN_TTL_HOURS` | Token lifetime | `8` |
| `APP_TIMEZONE` | Time zone for business dates | `Asia/Ho_Chi_Minh` |

Inside Docker the API reaches the database by the service name `db`; `DB_HOST` in `.env` is ignored by Compose.

## 3. Build and run

```
docker compose up -d --build
```

On start, the `api` container runs the migrations and the demo seed (both idempotent), then starts the server. The `api` service waits until the `db` health check passes.

| Service | Role | Address |
|---|---|---|
| `db` | MariaDB 10.11 (data kept in the `dbdata` volume) | internal only |
| `api` | Node.js + Express REST API | http://localhost:3000/api |
| `web` | React UI served by nginx, forwards `/api` to `api` | http://localhost:8080 |

Log in with `staff01` or `manager01`; the demo password is `Demo@2026` (seed data only, not for production).

## 4. How to verify the system runs correctly

1. All three services are up, `db` is `healthy`:
   ```
   docker compose ps
   ```
2. The API answers and can reach the database. Expected output: `{"status":"ok","db":"up"}`
   ```
   curl localhost:3000/api/health
   ```
3. Open http://localhost:8080, log in as `staff01`, and create a warranty request. It appears in the list with status `NEW`.
4. Run the automated test suite inside the container. Expected: `tests 60`, `pass 60`, `fail 0`. The tests use in-memory fake repositories, so they never touch the demo data.
   ```
   docker compose exec api npm test
   ```
5. Re-run safety: restart the API and check that the data is not duplicated (the seed runs again but adds nothing).
   ```
   docker compose restart api
   ```

## 5. Operations and troubleshooting

| Task | Command |
|---|---|
| View logs | `docker compose logs api --tail 50` |
| Stop (keep data) | `docker compose down` |
| Stop and delete all data | `docker compose down -v` |
| Rebuild after code changes | `docker compose up -d --build` |

Known issue on a developer machine: `ports are not available ... 0.0.0.0:3000`. Another program (or a stale Docker/Windows socket) holds port 3000. Use another host port, for example on Windows PowerShell: `$env:API_PORT=3001; docker compose up -d --build`, or write `API_PORT=3001` into `.env`.

## 6. Going to a real deployment (HTTPS)

The prototype listens on plain HTTP at `localhost`, which is fine for local testing only. In a real deployment:

- Put a reverse proxy with a real TLS certificate (for example nginx or Caddy) in front of the `web` service, and expose only port 443. Do not publish the API port.
- The login token is sent in the `Authorization` header, so it must never travel over plain HTTP.
- The web UI and the API are served from the same origin (nginx forwards `/api` to `api`), so no CORS setup is needed. If the UI is ever hosted on another domain, allow only that exact origin; never `*`.
- Change `AUTH_SECRET`, `DB_PASSWORD` and the demo password `Demo@2026` before going live, and keep the real `.env` out of Git.
