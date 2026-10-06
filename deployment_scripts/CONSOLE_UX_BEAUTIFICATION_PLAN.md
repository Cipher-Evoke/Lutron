# Lutron LMS Deployment Console UX Beautification Plan

Status: analysis and design only  
Scope: Install, Start, Stop, Uninstall, PM2 support, and deployment launchers  
Constraint: zero functionality change

## 1. Executive Summary

The deployment experience is operationally rich but visually inconsistent. The scripts already expose useful progress, retry, health, service, and final-state information; the main problem is that the information is emitted through many local `Write-Host` blocks and a few independent CMD `echo` blocks.

The safest improvement is a presentation-only standard layered over the existing control flow:

- Keep every command, branch, retry, wait, dependency, exit code, and execution order unchanged.
- Centralize only formatting decisions such as labels, separators, indentation, color, and summary layout.
- Preserve raw third-party output from `npm`, `pip`, PM2, `psql`, and installers as command output, but bracket it with a consistent step header and result line.
- Keep CMD launchers thin and compatible with double-click execution.
- Treat `pm2_runtime\.pm2` as generated runtime state, not as a source UX surface.

The largest operator benefit will come from making the current phase, current action, result, and next action visually obvious without reducing diagnostic detail.

## 2. Inventory

### Source entry points

| File | Purpose | UX role |
|---|---|---|
| `Install_LMS.cmd` | Double-click launcher for installation | Starts a visible elevated-capable PowerShell window and exits the CMD wrapper |
| `Start_LMS.cmd` | Double-click launcher for startup | Starts the visible startup PowerShell window |
| `Stop_LMS.cmd` | Double-click launcher for shutdown | Starts the visible stop PowerShell window |
| `Uninstall_LMS.cmd` | Double-click launcher for teardown | Runs uninstall synchronously and reports its exit code |
| `scripts/LMS_installation.ps1` | Full installation and configuration workflow | Main long-running installer UI |
| `scripts/LMS_start.ps1` | Preflight, cleanup, build, PM2 start, readiness checks, browser launch | Main startup UI |
| `scripts/LMS_stop.ps1` | PM2 stop, process-tree cleanup, service cleanup, legacy task cleanup | Main stop UI |
| `scripts/LMS_uninstall.ps1` | Remove PM2 stack and startup artifacts while leaving PostgreSQL | Teardown UI |
| `scripts/LMS_pm2.ps1` | Shared PM2 lifecycle, service cleanup, startup registration, verification, and logrotate support | Shared operational UI and control layer |
| `scripts/LutronPaths.ps1` | Shared path and monitoring-directory resolution | Mostly silent path utility; emits two deployment messages |

### Templates and generated runtime files

| File/category | Purpose | UX treatment |
|---|---|---|
| `pm2/ecosystem.config.js.template` | Source template for generated PM2 application configuration | No direct console output |
| `pm2/pm2-resurrect.cmd.template` | Source template for the Windows startup wrapper | No direct console output |
| `pm2_runtime/ecosystem.config.js` | Generated PM2 configuration | Runtime artifact; do not hand-style console output |
| `pm2_runtime/pm2-resurrect.cmd` | Generated startup wrapper | Runtime artifact; preserve command behavior |
| `pm2_runtime/.pm2/**` | PM2 daemon state, module files, logs, dumps, and metadata | Generated state; exclude from UX refactors and source review |
| `input.json` | Database, superadmin, and hosting configuration consumed by scripts | Configuration input, not a console UI file |
| `.gitignore` | Ignore rules for generated PM2 state | No UX change |

The current tree contains six source PowerShell scripts, four top-level CMD launchers, two PM2 templates, two generated PM2 root files, and a large generated PM2 state tree. There is no separate restart script; Start performs restart-like cleanup before relaunch. There is no separate service-management script; PM2 and legacy NSSM handling are embedded in the shared PM2 utility and operational scripts. There is no BAT file distinct from the CMD launchers.

## 3. Script-by-Script Analysis

### `Install_LMS.cmd`

