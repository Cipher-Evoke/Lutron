param(
  [Parameter(Mandatory=$false)]
  [string]$LogPath = "D:\lutron\lutron_backend\logs\backend-error-2026-03-30.log.txt",

  [Parameter(Mandatory=$false)]
  [int]$WindowSeconds = 60,

  # If <= 0, skips Postgres snapshots (log-only mode).
  [Parameter(Mandatory=$false)]
  [int]$PollCount = 0,

  # Optional Postgres connection (used only if PollCount > 0 and psql exists).
  [Parameter(Mandatory=$false)]
  [string]$PgHost = $env:PGHOST,
  [Parameter(Mandatory=$false)]
  [string]$PgPort = $env:PGPORT,
  [Parameter(Mandatory=$false)]
  [string]$PgDatabase = $env:PGDATABASE,
  [Parameter(Mandatory=$false)]
  [string]$PgUser = $env:PGUSER,
  [Parameter(Mandatory=$false)]
  [string]$PgPassword = $env:PGPASSWORD,

  [Parameter(Mandatory=$false)]
  [string]$Psql = "psql"
)

if (-not (Test-Path $LogPath)) {
  throw "LogPath not found: $LogPath"
}

$OutDir = Join-Path (Split-Path -Parent $LogPath) ("pool_timeout_analysis_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Invoke-Psql($Sql, $OutFile) {
  if (-not $env:PGPASSWORD) { $env:PGPASSWORD = $PgPassword }

  $args = @(
    "-h", $PgHost,
    "-p", $PgPort,
    "-U", $PgUser,
    "-d", $PgDatabase,
    "-v", "ON_ERROR_STOP=1",
    "-A", "-t",
    "-c", $Sql
  )

  $result = & $Psql @args 2>&1
  $result | Out-File -Encoding UTF8 $OutFile
}

Write-Host "Reading log: $LogPath"
$lines = Get-Content -Path $LogPath

$timePrefixRe = '^\[(?<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]'
$poolTimeoutRe = '^\[(?<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+\[ERROR\].*QueuePool limit.*overflow 10 reached'
$listenerStartRe = 'Starting unified listener for processor (?<proc>\d+)'
$receivedAreaStatusRe = 'Received area status for processor (?<proc>\d+)'

$events = New-Object System.Collections.Generic.List[object]
$errorTimes = New-Object System.Collections.Generic.List[DateTime]

foreach ($l in $lines) {
  $m = [regex]::Match($l, $timePrefixRe)
  if ($m.Success) {
    $tsText = $m.Groups["ts"].Value
    $ts = [DateTime]::ParseExact($tsText, "yyyy-MM-dd HH:mm:ss", $null)
    $events.Add([pscustomobject]@{ ts = $ts; line = $l })
  }

  $e = [regex]::Match($l, $poolTimeoutRe)
  if ($e.Success) {
    $tsText = $e.Groups["ts"].Value
    $ts = [DateTime]::ParseExact($tsText, "yyyy-MM-dd HH:mm:ss", $null)
    $errorTimes.Add($ts)
  }
}

if ($errorTimes.Count -eq 0) {
  Write-Host "No QueuePool timeout errors found in log." -ForegroundColor Yellow
  Write-Host "OutDir: $OutDir"
  return
}

$windowRows = New-Object System.Collections.Generic.List[object]

function UniqueProcsInWindow($windowLines, $regexText) {
  $procs = New-Object System.Collections.Generic.List[string]
  foreach ($wl in $windowLines) {
    $mm = [regex]::Match($wl.line, $regexText)
    if ($mm.Success) {
      $procs.Add($mm.Groups["proc"].Value)
    }
  }
  return ($procs | Select-Object -Unique)
}

