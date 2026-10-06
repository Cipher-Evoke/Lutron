# ============================================================
#  Lutron LMS - Uninstall Script (PowerShell)
#  Removes PM2 apps, startup registration, and LMS process leftovers.
#  PostgreSQL Windows Service is left running (same policy as install:
#  the installer never uninstalls PostgreSQL).
# ============================================================

param(
    [switch]$Silent
)

. (Join-Path $PSScriptRoot "LmsConsole.ps1")
Initialize-LmsConsole -Subtitle "Uninstalling Application" -Silent:$Silent

$ErrorActionPreference = "Continue"

Set-LmsConsolePhase -Percent 5 -Status "Removing application services..."

function Get-ScriptPath {
    param([string]$ScriptName)
    if ($PSCommandPath -and (Test-Path $PSCommandPath)) {
        return (Resolve-Path $PSCommandPath).Path
    }
    if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot $ScriptName))) {
        return (Resolve-Path (Join-Path $PSScriptRoot $ScriptName)).Path
    }
    return $null
}

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    $scriptPath = Get-ScriptPath -ScriptName "LMS_uninstall.ps1"
    if (-not $scriptPath) { $scriptPath = $PSCommandPath }
    $argList = @("-ExecutionPolicy", "Bypass", "-NoProfile", "-File", "`"$scriptPath`"")
    if ($Silent) { $argList += "-Silent" }
    $process = Start-Process powershell.exe -ArgumentList $argList -Verb RunAs -Wait -PassThru
    exit $process.ExitCode
}


$scriptPathForDir = Get-ScriptPath -ScriptName "LMS_uninstall.ps1"
if ($scriptPathForDir) {
    $ScriptDir = Split-Path -Parent $scriptPathForDir
    if ($ScriptDir -like "*\scripts") {
        $ScriptDir = Split-Path -Parent $ScriptDir
    }
} else {
    $ScriptDir = Split-Path -Parent $PSScriptRoot
}

$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "lutron_backend"
if (-not (Test-Path $BackendDir)) { $BackendDir = Join-Path $RootDir "backend" }
$FrontendDir = Join-Path $RootDir "lutron_frontend"
if (-not (Test-Path $FrontendDir)) { $FrontendDir = Join-Path $RootDir "frontend" }

Write-Host "[INFO] Root: $RootDir" -ForegroundColor Cyan

$pm2Lib = Join-Path $PSScriptRoot "LMS_pm2.ps1"
if (-not (Test-Path $pm2Lib)) {
    $pm2Lib = Join-Path (Split-Path $scriptPathForDir -Parent) "LMS_pm2.ps1"
}
if (Test-Path $pm2Lib) {
    Set-LmsConsolePhase -Percent 25 -Status "Removing PM2 applications..."
    . $pm2Lib
    try {
        Uninstall-LmsPm2Stack -RootDir $RootDir -BackendDir $BackendDir -FrontendDir $FrontendDir
    } catch {
        Write-Host "[WARNING] PM2 uninstall reported: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] LMS_pm2.ps1 not found; skipping PM2 teardown." -ForegroundColor Yellow
}

if (Get-Service -Name "LutronLMSBackend" -ErrorAction SilentlyContinue) {
    Write-Host "[ERROR] Legacy service LutronLMSBackend is still present after uninstall." -ForegroundColor Red
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

function Stop-ProcessTree {
    param([int]$ProcessId)
    $null = cmd /c "taskkill /PID $ProcessId /F /T 2>nul"
}

Write-Host "[INFO] Stopping leftover LMS listeners on ports 8000 and 3000..." -ForegroundColor Yellow
Set-LmsConsolePhase -Percent 55 -Status "Cleaning up application processes..."
foreach ($port in @(8000, 3000)) {
    try {
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object { Stop-ProcessTree -ProcessId $_ }
    } catch { }
}

Write-Host "[INFO] Stopping leftover Lutron Python spawn children..." -ForegroundColor Yellow
try {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^python(w)?(\.exe)?$' -and $_.CommandLine -match 'uvicorn app.main:app|multiprocessing.spawn' } |
        ForEach-Object { Stop-ProcessTree -ProcessId $_.ProcessId }
} catch { }

$pg = Get-Service | Where-Object { $_.Name -like "*postgresql*" }
Set-LmsConsolePhase -Percent 75 -Status "Verifying application removal..."
if ($pg) {
    Write-Host "[INFO] PostgreSQL service left running (installer policy: do not uninstall PostgreSQL)." -ForegroundColor Yellow
    $pg | ForEach-Object { Write-Host "  - $($_.Name) status=$($_.Status)" -ForegroundColor Yellow }
}

$orphans = @()
try {
    $orphans += @(Get-NetTCPConnection -LocalPort 8000, 3000 -State Listen -ErrorAction SilentlyContinue)
} catch { }
$spawnLeft = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^python(w)?(\.exe)?$' -and $_.CommandLine -match 'uvicorn app.main:app|multiprocessing.spawn'
})

Write-Host ""
if ($orphans.Count -eq 0 -and $spawnLeft.Count -eq 0) {
    Write-Host "[OK] No orphan LMS processes remain." -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some listeners or Python processes remain:" -ForegroundColor Yellow
    $spawnLeft | ForEach-Object { Write-Host "  PID $($_.ProcessId) $($_.CommandLine)" }
}

Write-Host ""
Complete-LmsConsole -Message "Uninstall Complete" -Detail "Application removed successfully.`n`nPostgreSQL was not modified."
Write-Host ""

if (-not $Silent) {
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
exit 0
