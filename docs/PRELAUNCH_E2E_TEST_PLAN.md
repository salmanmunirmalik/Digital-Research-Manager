# Pre-launch end-to-end testing plan

**Product:** Digital Research Manager  
**Date:** 2026-09-22  
**Target:** DirectAdmin production (single Node app serves `/api/*` + SPA)  
**Last automated QA:** 2026-08-04 — Playwright 31/31 and working-QA 77/77. That gate is **stale**. Writing Studio, Research Evidence packs, grant write-ups, marketplace tenders, writing collab, and several lab-workspace flows landed after it.

Do not treat the August green run as a launch signal.

---

## 1. Launch gate (go / no-go)

Ship only when **all P0 journeys pass on staging** (production-like Node + MySQL + `ENABLE_DEMO_AUTH=false`) and **no open Sev-1 defects**.

| Gate | Required for launch |
|------|---------------------|
| P0 journeys | 100% pass, two browsers (Chrome + Safari or Firefox), desktop |
| P1 journeys | All pass, or accepted as known limitation in release notes |
| Automated Playwright | Green against current UI (not mocked-only for core CRUD) |
| Working QA smoke | Extended route list (includes Writing Studio + Evidence) is green |
| Schema | `pnpm run db:migrate` clean on a fresh copy of production schema |
| Security | CORS allowlist, JWT required, demo auth off, GDPR consent + DSAR path |
| Production smoke | Health, login, dashboard, one write path on the live domain |

**Sev-1 (block launch):** data loss, auth bypass, 500 on a primary nav page, cannot create/login/logout, GDPR consent not recorded, CORS open in production, demo auth enabled.

**Sev-2 (fix before launch if in P0 module):** broken create/edit/delete on notebook, protocols, evidence, writing, lab tasks, grants, marketplace.

**Sev-3 (can ship with note):** cosmetic, optional AI when Gemini key missing, empty third-party scholarly results.

---

## 2. What is already covered vs what is not

### Automated today (`tests/e2e/*.pw.spec.ts`)

| Spec | What it actually proves |
|------|-------------------------|
| `digital-research-manager.pw.spec.ts` | Login form, bad credentials, demo login, logout, two sidebar links, `/api/health`, token login |
| `lab-notebook.pw.spec.ts` | Page loads, search box, entry-type headings — **no create/edit/delete** |
| `professional-protocols.pw.spec.ts` | Library heading, search, empty/results — **no write protocol** |
| `experiment-tracker.pw.spec.ts` | UI with **mocked** experiment APIs |
| `recommendations-notebook-summaries.pw.spec.ts` | Weak “page did not crash” checks; `/service-marketplace` is a redirect |

### Working QA (`node qa-results/run-full-working-qa.mjs`)

API CRUD for notebook, protocols, experiments, plus route crawl. **Missing routes:** `/writing-studio`, `/writing-studio/new`, `/evidence-references`, `/research-journey`, lab-workspace `?section=` tabs.

### Highest-risk untested surfaces

1. Writing Studio (desk → new doc → compose → cite → export → delete)
2. Research Evidence packs (create pack → artifacts → review)
3. Lab workspace (create lab, tasks list/board/calendar, projects, inventory, instruments, team, messages)
4. Grants (discover, preferences, write-up wizard, PDF export)
5. Marketplace (suppliers, services, tenders)
6. Networking, data bank, negative results
7. Cookie/GDPR/privacy-rights
8. Production CORS, JWT, rate limits, `ENABLE_DEMO_AUTH=false`
9. Mobile nav (`lg:hidden` hamburger)
10. Multi-user: invite collaborator, lab member roles, writing collab locks

---

## 3. Environments and accounts

| Env | URL | Notes |
|-----|-----|--------|
| Local | `http://localhost:5173` + API `:5002` + MySQL `researchlab` | Daily loop. See `docs/LOCAL_DEV.md`. |
| Staging | Production-like DirectAdmin or local `NODE_ENV=production SERVE_FRONTEND=true` | **Primary launch gate.** |
| Production | Live domain | Smoke only after staging GO. |

