# ============================================================
#  Lutron LMS - Start Script (PowerShell)
# ============================================================

param(
    [switch]$Silent,
    [switch]$EnableAutoStart,
    [switch]$HealthCheckOnly
)

. (Join-Path $PSScriptRoot "LmsConsole.ps1")
Initialize-LmsConsole -Subtitle "Launching Application" -Silent:$Silent

$ErrorActionPreference = "Continue"

$pm2LibForStart = Join-Path $PSScriptRoot "LMS_pm2.ps1"
if (Test-Path $pm2LibForStart) {
    . $pm2LibForStart
}
$runtimeLib = Join-Path $PSScriptRoot "LMS_runtime.ps1"
if (Test-Path $runtimeLib) {
    . $runtimeLib
}
$runtimeLib = Join-Path $PSScriptRoot "LMS_runtime.ps1"
if (Test-Path $runtimeLib) {
    . $runtimeLib
}

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
#  Hosting Configuration Loader
# ============================================================
function Get-HostingConfig {
    param(
        [string]$RootDir
    )

    # Default configuration keeps behavior predictable
    $config = [PSCustomObject]@{
        IsIpConfigEnabled     = $false
        ConfiguredIp          = "10.235.29.166"
        BackendHostForUvicorn = "0.0.0.0"
        FrontendApiBaseUrl    = "http://10.235.29.166:8000"
    }

    try {
        if (-not $RootDir) {
            return $config
        }

        $inputJsonPath = Join-Path $RootDir "deployment_scripts\input.json"
        if (-not (Test-Path $inputJsonPath)) {
            Write-Host "[INFO] input.json not found at: $inputJsonPath. Using default hosting settings." -ForegroundColor Yellow
            return $config
        }

        $inputContent = Get-Content $inputJsonPath -Raw
        if ([string]::IsNullOrWhiteSpace($inputContent)) {
            Write-Host "[WARNING] input.json is empty. Using default hosting settings." -ForegroundColor Yellow
            return $config
        }

        $inputConfig = $inputContent | ConvertFrom-Json

        if ($null -ne $inputConfig.hosting) {
            $hosting = $inputConfig.hosting

            if ($null -ne $hosting.ip_configuration) {
                $config.IsIpConfigEnabled = [bool]$hosting.ip_configuration
            }

            if ($hosting.PSObject.Properties.Name -contains "ip") {
                if (-not [string]::IsNullOrWhiteSpace($hosting.ip)) {
                    $config.ConfiguredIp = $hosting.ip
                }
            }
        }

        # Derive effective hosts/URLs based on flags
        if (-not $config.IsIpConfigEnabled) {
            # Local-only mode
            $config.BackendHostForUvicorn = "127.0.0.1"
            $config.FrontendApiBaseUrl    = "http://127.0.0.1:8000"
        } else {
            # LAN-accessible mode: backend on all interfaces, frontend uses configured IP
            $config.BackendHostForUvicorn = "0.0.0.0"
            $config.FrontendApiBaseUrl    = "http://{0}:8000" -f $config.ConfiguredIp
        }

        $mode = if ($config.IsIpConfigEnabled) { "LanAccessible" } else { "LocalOnly" }
        Write-Host "[INFO] Hosting mode: $mode" -ForegroundColor Yellow
        Write-Host "[INFO] Backend host: $($config.BackendHostForUvicorn)" -ForegroundColor Yellow
        Write-Host "[INFO] Frontend API URL: $($config.FrontendApiBaseUrl)" -ForegroundColor Yellow
    } catch {
        Write-Host "[WARNING] Failed to read hosting configuration from input.json: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "[WARNING] Using default hosting settings." -ForegroundColor Yellow
    }

    return $config
}

function Write-LmsManualStartCommands {
    param(
        [string]$BackendPath,
        [string]$FrontendPath,
        [string]$BackendHost
    )

    Write-Host ""
    Write-Host "Working manual commands (source of truth):" -ForegroundColor Yellow
    Write-Host ('  cd "' + $BackendPath + '"') -ForegroundColor Cyan
    Write-Host '  .\.venv\Scripts\python.exe -m pip install -r requirements.txt' -ForegroundColor Cyan
    Write-Host ('  .\.venv\Scripts\python.exe -m uvicorn app.main:app --host ' + $BackendHost + ' --port 8000') -ForegroundColor Cyan
    Write-Host ('  cd "' + $FrontendPath + '"') -ForegroundColor Cyan
    Write-Host '  npm install' -ForegroundColor Cyan
    Write-Host '  npm run build' -ForegroundColor Cyan
    Write-Host '  npm run serve' -ForegroundColor Cyan
    Write-Host ""
}

function Get-LmsHttpStatusCode {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [int]$TimeoutSec = 5
    )
    try {
        $response = Invoke-WebRequest -Uri $Uri -TimeoutSec $TimeoutSec -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
        return [int]$response.StatusCode
    } catch {
        $webResp = $_.Exception.Response
        if ($null -eq $webResp) {
            return $null
        }
        try {
            return [int]$webResp.StatusCode
        } catch {
            return $null
        }
    }
}