1. **Purpose:** Resolve its directory, verify `scripts/LMS_installation.ps1`, launch PowerShell visibly, and return immediately.
2. **Flow:** `@echo off` -> set local environment -> `cd /d` -> file existence check -> `start powershell.exe` -> `exit /b 0`.
3. **Current output:** Only prints an error when the PowerShell script is missing; normal execution is intentionally silent in CMD.
4. **Colors:** None; CMD has no color styling here.
5. **Duplicate logging:** The missing-script block is duplicated across all three operational CMD launchers.
6. **Errors:** `[ERROR]`, blank lines, and `pause`; normal wrapper launch errors are not surfaced.
7. **Progress:** Delegated to PowerShell.
8. **Summary:** None in CMD; the PowerShell installer owns the completion banner.
9. **Windows considerations:** `start` creates a separate visible window; `cd /d` supports a different drive; `start` returns before PowerShell finishes, so CMD exit code is not the installation result.
10. **Beautification opportunity:** Standardize the missing-script message and window titles only. Do not change `start`, arguments, elevation, or exit behavior.

### `Start_LMS.cmd`

The structure and concerns match `Install_LMS.cmd`. Its title is `Lutron LMS Startup`; the error names `LMS_start.ps1`. Keep the wrapper quiet on success and let `LMS_start.ps1` own all progress and final status.

### `Stop_LMS.cmd`

The structure and concerns match the other operational launchers. Its title is `Lutron LMS Stop`; the error names `LMS_stop.ps1`. The best improvement is consistent wording and spacing in the missing-script path only.

### `Uninstall_LMS.cmd`

1. **Purpose:** Launch uninstall and expose its exit code to the caller.
2. **Flow:** Resolve directory -> validate `LMS_uninstall.ps1` -> print a CMD banner -> run PowerShell synchronously -> capture `%ERRORLEVEL%` -> print completed/failed result -> return that code.
3. **Current output:** A banner appears before execution and a second completion block appears after execution.
4. **Colors:** None; plain CMD output.
5. **Duplicate logging:** Launcher validation repeats the other CMD files; banner and final result are unique to this launcher but overlap with PowerShell uninstall banners.
6. **Errors:** Missing script pauses and returns 1; nonzero uninstall reports `Exit code` and pauses.
7. **Progress:** Delegated to PowerShell.
8. **Summary:** CMD prints `Uninstall Completed` or `Uninstall Failed`; PowerShell also prints a completion banner.
9. **Windows considerations:** Synchronous invocation preserves the uninstall exit code; do not replace it with `start` without an explicit behavior decision.
10. **Beautification opportunity:** Align the CMD result wording with the PowerShell result while retaining the exact exit code and synchronous execution.

### `scripts/LMS_installation.ps1`

1. **Purpose:** Administrator elevation, prerequisite installation, virtual environment setup, Python/Node/PostgreSQL configuration, database initialization, superadmin setup, log creation, PM2 setup, and runtime verification.
2. **Flow:** Path discovery and elevation -> environment/path checks -> disk and network checks -> Python/Node install or detection -> Python verification -> venv creation/verification -> pip and npm installation -> folder/config validation -> PostgreSQL/service/database work -> migrations and superadmin -> logs/temp cleanup -> PM2 install/configuration/startup registration/verification -> final success pause.
3. **Current output:** Large cyan banner and numbered sections; `[INFO]`, `[OK]`, `[WARNING]`, and `[ERROR]` messages; raw package-manager and database command output; download progress bars/spinners; final next-steps block.
4. **Colors:** Cyan for headers/paths, green for success, yellow for information/warnings/retries, red for errors, and uncolored output for the timestamped log stream and third-party commands.
5. **Duplicate logging:** `Write-Log` writes timestamped lines to `%TEMP%\lutron_setup.log` and also prints them; many failures then print a second non-timestamped error block. The press-any-key exit sequence is repeated throughout. Section banners repeat the same three `Write-Host` calls for every step.
6. **Errors:** Usually a detailed immediate error plus manual remediation and a pause. Some installation failures are logged and continue, while fatal failures exit; presentation must not imply a different severity.
7. **Progress:** Download progress uses carriage-return bars/spinners; retries identify attempt counts and delay; long external commands stream their own output.
8. **Summary:** Strong final summary with install log path, PM2 apps, startup task, URLs, and next steps. Earlier phase outcomes are not collected into a compact summary.
9. **Windows considerations:** Auto-elevation, `ReadKey`, `Start-Process`, PowerShell execution policy, path quoting, `cmd.exe`/MSI invocation, carriage returns, and console-width limitations all matter. Avoid Unicode box drawing and ANSI-only control sequences.
10. **Beautification opportunity:** Keep the phase logic intact while replacing repeated banners and message construction with shared display helpers; preserve raw output and pauses exactly where operators currently rely on them.