**Start local:**

```bash
pnpm run fix-ports
pnpm run db:migrate
pnpm run dev:app
pnpm run wait:api
```

**Accounts (prepare before execution):**

| Persona | Role | Purpose |
|---------|------|---------|
| A — Researcher | `researcher` | Primary writer of data (all P0) |
| B — Student | `student` | Second user: collab, lab member, cannot admin-only APIs |
| C — Fresh register | either | Full signup + privacy checkbox + first dashboard |
| Demo | `researcher@researchlab.com` | **Local Playwright only.** Must be off in staging/prod. |

Use unique emails (`qa+prelaunch-YYYYMMDD-…@…`). Clean up created labs/docs after each pass.

**Staging/prod env checks (fail the run if wrong):**

- `ENABLE_DEMO_AUTH=false`
- `NODE_ENV=production`
- `FRONTEND_URL` is the real origin (not `*`)
- `JWT_SECRET` and `ENCRYPTION_KEY` are long random values, not `REPLACE_ME`
- `VITE_API_URL` baked at build time matches `https://<domain>/api`

---

## 4. Execution order (do not skip)

| Day | Phase | Owner time |
|-----|--------|------------|
| 0 | Environment + schema heal + health | 30–45 min |
| 1 | Auth, consent, public legal, settings | 1.5 h |
| 2 | Core research loop (notebook → protocol → evidence → writing) | 3–4 h |
| 3 | Lab workspace (lab, tasks, resources, team, messages) | 2–3 h |
| 4 | Network (grants, marketplace, networking, databank) | 2 h |
| 5 | Security, GDPR, production-like CORS | 1.5 h |
| 6 | Cross-browser + mobile + regression automation | 2 h |
| 7 | Staging re-run of P0 + sign-off | 1 h |

Fix Sev-1 immediately; re-test the journey, then adjacent pages that share the same API.

---

## 5. Phase 0 — Environment and schema

**Pass if:** API health reports MySQL, frontend 200, migrations apply, no 500 on `/api/labs`, `/api/settings`, `/api/writing/templates`.

```bash
pnpm run db:migrate
curl -s http://127.0.0.1:5002/api/health   # expect database: MySQL
curl -sI http://127.0.0.1:5173             # 200
pnpm exec playwright test tests/e2e/digital-research-manager.pw.spec.ts
node qa-results/run-full-working-qa.mjs
```

Checklist:

- [ ] XAMPP/MySQL up; no second MySQL on 3306
- [ ] `GET /api/health` OK
- [ ] Login page renders; cookie banner appears on first visit
- [ ] Tables exist for writing studio, writing collab, grant writeups, evidence/references, marketplace tenders, lab workspace, GDPR
- [ ] `ENABLE_DEMO_AUTH` is true only on local Playwright, false on staging

---

## 6. Phase 1 — Auth, consent, legal, account

### P0 journeys

| ID | Journey | Expected |
|----|---------|----------|
| A1 | Landing `/` → Login → valid credentials | Lands on `/dashboard`, “Welcome back” |
| A2 | Invalid login | Error on `[data-testid=login-error]`, stay on `/login` |
| A3 | Unauthenticated visit to `/dashboard` | Redirect to `/login` |
| A4 | Register (privacy checkbox required) → auto login | New user on dashboard; role student or researcher |
| A5 | Logout via user menu | `/login`; token gone; back-button does not restore app |
| A6 | Cookie banner: Accept all / necessary only | Banner dismisses; `POST /api/compliance/consent` 2xx; preference survives reload |
| A7 | `/privacy`, `/cookies`, `/terms`, `/cookie-preferences`, `/privacy-rights`, `/support` | 200, no crash, links work |
| A8 | Change password in Settings | Next login uses new password |
| A9 | Edit profile (name) | Header initials and profile page update |

### P1

- [ ] Register without privacy checkbox is blocked
- [ ] Duplicate email rejected
- [ ] Weak password rejected
- [ ] Session survives refresh; dies after logout
- [ ] `/unauthorized` renders
- [ ] Unknown path shows Not Found