function Test-LmsBackendHttpReady {
    param([int]$Port = 8000)

    # Probe IPv4 loopback. uvicorn --host 127.0.0.1 does not listen on ::1, so
    # http://localhost:8000 can fail while Get-NetTCPConnection shows :8000 Listen.
    # GET /users → 401 is the live API (docs may be 404 when ENABLE_API_DOCS=false).
    # GET /docs → 200 (docs on) or 404 (docs off). PowerShell treats 4xx as errors;
    # both are still "process responded".
    $base = "http://127.0.0.1:$Port"
    $probes = @(
        @{ Uri = "$base/users"; Ok = @(200, 401) },
        @{ Uri = "$base/docs"; Ok = @(200, 404) }
    )
    foreach ($p in $probes) {
        $code = Get-LmsHttpStatusCode -Uri $p.Uri
        if ($null -ne $code -and ($p.Ok -contains $code)) {
            return @{ Ready = $true; Uri = $p.Uri; StatusCode = $code }
        }
    }
    return @{ Ready = $false; Uri = $null; StatusCode = $null }
}

function Get-LmsFrontendBrowserUrl {
    return "http://127.0.0.1:3000/"
}

function Get-LmsBrowserLaunchStampPath {
    return (Join-Path $env:TEMP "LutronLMS-browser.stamp")
}

function Get-LmsBootStamp {
    try {
        return [string](Get-CimInstance Win32_OperatingSystem).LastBootUpTime
    } catch {
        return "unknown"
    }
}

function Test-LmsFrontendHttpReady {
    $uris = @("http://127.0.0.1:3000/", "http://127.0.0.1:3000")
    foreach ($uri in $uris) {
        try {
            $response = Invoke-WebRequest -Uri $uri -TimeoutSec 3 -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 307 -or $response.StatusCode -eq 308) {
                return $true
            }
        } catch {
            $webResp = $_.Exception.Response
            if ($null -ne $webResp) {
                try {
                    $code = [int]$webResp.StatusCode
                    if ($code -eq 200 -or $code -eq 307 -or $code -eq 308) { return $true }
                } catch { }
            }
        }
    }
    return $false
}

function Test-LmsBackendHealthy {
    $health = Test-LmsBackendHttpReady
    if (-not $health.Ready) { return $false }
    try {
        $pmHealth = (Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 3).Content
        return ($pmHealth -match '"status"\s*:\s*"healthy"')
    } catch {
        return $false
    }
}