### `scripts/LMS_start.ps1`

1. **Purpose:** Optional auto-start configuration, path/config loading, stale-process cleanup, dependency preflight, frontend build preparation, PM2 start, backend/frontend readiness checks, browser launch, and final endpoint summary.
2. **Flow:** Optional health-only branch -> optional auto-start branch -> title/path detection -> legacy service and old process cleanup -> hosting config -> path validation -> optional auto-start prompt -> venv/dependency checks -> log cleanup and environment updates -> frontend install/build decision -> PM2 start/save -> backend retry loop -> frontend retry loop -> browser open -> final summary.
3. **Current output:** Multiple banners (`CONFIGURING AUTO-START`, `LUTRON APPLICATION LAUNCHER`, `STEP 1`, `STEP 2`), detailed path/config lines, cleanup messages, retry messages, build status, readiness status, manual commands on failure, and final URLs/logs.
4. **Colors:** Cyan headers and paths, yellow info/action/warnings, green success, red fatal errors, cyan command snippets.
5. **Duplicate logging:** Path detection, elevation, process-tree helpers, service fallback handling, manual command blocks, and scheduled-task messaging overlap with Install/Stop. `[INFO]` is used for both routine state and operator action. The same pause/error pattern appears repeatedly.
6. **Errors:** Generally actionable, with logs and manual commands. Some errors include implementation diagnostics such as stack traces and path discovery internals that are useful during troubleshooting but visually noisy for routine operation.
7. **Progress:** Backend and frontend retry counters are clear but visually repetitive; build/install work is represented by a single line while subprocess output is redirected to log files.
8. **Summary:** Strong final summary with URLs, API docs state, logs, background status, and PM2 auto-start ownership.
9. **Windows considerations:** Scheduled tasks, UAC relaunch, `Get-WmiObject`, `Get-CimInstance`, `taskkill`, `cmd.exe` quoting, browser launch, and PowerShell host behavior are all Windows-specific. Keep command text and process order unchanged.
10. **Beautification opportunity:** Introduce a stable phase header and a compact two-column status layout; group cleanup, preflight, build, launch, and readiness without changing the underlying sequence.

### `scripts/LMS_stop.ps1`

1. **Purpose:** Stop PM2 apps, terminate backend/frontend process trees and residual children, remove legacy service/task remnants, and leave PM2 boot registration in place.
2. **Flow:** Elevate -> header/path discovery -> PM2 stop -> backend port/command-line/process-tree passes -> residual Python pass -> backend port result -> frontend passes -> no-server result -> legacy service cleanup -> legacy auto-start task cleanup -> final success banner.
3. **Current output:** Cyan banner, path lines, yellow action/status lines, green stopped/clear lines, warnings for unavailable scans or failed cleanup, and a final green banner.
4. **Colors:** Cyan for headings and paths, yellow for actions/info/warnings, green for success, red only in elevation errors.
5. **Duplicate logging:** Process-tree, path discovery, service cleanup, and elevation helpers overlap with Start. The backend and frontend cleanup sections are structurally repetitive. The final output says all servers stopped even though warnings can have been emitted.
6. **Errors:** Most cleanup failures are warnings and the script continues; this is operationally intentional. The presentation should distinguish completed cleanup from best-effort cleanup without changing exit code 0 behavior.
7. **Progress:** Clear backend-first/frontend-second order, but repeated `INFO` lines and blank lines make the multi-pass strategy harder to scan.
8. **Summary:** Present and readable, but it should report warnings/non-clear ports in a compact result area while retaining the current behavior.
9. **Windows considerations:** Process-tree termination uses `taskkill /F /T`; process command-line visibility may vary by privilege; scheduled tasks and services require elevation; do not add assumptions about WMI availability.
10. **Beautification opportunity:** Use a service-style status table for Backend, Frontend, residual processes, legacy service, and legacy task; retain all existing passes and warnings.

