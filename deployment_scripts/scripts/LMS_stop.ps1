# ============================================================
#  Lutron LMS - Stop Script (PowerShell)
# ============================================================
#  Auto-elevates to Administrator when double-clicked
# ============================================================

param(
    [switch]$Silent
)

. (Join-Path $PSScriptRoot "LmsConsole.ps1")
Initialize-LmsConsole -Subtitle "Stopping Application" -Silent:$Silent

# ============================================================
#  Simplified Script Path Detection Function
# ============================================================
function Get-ScriptPath {
    param([string]$ScriptName)
    
    # Method 1: Try standard PowerShell variables (fastest, most reliable)
    if ($PSCommandPath -and (Test-Path $PSCommandPath)) {
        return (Resolve-Path $PSCommandPath).Path
    }
    if ($MyInvocation.PSCommandPath -and (Test-Path $MyInvocation.PSCommandPath)) {
        return (Resolve-Path $MyInvocation.PSCommandPath).Path
    }
    if ($MyInvocation.MyCommand.Path -and (Test-Path $MyInvocation.MyCommand.Path)) {
        return (Resolve-Path $MyInvocation.MyCommand.Path).Path
    }
    if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot $ScriptName))) {
        return (Resolve-Path (Join-Path $PSScriptRoot $ScriptName)).Path
    }
    
    # Method 2: Search for script file starting from current directory
    # Walk up the directory tree looking for "deployment_scripts" folder
    $currentDir = Get-Location
    $searchDir = $currentDir
    
    # Search up to 5 levels up
    for ($i = 0; $i -lt 5; $i++) {
        $testPath = Join-Path $searchDir $ScriptName
        if (Test-Path $testPath) {
            return (Resolve-Path $testPath).Path
        }
        
        # Check if we're in or near a "deployment_scripts" folder
        $deploymentScriptsPath = Join-Path $searchDir "deployment_scripts\$ScriptName"
        if (Test-Path $deploymentScriptsPath) {
            return (Resolve-Path $deploymentScriptsPath).Path
        }
        
        # Check parent directory for "deployment_scripts"
        $parentDeploymentScripts = Join-Path (Split-Path $searchDir -Parent) "deployment_scripts\$ScriptName"
        if (Test-Path $parentDeploymentScripts) {
            return (Resolve-Path $parentDeploymentScripts).Path
        }
        
        $searchDir = Split-Path $searchDir -Parent
        if (-not $searchDir -or $searchDir -eq (Split-Path $searchDir -Parent)) {
            break
        }
    }
    
    # Method 3: Search all drives for "lutron\deployment_scripts\ScriptName" (last resort)
    $drives = Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root
    foreach ($drive in $drives) {
        $searchPath = Join-Path $drive "lutron\deployment_scripts\$ScriptName"
        if (Test-Path $searchPath) {
            return (Resolve-Path $searchPath).Path
        }
    }
    
    return $null
}