function Wait-LmsApplicationReady {
    param(
        [int]$TimeoutSec = 120,
        [int]$RetrySec = 2
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $backendReady = $false
    $frontendReady = $false
    while ((Get-Date) -lt $deadline) {
        if (-not $backendReady) {
            $backendReady = [bool](Test-LmsBackendHealthy)
            if ($backendReady) {
                Write-Host "[SUCCESS] Backend is healthy on 127.0.0.1:8000" -ForegroundColor Green
            }
        }
        if (-not $frontendReady) {
            $frontendReady = [bool](Test-LmsFrontendHttpReady)
            if ($frontendReady) {
                Write-Host "[SUCCESS] Frontend is responding on 127.0.0.1:3000" -ForegroundColor Green
            }
        }
        if ($backendReady -and $frontendReady) {
            return $true
        }
        Start-Sleep -Seconds $RetrySec
    }
    return $false
}

function Open-LmsFrontendInDefaultBrowser {
    $frontendUrlForBrowser = Get-LmsFrontendBrowserUrl
    $mutexName = "Local\LutronLMS-OpenBrowser"
    $createdNew = $false
    $mutex = $null
    $ownsMutex = $false
    try {
        $mutex = New-Object System.Threading.Mutex($false, $mutexName, [ref]$createdNew)
        if ($createdNew) {
            $ownsMutex = $true
        } else {
            $ownsMutex = $mutex.WaitOne(0)
            if (-not $ownsMutex) {
                Write-Host "[INFO] Browser launch already in progress; skipping duplicate." -ForegroundColor Yellow
                return
            }
        }
    } catch { }

    $stampPath = Get-LmsBrowserLaunchStampPath
    $bootStamp = Get-LmsBootStamp
    if (Test-Path -LiteralPath $stampPath) {
        try {
            $stampBody = (Get-Content -LiteralPath $stampPath -Raw -ErrorAction Stop).Trim()
            if ($stampBody -eq $bootStamp) {
                Write-Host "[INFO] Browser already opened this session; skipping duplicate." -ForegroundColor Yellow
                return
            }
        } catch { }
    }

    try {
        Start-Process -FilePath $frontendUrlForBrowser -ErrorAction Stop
        Set-Content -LiteralPath $stampPath -Value $bootStamp -Encoding ASCII -ErrorAction SilentlyContinue
        Write-Host "[SUCCESS] Opened default browser to: $frontendUrlForBrowser" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Failed to auto-open browser. URL: $frontendUrlForBrowser Error: $($_.Exception.Message)" -ForegroundColor Yellow
    } finally {
        if ($mutex -and $ownsMutex) {
            try { $mutex.ReleaseMutex() | Out-Null } catch { }
        }
        if ($mutex) {
            try { $mutex.Dispose() } catch { }
        }
    }
}

if ($HealthCheckOnly) {
    Set-LmsConsolePhase -Percent 85 -Status "Checking application health..."
    Write-Host "Checking backend HTTP readiness on 127.0.0.1:8000 ..." -ForegroundColor Yellow
    $health = Test-LmsBackendHttpReady
    if ($health.Ready) {
        Write-Host ("[SUCCESS] Backend is responding at {0} (HTTP {1})" -f $health.Uri, $health.StatusCode) -ForegroundColor Green
        exit 0
    }
    Write-Host "[ERROR] Backend health check failed. Not ready on 127.0.0.1:8000" -ForegroundColor Red
    exit 1
}

# If -EnableAutoStart flag is set, only configure auto-start and exit
if ($EnableAutoStart) {
    Set-LmsConsolePhase -Percent 80 -Status "Configuring application startup..."
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  CONFIGURING AUTO-START" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Get script path using optimized function
    $scriptPath = Get-ScriptPath -ScriptName "LMS_start.ps1"
    
    if (-not $scriptPath -or -not (Test-Path $scriptPath)) {
        Write-Host "[ERROR] Cannot determine script path for auto-start configuration." -ForegroundColor Red
        Write-Host "[ERROR] Attempted to find: LMS_start.ps1" -ForegroundColor Red
        Write-Host "[ERROR] Current location: $(Get-Location)" -ForegroundColor Red
        Write-Host "[ERROR] PSCommandPath: $PSCommandPath" -ForegroundColor Red
        Write-Host "[ERROR] MyInvocation.PSCommandPath: $($MyInvocation.PSCommandPath)" -ForegroundColor Red
        Write-Host "[ERROR] MyInvocation.MyCommand.Path: $($MyInvocation.MyCommand.Path)" -ForegroundColor Red
        Write-Host "[ERROR] PSScriptRoot: $PSScriptRoot" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[INFO] Script path: $scriptPath" -ForegroundColor Yellow
    Write-Host "[INFO] Current user: $env:USERNAME" -ForegroundColor Yellow
    Write-Host "[INFO] Creating scheduled task..." -ForegroundColor Yellow
    
    try {
        if (Get-Command Register-LutronAutoStartTask -ErrorAction SilentlyContinue) {
            Register-LutronAutoStartTask -StartScriptPath $scriptPath
        } else {
            throw "Register-LutronAutoStartTask is not available (LMS_pm2.ps1 not loaded)"
        }

        $verifyTask = Get-ScheduledTask -TaskName "LutronAutoStart" -ErrorAction SilentlyContinue
        if ($verifyTask) {
            Write-Host "[SUCCESS] Auto-start enabled! Servers will start on boot." -ForegroundColor Green
            Write-Host "[INFO] Task name: LutronAutoStart" -ForegroundColor Green
            Write-Host "[INFO] Task will run: At logon" -ForegroundColor Green
            Write-Host ""
            Start-Sleep -Seconds 3
            exit 0
        } else {
            throw "Task was created but could not be verified"
        }
    } catch {
        Write-Host "[ERROR] Failed to create scheduled task." -ForegroundColor Red
        Write-Host "[ERROR] Error message: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "[ERROR] Error type: $($_.Exception.GetType().FullName)" -ForegroundColor Red
        if ($_.Exception.InnerException) {
            Write-Host "[ERROR] Inner exception: $($_.Exception.InnerException.Message)" -ForegroundColor Red
        }
        Write-Host "[ERROR] Stack trace:" -ForegroundColor Red
        Write-Host $_.ScriptStackTrace -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to close this window..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

# Logon / -Silent: if a single healthy LMS is already up, reuse it.
# Stale or duplicate LMS runtimes fall through to cleanup + fresh start.
if ($Silent -and (Test-LmsRuntimeHealthySingleInstance)) {
    Open-LmsFrontendInDefaultBrowser
    exit 0
}

# Set window title
$Host.UI.RawUI.WindowTitle = "Lutron Application Launcher"

Set-LmsConsolePhase -Percent 5 -Status "Running preflight checks..."


# Early path detection for enhanced process stopping
$scriptPathForStop = Get-ScriptPath -ScriptName "LMS_start.ps1"
$tempScriptDir = $null
$tempRootDir = $null

if ($scriptPathForStop -and (Test-Path $scriptPathForStop)) {
    $tempScriptDir = Split-Path -Parent $scriptPathForStop
    if ($tempScriptDir -like "*\scripts") {
        $tempScriptDir = Split-Path -Parent $tempScriptDir
    }
} elseif ($PSScriptRoot) {
    $tempScriptDir = $PSScriptRoot
    if ($tempScriptDir -like "*\scripts") {
        $tempScriptDir = Split-Path -Parent $tempScriptDir
    }
} else {
    $tempScriptDir = Get-Location
}

if ($tempScriptDir) {
    $tempRootDir = Split-Path -Parent $tempScriptDir
    $tempBackendPath = Join-Path $tempRootDir "backend"
    if (-not (Test-Path $tempBackendPath)) {
        $tempBackendPath = Join-Path $tempRootDir "lutron_backend"
    }
    $tempFrontendPath = Join-Path $tempRootDir "frontend"
    if (-not (Test-Path $tempFrontendPath)) {
        $tempFrontendPath = Join-Path $tempRootDir "lutron_frontend"
    }
    if (Test-Path $tempBackendPath) {
        $tempBackendPath = (Resolve-Path $tempBackendPath).Path
    }
    if (Test-Path $tempFrontendPath) {
        $tempFrontendPath = (Resolve-Path $tempFrontendPath).Path
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

# Kill process and entire process tree (same logic as LMS_stop.ps1)
function Stop-ProcessTree {
    param([int]$ProcessId)
    try {
        $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if (-not $proc) { return }
        $null = cmd /c "taskkill /PID $ProcessId /F /T 2>nul"
        Write-Host "[INFO] Stopped process tree (PID: $ProcessId)" -ForegroundColor Yellow
    } catch {
        Write-Host "[WARNING] Could not stop process tree PID ${ProcessId}: $_" -ForegroundColor Yellow
    }
}

# Check if LMS is already running and stop it (backend first, process-tree kill, second-pass)
Write-Host "Checking if LMS is already running..." -ForegroundColor Yellow

# Remove leftover NSSM Windows service -- otherwise it starts a second backend on reboot
$pm2LibEarly = Join-Path $PSScriptRoot "LMS_pm2.ps1"
if (Test-Path $pm2LibEarly) {
    . $pm2LibEarly
    try {
        Remove-LmsLegacyNssmBackendService
    } catch {
        Write-Host "[WARNING] Could not remove leftover LutronLMSBackend: $_" -ForegroundColor Yellow
    }
} else {
    $svcName = "LutronLMSBackend"
    $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -ne "Stopped") {
        Write-Host "[INFO] Windows service '$svcName' is $($svc.Status) -- stopping before console start..." -ForegroundColor Yellow
        try {
            Stop-Service -Name $svcName -Force -ErrorAction Stop
            $svc.WaitForStatus("Stopped", (New-TimeSpan -Seconds 30))
            Write-Host "[SUCCESS] Service '$svcName' stopped" -ForegroundColor Green
        } catch {
            Write-Host "[WARNING] Could not stop '$svcName': $_" -ForegroundColor Yellow
        }
    }
}

$backendProcessIds = @()
try {
    $backendConnections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($backendConnections) {
        $backendConnections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            if ($backendProcessIds -notcontains $_) { $backendProcessIds += $_ }
        }
    }
} catch { }

if ($tempBackendPath -and (Test-Path $tempBackendPath)) {
    try {
        Get-Process -Name "python*" -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $cmdLine = Get-ProcessCommandLine -ProcessId $_.Id
                if ($cmdLine) {
                    if (($cmdLine -like "*$tempBackendPath*" -or $cmdLine -like "*uvicorn*") -and
                        ($cmdLine -like "*uvicorn*" -or $cmdLine -like "*app.main:app*")) {
                        if ($backendProcessIds -notcontains $_.Id) { $backendProcessIds += $_.Id }
                    }
                }
            } catch { }
        }
    } catch { }
}

foreach ($processId in $backendProcessIds) {
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) { Stop-ProcessTree -ProcessId $processId }
}
if ($backendProcessIds.Count -gt 0) { Start-Sleep -Seconds 1 }

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

# Residual runtime children (energy_logger / listener / loadcontroller)
$residualIds = @()
$backendMarkers = @("*lutron_backend*", "*\backend\*", "*uvicorn*app.main:app*", "*energy_logger*", "*loadcontroller*")
if ($tempBackendPath) { $backendMarkers += "*$tempBackendPath*" }
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
            if (-not $hit -and $tempBackendPath -and $exe -and ($exe -like "$tempBackendPath*")) { $hit = $true }
            if ($hit -and $residualIds -notcontains $_.ProcessId) { $residualIds += $_.ProcessId }
        }
} catch { }
foreach ($processId in $residualIds) {
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
        Write-Host "[INFO] Stopping residual backend PID: $processId" -ForegroundColor Yellow
        Stop-ProcessTree -ProcessId $processId
    }
}
if ($residualIds.Count -gt 0) { Start-Sleep -Seconds 1 }