### `scripts/LMS_uninstall.ps1`

1. **Purpose:** Remove PM2 apps, PM2 startup registration/artifacts, leftover LMS processes, legacy service remnants, and legacy auto-start artifacts while deliberately leaving PostgreSQL running.
2. **Flow:** Elevate -> uninstall banner/root -> shared PM2 teardown -> verify legacy service absence -> kill leftover listeners/processes -> report PostgreSQL policy -> verify orphans -> final completion banner/pause.
3. **Current output:** Cyan banner/root, yellow operational messages, red fatal legacy-service message, green orphan/completion messages, and a policy note that PostgreSQL is not modified.
4. **Colors:** Cyan, yellow, green, and red with the same semantic intent as Stop but no shared formatter.
5. **Duplicate logging:** Header, elevation, path resolution, process cleanup, service handling, pause, and final banner patterns overlap with Stop. PM2 helper output is also printed directly.
6. **Errors:** PM2 teardown errors are downgraded to warnings; a remaining legacy service is fatal; orphan processes are warnings; the script exits 0 after its normal completion path.
7. **Progress:** Reasonable phase order, but the distinction between removed, left running by policy, and still detected is not visually grouped.
8. **Summary:** Good final policy statement; it should be preserved and made more scannable.
9. **Windows considerations:** Same UAC, Task Scheduler, service, WMI/CIM, `taskkill`, and pause concerns as Stop.
10. **Beautification opportunity:** Reuse Stop’s proposed cleanup summary and add an explicit `PRESERVED BY POLICY` row for PostgreSQL.

### `scripts/LMS_pm2.ps1`

1. **Purpose:** Shared PM2 context, executable resolution, generated config, legacy NSSM/task cleanup, PM2 app lifecycle, logrotate setup, startup task registration, and runtime verification.
2. **Flow:** Initialize context -> resolve Node/PM2 -> write ecosystem -> assert config -> resurrect or start apps -> install/configure logrotate -> save dump -> register SYSTEM startup task -> verify apps, health, children, energy logger, frontend, service absence, and listener count.
3. **Current output:** Direct helper messages such as `[OK]`, `[INFO]`, `[WARNING]`; raw PM2 output from resurrect/start/install/config commands; generated paths; scheduled-task details; final verification errors as a list.
4. **Colors:** Green success, yellow info/warnings, red only at the calling installer’s final verification block; raw PM2 output is uncolored.
5. **Duplicate logging:** PM2 operations print their raw output and then print a local result. Service and startup operations repeat the same patterns found in Start/Stop/Uninstall. No common UI abstraction exists.
6. **Errors:** Throws are appropriate for control flow; messages are often multiline and mixed with raw command output. The installer catches and presents them again.
7. **Progress:** Good local action messages, but long PM2 operations have no consistent begin/end framing.
8. **Summary:** Runtime verification has a useful error list and success line, but no compact per-check status table.
9. **Windows considerations:** PM2 named pipes, `PM2_HOME`, `pythonw.exe`, scheduled tasks as SYSTEM, ACLs, `cmd.exe`, and WMI/CIM visibility are central. Any helper must avoid ANSI assumptions and preserve raw command behavior.
10. **Beautification opportunity:** This is the natural owner for shared status/result formatting, but the helper should remain presentation-only and must not catch, suppress, reorder, or reinterpret errors.

### `scripts/LutronPaths.ps1`

This utility resolves deployment, application, monitoring, input, and log paths across drives and may copy monitoring files into the root. It is mostly silent; its two `[INFO]` deployment/copy messages should use the same action style as the operational scripts. Do not add progress output inside recursive drive searches because that would materially increase noise and could expose paths without aiding operators.

### PM2 templates and CMD runtime wrapper

`ecosystem.config.js.template` and `pm2-resurrect.cmd.template` define generated runtime behavior and have no user-facing status system. `pm2-resurrect.cmd` should remain a minimal command wrapper. Any later UX change should be limited to comments or surrounding caller output, never command quoting, environment variables, executable paths, or PM2 arguments.

## 4. Ranked Console UX Issues

### High impact