---

## 7. Phase 2 — Core research loop (P0 product)

This is the path a researcher will use on day one. Test it as **one continuous story** with Persona A, then spot-check the same APIs independently.

### 2A Dashboard

- [ ] Stats/reminders/notes load without console TypeError
- [ ] Create / edit / delete a dashboard note
- [ ] Deep links to notebook, protocols, workspace, writing studio work
- [ ] Notification bell opens; `/notifications` lists items or empty state

### 2B Personal notebook `/lab-notebook`

- [ ] List loads (empty state or cards)
- [ ] Create **Idea**, **Experiment note**, **Results note**, **Problem**
- [ ] Search filters; tags null does not crash (regression)
- [ ] Edit and delete an entry
- [ ] Linked chips (protocol / experiment / evidence) if shown

### 2C Protocol library `/protocols`

- [ ] Write protocol → required content saved → appears in list for author even with `lab_id` null (August P0 regression)
- [ ] Open `/protocols/:id` detail
- [ ] Edit, search, delete
- [ ] Share (if UI present) — second user B can or cannot see per rules
- [ ] Protocol AI assistant: graceful failure if no Gemini key (no white screen)

### 2D Research evidence `/data-results`

- [ ] Create evidence pack (title, type, category)
- [ ] Add artifacts: text result, summary table, data sheet, figure
- [ ] Spreadsheet grid edits persist after reload
- [ ] Plot / regression modules render or show empty-state, not crash
- [ ] Review view; status draft → published
- [ ] Delete pack
- [ ] `/evidence-references` search + save to library (OpenAlex may be empty; UI must not 500)

### 2E Writing studio `/writing-studio`

- [ ] Desk loads templates
- [ ] New document (`/writing-studio/new/:docType`)
- [ ] Compose section, autosave or explicit save
- [ ] Insert citation (library or DOI lookup)
- [ ] Readiness / analyze draft
- [ ] Preview manuscript
- [ ] Export markdown and PDF download
- [ ] Delete document
- [ ] Sidebar “Writing studio” always returns to desk (reset state)
- [ ] Legacy redirects: `/research-assistant` and `/ai-agents-capabilities` → studio; `/presentations` → studio with notice
- [ ] Write Together: invite B, B accepts, both see draft; section lock prevents double-edit clash or shows presence

### 2F Experiment tracker `/experiment-tracker`

- [ ] List against **real API** (not Playwright mocks)
- [ ] Create, open, update status, delete
- [ ] Linked from notebook/protocol if UI offers it

**Phase 2 pass:** Persona A can go notebook → protocol → evidence pack → manuscript with citations and a PDF, without a 500 or lost data on reload.

---

## 8. Phase 3 — Lab workspace `/lab-workspace`

Create a lab first if Persona A has none.

| Section | Must pass |
|---------|-----------|
| Lab create / switch | Create lab, switch active lab (`lab-workspace-active-lab`), showcase optional |
| Tasks `?section=tasks` | Create task; list / board / calendar views; edit status & assignee; delete |
| Projects `?section=projects` | Create project; import text optional; edit; delete |
| Resources `?section=resources` | Inventory item CRUD; instrument CRUD; booking; maintenance log |
| Team `?section=teams` | Invite B by email/search; role update; remove |
| Messages `?section=messages` | Send message; B sees it after refresh |

Redirects that must still work:

- `/team-messaging` → workspace messages
- Legacy `?section=inventory|instruments|experiments` → resources or tasks

**Phase 3 pass:** two users in one lab can assign a task and exchange a message.

---

## 9. Phase 4 — Research network

### Grants `/grants-fundings`

- [ ] Discover list (Horizon ingest may be empty — empty state OK)
- [ ] Filters, deadline sort, open detail / external URL
- [ ] Preferences save and Matches tab uses them
- [ ] Write tab: create write-up, fill sections, save, export PDF, delete
- [ ] Post a manual grant (if permitted)

### Marketplace `/marketplace`