$frontendProcessIds = @()
try {
    $frontendConnections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($frontendConnections) {
        $frontendConnections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            if ($frontendProcessIds -notcontains $_) { $frontendProcessIds += $_ }
        }
    }
} catch { }

if ($tempFrontendPath -and (Test-Path $tempFrontendPath)) {
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $cmdLine = Get-ProcessCommandLine -ProcessId $_.Id
                if ($cmdLine) {
                    if ($cmdLine -like "*$tempFrontendPath*" -or $cmdLine -like "*npm start*" -or $cmdLine -like "*npm run*" -or $cmdLine -like "*serve*build*" -or $cmdLine -like "*serve -s*") {
                        if ($frontendProcessIds -notcontains $_.Id) { $frontendProcessIds += $_.Id }
                    }
                }
            } catch { }
        }
    } catch { }
}

foreach ($processId in $frontendProcessIds) {
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) { Stop-ProcessTree -ProcessId $processId }
}
if ($frontendProcessIds.Count -gt 0) { Start-Sleep -Seconds 1 }

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

Write-Host ""

# Get current date for log files
$logDate = Get-Date -Format "yyyy-MM-dd"

# Auto-detect paths based on script location using optimized function
$scriptPathForDir = Get-ScriptPath -ScriptName "LMS_start.ps1"

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

# Load hosting configuration (backend host + frontend API URL)
$hostingConfig = Get-HostingConfig -RootDir $RootDir
$ipConfigurationEnabled = $hostingConfig.IsIpConfigEnabled
$configuredIp = $hostingConfig.ConfiguredIp
$backendHostForUvicorn = $hostingConfig.BackendHostForUvicorn
$frontendApiBaseUrl = $hostingConfig.FrontendApiBaseUrl

# Try new folder names first, then fallback to old names
$BackendPath = Join-Path $RootDir "backend"
if (-not (Test-Path $BackendPath)) {
    $BackendPath = Join-Path $RootDir "lutron_backend"
}

$FrontendPath = Join-Path $RootDir "frontend"
if (-not (Test-Path $FrontendPath)) {
    $FrontendPath = Join-Path $RootDir "lutron_frontend"
}