1. **No shared presentation layer:** The same headers, labels, pauses, path lines, and severity conventions are reimplemented across scripts, making future consistency difficult.
2. **Phase visibility is inconsistent:** Install has numbered phases; Start mixes named banners and numbered steps; Stop mixes prose actions and banners; PM2 helper functions have no section framing.
3. **Result semantics are mixed:** `[INFO]` can mean a normal state, an action beginning, or a configuration fact; `[WARNING]` can mean fallback, retry, nonfatal failure, or expected absence.
4. **Long-running output lacks a stable step contract:** Operators cannot always tell whether a line means started, still running, completed, or skipped.
5. **Final summaries do not share a shape:** Start and Install have rich summaries; Stop and Uninstall have different banners; PM2 verification is mostly an error list.

### Medium impact

6. **Raw third-party output is not visually bracketed:** `npm`, `pip`, PM2, `psql`, and installer output can interrupt the script’s visual hierarchy.
7. **Repeated blank lines and repeated full-width separators consume vertical space:** This is most noticeable in Install and Start.
8. **Error detail is sometimes too low-level for the first screen:** Stack traces and path discovery internals are useful, but should be grouped under a diagnostics block after the concise action/remediation line.
9. **Progress bars and retry lines use different conventions:** Download bars use carriage returns, while readiness checks emit new lines.
10. **CMD and PowerShell completion language differs:** Uninstall reports completion in both layers with different wording.

### Low impact

11. **Some labels are not aligned:** `Backend:`, `Frontend:`, `Log File:`, and URL lines use ad hoc spacing.
12. **The project uses `[OK]` and `[SUCCESS]` interchangeably:** Both are understandable, but one standard is easier to scan.
13. **No explicit quiet/detail mode for console volume:** Existing `-Silent` behavior must be preserved; a later design may add display detail only if it does not change execution or existing automation expectations.

## 5. Professional Console Standard

### Design principles

- ASCII-only framing for Windows PowerShell 5.1 and standard CMD compatibility.
- One blank line before each major section and one after each final summary.
- Fixed semantic labels, not decorative symbols.
- Keep lines below approximately 100 characters where practical; wrap paths and command details deliberately.
- Never hide raw command output; place it between `BEGIN` and `END` markers when it is expected to be verbose.
- Color is reinforcement, not the only meaning. Every state must remain understandable in monochrome.

### Header and section format

Major operation:

```text
============================================================
  LUTRON LMS | INSTALLATION
============================================================
```

Section:

```text
------------------------------------------------------------
  [03/12] Virtual environment
------------------------------------------------------------
```

The denominator is optional in a later phase if calculating it would touch control flow. A fixed section title without a count is safer for the first implementation.

### Message vocabulary

| Type | Canonical label | Color | Use |
|---|---|---|---|
| Informational state | `[INFO]` | Cyan or default | Facts, detected configuration, paths, expected skips |
| Action beginning | `[....]` | Yellow | Work about to start or an external command being invoked |
| Success | `[ OK ]` | Green | Completed validation or operation |
| Warning | `[WARN]` | Yellow | Nonfatal fallback, retry, unavailable optional check, policy-preserved item |
| Error | `[FAIL]` | Red | Fatal failure or a failed required check |
| Policy | `[KEEP]` | Cyan | Deliberately preserved dependency such as PostgreSQL |

Use one label vocabulary consistently. If existing text must remain recognizable for operators or automation, the helper can initially render legacy labels while the design standard is adopted incrementally.

### Alignment and detail

```text
  Backend       : D:\lutron\lutron_backend
  Frontend      : D:\lutron\lutron_frontend
  PM2 home      : D:\lutron\deployment_scripts\pm2_runtime\.pm2
  Log file      : C:\Users\...\lutron_setup.log
```

For status checks:

```text
  Backend API   [ OK ]  http://127.0.0.1:8000/health (HTTP 200)
  Frontend      [ OK ]  http://127.0.0.1:3000 (HTTP 200)
  PM2 children  [ OK ]  3 detected
  Legacy NSSM   [ OK ]  absent
```

### External command blocks

```text
  [....] Installing Python packages
         Output is being written to the installation log.
  [ OK ] Python packages installed and verified
```

The command itself and its redirection must not change. This is only a presentation wrapper around the existing invocation.

### Final summaries