- [ ] Tabs: suppliers, services, tenders
- [ ] Register as supplier and as service provider; catalog/offering item
- [ ] Post a tender; edit; delete
- [ ] Contact is email-only (no fake checkout)
- [ ] `/marketplace/supplier` and `/marketplace/provider` workspaces
- [ ] Redirects `/supplier-marketplace`, `/service-marketplace`

### Networking `/collaboration-networking`

- [ ] Directory loads; profile view `/profile/:userId`
- [ ] Connect / follow / message action does not 500
- [ ] Public lab page `/labs/:labId` if showcase enabled

### Data bank `/research-databank`

- [ ] Org list; org page; no crash on empty

### Negative results `/negative-results`

- [ ] Submit, list “my submissions”, view

### Other authenticated pages (P1 smoke — load + no crash)

`/events-opportunities`, `/conference-news`, `/help-forum`, `/current-trends`, `/project-management`, `/pi-review-dashboard`, `/data-analytics`, `/research-journey`

---

## 10. Phase 5 — Security, GDPR, production config

Run on staging with demo auth **off**.

| ID | Check | Pass |
|----|--------|------|
| S1 | No token on `/api/labs`, `/api/writing/documents`, `/api/lab-notebooks` | 401 |
| S2 | Garbage Bearer token | 401 |
| S3 | User A cannot GET/PUT/DELETE User B’s notebook, writing doc, or grant write-up | 403/404 |
| S4 | SQL-ish search strings do not 500 (400 or empty list) | no 500 |
| S5 | Production CORS | only `FRONTEND_URL`; browser from other origin blocked |
| S6 | Rate limit | burst login returns 429 eventually, app still usable after wait |
| S7 | `ENABLE_DEMO_AUTH=false` | `/api/auth/demo-login` disabled or 403 |
| S8 | Cookie / privacy rights | DSAR form on `/privacy-rights` submits; consent withdraw works |
| S9 | Helmet / security headers on API | `X-Content-Type-Options`, etc. |
| S10 | No secrets in client bundle | search built JS for `MYSQL_PASSWORD`, `JWT_SECRET`, raw Gemini key in `VITE_*` |

AI features: if `GEMINI_API_KEY` unset, every AI button must show a controlled error, never an uncaught overlay.

---

## 11. Phase 6 — Cross-cutting UX

| Check | Viewports |
|-------|-----------|
| Sidebar all primary links | Desktop ≥ 1024px |
| Hamburger nav, overlay, Escape closes | 375×667 and 768×1024 |
| Cookie banner does not block primary CTA | both |
| Forms: required fields, cancel, unsaved close | desktop |
| File upload (writing PDF, evidence figure) | desktop; reject huge/non-PDF |
| SPA refresh on deep link `/writing-studio/m/:id` | production `SERVE_FRONTEND=true` (Apache must not 404) |

Redirect matrix (authenticated):

| From | To |
|------|-----|
| `/home` | `/dashboard` |
| `/professional-protocols` | `/protocols` |
| `/research-tools`, `/calculator-hub`, `/bioinformatics-tools`, `/molecular-biology` | `/dashboard` |
| `/research-assistant`, `/ai-agents-capabilities` | `/writing-studio` |
| `/presentations` | `/writing-studio?notice=slides` |
| `/my-portfolio`, `/scientist-passport` | `/profile` |
| `/data-sharing` | `/research-databank` |
| `/supplier-marketplace` | `/marketplace?tab=suppliers` |

---

## 12. Phase 7 — Automation to re-baseline before launch

**Do this after P0 manual journeys are green**, so selectors match the real UI.

1. Keep existing Playwright auth + navigation specs.
2. Add (or extend working-QA) **real CRUD** specs — no API mocks for:
   - notebook create/search/delete
   - protocol create/open/delete
   - evidence pack create
   - writing document create/save/delete
   - lab task create
   - grant write-up create
3. Extend `PROTECTED_ROUTES` in `qa-results/run-full-working-qa.mjs` with:

