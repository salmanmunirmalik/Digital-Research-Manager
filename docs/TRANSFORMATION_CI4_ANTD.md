# Transformation Plan: Express/React-TS → CodeIgniter 4 + React-JS + Ant Design

**Status:** Approved direction (user: 1A-style parity minus AI agents, frontend 2B, CodeIgniter 4)  
**Goal:** Complete cutover with **no overlapping runtimes** — final product is CI4 + React JS + Ant Design + MySQL (+ optional Python stats sidecar).

---

## 1. Decisions locked

| Choice | Decision |
|--------|----------|
| Backend | **CodeIgniter 4** (PHP 8.2+), JWT auth matching current API |
| Frontend | **React + JavaScript + Vite + Ant Design** (convert app code to `.jsx` / `.js`; no TypeScript in the new SPA) |
| Database | **Existing MySQL** — single DB; do not fork schema |
| AI agents | **Excluded** — do not port agents, orchestrator, AI research chat, provider keys, AI training, protocol-AI, presentation-AI, notebook-summaries |
| Stats | **Keep** `stats_service/` (Python FastAPI); CI4 proxies `/api/advanced-stats` |
| End state | Delete Express/`server/`, old root React-TS/Tailwind SPA, Node PM2 API, and all EXCLUDE AI routes |

---

## 2. Target architecture

```text
Browser
  → Vite SPA (React JS + Ant Design)
    → /api/*  (Bearer JWT)
      → Apache / php-fpm → CodeIgniter 4
           → MySQL (researchlab)
           → proxy → Python stats_service (optional)
```

**Final repo layout (after Phase 5 cleanup):**

```text
researchlab/
  frontend/          # Only SPA: Vite + React JS + Ant Design
  backend/           # Only API: CodeIgniter 4
  database/          # SQL migrations (shared)
  stats_service/     # Optional Python stats
  docs/api/          # OpenAPI / route contracts
```

During migration, old trees and new trees coexist on branch `migrate/ci4-antd`. **Final merge deletes the old trees.**

---

## 3. Strategy (strangler → clean cutover)

Do **not** rewrite `main` in place. Use a strangler fig:

1. Scaffold CI4 + new SPA beside the live app.
2. Reimplement **KEEP** APIs with **identical JSON contracts**.
3. Flip traffic module-by-module (reverse proxy or env `VITE_API_URL`).
4. When every KEEP feature runs on CI4: **delete** Express, old SPA, AI code, Node deploy paths.

This delivers a **complete** transformation (no dual stack left) without shipping a months-long broken main.

```text
Phase 0 Foundation → Phase 1 Auth+Shell → Phase 2 Port KEEP waves
  → Phase 3 Finish Ant Design JS UI → Phase 4 Confirm EXCLUDE gone
  → Phase 5 Cutover + delete Node/old SPA
```

---

## 4. KEEP vs EXCLUDE

### KEEP (must port)

- Auth: `/api/auth/*` (login, register, logout, profile/me, change-password)
- Users, labs, lab-members, settings (**non-AI**)
- Dashboard, notifications, compliance/GDPR, support
- Protocols (+ execution, collaboration, comparison), lab-notebooks, quick-notes, calendar
- Experiments, project-management, lab-workspace
- Inventory, instruments, bookings, exchange
- Data results, databank, negative-results
- Conversations / team messaging
- Networking (posts, directory, social), help-forum, community-news
- Grants (catalog, matches, preferences, **writeups CRUD** — no agent generation)
- Research events
- Marketplace, services, scientist-passport
- Recommendations + protocol-search (SQL/text; not LLM)
- Advanced-stats proxy → Python

### EXCLUDE (never port; delete at cutover)

| Mount / area | Reason |
|--------------|--------|
| `/api/agents` | Task agents (proposal, paper, etc.) |
| `/api/orchestrator` | Multi-agent workflows |
| `/api/ai-research-agent` | Chat agent |
| `/api/ai-providers` | LLM API keys |
| `/api/ai-training` | RAG / training chat |
| `/api/api-task-assignments` | Task → provider mapping |
| `/api/protocol-ai` | Protocol LLM generate |
| `/api/presentations/ai/*` | Slide generation |
| `/api/notebook-summaries` | LLM digests |
| `server/services/agents/*` | Agent implementations |
| AI-only pages | `AIResearchAgentPage`, `ResearchAssistantPage`, `AIApiKeysPage`, `AIAgentsCapabilitiesPage`, `AIPresentationsPage` |

**Grant writing:** Keep templates + manual drafts + `/api/grants/writeups`. Remove any call to `/api/agents/proposal_writing/execute`.

---

## 5. Phases

### Phase 0 — Foundation (1–2 weeks)

1. Branch: `migrate/ci4-antd`.
2. Freeze KEEP contracts: inventory from `server/index.ts` → `docs/api/` (OpenAPI or route tables).
3. Scaffold:
   - `backend/` — `composer create-project codeigniter4/appstarter`
   - `frontend/` — Vite **react** (JavaScript) + `antd` + `@ant-design/icons` + `react-router-dom`
4. Point CI4 `.env` at existing `MYSQL_*` (same DB as today).
5. Ports (avoid collisions):