```text
============================================================
  INSTALLATION COMPLETE
============================================================

  Result        : SUCCESS
  Backend       : PM2 managed
  Frontend      : PM2 managed
  Startup task  : LutronPM2Startup
  Log file      : C:\Users\...\lutron_setup.log

  Next steps
    1. Copy certificates if required.
    2. Open http://localhost:3000.
    3. No manual PM2 command is required.
============================================================
```

For Stop/Uninstall, include `Warnings: 0` or a concise warning count only if the scripts already track equivalent state. Do not add state collection merely to beautify the output in the first phase.

## 6. Before/After Mockups

These are visual examples only. They do not prescribe code or alter behavior.

### Install

Before:

```text
============================================
  STEP 7: Installing PostgreSQL
============================================
[INFO] Found psql.exe at: C:\Program Files\PostgreSQL\17\bin\psql.exe
[INFO] Verifying PostgreSQL installation...
[INFO] Found PostgreSQL service: postgresql-x64-17
[INFO] PostgreSQL service is running
[OK] PostgreSQL is installed and functional
...
[ERROR] PM2 startup verification failed:
  - Expected exactly 3 RuntimeSupervisor children, found 0
```

After:

```text
------------------------------------------------------------
  PostgreSQL and database
------------------------------------------------------------
  [....] Checking PostgreSQL installation
         Service: postgresql-x64-17
  [ OK ] PostgreSQL is installed and functional

  [....] Verifying PM2 runtime
  [FAIL] PM2 runtime verification failed
         - Expected exactly 3 RuntimeSupervisor children, found 0
         Action: Fix the runtime and run the installer again.
```

### Start

Before:

```text
========================================
  STEP 2: Frontend build + PM2 start
========================================
Building production frontend...
[INFO] NODE_OPTIONS=--max-old-space-size=1536 for build
[SUCCESS] Frontend production build completed
Starting lutron-backend and lutron-frontend via PM2...
[SUCCESS] Backend is responding at http://127.0.0.1:8000/users (HTTP 401)
```

After:

```text
------------------------------------------------------------
  Frontend build and PM2 start
------------------------------------------------------------
  [....] Preparing production frontend
         Build output: lutron_frontend\logs\frontend-2026-09-08.log
  [ OK ] Production build ready
  [....] Starting backend and frontend through PM2
  [ OK ] PM2 applications started

  Readiness
    Backend       [ OK ]  HTTP 401 from /users
    Frontend      [ OK ]  HTTP 200 from :3000
    Browser       [ OK ]  Opened http://localhost:3000
```

### Stop

Before:

```text
Stopping Backend Server (Python)...
[SUCCESS] Stopped process tree (PID: 20292)
Stopping residual Lutron backend Python processes...
[SUCCESS] Port 8000 is clear
Stopping Frontend Server (Node.js)...
[SUCCESS] Stopped process tree (PID: 18120)
========================================
  All servers stopped!
  PM2 boot registration left in place
========================================
```

After:

```text
------------------------------------------------------------
  Stopping application
------------------------------------------------------------
  Backend
    [ OK ] PM2 stop issued
    [ OK ] Port 8000 is clear
    [ OK ] Residual Python scan complete
  Frontend
    [ OK ] Port 3000 is clear
  Legacy items
    [ OK ] LutronLMSBackend removed or absent
    [ OK ] LutronAutoStart removed or absent

============================================================
  STOP COMPLETE
============================================================
  PM2 boot registration: preserved
```

## 7. Proposed Shared Helper Architecture

Introduce a presentation-only helper, for example `scripts/LmsConsole.ps1`, and dot-source it from the operational PowerShell scripts. It should not own process execution, retries, file writes, service operations, or exit decisions.

Proposed responsibilities:

- `Write-LmsHeader -Title ...`
- `Write-LmsSection -Title ...`
- `Write-LmsInfo -Message ...`
- `Write-LmsAction -Message ...`
- `Write-LmsSuccess -Message ...`
- `Write-LmsWarning -Message ...`
- `Write-LmsError -Message ...`
- `Write-LmsDetail -Label ... -Value ...`
- `Write-LmsExternalCommandStart/End`
- `Write-LmsSummary -Title ... -Rows ...`
- `Write-LmsPauseIfInteractive` only if it is a strict formatting wrapper around the existing pause call sites

Recommended internal policy:

1. Detect whether the host supports color, but retain labels when it does not.
2. Use `Write-Host -ForegroundColor` only for display; never redirect or alter pipeline values.
3. Keep `Write-Log` separate from console formatting because its timestamped file contract is operational data, not presentation.
4. Allow a compatibility mode to render existing `[INFO]`, `[OK]`, `[WARNING]`, and `[ERROR]` labels during a staged rollout.
5. Keep helper loading failure-safe: if the helper is absent, the existing script must either use its current local output or fail exactly as it currently does. Do not silently change execution paths.

The CMD wrappers should remain self-contained. A shared CMD helper is not recommended because it would add indirection to four tiny launchers and could affect `start`/`ERRORLEVEL` behavior. Standardize their literal text manually in a later, isolated change.

## 8. Functionality-Preservation Risk Assessment

### Low-risk presentation changes

- Replacing three-line separator blocks with a helper that emits the same number of display lines.
- Changing color assignments while retaining labels and message text.
- Aligning labels and adding blank lines around existing output.
- Adding begin/end markers around already-running external commands without changing their arguments or redirection.
- Reformatting existing final summaries after all decisions have already occurred.

### Medium-risk changes requiring tests

- Moving `Write-Host` calls into helpers inside `try/catch` blocks, because a helper error could alter control flow.
- Replacing carriage-return progress output, because console host differences can affect perceived completion.
- Consolidating pause behavior, because `-Silent`, double-click windows, and `ReadKey` are user-visible behavior.
- Changing raw PM2 output handling, because output is sometimes inspected during failures.

### Prohibited in the beautification phase

- Moving or combining commands, retries, sleeps, or validation checks.
- Changing `$ErrorActionPreference`, exit codes, elevation flags, scheduled-task principals, service dependencies, or PM2 arguments.
- Suppressing third-party output without an existing equivalent log destination.
- Changing `Start-Process` to synchronous or asynchronous execution.
- Adding new process scans, health checks, status tracking, or summary data collection solely for visual purposes.

### Proof strategy for a later implementation

- Capture representative Install, Start, Stop, and Uninstall transcripts before the change.
- Compare command invocation order and exit codes using tracing or test doubles.
- Run PowerShell parser checks on every edited `.ps1`.
- Test under Windows PowerShell 5.1, noninteractive execution, interactive double-click execution, and a narrow console width.
- Verify monochrome readability and that all existing raw logs remain unchanged.
- Exercise failure branches for missing files, failed downloads, failed health checks, missing services, PM2 failures, and elevation refusal.

## 9. Later Implementation Plan

1. **Baseline transcripts:** Capture normal and representative failure output for Install, Start, Stop, and Uninstall. Record exit codes and key log files.
2. **Define compatibility vocabulary:** Choose whether to preserve legacy labels initially or migrate to `[ OK ]`/`[WARN]`/`[FAIL]` in one controlled presentation pass.
3. **Add the helper only:** Create the shared PowerShell UI helper with no callers changed; parser-test it under Windows PowerShell 5.1.
4. **Migrate one low-risk surface:** Start with PM2 helper success/info messages or Stop section headers. Compare behavior and transcript shape.
5. **Migrate Stop and Uninstall:** They have bounded flows and clear summaries; preserve every cleanup pass and warning path.
6. **Migrate Start:** Group existing output into preflight, cleanup, build, launch, readiness, browser, and summary sections without moving operations.
7. **Migrate Install:** Replace repeated banners and progress/result text last because it has the largest surface area and the most external command output.
8. **Align CMD wrappers:** Standardize missing-script wording and Uninstall completion wording without changing `start`, synchronous invocation, `%ERRORLEVEL%`, or pauses.
9. **Regression validation:** Re-run parser, transcript, exit-code, elevation, `-Silent`, health-only, PM2, service, and scheduled-task checks.
10. **Documentation update:** Add the console standard to deployment maintenance documentation and keep generated PM2 runtime artifacts excluded from the source UX contract.

## 10. Recommendation

Approve a presentation-only refactor centered on a small PowerShell helper, beginning with Stop/Uninstall and ending with Install. Keep the CMD files intentionally thin, preserve raw external command output, and make the final summary shape consistent across operations. No production behavior should be considered changed unless a command trace, exit-code test, or control-flow comparison proves otherwise.