# ============================================================
#  Enhanced Auto-Elevation with Loop Prevention
# ============================================================
function Request-AdminElevation {
    param(
        [string]$ScriptPath,
        [string[]]$AdditionalArgs = @()
    )
    
    # Check if already running as admin
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if ($isAdmin) {
        return $true
    }
    
    # Prevent infinite loops - check if we were just elevated
    if ($env:__ELEVATED__ -eq "1") {
        Write-Host "[ERROR] Already attempted elevation. Cannot elevate again." -ForegroundColor Red
        Write-Host "[ERROR] Please run this script as Administrator manually." -ForegroundColor Red
        return $false
    }
    
    # Get script path if not provided
    if (-not $ScriptPath) {
        $ScriptPath = $PSCommandPath
        if (-not $ScriptPath) {
            $ScriptPath = $MyInvocation.PSCommandPath
        }
        if (-not $ScriptPath) {
            $ScriptPath = $MyInvocation.MyCommand.Path
        }
        if (-not $ScriptPath -and $PSScriptRoot) {
            $ScriptPath = Join-Path $PSScriptRoot "LMS_stop.ps1"
        }
        if (-not $ScriptPath) {
            $ScriptPath = Get-ScriptPath -ScriptName "LMS_stop.ps1"
        }
    }
    
    # Verify script exists
    if (-not $ScriptPath -or -not (Test-Path $ScriptPath)) {
        Write-Host "[ERROR] Cannot determine script path for elevation." -ForegroundColor Red
        Write-Host "[ERROR] Attempted to find: LMS_stop.ps1" -ForegroundColor Red
        Write-Host "[ERROR] Current location: $(Get-Location)" -ForegroundColor Red
        return $false
    }
    
    # Resolve full path
    try {
        $ScriptPath = (Resolve-Path $ScriptPath).Path
    } catch {
        Write-Host "[ERROR] Cannot resolve script path: $_" -ForegroundColor Red
        return $false
    }
    
    # Build PowerShell arguments
    $argList = @(
        "-ExecutionPolicy", "Bypass",
        "-NoProfile",
        "-File", "`"$ScriptPath`""
    )
    
    # Add any additional arguments
    $argList += $AdditionalArgs
    
    # Set environment variable to prevent loops
    $env:__ELEVATED__ = "1"
    
    try {
        # Launch elevated process
        $process = Start-Process powershell.exe -ArgumentList $argList -Verb RunAs -Wait -PassThru -ErrorAction Stop
        
        # Clear the flag
        Remove-Item Env:\__ELEVATED__ -ErrorAction SilentlyContinue
        
        # Return exit code
        exit $process.ExitCode
    } catch {
        Remove-Item Env:\__ELEVATED__ -ErrorAction SilentlyContinue
        Write-Host "[ERROR] Failed to elevate: $_" -ForegroundColor Red
        Write-Host "[ERROR] Please run this script as Administrator manually." -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return $false
    }
}

# Check for administrator privileges and auto-elevate if needed
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    $additionalArgs = @()
    if ($Silent) { $additionalArgs += "-Silent" }
    
    $elevated = Request-AdminElevation -ScriptPath $null -AdditionalArgs $additionalArgs
    if (-not $elevated) {
        exit 1
    }
}

$ErrorActionPreference = "Continue"

Set-LmsConsolePhase -Percent 5 -Status "Stopping application services..."

Set-LmsConsolePhase -Percent 20 -Status "Stopping PM2 applications..."

# Auto-detect paths based on script location
$scriptPathForDir = Get-ScriptPath -ScriptName "LMS_stop.ps1"

if ($scriptPathForDir -and (Test-Path $scriptPathForDir)) {
    $ScriptDir = Split-Path -Parent $scriptPathForDir
    # If script is in a "scripts" subfolder, use parent directory for RootDir
    if ($ScriptDir -like "*\scripts") {
        $ScriptDir = Split-Path -Parent $ScriptDir
    }
} elseif ($PSScriptRoot) {
    $ScriptDir = $PSScriptRoot
    # If script is in a "scripts" subfolder, use parent directory for RootDir
    if ($ScriptDir -like "*\scripts") {
        $ScriptDir = Split-Path -Parent $ScriptDir
    }
} else {
    $ScriptDir = Get-Location
}

$RootDir = Split-Path -Parent $ScriptDir

# Try new folder names first, then fallback to old names
$BackendPath = Join-Path $RootDir "backend"
if (-not (Test-Path $BackendPath)) {
    $BackendPath = Join-Path $RootDir "lutron_backend"
}

$FrontendPath = Join-Path $RootDir "frontend"
if (-not (Test-Path $FrontendPath)) {
    $FrontendPath = Join-Path $RootDir "lutron_frontend"
}

# Normalize paths for comparison
if (Test-Path $BackendPath) {
    $BackendPath = (Resolve-Path $BackendPath).Path
}
if (Test-Path $FrontendPath) {
    $FrontendPath = (Resolve-Path $FrontendPath).Path
}

Write-Host "[INFO] Backend path: $BackendPath" -ForegroundColor Cyan
Write-Host "[INFO] Frontend path: $FrontendPath" -ForegroundColor Cyan
Write-Host ""

# Stop PM2-managed apps first (preferred). Port/process kill below is a fallback.
$pm2Lib = Join-Path $PSScriptRoot "LMS_pm2.ps1"
if (-not (Test-Path $pm2Lib) -and $scriptPathForDir) {
    $pm2Lib = Join-Path (Split-Path $scriptPathForDir -Parent) "LMS_pm2.ps1"
}
if (Test-Path $pm2Lib) {
    try {
        . $pm2Lib
        Initialize-LmsPm2Context -RootDir $RootDir -BackendDir $BackendPath -FrontendDir $FrontendPath
        Write-Host "Stopping PM2 apps lutron-backend and lutron-frontend..." -ForegroundColor Yellow
        Stop-LmsPm2Apps
        Write-Host "[OK] PM2 stop issued (boot registration LutronPM2Startup is left in place)." -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "[WARNING] PM2 stop skipped: $_" -ForegroundColor Yellow
    }
}

# Function to get process command line (requires WMI)
function Get-ProcessCommandLine {
    param([int]$ProcessId)
    try {
        $process = Get-WmiObject Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
        if ($process) {
            return $process.CommandLine
        }
    } catch {
        # WMI might not be available or process might have exited
    }
    return $null
}

# Function to get process working directory
function Get-ProcessWorkingDirectory {
    param([int]$ProcessId)
    try {
        $process = Get-WmiObject Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
        if ($process) {
            return $process.ExecutablePath
        }
    } catch {
        # WMI might not be available or process might have exited
    }
    return $null
}

# Kill process and entire process tree (handles uvicorn --reload child processes)
function Stop-ProcessTree {
    param([int]$ProcessId)
    try {
        $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if (-not $proc) { return }
        $null = cmd /c "taskkill /PID $ProcessId /F /T 2>nul"
        Write-Host "[SUCCESS] Stopped process tree (PID: $ProcessId)" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Could not stop process tree PID ${ProcessId}: $_" -ForegroundColor Yellow
    }
}

# ---------- Backend first (then frontend) ----------

# Stop Backend Server (Python) - Port + command-line detection, then process-tree kill
Write-Host "Stopping Backend Server (Python)..." -ForegroundColor Yellow
Set-LmsConsolePhase -Percent 40 -Status "Stopping the backend..."
$backendProcessIds = @()

try {
    $backendConnections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($backendConnections) {
        $backendConnections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            if ($backendProcessIds -notcontains $_) { $backendProcessIds += $_ }
        }
    }
} catch {
    Write-Host "[INFO] Port check method unavailable" -ForegroundColor Yellow
}

if (Test-Path $BackendPath) {
    try {
        Get-Process -Name "python*" -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $cmdLine = Get-ProcessCommandLine -ProcessId $_.Id
                if ($cmdLine) {
                    if (($cmdLine -like "*$BackendPath*" -or $cmdLine -like "*uvicorn*") -and
                        ($cmdLine -like "*uvicorn*" -or $cmdLine -like "*app.main:app*")) {
                        if ($backendProcessIds -notcontains $_.Id) { $backendProcessIds += $_.Id }
                    }
                } else {
                    $procPath = Get-ProcessWorkingDirectory -ProcessId $_.Id
                    if ($procPath -and $procPath -like "*$BackendPath*") {
                        if ($backendProcessIds -notcontains $_.Id) { $backendProcessIds += $_.Id }
                    }
                }
            } catch { }
        }
    } catch {
        Write-Host "[INFO] Process enumeration method unavailable" -ForegroundColor Yellow
    }
}

foreach ($processId in $backendProcessIds) {
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) { Stop-ProcessTree -ProcessId $processId }
}
if ($backendProcessIds.Count -gt 0) { Start-Sleep -Seconds 1 }

# Second-pass: any process still on port 8000
$stillBackend = @()
try {
    $stillBackend = @(Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique)
    foreach ($processId in $stillBackend) {
        if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
            Write-Host "[INFO] Second-pass: stopping process on port 8000 (PID: $processId)" -ForegroundColor Yellow
            Stop-ProcessTree -ProcessId $processId
        }
    }
} catch { }

# Third-pass: residual runtime children (energy_logger / listener / loadcontroller)
# that can outlive uvicorn if the parent was missed or job teardown failed.
Write-Host "Stopping residual Lutron backend Python processes..." -ForegroundColor Yellow
$residualIds = @()
$backendMarkers = @(
    "*lutron_backend*",
    "*\backend\*",
    "*uvicorn*app.main:app*",
    "*energy_logger*",
    "*listener_process*",
    "*loadcontroller*"
)
if ($BackendPath) {
    $backendMarkers += "*$BackendPath*"
}
try {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^python(w)?(\.exe)?$' } |
        ForEach-Object {
            $cmd = [string]$_.CommandLine
            $exe = [string]$_.ExecutablePath
            $hit = $false
            foreach ($m in $backendMarkers) {
                if ($cmd -and ($cmd -like $m)) { $hit = $true; break }
            }
            if (-not $hit -and $BackendPath -and $exe -and ($exe -like "$BackendPath*")) {
                $hit = $true
            }
            # multiprocessing child spawned from lutron backend venv
            if (-not $hit -and $cmd -and ($cmd -like "*multiprocessing*") -and $BackendPath -and $exe -and ($exe -like "$BackendPath*")) {
                $hit = $true
            }
            if ($hit -and $residualIds -notcontains $_.ProcessId) {
                $residualIds += $_.ProcessId
            }
        }
} catch {
    Write-Host "[WARNING] Residual process scan failed: $_" -ForegroundColor Yellow
}

foreach ($processId in $residualIds) {
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
        Write-Host "[INFO] Stopping residual backend PID: $processId" -ForegroundColor Yellow
        Stop-ProcessTree -ProcessId $processId
    }
}
if ($residualIds.Count -gt 0) { Start-Sleep -Seconds 1 }

$portStillOpen = $false
try {
    $portStillOpen = [bool]@(Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)
} catch { }
if ($portStillOpen) {
    Write-Host "[WARNING] Port 8000 still has listeners after stop" -ForegroundColor Yellow
} else {
    Write-Host "[SUCCESS] Port 8000 is clear" -ForegroundColor Green
}

Write-Host ""

# Stop Frontend Server (Node.js) - Port + command-line detection, then process-tree kill
Write-Host "Stopping Frontend Server (Node.js)..." -ForegroundColor Yellow
Set-LmsConsolePhase -Percent 62 -Status "Stopping the frontend..."
$frontendProcessIds = @()

try {
    $frontendConnections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($frontendConnections) {
        $frontendConnections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            if ($frontendProcessIds -notcontains $_) { $frontendProcessIds += $_ }
        }
    }
} catch {
    Write-Host "[INFO] Port check method unavailable" -ForegroundColor Yellow
}

if (Test-Path $FrontendPath) {
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $cmdLine = Get-ProcessCommandLine -ProcessId $_.Id
                if ($cmdLine) {
                    if ($cmdLine -like "*$FrontendPath*" -or $cmdLine -like "*npm start*" -or $cmdLine -like "*npm run*" -or $cmdLine -like "*serve*build*" -or $cmdLine -like "*serve -s*") {
                        if ($frontendProcessIds -notcontains $_.Id) { $frontendProcessIds += $_.Id }
                    }
                } else {
                    $procPath = Get-ProcessWorkingDirectory -ProcessId $_.Id
                    if ($procPath -and $procPath -like "*$FrontendPath*") {
                        if ($frontendProcessIds -notcontains $_.Id) { $frontendProcessIds += $_.Id }
                    }
                }
            } catch { }
        }
    } catch {
        Write-Host "[INFO] Process enumeration method unavailable" -ForegroundColor Yellow
    }
}

foreach ($processId in $frontendProcessIds) {
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) { Stop-ProcessTree -ProcessId $processId }
}
if ($frontendProcessIds.Count -gt 0) { Start-Sleep -Seconds 1 }

# Second-pass: any process still on port 3000
$stillFrontend = @()
try {
    $stillFrontend = @(Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique)
    foreach ($processId in $stillFrontend) {
        if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
            Write-Host "[INFO] Second-pass: stopping process on port 3000 (PID: $processId)" -ForegroundColor Yellow
            Stop-ProcessTree -ProcessId $processId
        }
    }
} catch { }

if ($backendProcessIds.Count -eq 0 -and $frontendProcessIds.Count -eq 0 -and $stillBackend.Count -eq 0 -and $stillFrontend.Count -eq 0 -and $residualIds.Count -eq 0) {
    Write-Host "[INFO] No application servers were running" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "Removing leftover Lutron Windows Service (if installed)..." -ForegroundColor Yellow
$pm2LibStop = Join-Path $PSScriptRoot "LMS_pm2.ps1"
if (-not (Test-Path $pm2LibStop) -and $scriptPathForDir) {
    $pm2LibStop = Join-Path (Split-Path $scriptPathForDir -Parent) "LMS_pm2.ps1"
}
if (Test-Path $pm2LibStop) {
    . $pm2LibStop
    try {
        Remove-LmsLegacyNssmBackendService
    } catch {
        Write-Host "[WARNING] Could not remove leftover LutronLMSBackend: $_" -ForegroundColor Yellow
    }
} else {
    $serviceNames = @("LutronLMSBackend")
    foreach ($svcName in $serviceNames) {
        $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
        if (-not $svc) {
            Write-Host "[INFO] Service '$svcName' is not installed" -ForegroundColor Yellow
            continue
        }
        Write-Host "[INFO] Service '$svcName' status: $($svc.Status)" -ForegroundColor Yellow
        if ($svc.Status -ne "Stopped") {
            try {
                Stop-Service -Name $svcName -Force -ErrorAction Stop
                $svc.WaitForStatus("Stopped", (New-TimeSpan -Seconds 30))
                Write-Host "[SUCCESS] Service '$svcName' stopped" -ForegroundColor Green
            } catch {
                Write-Host "[WARNING] Stop-Service failed for '$svcName': $_" -ForegroundColor Yellow
                sc.exe stop $svcName | Out-Null
            }
        }
        try { Set-Service -Name $svcName -StartupType Disabled -ErrorAction SilentlyContinue } catch { }
        sc.exe delete $svcName | Out-Null
    }
}

Write-Host ""

# Leave LutronAutoStart registered. Stop LMS must not remove logon browser launch;
# uninstall is the only path that unregisters it.
$browserStamp = Join-Path $env:TEMP "LutronLMS-browser.stamp"
if (Test-Path -LiteralPath $browserStamp) {
    Remove-Item -LiteralPath $browserStamp -Force -ErrorAction SilentlyContinue
}

Write-Host ""

Complete-LmsConsole -Message "Application stopped successfully."

# Brief pause so the success banner is readable, then close (no key press).
Start-Sleep -Seconds 2
exit 0