| Process | Port |
|---------|------|
| Old Vite | 5173 |
| Old Express | 5002 |
| New Vite | 5174 |
| CI4 | 8080 |
| Stats | 5003 / 8001 |

### Phase 1 — Auth + app shell

**CI4**

- Filters: CORS, JWT Bearer, rate limit.
- Endpoints matching current client (`services/apiService.ts`, `contexts/AuthContext.tsx`):
  - `POST /api/auth/login`, `register`, `logout`
  - `GET /api/auth/profile` (or `/me` — **exact path parity**)
- Same `JWT_SECRET` and claim shape (`id`, `role`, …).
- Bcrypt verify compatible with existing `users.password` hashes.

**Frontend**

- Ant Design `ConfigProvider`, layout, Login, auth guard (all `.jsx`).
- `VITE_API_URL=http://localhost:8080/api` for the new app only.

**Exit criteria:** Real MySQL users can log in via CI4; old Express app still works.

### Phase 2 — Port KEEP modules (waves)

| Wave | Modules |
|------|---------|
| 2.1 | Users, labs, lab-members, settings (non-AI) |
| 2.2 | Dashboard, notifications, compliance |
| 2.3 | Protocols (+ execution/collaboration/comparison), notebooks, quick-notes, calendar |
| 2.4 | Experiments, project-management, lab-workspace, inventory/instruments/bookings |
| 2.5 | Data results, databank, negative-results |
| 2.6 | Messaging, networking, help-forum, community-news |
| 2.7 | Grants (no agents), research-events |
| 2.8 | Marketplace, services, scientist-passport, support |
| 2.9 | `/api/advanced-stats` → Python sidecar |

**Per-module checklist**

- [ ] CI4 routes mirror `/api/...`
- [ ] Models use existing tables
- [ ] Ant Design page(s) replace Tailwind page(s)
- [ ] Contract test: status codes + JSON keys match Express
- [ ] Flip only that path prefix to CI4 when green

### Phase 3 — Frontend conversion rules

- All new UI in `frontend/` as `.js` / `.jsx`.
- Ant Design is the design system (not Tailwind-primary).
- Strip AI widgets from kept pages (`ProtocolAIAssistant`, grant AI-fill, notebook AI summary).
- Delete AI-only routes from the new router (do not port redirected AI pages).

### Phase 4 — Confirm EXCLUDE is gone from the new stack

- Grep new `frontend/` and `backend/` for: `agents`, `ai-providers`, `orchestrator`, `protocol-ai`, `notebook-summaries`.
- No Composer/npm dependency that exists only to call LLM agents.

### Phase 5 — Complete cutover (zero overlap)

When all KEEP waves pass against CI4:

1. Point production API URL to CI4 only; stop Express.
2. Build `frontend` → serve from CI4 `public/` or Apache docroot.
3. **Delete from repo:**
   - `server/` (entire Express API)
   - Root Vite React-TS/Tailwind app once replaced (`App.tsx`, root `pages/`, root `components/`, etc.)
   - Node API scripts / `tsx watch server` / PM2 Node `ecosystem` for API
   - DirectAdmin Node `app.js` as primary runtime → PHP document root
4. Root tooling: `frontend/package.json` for Vite only; `backend/composer.json` for PHP.
5. Rewrite `DEPLOYMENT_DIRECTADMIN.md` for Apache + CI4 + MySQL + optional Python stats.
6. Final greps must find **no** Express entrypoint and **no** EXCLUDE mounts in the surviving tree.

**Definition of done:** One SPA (React JS + Ant Design), one API (CI4), one MySQL, optional stats process — **no Express process and no dual `/api` owners.**

---

## 6. Testing

- Contract tests per wave (PHPUnit or scripted HTTP vs OpenAPI).
- Re-point Playwright smoke to CI4: auth, labs, protocols, grants list/writeups, compliance.
- Explicit tests: bcrypt login, JWT expiry, file uploads (multer → CI4 Upload).

---

## 7. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| JSON drift breaks UI | Freeze OpenAPI before porting; no silent field renames |
| JWT/bcrypt mismatch | Golden login tests on real `users` rows |
| Inline mega-routes in `server/index.ts` | Inventory by domain early; port by domain |
| AI creeping back | Enforce EXCLUDE list in PR review |
| Long branch rot | Merge KEEP waves often; delete old code only in Phase 5 |

---

## 8. Effort (order of magnitude)

| Phase | Rough effort |
|-------|----------------|
| 0–1 Foundation + auth | 1–2 weeks |
| 2.1–2.4 Core lab | 4–6 weeks |
| 2.5–2.9 Rest KEEP | 4–6 weeks |
| 3–5 UI finish + cutover | 2–4 weeks |

**~3–4+ months** for one focused developer (faster with FE/BE parallel).

---

## 9. First execution tasks

1. Create `migrate/ci4-antd` + scaffold `backend/` (CI4) and `frontend/` (Vite React JS + Ant Design).
2. Export KEEP route inventory / OpenAPI stubs from `server/index.ts`.
3. Implement CI4 auth + Ant Design login against live MySQL.
4. Document reverse-proxy / path-flip map for gradual cutover.
5. Only after Phase 5: delete `server/` and the old SPA so nothing from the old stack remains in the running product.
