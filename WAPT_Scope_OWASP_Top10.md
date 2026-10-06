# WAPT Scope — Lutron LMS (lutron_backend + lutron_frontend)
**Standard:** OWASP Top 10 2021 | **Methodology:** OWASP WSTG v4.2 + PTES | **Type:** Grey-box (authenticated + unauthenticated)

> Backend: FastAPI (`app.main:app`, routers mounted at `/` AND `/api/v1`) — `http://127.0.0.1:8000`
> Frontend: React 18 + CRA/craco (`lutron_frontend`) — `http://127.0.0.1:3000`, API base = `REACT_APP_API_URL`
> DB: Postgres via `DATABASE_HOST_URL`. Auth: JWT HS256 (120-min, `jti`, revoked-list `logs/jwt_revoked.json`). Roles: `Superadmin > Admin > Operator` + per-floor `monitor / monitor_control / monitor_control_edit` (levels 1–4, 5 = SA-only).

---

## 1. In-Scope Assets & Functions

### 1.1 Backend API surface (38 route files)

| # | Module | Endpoints (representative) | Auth |
|---|--------|----------------------------|------|
| F1 | Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/change_password`, `POST /auth/logout` | Public / JWT |
| F2 | Users & RBAC | `POST /users/create`, `GET /users`, `PATCH /users/update`, `PUT /users/{email}`, `POST /users/delete` | JWT + OP(4)/SA |
| F3 | Processors (LEAP/LAP) | `GET /processor/discover`, `/get/{id}`, `/list`, `POST /toggle_handshake_status`, `POST /ping_terminal`, `GET /leaf_areas`, `POST /area_coord`, `POST /processor_handshake` | JWT |
| F4 | Processor discovery | `POST /processor_discovery/scan` (32 IPs, ports 8081/8083), `POST /manual_add` | JWT |
| F5 | Floors + plans | `POST /floor/create` (multipart PDF), `PUT /floor/update/{id}`, `GET /floor/{id}/plan`, `/list`, `/get/{id}`, `/sync-zones`, `/modify_coordinates`, `DELETE /delete/{id}`, occupancy/light/energy status, area_tree | JWT |
| F6 | Home / branding CMS | `GET/POST /home/lutron`, `/client`, `/project` (+ `background_image`, `logo_image` uploads), `GET /home/dashboard` | JWT |
| F7 | Areas / zones / devices | `GET /area/full_area_status`, `POST /area/rename`, `/zone_update`, `/zone_tuning_update`, `/zone_on-off`, `/scene_activate`, `/scene_list`, `/zone_status`, `GET /area/zones_missing_load_data`, `/zone_list`, `/tunning_settings`, `POST /area/upload_zonewise_load_csv`, `POST /setting/button_status`, `/button_update`, `/setting/edit`, `/scene_status` | JWT |
| F8 | Area groups | CRUD `/area_group/*` + `POST /upload_csv`, `GET /download_csv` | JWT |
| F9 | Schedules + quick controls | `GET/POST/PUT/DELETE /schedule/*` (`enable/disable/create/trigger/update/delete/list/details/groups`), `/quick_control/*` (`create/update/list/details/trigger/delete`), `/occupancy/update_setting`, `/area_group/update_setting` | JWT |
| F10 | Email / SMTP | `POST /email/create`, `GET /email/list`, `POST /email/send-test-email` | JWT |
| F11 | Dashboards / energy | `GET /dashboard/energy_consumption`, `/energy_savings`, `/peak_min_consumption`, `/light_power_density`, `/total_consumption/by_group`, `/occupancy_count`, `/instant_occupancy_count`, `/occupancy_by_group*`, `/space_utilization_per*`, `/peak_min_occupancy*`, `/saving_by_stratergy`, `/unified_energy_consumption_savings_data`, `POST /test-fill-missing-data` | JWT |
| F12 | Exports / reports | 10× `GET /exports/*/download` + `POST /exports/*/email`, `GET /activity_report` + `/export/download` + `/export/send_by_email`, `GET /alert/active_alerts/download`, `POST /alert/active_alerts/send_by_email`, `POST /dashboard/*/send_by_email`, `GET /area/area_size_download`, `GET /processor/leaf_areas` | JWT |
| F13 | FOFP overlay | `GET/PUT /fofp/config`, `POST /generate-layout`, `GET /layout/{floor_id}`, `PUT /layout` | JWT |
| F14 | Layout / widgets / theme | `GET/POST /dashboard/layout` (write = SA-only), `/widgets/dashboard_chart_order`, `/widgets/rename_widget`, `/widgets/configuration`, `GET/POST /theme/`, `/background`, `/application`, `/heatmap`, `POST /theme/background_image_clear` | JWT / SA |
| F15 | Help files | `POST /help/upload` (→ `/help_files/{uuid}_{name}`), `GET /help/list` | JWT (files served publicly) |
| F16 | Config / settings / alerts | `GET/POST /config/installation`, `POST /settings/disable_alerts`, `/maintenance`, `GET /settings/alerts_display_status`, `POST /alert/discover_devices`, `GET /alert/active_alerts`, `/alerts_types`, `POST /alert/reconcile_live`, `POST /reconciliation/trigger` | JWT / SA |
| F17 | Monitoring | `GET /monitoring/health`, `/pipeline`, `/processors/connectivity`, `/jobs`, `/status`, `/summary`, `/components`, `/processors`, `/alerts`, `/jobs`, `/http`, `/analytics`, `/pipeline`, `/runtime/*`, `/issues`, `/resources`, `/internal/*`, `PATCH /monitoring/status`, `POST /monitoring/alerts/{id}/acknowledge`, `POST /monitoring/ingest` (shared-secret `X-Monitoring-Ingest-Token` / Bearer) | SA / MON |
| F18 | Heatmap live WS | `WS /ws/heatmap/live` (auth via `Authorization` header / `?token=` / `{"action":"auth"}`; then `subscribe {floor_id, area_id, display_mode}`) | JWT + OP(1) |
| F19 | Static mounts | `/background_image/*`, `/logo_image/*`, `/help_files/*` (public, no auth); `/floor/{id}/plan` is the authenticated replacement; `/certificates/*` never served | Public (F19a) / JWT (plan) |
| F20 | Health / docs | `GET /health` (public liveness), `/docs`, `/redoc`, `/openapi.json` (disabled when `ENABLE_API_DOCS=false`) | Public |

Dual-routing note: every `api_router` endpoint is reachable at BOTH `/X` and `/api/v1/X` — test both for auth drift.

### 1.2 Frontend (React) — same functions from client side
Login, ChangePassword, Dashboard/Energy/Space-Utilization/Alerts tabs, HeatMap + live WS + GroupOccupancy model, Floors CRUD + PDF viewer + coordinate correction + area calc (localStorage `area_calculation_{floorId}`, `selectedProcessors`), Schedules, QuickControls, AreaGroups (manage + user), AreaSizeLoad, EmailServer, Users, ThemeChange, RenameWidget, Sensors/Modules (Superadmin-only CSV/XLSX/JSON upload → `POST /alert/upload_device_alerts`), Help create/get, Home CMS (react-quill rich text), ActivityReport, LutronWebsite page. Token in `localStorage["lutron"]`, role/permission in localStorage, `AuthGuard` only on quickcontrols / activity-report / sensors / modules / alerts — rest is sidebar-hiding only.

### 1.3 Out of scope
Windows EXE packaging (`start_server.exe`, Nuitka, tray, NSSM/PM2 scripts in `deployment_scripts/`), physical Lutron processor hardware, third-party mail relays, DoS above rate-limit validation, social engineering.

---

## 2. Test Methodology (OWASP WSTG + PTES)

1. **Recon & mapping** — WSTG-INFO/IDENT: spider `/`, `/api/v1/`, `/health`, `/openapi.json` (toggle `ENABLE_API_DOCS=true` in lab only), enumerate dual routes, WS endpoint, static mounts, `robots/sitemap`, JS bundle (`main.*.js`) for hidden routes + `REACT_APP_API_URL`.
2. **Configuration & identity** — WSTG-CONF/IDNT: CORS (`Origin` reflection vs `CORS_ALLOWED_ORIGINS`), security headers (`SecurityHeadersMiddleware`: nosniff/DENY/CSP), HTTP methods (`OPTIONS/TRACE`), error verbosity, rate-limit (login 20/5min, mutations 30/60s → expect 429).
3. **Authentication testing** — credential stuffing/brute force, JWT alg-confusion (`none`/RS256), `kid`/`jku` injection, expiry/replay (revoked-list check after `POST /auth/logout`), `change_password` enforcement, no-reset-flow abuse, WS `?token=` leakage in logs.
4. **Authorization testing** — horizontal/vertical IDOR + BOLA on every `/{id}`, `{email}`, `{floor_id}`, `{area_id}`; role matrix (Operator → Admin → Superadmin endpoints incl. `PUT /users/{email}`, `/dashboard/layout` POST, `/monitoring/*`, `/manage-sensors`); floor-permission levels 1–4 bypass; dual-route (`/` vs `/api/v1/`) auth drift; WS `subscribe` to unauthorized floor.
5. **Session & storage** — `localStorage["lutron"]` XSS exfiltration, `jwtDecode` client-trust (forge role, tamper `permission`), missing `HttpOnly/Secure` compensations, 401/403 redirect handling.
6. **Input validation / injection** — WSTG-INPV: SQLi (all filters/IDs/CSV contents), XSS (stored via react-quill home descriptions, widget titles, help names, area rename → reflected in heatmap/dashboard; DOM via `resolveMediaUrl`, `pdf.worker` query), CSV/Excel formula injection (`=cmd|…` in `leaf_areas`, `area_size_download`, all `exports/*/download`), XML/XXE (XLSX upload in ManageModules), SSTI/PDF-injection (jsPDF/pdfmake paths), OS command injection (`POST /processor/ping_terminal` — `ping.exe -t <ip>` despite RFC1918 check; `&`, `|`, `;`, `%26`, Unicode bypass), SMTP header injection (`/email/*`, `*/send_by_email?to_email=`), LDAP/XPath N/A, SSRF (`/processor_discovery/scan`, `/manual_add`, LEAP probe 8081/8083, `is_processor_reachable` — try 169.254.169.254/cloud metadata, internal CIDR, DNS-rebind).
7. **File upload / traversal** — extension/MIME/polyglot (`.pdf`, `.csv`, `image/*`, help uploads): double-extension (`x.pdf.exe`, `x.svg`), `content-type` spoof, `%00`, case (`.PDF`), SVG-with-JS, PDF-with-JS; size bombs; path traversal on download (`../`, `%2e%2e`, `lstrip("/")` bypass); unauthenticated fetch of `/background_image/*`, `/logo_image/*`, `/help_files/*` (enumeration, sensitive content); floor-plan `FileResponse` media-sniff.
8. **Cryptography & secrets** — JWT `HS256` brute-force (`JWT_SECRET` strength), `DATABASE_HOST_URL` / `MONITORING_INGEST_TOKEN` / `SMTP_FERNET_KEY` exposure (env, bundles, `/internal/*`), SMTP creds in DB via `GET /email/list`, TLS on LEAP (8081/8083, `CERT_REQUIRED` downgrade), cert-bundle handling in `processor_handshake`.
9. **Business-logic & integrity** — mass-assignment (immutable `role` on `PATCH /users/update`), `can_create_role` / `can_manage_user_for_update` bypass, schedule trigger abuse (APScheduler job flooding via `POST /schedule/trigger`), `reconciliation/trigger` + `reconcile_live` abuse, `test-fill-missing-data` data-poisoning, `installation_config` token/flag tampering, `disable_alerts`/`maintenance` silencing, dependency integrity (`axios 1.12.0`, `react-scripts 5.0.1`, `pdfjs-dist 4.8.69`, `shell-quote/websocket-driver/flatted/node-forge/yaml` overrides — `npm audit`, lockfile tamper).
10. **Logging, monitoring & rate-limit** — `activity_report` tamper/gap, `jwt_revoked.json` persistence, `monitoring/ingest` backpressure (429/503), `acknowledge` audit, alert-email spoofing, log injection via renamed areas/usernames.
11. **Retest & reporting** — reproduce with `curl`/Burp, CVSS 3.1 + OWASP risk, evidence (request/response, screenshots), remediation mapped to file:line.

Tools: Burp/ZAP, `ffuf/gobuster`, `sqlmap`, `jwt_tool`, `Semgrep/Bandit/npm audit`, browser DevTools (sourcemap check — `GENERATE_SOURCEMAP=false` must hold).

---

## 3. OWASP Top 10 → Coverage Matrix

| OWASP 2021 | Where it applies in Lutron LMS |
|------------|--------------------------------|
| **A01 Broken Access Control** | F2 (role escalation, immutable-role bypass), F5/F7/F8 (floor/area/zone IDOR, `OP(1-4)` bypass), F14 (SA-only layout write), F17 (SA monitoring vs JWT), F18 (WS subscribe scope), F19 (public static vs auth plan), dual-route drift, `AuthGuard`-only UI gating |
| **A02 Cryptographic Failures** | JWT secret strength/expiry, `localStorage` token theft via XSS, SMTP creds in `GET /email/list`, `DATABASE_HOST_URL`/`MONITORING_INGEST_TOKEN` exposure, LEAP mTLS cert handling, missing field-level encryption (FERNET scope) |
| **A03 Injection** | `ping_terminal` OS-CMDi, SQLi (filters/IDs/CSV), stored/reflected/DOM XSS (quill, rename, media URLs), SMTP header injection, CSV formula injection, SSRF (`scan`/`manual_add`/LEAP probe), XXE via XLSX, log injection |
| **A04 Insecure Design** | No password-reset flow, single long-lived JWT (no refresh/rotation), `change_password` flag bypass, unauth `/health` info, public `/help_files` by design, permissive `scan` (32 arbitrary IPs), `test-fill-missing-data` in prod |
| **A05 Security Misconfiguration** | CORS allowlist, security headers, docs enabled in prod, verbose errors/stack traces, `setupProxy.js` → 127.0.0.1:8000, default creds, `ENABLE_API_DOCS`, GZip on sensitive JSON, `TRACE`/debug methods |
| **A06 Vulnerable Components** | `react-scripts 5.0.1`, `axios`, `pdfjs-dist`, `recharts`, `formik/yup`, `python` deps (`psycopg2`, `cryptography`, `zeroconf`), `overrides` advisories — `npm audit` + `pip-audit` + `retire.js` |
| **A07 Auth Failures** | Brute-force/credential stuffing (rate-limit bypass via IP rotation, `/api/v1` vs `/` counter sharing), JWT `none`/alg-confusion, logout-replay, `change_password` skip, WS token in URL, weak lockout |
| **A08 Integrity Failures** | Mass-assignment (`role`), unsigned firmware/plan/CSV ingestion, `postbuild` precompress tamper, CDN-less SRI check, `pdf.worker.min.mjs` nonce handling, `UploadFile` without checksum, schedule/job integrity |
| **A09 Logging & Monitoring** | `activity_report` completeness (all F1–F17 mutations logged?), `monitoring/health` vs `/health` confusion, `acknowledge` audit, ingest-token misuse alerting, revoked-token log, alert-silencing (`disable_alerts`) detection |
| **A10 SSRF** | `POST /processor_discovery/scan` + `/manual_add` + `is_processor_reachable` + LEAP `ReadRequest/UpdateRequest` to attacker IP + `resolveMediaUrl`/PDF fetch if server-side |

---

## 4. Test Cases (execute per environment: unauth + Operator + Admin + Superadmin)

| ID | OWASP | Function / Endpoint | Steps | Expected (pass) |
|----|-------|---------------------|-------|-----------------|
| TC-A01-01 | A01 | Users vertical: `POST /users/create`, `PUT /users/{email}`, `POST /dashboard/layout` as Operator/Admin | Replay SA-only calls with lower-role JWT on both `/` and `/api/v1/` | 403 every time; no user created, layout unchanged |
| TC-A01-02 | A01 | Users horizontal / immutable role: `PATCH /users/update` + `{"role":"Superadmin"}` | Update own/other user incl. role field | Role ignored (still old role); cannot edit out-of-scope user → 403 |
| TC-A01-03 | A01 | Floor/area BOLA: `GET /floor/{id}/plan`, `/area/*`, `/fofp/layout/{floor_id}`, `/area_group/get/{id}` | Swap IDs to another floor/area/group the Operator cannot view | 403/404 without data leak; no enumeration oracle |
| TC-A01-04 | A01 | WS scope: `/ws/heatmap/live` subscribe | Auth as Operator with floor-A only, subscribe `floor_id=B` | Server rejects/close, no snapshots for floor B |
| TC-A01-05 | A01 | Static vs auth: `/help_files/*`, `/background_image/*` vs `/floor/{id}/plan` | Fetch uploaded file unauth; fetch plan unauth | Static per design (no sensitive content); plan → 401 |
| TC-A01-06 | A01 | Dual-route drift | Repeat 01–03 on `/api/v1/...` mirror | Identical 401/403; no route missing auth |
| TC-A02-01 | A02 | JWT + storage | `jwt_tool` crack, `alg=none`, tamper `exp/role`; XSS `localStorage["lutron"]` read | Weak secret rejected (strong secret); forged/tampered token → 401; token not exfiltratable (no XSS — see TC-A03) |
| TC-A02-02 | A02 | Secrets exposure: `GET /email/list`, `/monitoring/internal/*`, `/config/installation`, JS bundle | Inspect responses + `main.*.js` for `JWT_SECRET`, ingest token, SMTP password, DB URL | No secrets; SMTP password masked; tokens server-side only |
| TC-A03-01 | A03 | SQLi: `list/details/search`, `?floor_id=`, `area_id`, CSV import values | `' OR '1'='1`, `UNION SELECT`, time-based (`pg_sleep`) | Parameterized (no error/time diff); 400/422, no dump |
| TC-A03-02 | A03 | OS-CMDi: `POST /processor/ping_terminal` | `127.0.0.1;whoami`, `&&calc`, `\|dir`, `%26`, Unicode, 300-char | Strict RFC1918 IPv4 only; any meta-char → 422; no command output |
| TC-A03-03 | A03 | Stored XSS: home descriptions (quill), widget rename, area rename, help filename | `<img src=x onerror=alert(1)>`, `<svg onload>`, `javascript:` URLs | Sanitized/escaped on render; no script execution in Dashboard/HeatMap/GetHelp |
| TC-A03-04 | A03 | SMTP injection: `/email/*`, `*/send_by_email`, `?to_email=` | `victim@x.com%0d%Bcc:evil@x`, subject `\r\n` split | Rejected/encoded; single recipient only |
| TC-A03-05 | A03 | CSV formula injection: all `*/download`, `leaf_areas`, `area_size_download` | Seed zone/area name `=cmd\|'/c calc'!A0`, `+2+2`, `@SUM` | Cells sanitized (`'=`, quoted) or export warns; no execution on open |
| TC-A03-06 | A03 | XXE (ManageModules XLSX/JSON upload) | XLSX with `<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">` | Parser hardened (no external entities); upload rejected or neutralized |
| TC-A07-01 | A07 | Brute force: `POST /auth/login` | 25 wrong logins same IP; then rotate IP/`/api/v1/` path | 429 after 20/5min on all mirrors; no user-enumeration delta |
| TC-A07-02 | A07 | JWT lifecycle: logout replay, expired use, `change_password` skip | Use token after `POST /auth/logout`; expired `exp`; skip forced change | Revoked/expired → 401; forced-change user blocked until `POST /auth/change_password` |
| TC-A07-03 | A07 | WS token leakage: `?token=<JWT>` | Connect via query-token; check server access logs | Works but token rotated on logout; logs mask query token (or header-auth preferred) |
| TC-A10-01 | A10 | SSRF: `POST /processor_discovery/scan`, `/manual_add` | `{"ips":["169.254.169.254","127.0.0.1","0.0.0.0"]}`, DNS-rebind domain, `http://evil` | Only operator-pasted public-site IPs probed on 8081/8083; CIDR/metadata/internal rejected; no response body from internal service |
| TC-UPL-01 | A01/A03/A08 | Uploads: floor PDF/CSV, logo/background `image/*`, help files, `area_coord`, zone-load CSV, LEAP certs | Polyglots (`shell.pdf.exe`, `x.svg` with JS, PDF-with-JS, `../../evil`), wrong `Content-Type`, 100 MB | Allowlist ext+MIME+magic bytes, random `uuid_` rename, size cap, malware-safe store; traversal neutralized; SVG served as `image/svg+xml` without script exec (or `Content-Disposition: attachment`) |
| TC-UPL-02 | A01 | Download traversal: `GET /floor/{id}/plan`, `/exports/*/download`, `/help_files/{path}` | `../environment.env`, `%2e%2e%2f`, absolute paths | Constrained to own dir (basename/join-safe); `../` → 404 without leak |
| TC-A05-01 | A05 | CORS/headers/methods | `Origin: https://evil.com`, `OPTIONS`, `TRACE`, `GET /openapi.json`, error trigger (bad JSON) | No `Access-Control-Allow-Origin: evil`; `nosniff/DENY/CSP` present; docs 404 in prod; generic errors, no tracebacks |
| TC-A06-01 | A06 | Components | `npm audit --omit=dev`, `pip-audit`, `retire.js` on `build/` | No critical/high without mitigation; `overrides` (shell-quote etc.) verified |
| TC-A08-01 | A08 | Integrity: `PATCH /users/update{role}`, `POST /config/installation{monitoring tokens}`, `POST /schedule/trigger` flood | Mass-assign role/token; 50 rapid triggers | Immutable fields ignored; tokens SA-gated; scheduler throttled (429/job dedupe) |
| TC-A09-01 | A09 | Logging: login fail, privilege escalation attempt, alert-silence, ingest abuse | Perform each, then `GET /activity_report` + `/monitoring/issues` | All security events logged with actor/IP/time; silencing raises alert; logs tamper-evident |
| TC-BIZ-01 | A04 | Business logic: `POST /schedule/trigger`, `/alert/reconcile_live`, `/reconciliation/trigger`, `/test-fill-missing-data` | Trigger as Operator on unauthorized floor; reconcile storm | Scope-checked (403 out-of-scope); prod-dangerous endpoints SA-gated or removed |

**Pass/fail:** any data leak, privilege gain, command/SSRF egress, stored XSS execution, unauth plan/monitoring access, or auth bypass on either `/` or `/api/v1/` mirror = **FAIL (re-test after fix)** with CVSS 3.1.

---

## 5. Deliverables
1. Executive summary (risk rating per OWASP category).
2. Findings table (ID, OWASP, endpoint, evidence request/response, CVSS, remediation + file hint, e.g. `routes/processor.py: ping_terminal`, `cors_config.py`, `dependencies/permissions.py`).
3. Retest report.
4. Optional hardening backlog: refresh-token rotation, server-side upload AV + SVG sandbox, SSRF allowlist (RFC1918-only already for ping — extend to scan), `HttpOnly` cookie alternative to localStorage, WAF/rate-limit tuning, `ENABLE_API_DOCS` guard test in CI.
