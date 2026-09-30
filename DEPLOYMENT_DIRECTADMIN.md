# ============================================================
# Digital Research Manager — DirectAdmin / cPanel deployment
# ============================================================

This guide targets **DirectAdmin with Node.js Selector** (also works on similar cPanel Node hosts).

## Recommended architecture (simplest)

Run **one Node.js app** that serves:

- REST API under `/api/*`
- Built React SPA from `dist/`

Startup file: **`app.js`** (copied from `deploy/directadmin/app.js` by the pack script)  
Env flag: **`SERVE_FRONTEND=true`** (default when `NODE_ENV=production`)

```
Browser  →  DirectAdmin proxy  →  Node (app.js)
                                  ├─ /api/*     Express routes
                                  └─ /*         dist/index.html + assets
```

---

## 1. Create MySQL database (DirectAdmin)

1. **MySQL Management** → create database + user, grant ALL on that DB.
2. Note: host (usually `localhost`), DB name, user, password.

Apply schema/migrations from `database/migrations/mysql_*.sql` (or your existing MySQL migration process) against that database.

---

## 2. Build locally (or on a machine with Node 18+)

```bash
pnpm install

# Use your real domain — Vite bakes VITE_API_URL into the JS bundle
export VITE_API_URL=https://YOUR-DOMAIN.com/api
export NODE_ENV=production

pnpm run build:all
# or: pnpm run build:directadmin
```

Package for upload:

```bash
pnpm run pack:directadmin
# → creates digital-research-manager-directadmin-YYYYMMDD-HHMMSS.zip
```

---

## 3. Upload to the server

Extract into the Node application root, for example:

`/home/USERNAME/domains/YOUR-DOMAIN.com/nodejs/`  
(or the path DirectAdmin shows as **Application root**)

Upload at least:

| Path | Purpose |
|------|---------|
| `app.js` | DirectAdmin startup file (from pack) |
| `package.json` + `pnpm-lock.yaml` | deps |
| `dist/client/` | frontend SPA |
| `dist/server/` | compiled API |
| `database/migrations/` | MySQL SQL (optional on server if already migrated) |
| `env.directadmin.example` | copy to `.env` and edit |
| `ecosystem.config.cjs` | optional PM2 |

Do **not** upload local `.env` with secrets from your laptop. Create `.env` on the server.

---

## 4. Create the Node.js application (DirectAdmin UI)

1. **Extra Features** → **Node.js** (or **Setup Node.js App**).
2. **Create Application**:
   - **Node.js version:** 18.x or 20.x LTS
   - **Application mode:** Production
   - **Application root:** folder with `app.js`
   - **Application URL:** `/` (whole domain) or a subdomain
   - **Application startup file:** `app.js`
   - **Passenger log** / port: leave DirectAdmin defaults (it sets `PORT`)
3. Open the app’s environment editor and paste values from `env.directadmin.example` (filled in).
4. In the application directory (SSH or Terminal):

```bash
cd /path/to/application/root
npm install -g pnpm   # if not available
pnpm install --prod
# If pnpm is unavailable:
# npm install --omit=dev
```

5. **Restart** the Node.js application in DirectAdmin.

---

## 5. Required environment variables

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | Usually set by DirectAdmin — do not fight it |
| `TRUST_PROXY` | `true` |
| `SERVE_FRONTEND` | `true` |
| `FRONTEND_URL` | `https://YOUR-DOMAIN.com` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `ENABLE_DEMO_AUTH` | **must be `false`** |
| `MYSQL_*` | DirectAdmin MySQL credentials |
| `VITE_API_URL` | Already baked at build time; keep for documentation |

Optional: `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.

---

## 6. Verify

```bash
curl -sS https://YOUR-DOMAIN.com/api/health
# expect: {"status":"API healthy", ... "database":"MySQL"}

# Open in browser:
# https://YOUR-DOMAIN.com/
```

Deep links (`/lab-notebook`, `/protocols`, …) must load the SPA (Express fallback handles this when `SERVE_FRONTEND=true`).

---

## Alternative: static SPA in `public_html` + Node API only

Use this if your host forces static files in `public_html` and Node on another port.

1. Set `SERVE_FRONTEND=false` on the Node app.
2. Copy contents of `dist/` (except nested `dist/server`) into `public_html/`.
3. Copy `deploy/directadmin/htaccess.apache-static-spa` to `public_html/.htaccess` and set the proxy port to the Node app port.
4. Build with `VITE_API_URL=https://YOUR-DOMAIN.com/api`.

Requires Apache `mod_rewrite` + `mod_proxy` (or LiteSpeed equivalents).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank page / wrong API host | Rebuild frontend with correct `VITE_API_URL`, re-upload `dist/` |
| CORS errors | Set `FRONTEND_URL` to the exact browser origin (`https://…`) |
| `JWT_SECRET` boot failure | Use a long random secret; remove example/weak values |
| DB connection failed | Check MySQL user host (`localhost`), DB name, password; test with `mysql` CLI |
| 502 / app won’t start | Check DirectAdmin Node error log; confirm `app.js` path and `pnpm install --prod` |
| Port conflicts | Let DirectAdmin assign `PORT`; don’t hardcode a busy port |

---

## Local package command reference

```bash
pnpm run build:directadmin   # production build with /api default if VITE_API_URL unset
pnpm run pack:directadmin    # zip ready to upload
pnpm run start:prod          # smoke-test the same entry as production
```