$uniqueErrorTimes = $errorTimes | Select-Object -Unique
$idx = 0
foreach ($et in $uniqueErrorTimes) {
  $idx++
  $start = $et.AddSeconds(-1 * $WindowSeconds)
  $end = $et.AddSeconds($WindowSeconds)

  $windowLines = $events | Where-Object { $_.ts -ge $start -and $_.ts -le $end }

  $listenerStarts = $windowLines | Where-Object { $_.line -match 'Starting unified listener for processor' }
  $receivedAreaStatuses = $windowLines | Where-Object { $_.line -match 'Received area status for processor' }

  $listenerProcs = UniqueProcsInWindow $windowLines $listenerStartRe
  $receivedProcs = UniqueProcsInWindow $windowLines $receivedAreaStatusRe

  $windowRows.Add([pscustomobject]@{
    ErrorTime = $et.ToString("yyyy-MM-dd HH:mm:ss")
    WindowStart = $start.ToString("yyyy-MM-dd HH:mm:ss")
    WindowEnd = $end.ToString("yyyy-MM-dd HH:mm:ss")
    ListenerStartLines = $listenerStarts.Count
    ListenerUniqueProcessors = $listenerProcs.Count
    ReceivedAreaStatusLines = $receivedAreaStatuses.Count
    ReceivedAreaUniqueProcessors = $receivedProcs.Count
  })
}

$csvPath = Join-Path $OutDir "log_burst_windows_summary.csv"
$windowRows | Export-Csv -NoTypeInformation -Encoding UTF8 $csvPath
Write-Host "Wrote: $csvPath"

if ($PollCount -le 0) {
  Write-Host "PollCount <= 0, skipping Postgres snapshots."
  Write-Host "OutDir: $OutDir"
  return
}

if (-not (Get-Command $Psql -ErrorAction SilentlyContinue)) {
  Write-Host "psql not found on PATH; skipping Postgres snapshots." -ForegroundColor Yellow
  Write-Host "OutDir: $OutDir"
  return
}

if ([string]::IsNullOrWhiteSpace($PgHost) -or
    [string]::IsNullOrWhiteSpace($PgPort) -or
    [string]::IsNullOrWhiteSpace($PgDatabase) -or
    [string]::IsNullOrWhiteSpace($PgUser)) {
  Write-Host "Postgres env vars missing (PGHOST/PGPORT/PGDATABASE/PGUSER); skipping snapshots." -ForegroundColor Yellow
  Write-Host "OutDir: $OutDir"
  return
}

for ($i=1; $i -le $PollCount; $i++) {
  $snapTag = "snapshot_" + $i.ToString() + "_" + (Get-Date -Format "yyyyMMdd_HHmmss")
  $summaryFile = Join-Path $OutDir ($snapTag + "_pg_summary.txt")
  $activityFile = Join-Path $OutDir ($snapTag + "_pg_stat_activity.txt")
  $idleTxFile = Join-Path $OutDir ($snapTag + "_pg_idle_in_transaction.txt")
  $waitLocksFile = Join-Path $OutDir ($snapTag + "_pg_waiting_locks.txt")

  Write-Host "Running Postgres snapshot ($i/$PollCount)..."

  $summarySql = @"
SELECT
  now() AS snapshot_time,
  (SELECT setting::int FROM pg_settings WHERE name='max_connections') AS max_connections,
  (SELECT count(*) FROM pg_stat_activity) AS total_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state='active') AS active_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state='idle') AS idle_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state='idle in transaction') AS idle_in_transaction,
  (SELECT count(*) FROM pg_stat_activity WHERE state='idle in transaction (aborted)') AS idle_in_transaction_aborted;
"@

  $activitySql = @"
SELECT
  pid, usename, application_name, client_addr,
  state, wait_event_type, wait_event,
  query_start, left(query, 200) AS query_snippet
FROM pg_stat_activity
ORDER BY query_start DESC
LIMIT 50;
"@

  $idleTxSql = @"
SELECT
  pid, usename, application_name,
  xact_start,
  now() - xact_start AS xact_duration,
  left(query, 200) AS query_snippet
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start ASC
LIMIT 50;
"@

  $waitLocksSql = @"
SELECT
  a.pid, a.usename, a.state,
  a.wait_event_type, a.wait_event,
  l.locktype, l.mode, l.granted,
  left(a.query, 200) AS waiting_query_snippet
FROM pg_stat_activity a
JOIN pg_locks l ON a.pid = l.pid
WHERE l.granted = false
ORDER BY a.query_start ASC
LIMIT 50;
"@

  Invoke-Psql -Sql $summarySql -OutFile $summaryFile
  Invoke-Psql -Sql $activitySql -OutFile $activityFile
  Invoke-Psql -Sql $idleTxSql -OutFile $idleTxFile
  Invoke-Psql -Sql $waitLocksSql -OutFile $waitLocksFile
}

Write-Host "Postgres snapshot files written to: $OutDir"