# Verify paths exist
if (-not (Test-Path $BackendPath)) {
    Write-Host "[ERROR] Could not locate backend folder." -ForegroundColor Red
    Write-Host "Expected locations:" -ForegroundColor Red
    Write-Host "  - $RootDir\backend" -ForegroundColor Red
    Write-Host "  - $RootDir\lutron_backend" -ForegroundColor Red
    Write-Host ""
    Write-Host "Current script location: $ScriptDir" -ForegroundColor Red
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-Host "[ERROR] Could not locate frontend folder." -ForegroundColor Red
    Write-Host "Expected locations:" -ForegroundColor Red
    Write-Host "  - $RootDir\frontend" -ForegroundColor Red
    Write-Host "  - $RootDir\lutron_frontend" -ForegroundColor Red
    Write-Host ""
    Write-Host "Current script location: $ScriptDir" -ForegroundColor Red
    Write-Host "Backend path detected: $BackendPath" -ForegroundColor Red
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

Write-Host "Backend: $BackendPath" -ForegroundColor Cyan
Write-Host "Frontend: $FrontendPath" -ForegroundColor Cyan
Write-Host ""

# Function to configure auto-start (defined early so it can be called later)
function Configure-AutoStart {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  AUTO-START ON BOOT" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $taskName = "LutronAutoStart"
    $taskExists = $false
    
    try {
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($task) {
            $taskExists = $true
        }
    } catch {
        # Task doesn't exist
    }
    
    if ($taskExists) {
        Write-Host "[INFO] Auto-start is already enabled." -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    Write-Host "Auto-start is not currently enabled." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Do you want to enable auto-start on boot?" -ForegroundColor Yellow
    Write-Host "  - Servers will automatically start when you log in" -ForegroundColor Yellow
    Write-Host "  - Requires administrator privileges" -ForegroundColor Yellow
    Write-Host ""
    $enableAutostart = Read-Host "Enable auto-start on boot? (Y/N) [Default: N]"
    
    if ([string]::IsNullOrWhiteSpace($enableAutostart)) {
        $enableAutostart = "N"
    }
    
    if ($enableAutostart -ne "Y" -and $enableAutostart -ne "y") {
        Write-Host "[INFO] Auto-start not enabled. You can enable it later by running this script again." -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    # User wants to enable auto-start
    Write-Host "[INFO] Attempting to create auto-start task..." -ForegroundColor Yellow
    
    # Check for administrator privileges
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "[INFO] Administrator privileges required. Requesting elevation..." -ForegroundColor Yellow
        Write-Host ""
        
        # Prevent infinite loops - check if we were just elevated
        if ($env:__ELEVATED__ -eq "1") {
            Write-Host "[ERROR] Already attempted elevation. Cannot elevate again." -ForegroundColor Red
            Write-Host "[ERROR] Please run this script as Administrator manually to enable auto-start." -ForegroundColor Red
            Write-Host ""
            return
        }
        
        # Get script path using optimized function
        $scriptPath = Get-ScriptPath -ScriptName "LMS_start.ps1"
        
        if ($scriptPath -and (Test-Path $scriptPath)) {
            # Resolve full path
            try {
                $scriptPath = (Resolve-Path $scriptPath).Path
            } catch {
                Write-Host "[ERROR] Cannot resolve script path: $_" -ForegroundColor Red
                Write-Host "[ERROR] Auto-start configuration skipped." -ForegroundColor Red
                Write-Host ""
                return
            }
            
            # Set environment variable to prevent loops
            $env:__ELEVATED__ = "1"
            
            try {
                # Re-launch script with admin privileges and auto-enable flag
                # Use full path to PowerShell executable
                $powershellExe = (Get-Command powershell.exe).Source
                $argList = @("-ExecutionPolicy", "Bypass", "-NoProfile", "-File", "`"$scriptPath`"", "-Silent", "-EnableAutoStart")
                $process = Start-Process -FilePath $powershellExe -ArgumentList $argList -Verb RunAs -Wait -PassThru -WindowStyle Normal -ErrorAction Stop
                
                # Clear the flag
                Remove-Item Env:\__ELEVATED__ -ErrorAction SilentlyContinue
                
                if ($process.ExitCode -eq 0) {
                    Write-Host "[SUCCESS] Auto-start enabled! Servers will start on boot." -ForegroundColor Green
                    Write-Host ""
                } else {
                    Write-Host "[ERROR] Failed to enable auto-start. Exit code: $($process.ExitCode)" -ForegroundColor Red
                    Write-Host "[ERROR] Please check the elevated window for error details." -ForegroundColor Red
                    Write-Host ""
                }
            } catch {
                Remove-Item Env:\__ELEVATED__ -ErrorAction SilentlyContinue
                Write-Host "[ERROR] Failed to elevate: $_" -ForegroundColor Red
                Write-Host "[ERROR] Please run this script as Administrator manually to enable auto-start." -ForegroundColor Red
                Write-Host ""
            }
        } else {
            Write-Host "[ERROR] Cannot determine script path for auto-start configuration." -ForegroundColor Red
            Write-Host "[ERROR] Auto-start configuration skipped." -ForegroundColor Red
            Write-Host ""
        }
        return
    }
    
    # Get script path using optimized function
    $scriptPath = Get-ScriptPath -ScriptName "LMS_start.ps1"
    
    if (-not $scriptPath -or -not (Test-Path $scriptPath)) {
        Write-Host "[ERROR] Cannot determine script path for auto-start configuration." -ForegroundColor Red
        Write-Host "[ERROR] Auto-start configuration skipped." -ForegroundColor Red
        return
    }
    
    try {
        if (Get-Command Register-LutronAutoStartTask -ErrorAction SilentlyContinue) {
            Register-LutronAutoStartTask -StartScriptPath $scriptPath
        } else {
            throw "Register-LutronAutoStartTask is not available (LMS_pm2.ps1 not loaded)"
        }
        Write-Host "[SUCCESS] Auto-start enabled! Servers will start on boot." -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "[ERROR] Failed to create scheduled task. Please check Task Scheduler manually." -ForegroundColor Red
        Write-Host "[ERROR] Error: $_" -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "Auto-start configuration complete." -ForegroundColor Yellow
}

# Require lutron_backend\.venv (never fall back to system Python)
$VenvPython = Join-Path $BackendPath ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Host "[ERROR] Virtual environment not found at:" -ForegroundColor Red
    Write-Host "  $VenvPython" -ForegroundColor Red
    Write-Host ""
    Write-Host "Recreate it with:" -ForegroundColor Yellow
    Write-Host ('  cd "' + $BackendPath + '"') -ForegroundColor Cyan
    Write-Host '  python -m venv .venv' -ForegroundColor Cyan
    Write-Host '  .\.venv\Scripts\python.exe -m pip install -r requirements.txt' -ForegroundColor Cyan
    Write-Host ""
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

Write-Host "[INFO] Using virtual environment Python: $VenvPython" -ForegroundColor Yellow

Write-Host "[INFO] Preflight: verifying backend dependencies..." -ForegroundColor Yellow
& $VenvPython -c 'import uvicorn, httpx, psutil'
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend dependencies missing (uvicorn, httpx, or psutil)." -ForegroundColor Red
    Write-Host "[ERROR] Run:" -ForegroundColor Red
    Write-Host ('  cd "' + $BackendPath + '"') -ForegroundColor Cyan
    Write-Host '  .\.venv\Scripts\python.exe -m pip install -r requirements.txt' -ForegroundColor Cyan
    Write-Host ""
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}
Write-Host "[OK] Backend dependencies verified" -ForegroundColor Green

Write-Host ""

# Verify required folders exist
if (-not (Test-Path $BackendPath)) {
    Write-Host "[ERROR] Backend folder not found at: $BackendPath" -ForegroundColor Red
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-Host "[ERROR] Frontend folder not found at: $FrontendPath" -ForegroundColor Red
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

# Create logs directory if not exists
$backendLogDir = Join-Path $BackendPath "logs"
$frontendLogDir = Join-Path $FrontendPath "logs"

if (-not (Test-Path $backendLogDir)) {
    New-Item -ItemType Directory -Path $backendLogDir -Force | Out-Null
}

if (-not (Test-Path $frontendLogDir)) {
    New-Item -ItemType Directory -Path $frontendLogDir -Force | Out-Null
}

# Delete log files older than 7 days
Write-Host "Cleaning up old log files (keeping last 7 days)..." -ForegroundColor Yellow
$cutoffDate = (Get-Date).AddDays(-7)

Get-ChildItem -Path $backendLogDir -Filter "*.log" -ErrorAction SilentlyContinue | Where-Object {
    $_.LastWriteTime -lt $cutoffDate
} | Remove-Item -Force -ErrorAction SilentlyContinue

Get-ChildItem -Path $frontendLogDir -Filter "*.log" -ErrorAction SilentlyContinue | Where-Object {
    $_.LastWriteTime -lt $cutoffDate
} | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host ""

# LMS-007: ensure CORS_ALLOWED_ORIGINS exists before uvicorn starts.
# Do not overwrite an existing non-empty allowlist (operator may have customized it).
$backendEnvFile = Join-Path $BackendPath "environment.env"
if (Test-Path $backendEnvFile) {
    $corsEnv = Get-Content $backendEnvFile -Raw
    $corsValue = $null
    if ($corsEnv -match '(?m)^\s*CORS_ALLOWED_ORIGINS\s*=\s*"?([^"\r\n]*)"?\s*$') {
        $corsValue = $matches[1].Trim()
    }
    $needsCors = [string]::IsNullOrWhiteSpace($corsValue) -or ($corsValue -eq '*')
    if ($needsCors) {
        $corsOrigins = [System.Collections.Generic.List[string]]::new()
        [void]$corsOrigins.Add('http://localhost:3000')
        [void]$corsOrigins.Add('http://127.0.0.1:3000')
        if ($ipConfigurationEnabled -and -not [string]::IsNullOrWhiteSpace($configuredIp)) {
            [void]$corsOrigins.Add(("http://{0}:3000" -f $configuredIp.Trim()))
        }
        $corsLine = ($corsOrigins | Select-Object -Unique) -join ','
        if ($corsEnv -match '(?m)^\s*CORS_ALLOWED_ORIGINS\s*=') {
            $corsEnv = $corsEnv -replace '(?m)^\s*CORS_ALLOWED_ORIGINS\s*=.*', "CORS_ALLOWED_ORIGINS=`"$corsLine`""
        } else {
            if (-not $corsEnv.EndsWith("`n") -and -not $corsEnv.EndsWith("`r`n")) {
                $corsEnv += "`r`n"
            }
            $corsEnv += "CORS_ALLOWED_ORIGINS=`"$corsLine`"`r`n"
        }
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($backendEnvFile, $corsEnv, $utf8NoBom)
        Write-Host "[INFO] Wrote CORS_ALLOWED_ORIGINS=$corsLine" -ForegroundColor Yellow
    } else {
        Write-Host "[INFO] CORS_ALLOWED_ORIGINS already set; leaving existing value" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] environment.env not found at $backendEnvFile; CORS_ALLOWED_ORIGINS not written" -ForegroundColor Yellow
}

# LMS-008: production installs disable API docs. Do not overwrite an explicit value.
if (Test-Path $backendEnvFile) {
    $docsEnv = Get-Content $backendEnvFile -Raw
    $hasDocsFlag = $docsEnv -match '(?m)^\s*ENABLE_API_DOCS\s*='
    if (-not $hasDocsFlag) {
        if (-not $docsEnv.EndsWith("`n") -and -not $docsEnv.EndsWith("`r`n")) {
            $docsEnv += "`r`n"
        }
        $docsEnv += "ENABLE_API_DOCS=false`r`n"
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($backendEnvFile, $docsEnv, $utf8NoBom)
        Write-Host "[INFO] Wrote ENABLE_API_DOCS=false" -ForegroundColor Yellow
    } else {
        Write-Host "[INFO] ENABLE_API_DOCS already set; leaving existing value" -ForegroundColor Yellow
    }
}

# STEP 1: Backend and frontend are started together by PM2 after the
# production frontend build exists (STEP 2). Do not launch a second uvicorn.
Set-LmsConsolePhase -Percent 30 -Status "Preparing the frontend..."
Write-Host "[INFO] Skipping direct uvicorn launch. PM2 owns lutron-backend." -ForegroundColor Yellow
Write-Host ""

# STEP 2: Prepare Frontend assets, then start both apps via PM2
Set-LmsConsolePhase -Percent 38 -Status "Preparing the frontend..."

# Ensure frontend .env has correct REACT_APP_API_URL based on hosting configuration
# (CRA bakes REACT_APP_* into the JS at build time — must be correct before npm run build)
$frontendEnvPath = Join-Path $FrontendPath ".env"
if (Test-Path $frontendEnvPath) {
    try {
        $envLines = Get-Content $frontendEnvPath

        $foundApiLine = $false
        $newLines = @()

        foreach ($line in $envLines) {
            if ($line -match "^\s*REACT_APP_API_URL\s*=") {
                $newLines += "REACT_APP_API_URL=$frontendApiBaseUrl"
                $foundApiLine = $true
            } else {
                $newLines += $line
            }
        }

        if (-not $foundApiLine) {
            $newLines += "REACT_APP_API_URL=$frontendApiBaseUrl"
        }

        Set-Content -Path $frontendEnvPath -Value $newLines -Encoding UTF8
        Write-Host "[INFO] Updated frontend .env REACT_APP_API_URL to $frontendApiBaseUrl" -ForegroundColor Yellow
    } catch {
        Write-Host "[WARNING] Failed to update frontend .env: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    try {
        Set-Content -Path $frontendEnvPath -Value "REACT_APP_API_URL=$frontendApiBaseUrl" -Encoding UTF8
        Write-Host "[INFO] Created frontend .env with REACT_APP_API_URL=$frontendApiBaseUrl" -ForegroundColor Yellow
    } catch {
        Write-Host "[WARNING] Frontend .env not found and could not be created at: $frontendEnvPath" -ForegroundColor Yellow
    }
}

# Production static serve (low Node RAM) instead of npm start (webpack-dev-server).
$frontendBuildIndex = Join-Path $FrontendPath "build\index.html"
$frontendApiStamp = Join-Path $FrontendPath "build\.lms-api-url"
$reactModulePath = Join-Path $FrontendPath "node_modules\react"
$needFrontendBuild = $false
$needNpmInstall = $false

if (-not (Test-Path $reactModulePath)) {
    $needNpmInstall = $true
    $needFrontendBuild = $true
    Write-Host "[INFO] node_modules\react missing - will run npm install and npm run build" -ForegroundColor Yellow
}

if (-not (Test-Path $frontendBuildIndex)) {
    $needFrontendBuild = $true
    Write-Host "[INFO] No production build found - will run npm run build" -ForegroundColor Yellow
} elseif (-not $needFrontendBuild) {
    $previousApiUrl = $null
    if (Test-Path $frontendApiStamp) {
        $previousApiUrl = (Get-Content $frontendApiStamp -Raw -ErrorAction SilentlyContinue).Trim()
    }
    if ($previousApiUrl -ne $frontendApiBaseUrl) {
        $needFrontendBuild = $true
        Write-Host "[INFO] API URL changed ($previousApiUrl -> $frontendApiBaseUrl) - rebuilding frontend" -ForegroundColor Yellow
    }
    if (-not $needFrontendBuild) {
        try {
            $buildTime = (Get-Item $frontendBuildIndex).LastWriteTimeUtc
            $srcRoot = Join-Path $FrontendPath "src"
            $newerSrc = $null
            if (Test-Path $srcRoot) {
                $newerSrc = Get-ChildItem -Path $srcRoot -Recurse -File -ErrorAction SilentlyContinue |
                    Where-Object { $_.LastWriteTimeUtc -gt $buildTime } |
                    Select-Object -First 1
            }
            $pkgJson = Join-Path $FrontendPath "package.json"
            if (-not $newerSrc -and (Test-Path $pkgJson) -and ((Get-Item $pkgJson).LastWriteTimeUtc -gt $buildTime)) {
                $newerSrc = Get-Item $pkgJson
            }
            if ($newerSrc) {
                $needFrontendBuild = $true
                Write-Host "[INFO] Frontend source newer than build ($($newerSrc.Name)) - rebuilding" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[WARNING] Could not compare source vs build timestamps; keeping existing build." -ForegroundColor Yellow
        }
    }
}

$frontendLogFile = Join-Path $frontendLogDir "frontend-$logDate.log"
$frontendErrorLogFile = Join-Path $frontendLogDir "frontend-error-$logDate.log"
Write-Host "Logs: frontend-$logDate.log" -ForegroundColor Cyan

if ($needNpmInstall) {
    Write-Host "Running npm install..." -ForegroundColor Yellow
    $npmInstallCmd = "cd /d `"$FrontendPath`" && npm install > `"$frontendLogFile`" 2> `"$frontendErrorLogFile`""
    $npmInstallProcess = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", $npmInstallCmd) -Wait -PassThru -WindowStyle Hidden
    if ($null -eq $npmInstallProcess -or $npmInstallProcess.ExitCode -ne 0 -or -not (Test-Path $reactModulePath)) {
        Write-Host "[ERROR] npm install failed. Check logs:" -ForegroundColor Red
        Write-Host "  - $frontendLogFile" -ForegroundColor Red
        Write-Host "  - $frontendErrorLogFile" -ForegroundColor Red
        Write-LmsManualStartCommands -BackendPath $BackendPath -FrontendPath $FrontendPath -BackendHost $backendHostForUvicorn
        if (-not $Silent) {
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        exit 1
    }
    Write-Host "[OK] npm install completed" -ForegroundColor Green
}

if ($needFrontendBuild) {
    Write-Host "Building production frontend..." -ForegroundColor Yellow
    Write-Host "[INFO] NODE_OPTIONS=--max-old-space-size=1536 for build" -ForegroundColor Yellow
    $buildCmd = "cd /d `"$FrontendPath`" && set NODE_OPTIONS=--max-old-space-size=1536&& set REACT_APP_API_URL=$frontendApiBaseUrl&& npm run build > `"$frontendLogFile`" 2> `"$frontendErrorLogFile`""
    $buildProcess = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", $buildCmd) -Wait -PassThru -WindowStyle Hidden
    if ($null -eq $buildProcess -or $buildProcess.ExitCode -ne 0 -or -not (Test-Path $frontendBuildIndex)) {
        Write-Host "[ERROR] Frontend production build failed. Check logs:" -ForegroundColor Red
        Write-Host "  - $frontendLogFile" -ForegroundColor Red
        Write-Host "  - $frontendErrorLogFile" -ForegroundColor Red
        Write-LmsManualStartCommands -BackendPath $BackendPath -FrontendPath $FrontendPath -BackendHost $backendHostForUvicorn
        if (-not $Silent) {
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        exit 1
    }
    try {
        Set-Content -Path $frontendApiStamp -Value $frontendApiBaseUrl -Encoding UTF8 -Force
    } catch { }
    Write-Host "[SUCCESS] Frontend production build completed" -ForegroundColor Green
} else {
    Write-Host "[INFO] Using existing frontend build (skip rebuild)" -ForegroundColor Yellow
}

if (-not (Test-Path $frontendBuildIndex)) {
    Write-Host "[ERROR] Cannot start frontend: build\index.html is missing." -ForegroundColor Red
    Write-LmsManualStartCommands -BackendPath $BackendPath -FrontendPath $FrontendPath -BackendHost $backendHostForUvicorn
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

Write-Host "Starting lutron-backend and lutron-frontend via PM2..." -ForegroundColor Yellow
Set-LmsConsolePhase -Percent 52 -Status "Starting application services..."

$pm2Lib = Join-Path $PSScriptRoot "LMS_pm2.ps1"
if (-not (Test-Path $pm2Lib)) {
    $pm2Lib = Join-Path (Split-Path $scriptPathForDir -Parent) "LMS_pm2.ps1"
}
if (-not (Test-Path $pm2Lib)) {
    Write-Host "[ERROR] LMS_pm2.ps1 not found. Re-run Install_LMS.cmd." -ForegroundColor Red
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}
. $pm2Lib
try {
    Initialize-LmsPm2Context -RootDir $RootDir -BackendDir $BackendPath -FrontendDir $FrontendPath
    Start-LmsPm2Apps
    Save-LmsPm2Dump
} catch {
    $pm2ErrorDetails = $_ | Out-String
    Write-LmsTechnicalLog -Object $pm2ErrorDetails
    if (-not $Silent) {
        $recoveryCommands = @(
            'Working manual commands (source of truth):',
            ('  cd "' + $BackendPath + '"'),
            '  .\.venv\Scripts\python.exe -m pip install -r requirements.txt',
            ('  .\.venv\Scripts\python.exe -m uvicorn app.main:app --host ' + $backendHostForUvicorn + ' --port 8000'),
            ('  cd "' + $FrontendPath + '"'),
            '  npm install',
            '  npm run build',
            '  npm run serve'
        )
        Show-LmsFailurePrompt -Message "PM2 could not start." -RecoveryCommands $recoveryCommands
    }
    exit 1
}

$backendLogFile = Join-Path $backendLogDir "pm2-backend-out.log"
$backendErrorLogFile = Join-Path $backendLogDir "pm2-backend-error.log"
$frontendUrlForBrowser = Get-LmsFrontendBrowserUrl

if (-not (Wait-LmsApplicationReady)) {
    Write-Host "[ERROR] Application health check failed. Backend or frontend is not ready." -ForegroundColor Red
    Write-Host "  - Backend logs: $backendLogFile" -ForegroundColor Red
    Write-Host "  - Backend error logs: $backendErrorLogFile" -ForegroundColor Red
    Write-LmsManualStartCommands -BackendPath $BackendPath -FrontendPath $FrontendPath -BackendHost $backendHostForUvicorn
    if (-not $Silent) {
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

Open-LmsFrontendInDefaultBrowser

Write-Host ""

Complete-LmsConsole -Message "Launch Complete" -Detail ("Dashboard:`n{0}" -f $frontendUrlForBrowser)
exit 0