```text
/writing-studio
/writing-studio/new
/evidence-references
/research-journey
/lab-workspace?section=tasks
/lab-workspace?section=projects
/lab-workspace?section=resources
/lab-workspace?section=teams
/lab-workspace?section=messages
```

4. Fix redirect expectation: `/research-assistant` → `/writing-studio` (script still expects `/dashboard`).
5. Commands:

```bash
pnpm run type-check
pnpm test:ci                    # unit/integration; do not block launch on pre-existing Jest noise — log and triage
ENABLE_DEMO_AUTH=true pnpm test:playwright
node qa-results/run-full-working-qa.mjs
```

6. Optional load: `pnpm test:performance` only after functional GO; login + dashboard + notebook list under 50 concurrent users should stay < 3s p95 locally.

**Do not** rely on `e2e-testing/` Puppeteer+Postgres suite for this launch — it targets an older Postgres stack. Playwright + working-QA + this plan are the source of truth.

---

## 13. Production smoke (30 minutes, live domain)

After deploy, before announcing:

1. `GET https://<domain>/api/health`
2. Open `/`, accept cookies, register **or** login with a real (non-demo) user
3. Dashboard loads
4. Create one notebook entry and one writing document; reload; they persist
5. Logout
6. Direct visit to `/writing-studio/m/<id>` while logged in does not Apache-404
7. Confirm demo login is dead
8. Confirm another origin cannot call `/api` (CORS)

If any of 1–7 fail: **rollback / hold launch**.

---

## 14. Coverage matrix (sign-off sheet)

Copy into the run log. `A` = automated, `M` = manual, `—` = not required this launch.

| Area | Load | Create | Update | Delete | Cross-user | Auto |
|------|------|--------|--------|--------|------------|------|
| Auth / session | P0 | P0 register | P0 password | logout | — | A+M |
| Cookie / GDPR | P0 | consent | preferences | withdraw | — | M |
| Dashboard | P0 | notes | notes | notes | — | M |
| Notebook | P0 | P0 | P0 | P0 | share P1 | A load, M CRUD |
| Protocols | P0 | P0 | P0 | P0 | share P1 | A load, M CRUD |
| Evidence packs | P0 | P0 | P0 | P0 | P1 | M |
| Evidence & refs | P1 | library | — | P1 | — | M |
| Writing studio | P0 | P0 | P0 | P0 | collab P1 | M |
| Experiments | P1 | P1 | P1 | P1 | — | A mocked, M real |
| Lab + tasks | P0 | P0 | P0 | P0 | P0 | M |
| Inventory / instruments | P1 | P1 | P1 | P1 | P1 | M |
| Team / messages | P0 | P0 | P1 | P1 | P0 | M |
| Grants + write-ups | P0 | P0 | P0 | P0 | — | M |
| Marketplace + tenders | P1 | P1 | P1 | P1 | — | M |
| Networking | P1 | P1 | — | — | P1 | M |
| Data bank / negative results | P1 | P1 | — | — | — | M |
| Settings / profile | P0 | — | P0 | — | — | M |
| Notifications / help / news | P1 | — | — | — | — | M |
| Production SPA fallback | P0 | — | — | — | — | M |

---

## 15. Bug log template

```text
ID:
Severity: 1 / 2 / 3
Journey: (e.g. 2E Writing studio)
Env: local / staging / prod
Steps:
Expected:
Actual:
Console / network:
Screenshot:
```

Re-test rule: a fix is not done until the failed journey **and** one sibling page that shares the store or API are re-run.

---

## 16. Sign-off

| Role | Name | Date | Verdict |
|------|------|------|---------|
| Tester (this plan) | | | GO / NO-GO |
| Engineering | | | |
| Product / owner | | | |

**NO-GO unless:** Phase 0–2 and 5 and production smoke are green, demo auth is off, and no Sev-1 is open.

Artifacts to keep:

- This document
- `qa-results/prelaunch-run-YYYYMMDD.md` (pass/fail per ID)
- Playwright HTML report + `qa-results/playwright-prelaunch.txt`
- Updated `qa-results/full-working-qa.json`
- Screenshot zip of failures only
