# ============================================================
#  Lutron LMS - Installation Script with JSON Input (PowerShell)
# ============================================================
#  Installs: Python 3.13.2, Node.js 18.20.8, PostgreSQL 17.5
#  Creates Database + Superadmin User from JSON input
#  Python packages installed in .venv virtual environment (inside backend folder)
#  REQUIRES ADMINISTRATOR PRIVILEGES
#  Reads configuration from input.json
#  Auto-elevates to Administrator when double-clicked
# ============================================================

param(
    [switch]$SkipPythonNode,
    [switch]$SkipPostgres
)

. (Join-Path $PSScriptRoot "LmsConsole.ps1")
Initialize-LmsConsole -Subtitle "Installing Application" -WindowTitle "Lutron LMS Installation"

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

# The CMD launcher performs elevation before starting this script. Do not
# spawn another PowerShell process here because it would create a second UI.
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Administrator privileges are required." -ForegroundColor Red
    Write-Host "Run Install_LMS.cmd to start the installer." -ForegroundColor Red
    exit 1
}

$ErrorActionPreference = "Stop"
# Set-StrictMode -Version Latest  # Commented out to avoid issues with dynamic variables

# ============================================================
#  Configuration Variables
# ============================================================
# Get script directory using optimized path detection
$scriptPathForDir = Get-ScriptPath -ScriptName "LMS_installation.ps1"

if ($scriptPathForDir -and (Test-Path $scriptPathForDir)) {
    $Script:ScriptDir = Split-Path -Parent $scriptPathForDir
    # If script is in a "scripts" subfolder, use parent directory for input.json
    if ($Script:ScriptDir -like "*\scripts") {
        $Script:ScriptDir = Split-Path -Parent $Script:ScriptDir
    }
} elseif ($PSScriptRoot) {
    $Script:ScriptDir = $PSScriptRoot
    # If script is in a "scripts" subfolder, use parent directory for input.json
    if ($Script:ScriptDir -like "*\scripts") {
        $Script:ScriptDir = Split-Path -Parent $Script:ScriptDir
    }
} else {
    $Script:ScriptDir = Get-Location
}

$Script:RootDir = Split-Path -Parent $ScriptDir
$Script:InputJson = Join-Path $ScriptDir "input.json"
$Script:BackendDir = Join-Path (Join-Path $ScriptDir "..") "backend"
$Script:FrontendDir = Join-Path (Join-Path $ScriptDir "..") "frontend"

# Fallback to old folder names if new ones don't exist
if (-not (Test-Path $Script:BackendDir)) {
    $Script:BackendDir = Join-Path (Join-Path $ScriptDir "..") "lutron_backend"
}
if (-not (Test-Path $Script:FrontendDir)) {
    $Script:FrontendDir = Join-Path (Join-Path $ScriptDir "..") "lutron_frontend"
}

$Script:VenvDir = Join-Path $Script:BackendDir ".venv"
$Script:PythonVersion = "3.13.2"
$Script:NodeVersion = "18.20.8"
$Script:PostgresVersion = "17.5"
$Script:LogFile = Join-Path $env:TEMP "lutron_setup.log"

# Initialize logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $Script:LogFile -Value $logMessage
    Write-LmsTechnicalLog -Object $logMessage
    if ($Level -eq "ERROR") {
        Show-LmsFailurePrompt -Message $Message
        Write-Host $logMessage -ForegroundColor Red
    } elseif ($Level -eq "WARNING") {
        Write-Host $logMessage -ForegroundColor Yellow
    } else {
        Write-Host $logMessage
    }
}

Set-LmsConsolePhase -Percent 5 -Status "Running pre-checks..."

# Clear log file at start
"" | Out-File $Script:LogFile -Force
Write-Log "Starting Lutron LMS Installation (PowerShell)"


# ============================================================
#  STEP 1: Check Administrator Privileges
# ============================================================

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Log "ERROR: Administrator privileges required" "ERROR"
    Write-Host "[ERROR] This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "[ERROR] Please right-click this file and select 'Run as Administrator'" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Log "Administrator check passed"
Write-Host "[OK] Administrator privileges confirmed" -ForegroundColor Green
Write-Host ""

# ============================================================
#  Optimization Helper Functions
# ============================================================
function Test-Paths {
    Write-Log "Validating paths..."
    if ($ScriptDir -match '[<>|&]') {
        Write-Log "ERROR: Script path contains invalid characters" "ERROR"
        Write-Host "[ERROR] Script path contains invalid characters" -ForegroundColor Red
        Write-Host "[ERROR] Path: $ScriptDir" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    return $true
}

function Test-DiskSpace {
    Write-Log "Checking disk space..."
    $drive = (Get-Item $RootDir).PSDrive
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    if ($freeSpaceGB -lt 2) {
        Write-Log "ERROR: Insufficient disk space - Required: 2GB, Available: ${freeSpaceGB}GB" "ERROR"
        Write-Host "[ERROR] Insufficient disk space" -ForegroundColor Red
        Write-Host "[ERROR] Required: 2GB free, Available: ${freeSpaceGB}GB" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Write-Host "[OK] Sufficient disk space available (${freeSpaceGB}GB free)" -ForegroundColor Green
    return $true
}

function Test-InternetConnectivity {
    Write-Log "Checking internet connectivity..."
    try {
        $result = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -ErrorAction Stop
        if (-not $result) {
            throw "No internet connectivity"
        }
        Write-Host "[OK] Internet connectivity confirmed" -ForegroundColor Green
        return $true
    } catch {
        Write-Log "ERROR: No internet connectivity detected" "ERROR"
        Write-Host "[ERROR] No internet connectivity detected" -ForegroundColor Red
        Write-Host "[ERROR] Internet is required for downloading installers" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

function Test-FilePermissions {
    Write-Log "Checking file permissions..."
    if (-not (Test-Path $BackendDir)) {
        Write-Log "ERROR: Backend directory does not exist: $BackendDir" "ERROR"
        Write-Host "[ERROR] Backend directory does not exist: $BackendDir" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    # Test write permission
    $testFile = Join-Path $BackendDir "permission_test.tmp"
    try {
        "" | Out-File $testFile -ErrorAction Stop
        Remove-Item $testFile -ErrorAction SilentlyContinue
    } catch {
        Write-Log "ERROR: Cannot write to backend directory: $BackendDir" "ERROR"
        Write-Host "[ERROR] Cannot write to backend directory: $BackendDir" -ForegroundColor Red
        Write-Host "[ERROR] Please check directory permissions" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    return $true
}

# ============================================================
#  Progress Display Helper Functions
# ============================================================
function Show-ProgressBar {
    param(
        [int]$Percent,
        [int]$BarLength = 40,
        [string]$Status = ""
    )
    
    $Percent = [Math]::Min([Math]::Max($Percent, 0), 100)
    $filled = [math]::Floor(($Percent / 100) * $BarLength)
    $empty = $BarLength - $filled
    $bar = "[" + ("=" * $filled) + (" " * $empty) + "]"
    
    Write-Host "`r$bar $Percent% $Status" -NoNewline -ForegroundColor Cyan
}

function Show-SpinnerProgress {
    param(
        [int]$Percent,
        [string]$Status = "",
        [int]$SpinnerIndex = 0
    )
    
    $spinnerChars = @('|', '/', '-', '\')
    $spinnerChar = $spinnerChars[$SpinnerIndex % $spinnerChars.Length]
    $Percent = [Math]::Min([Math]::Max($Percent, 0), 100)
    
    Write-Host "`r[INFO] $spinnerChar Progress: ~$Percent% | $Status" -NoNewline -ForegroundColor Cyan
}

# ============================================================
#  Retry Helper Functions
# ============================================================
function Invoke-WithRetry {
    param(
        [scriptblock]$ScriptBlock,
        [string]$OperationName,
        [int]$MaxRetries = 3,
        [int]$InitialDelay = 2,
        [bool]$ExponentialBackoff = $true,
        [int]$MaxDelay = 30,
        [string[]]$RetryableErrors = @()
    )
    
    $retryCount = 0
    $delay = $InitialDelay
    $lastError = $null
    
    while ($retryCount -lt $MaxRetries) {
        try {
            $result = & $ScriptBlock
            if ($retryCount -gt 0) {
                Write-Host "[OK] $OperationName succeeded on attempt $($retryCount + 1)" -ForegroundColor Green
                Write-Log "$OperationName succeeded on attempt $($retryCount + 1)"
            }
            return $result
        } catch {
            $retryCount++
            $lastError = $_
            $errorMessage = $_.Exception.Message
            
            # Check if error is retryable
            $isRetryable = $true
            if ($RetryableErrors.Count -gt 0) {
                $isRetryable = $false
                foreach ($retryableError in $RetryableErrors) {
                    if ($errorMessage -like "*$retryableError*") {
                        $isRetryable = $true
                        break
                    }
                }
            }
            
            if (-not $isRetryable) {
                Write-Host "[ERROR] $OperationName failed with non-retryable error: $errorMessage" -ForegroundColor Red
                Write-Log "ERROR: $OperationName failed with non-retryable error: $errorMessage" "ERROR"
                throw
            }
            
            if ($retryCount -ge $MaxRetries) {
                Write-Host "[ERROR] $OperationName failed after $MaxRetries attempts" -ForegroundColor Red
                Write-Host "[ERROR] Last error: $errorMessage" -ForegroundColor Red
                Write-Log "ERROR: $OperationName failed after $MaxRetries attempts: $errorMessage" "ERROR"
                throw
            }
            
            Write-Host "[WARNING] $OperationName failed (attempt $retryCount/$MaxRetries): $errorMessage" -ForegroundColor Yellow
            Write-Host "[INFO] Retrying in $delay seconds..." -ForegroundColor Yellow
            Write-Log "WARNING: $OperationName failed (attempt $retryCount/$MaxRetries), retrying in $delay seconds"
            Start-Sleep -Seconds $delay
            
            if ($ExponentialBackoff) {
                $delay = [Math]::Min($delay * 2, $MaxDelay)
            }
        }
    }
    
    throw $lastError
}

# Resolve psql.exe on Windows.
# EnterpriseDB installs under major version folders (e.g. ...\PostgreSQL\17\) even when
# the installer product version is 17.5 — never keep a path that fails Test-Path.
function Resolve-PsqlExecutable {
    param(
        [string]$PreferredVersion = $Script:PostgresVersion
    )

    $candidates = New-Object System.Collections.Generic.List[string]

    if (-not [string]::IsNullOrWhiteSpace($PreferredVersion)) {
        $candidates.Add("C:\Program Files\PostgreSQL\$PreferredVersion\bin\psql.exe")
        $major = ($PreferredVersion -split '\.')[0]
        if ($major -and $major -ne $PreferredVersion) {
            $candidates.Add("C:\Program Files\PostgreSQL\$major\bin\psql.exe")
        }
    }

    foreach ($v in @("17", "16", "15", "14")) {
        $candidates.Add("C:\Program Files\PostgreSQL\$v\bin\psql.exe")
    }

    $pgRoot = "C:\Program Files\PostgreSQL"
    if (Test-Path $pgRoot) {
        Get-ChildItem -Path $pgRoot -Directory -ErrorAction SilentlyContinue |
            ForEach-Object {
                $candidates.Add((Join-Path $_.FullName "bin\psql.exe"))
            }
    }

    $seen = @{}
    foreach ($path in $candidates) {
        if ([string]::IsNullOrWhiteSpace($path)) { continue }
        if ($seen.ContainsKey($path)) { continue }
        $seen[$path] = $true
        if (Test-Path -LiteralPath $path) {
            return $path
        }
    }

    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd -and $psqlCmd.Source -and (Test-Path -LiteralPath $psqlCmd.Source)) {
        return $psqlCmd.Source
    }

    return $null
}

function Invoke-DownloadWithRetry {
    param(
        [string]$Url,
        [string]$DestinationPath,
        [string]$Description,
        [int]$MaxRetries = 3
    )
    
    return Invoke-WithRetry -ScriptBlock {
        Write-Host "[INFO] Downloading $Description..." -ForegroundColor Yellow
        Write-Host "[INFO] This may take a few minutes depending on your internet speed..." -ForegroundColor Cyan
        Write-Log "Downloading $Description from $Url"
        
        # Get file size from server for progress calculation
        $totalBytes = 0
        try {
            $webRequest = [System.Net.WebRequest]::Create($Url)
            $webRequest.Method = "HEAD"
            $webRequest.Timeout = 10000
            $response = $webRequest.GetResponse()
            $totalBytes = $response.ContentLength
            $response.Close()
        } catch {
            Write-Host "[INFO] Could not determine file size, showing download progress..." -ForegroundColor Yellow
        }
        
        $lastPercent = -1
        $lastUpdateTime = Get-Date
        
        # Start download in background job to monitor progress
        $downloadJob = Start-Job -ScriptBlock {
            param($url, $dest)
            $wc = New-Object System.Net.WebClient
            try {
                $wc.DownloadFile($url, $dest)
            } catch {
                throw $_
            } finally {
                $wc.Dispose()
            }
        } -ArgumentList $Url, $DestinationPath
        
        # Monitor progress while downloading
        while ($downloadJob.State -eq "Running") {
            Start-Sleep -Milliseconds 500
            
            # Check file size if it exists
            if (Test-Path $DestinationPath) {
                $downloadedBytes = (Get-Item $DestinationPath -ErrorAction SilentlyContinue).Length
                $now = Get-Date
                $timeSinceLastUpdate = ($now - $lastUpdateTime).TotalSeconds
                
                if ($totalBytes -gt 0 -and $downloadedBytes -gt 0) {
                    $percent = [math]::Min([math]::Floor(($downloadedBytes / $totalBytes) * 100), 99)
                    
                    if (($percent -ne $lastPercent -and $percent % 2 -eq 0) -or $timeSinceLastUpdate -ge 0.5) {
                        $lastPercent = $percent
                        $lastUpdateTime = $now
                        $downloadedMB = [math]::Round($downloadedBytes / 1MB, 2)
                        $totalMB = [math]::Round($totalBytes / 1MB, 2)
                        $status = "($downloadedMB MB / $totalMB MB)"
                        Show-ProgressBar -Percent $percent -Status $status
                    }
                } else {
                    # If we don't know total size, just show downloaded amount
                    if ($timeSinceLastUpdate -ge 0.5) {
                        $lastUpdateTime = $now
                        $downloadedMB = [math]::Round($downloadedBytes / 1MB, 2)
                        Write-Host "`r[INFO] Downloading... $downloadedMB MB downloaded" -NoNewline -ForegroundColor Cyan
                    }
                }
            }
        }
        
        # Wait for job to complete and check for errors
        $jobResult = Wait-Job $downloadJob
        $jobError = Receive-Job $downloadJob
        Remove-Job $downloadJob -Force
        
        # Check if download had errors
        if ($jobResult.State -eq "Failed" -or $jobError) {
            if (Test-Path $DestinationPath) {
                Remove-Item $DestinationPath -ErrorAction SilentlyContinue
            }
            throw "Download failed: $jobError"
        }
        
        if (-not (Test-Path $DestinationPath)) {
            throw "Downloaded file not found at: $DestinationPath"
        }
        
        $fileSize = (Get-Item $DestinationPath).Length
        if ($fileSize -eq 0) {
            throw "Downloaded file is empty"
        }
        
        # Clear progress line and show completion
        Write-Host "`r" -NoNewline
        Write-Host (" " * 100) -NoNewline
        Write-Host "`r" -NoNewline
        
        if ($totalBytes -gt 0) {
            $totalMB = [math]::Round($totalBytes / 1MB, 2)
            Write-Host "[OK] Download completed: 100% ($totalMB MB)" -ForegroundColor Green
        } else {
            $totalMB = [math]::Round($fileSize / 1MB, 2)
            Write-Host "[OK] Download completed: $totalMB MB" -ForegroundColor Green
        }
        
        if (-not (Test-Path $DestinationPath)) {
            throw "Downloaded file not found at: $DestinationPath"
        }
        
        $fileSize = (Get-Item $DestinationPath).Length
        if ($fileSize -eq 0) {
            throw "Downloaded file is empty"
        }
        
        Write-Log "$Description downloaded successfully ($([math]::Round($fileSize / 1MB, 2)) MB)"
    } -OperationName "Download $Description" -MaxRetries $MaxRetries -InitialDelay 3 -ExponentialBackoff $true -MaxDelay 15 -RetryableErrors @("timeout", "network", "connection", "download")
}

# Pre-installation validation checks
Write-Host "[INFO] Running pre-installation validation checks..." -ForegroundColor Yellow
Test-Paths
Test-DiskSpace
Write-Host ""

# ============================================================
#  STEP 2: Install Python, Node.js, pip, npm
# ============================================================
Set-LmsConsolePhase -Percent 15 -Status "Setting up the environment..."

if (-not $SkipPythonNode) {
    # Check if Python is already installed
    $pythonInstalled = $false
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Python already installed: $pythonVersion"
            Write-Host "[INFO] Python already installed: $pythonVersion" -ForegroundColor Yellow
            $pythonInstalled = $true
        }
    } catch {
        # Python not found
    }
    
    # Check if Node.js is already installed
    $nodeInstalled = $false
    try {
        $nodeVersion = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Node.js already installed: $nodeVersion"
            Write-Host "[INFO] Node.js already installed: $nodeVersion" -ForegroundColor Yellow
            $nodeInstalled = $true
        }
    } catch {
        # Node.js not found
    }
    
    # Auto-install if missing (NO PROMPT)
    $pythonInstallationAttempted = $false
    $nodeInstallationAttempted = $false
    
    if (-not $pythonInstalled) {
        Write-Host "[INFO] Python not found - installing..." -ForegroundColor Yellow
        Test-InternetConnectivity
        
        try {
            # Download Python installer
            $pythonInstallerUrl = "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-amd64.exe"
            $pythonInstallerPath = Join-Path $env:TEMP "python-$PythonVersion-installer.exe"
            
            Invoke-DownloadWithRetry -Url $pythonInstallerUrl -DestinationPath $pythonInstallerPath -Description "Python $PythonVersion installer" -MaxRetries 3
            
            Write-Host "[INFO] Installing Python $PythonVersion (this may take a few minutes)..." -ForegroundColor Yellow
            Write-Log "Installing Python $PythonVersion"
            
            # Install Python silently with add to PATH
            $installArgs = @(
                "/quiet",
                "InstallAllUsers=1",
                "PrependPath=1",
                "Include_test=0",
                "Include_doc=0"
            )
            
            $process = Start-Process -FilePath $pythonInstallerPath -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0) {
                Write-Host "[OK] Python $PythonVersion installed successfully" -ForegroundColor Green
                Write-Log "Python installation completed successfully"
                
                # Refresh PATH environment variable
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
                
                # Verify installation
                Start-Sleep -Seconds 3
                $pythonCheck = python --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Python verified: $pythonCheck" -ForegroundColor Green
                    $pythonInstalled = $true
                } else {
                    Write-Host "[WARNING] Python installed but not yet in PATH. Restart may be required." -ForegroundColor Yellow
                }
            } else {
                throw "Python installer exited with code: $($process.ExitCode)"
            }
            
            # Clean up installer
            if (Test-Path $pythonInstallerPath) {
                Remove-Item $pythonInstallerPath -Force -ErrorAction SilentlyContinue
            }
            
            $pythonInstallationAttempted = $true
        } catch {
            Write-Log "ERROR: Python installation failed - $_" "ERROR"
            Write-Host "[ERROR] Failed to install Python: $_" -ForegroundColor Red
            Write-Host "[ERROR] Please install Python $PythonVersion manually from https://www.python.org/" -ForegroundColor Red
            $pythonInstallationAttempted = $true
        }
    }
    
    if (-not $nodeInstalled) {
        Write-Host "[INFO] Node.js not found - installing..." -ForegroundColor Yellow
        Test-InternetConnectivity
        
        try {
            # Download Node.js installer
            $nodeInstallerUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-x64.msi"
            $nodeInstallerPath = Join-Path $env:TEMP "node-$NodeVersion-installer.msi"
            
            Invoke-DownloadWithRetry -Url $nodeInstallerUrl -DestinationPath $nodeInstallerPath -Description "Node.js $NodeVersion installer" -MaxRetries 3
            
            Write-Host "[INFO] Installing Node.js $NodeVersion (this may take a few minutes)..." -ForegroundColor Yellow
            Write-Log "Installing Node.js $NodeVersion"
            
            # Install Node.js silently
            $installArgs = @(
                "/i",
                "`"$nodeInstallerPath`"",
                "/quiet",
                "/norestart",
                "ADDLOCAL=ALL"
            )
            
            $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0) {
                Write-Host "[OK] Node.js $NodeVersion installed successfully" -ForegroundColor Green
                Write-Log "Node.js installation completed successfully"
                
                # Refresh PATH environment variable
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
                
                # Verify installation
                Start-Sleep -Seconds 3
                $nodeCheck = node --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Node.js verified: $nodeCheck" -ForegroundColor Green
                    $nodeInstalled = $true
                } else {
                    Write-Host "[WARNING] Node.js installed but not yet in PATH. Restart may be required." -ForegroundColor Yellow
                }
            } else {
                throw "Node.js installer exited with code: $($process.ExitCode)"
            }
            
            # Clean up installer
            if (Test-Path $nodeInstallerPath) {
                Remove-Item $nodeInstallerPath -Force -ErrorAction SilentlyContinue
            }
            
            $nodeInstallationAttempted = $true
        } catch {
            Write-Log "ERROR: Node.js installation failed - $_" "ERROR"
            Write-Host "[ERROR] Failed to install Node.js: $_" -ForegroundColor Red
            Write-Host "[ERROR] Please install Node.js $NodeVersion manually from https://nodejs.org/" -ForegroundColor Red
            $nodeInstallationAttempted = $true
        }
    }
    
    if ($pythonInstalled -and $nodeInstalled) {
        Write-Host "[OK] Python and Node.js are already installed" -ForegroundColor Green
    }
} else {
    Write-Log "INFO: Python/Node installation skipped by user"
    Write-Host "[INFO] Skipping Python and Node.js installation" -ForegroundColor Yellow
    $pythonInstallationAttempted = $false
    $nodeInstallationAttempted = $false
}
Write-Host ""

# ============================================================
#  STEP 3: Verify Python Installation
# ============================================================
Set-LmsConsolePhase -Percent 28 -Status "Verifying the environment..."

# Skip verification if Python installation was attempted but not actually performed
if ($pythonInstallationAttempted) {
    Write-Host "[INFO] Python installation was attempted but not actually performed" -ForegroundColor Yellow
    Write-Host "[INFO] Skipping Python verification - please install Python $PythonVersion manually" -ForegroundColor Yellow
    Write-Host "[INFO] After installing Python, re-run this script or use -SkipPythonNode if already installed" -ForegroundColor Yellow
    Write-Log "INFO: Python verification skipped - installation was stubbed"
    Write-Host ""
} else {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Python not found in PATH"
        }
        
        # Test Python import
        python -c "import sys" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Python is installed but not accessible"
        }
        
        Write-Log "Python verification passed: $pythonVersion"
        Write-Host "[OK] Python installation verified: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Log "ERROR: Python verification failed - $_" "ERROR"
        Write-Host "[ERROR] Python is not found in PATH" -ForegroundColor Red
        Write-Host "[ERROR] Please install Python $PythonVersion and ensure it's added to PATH" -ForegroundColor Red
        Write-Host "[ERROR] After installing Python, you may need to:" -ForegroundColor Red
        Write-Host "[ERROR]   1. Restart this PowerShell window" -ForegroundColor Red
        Write-Host "[ERROR]   2. Or restart your computer" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}
Write-Host ""

# ============================================================
#  STEP 4: Create and Activate Virtual Environment
# ============================================================
Set-LmsConsolePhase -Percent 38 -Status "Creating the Python environment..."

$venvPythonExe = Join-Path $VenvDir "Scripts\python.exe"

# Broken .venv folder (exists but no python.exe): delete and recreate
if ((Test-Path $VenvDir) -and -not (Test-Path $venvPythonExe)) {
    Write-Host "[WARNING] .venv exists but Scripts\python.exe is missing - removing and recreating..." -ForegroundColor Yellow
    Write-Log "Removing incomplete virtual environment at $VenvDir"
    Remove-Item -Path $VenvDir -Recurse -Force -ErrorAction Stop
}

$venvExists = (Test-Path $VenvDir) -and (Test-Path $venvPythonExe)

if ($venvExists) {
    Write-Host "[INFO] Virtual environment already exists at: $VenvDir" -ForegroundColor Yellow
    $Script:pythonExe = $venvPythonExe
    Write-Log "Using existing virtual environment"
} else {
    Write-Host "[INFO] Virtual environment not found - creating..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[INFO] Creating virtual environment..." -ForegroundColor Yellow
    
    # Ensure Python is available before creating venv
    $pythonAvailable = $false
    try {
        $pythonCheck = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonAvailable = $true
        }
    } catch {
        # Python not available
    }
    
    if (-not $pythonAvailable) {
        Write-Host "[ERROR] Python is not available. Cannot create virtual environment." -ForegroundColor Red
        Write-Host "[ERROR] Please ensure Python is installed and in PATH" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    try {
        if (-not (Test-Path $VenvDir)) {
            Write-Log "Creating virtual environment at $VenvDir"
            
            # Retry logic for venv creation
            $maxRetries = 3
            $retryCount = 0
            $venvCreated = $false
            
            while ($retryCount -lt $maxRetries -and -not $venvCreated) {
                $retryCount++
                if ($retryCount -gt 1) {
                    Write-Host "[INFO] Retrying virtual environment creation (attempt $retryCount/$maxRetries)..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 2
                }
                
                python -m venv $VenvDir
                if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $VenvDir "Scripts\python.exe"))) {
                    $venvCreated = $true
                    Write-Host "[OK] Virtual environment created" -ForegroundColor Green
                }
            }
            
            if (-not $venvCreated) {
                throw "Failed to create virtual environment after $maxRetries attempts"
            }
        } else {
            Write-Log "Virtual environment already exists at $VenvDir"
            Write-Host "[INFO] Virtual environment already exists" -ForegroundColor Yellow
        }
        
        # Verify venv was created successfully
        $Script:pythonExe = $venvPythonExe
        $pipExe = Join-Path $VenvDir "Scripts\pip.exe"
        
        if (-not (Test-Path $Script:pythonExe)) {
            throw "Virtual environment verification failed - python.exe not found"
        }
        if (-not (Test-Path $pipExe)) {
            throw "Virtual environment verification failed - pip.exe not found"
        }
        
        Write-Log "Virtual environment verified"
        Write-Host "[OK] Virtual environment verified" -ForegroundColor Green
    } catch {
        Write-Log "ERROR: Virtual environment setup failed - $_" "ERROR"
        Write-Host "[ERROR] Virtual environment setup failed" -ForegroundColor Red
        Write-Host "[ERROR] Cannot continue without virtual environment" -ForegroundColor Red
        Write-Host "[ERROR] Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}
Write-Host ""

# ============================================================
#  STEP 5: Install Requirements
# ============================================================
Set-LmsConsolePhase -Percent 50 -Status "Installing application dependencies..."

if ($null -eq $Script:pythonExe -or -not (Test-Path $Script:pythonExe)) {
    Write-Host "[ERROR] Virtual environment Python not found. Cannot install requirements." -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "[INFO] Installing Python packages (always runs pip install -r requirements.txt)..." -ForegroundColor Yellow
try {
    $requirementsFile = Join-Path $BackendDir "requirements.txt"
    if (-not (Test-Path $requirementsFile)) {
        throw "requirements.txt not found at $requirementsFile"
    }

    Write-Log "Installing Python packages from requirements.txt"
    & $Script:pythonExe -m pip install --upgrade pip >> $script:LmsConsoleTechnicalLog 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARNING] pip upgrade returned exit code $LASTEXITCODE; continuing..." -ForegroundColor Yellow
    }

    & $Script:pythonExe -m pip install -r $requirementsFile >> $script:LmsConsoleTechnicalLog 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "pip install -r requirements.txt failed with exit code $LASTEXITCODE"
    }

    & $Script:pythonExe -c 'import uvicorn, httpx, psutil' >> $script:LmsConsoleTechnicalLog 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Backend preflight import failed (uvicorn, httpx, psutil)"
    }

    Write-Host "[OK] Python requirements installed and verified" -ForegroundColor Green
} catch {
    Write-Log "ERROR: Python requirements installation failed - $_" "ERROR"
    Write-Host "[ERROR] Python requirements installation failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual fix:" -ForegroundColor Yellow
    Write-Host ('  cd "' + $BackendDir + '"') -ForegroundColor Cyan
    Write-Host '  .\.venv\Scripts\python.exe -m pip install -r requirements.txt' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

$packageJson = Join-Path $FrontendDir "package.json"
if (Test-Path $packageJson) {
    Write-Host "[INFO] Installing Node.js packages (always runs npm install)..." -ForegroundColor Yellow
    $nodeAvailable = $false
    try {
        $null = node --version 2>&1
        if ($LASTEXITCODE -eq 0) { $nodeAvailable = $true }
    } catch { }

    if (-not $nodeAvailable) {
        Write-Host "[ERROR] Node.js is not available. Cannot run npm install." -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }

    Push-Location $FrontendDir
    try {
        Write-Log "Running npm install in lutron_frontend"
        $windowTitle = "Lutron LMS Installation"
        try {
            npm.cmd install
        } finally {
            $Host.UI.RawUI.WindowTitle = $windowTitle
        }
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        Write-Host "[OK] Node.js packages installed" -ForegroundColor Green
    } catch {
        Write-Log "ERROR: npm install failed - $_" "ERROR"
        Write-Host "[ERROR] npm install failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual fix:" -ForegroundColor Yellow
        Write-Host ('  cd "' + $FrontendDir + '"') -ForegroundColor Cyan
        Write-Host '  npm install' -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Log "WARNING: package.json not found at $packageJson" "WARNING"
    Write-Host "[WARNING] package.json not found - skipping npm install" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
#  STEP 6: Check Backend and Frontend Folders
# ============================================================
Set-LmsConsolePhase -Percent 58 -Status "Validating application folders..."

if (-not (Test-Path $BackendDir)) {
    Write-Log "ERROR: Backend folder not found at: $BackendDir" "ERROR"
    Write-Host "[ERROR] Backend folder not found at: $BackendDir" -ForegroundColor Red
    Write-Host "[WARNING] Continuing with installation despite error..." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Backend folder found: $BackendDir" -ForegroundColor Green
}

if (-not (Test-Path $FrontendDir)) {
    Write-Log "ERROR: Frontend folder not found at: $FrontendDir" "ERROR"
    Write-Host "[ERROR] Frontend folder not found at: $FrontendDir" -ForegroundColor Red
    Write-Host "[WARNING] Continuing with installation despite error..." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Frontend folder found: $FrontendDir" -ForegroundColor Green
}

Write-Log "Folder structure validated"
Write-Host ""

# ============================================================
#  STEP 6.5: Load Database Credentials from input.json (REQUIRED)
# ============================================================
Set-LmsConsolePhase -Percent 64 -Status "Preparing database configuration..."

# Initialize database variables
$Script:DBUsername = $null
$Script:DBPassword = $null
$Script:DBHost = $null
$Script:DBPort = $null
$Script:DBName = $null

# Check if input.json exists
if (-not (Test-Path $InputJson)) {
    Write-Log "ERROR: input.json file not found at: $InputJson" "ERROR"
    Write-Host "[ERROR] input.json file not found at: $InputJson" -ForegroundColor Red
    Write-Host "[ERROR] Please create input.json with required configuration" -ForegroundColor Red
    Write-Host "[ERROR] Cannot continue without input.json" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Read database credentials from JSON
try {
    $jsonContent = Get-Content $InputJson -Raw -Encoding UTF8
    $jsonData = $jsonContent | ConvertFrom-Json
    
    $dbConfig = $jsonData.database
    if ($null -eq $dbConfig) {
        throw "Database configuration not found in input.json"
    }
    
    $Script:DBUsername = if ($dbConfig.username) { $dbConfig.username } else { "postgres" }
    $Script:DBPassword = $dbConfig.password
    $Script:DBHost = if ($dbConfig.host) { $dbConfig.host } else { "localhost" }
    $Script:DBPort = if ($dbConfig.port) { $dbConfig.port } else { 5432 }
    $Script:DBName = if ($dbConfig.db_name) { $dbConfig.db_name } else { "lutron" }
    
    # Set local variables for easier access (ensure password is available)
    $DBUsername = $Script:DBUsername
    $DBPassword = $Script:DBPassword
    $DBHost = $Script:DBHost
    $DBPort = $Script:DBPort
    $DBName = $Script:DBName
    
    # Validate required fields
    if ([string]::IsNullOrWhiteSpace($Script:DBPassword)) {
        Write-Log "ERROR: Database password is missing in input.json" "ERROR"
        Write-Host "[ERROR] Database password is missing in input.json" -ForegroundColor Red
        Write-Host "[ERROR] Please fill input.json with database password" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    # Validate input
    if ($Script:DBPassword.Length -lt 4) {
        Write-Log "ERROR: Database password must be at least 4 characters" "ERROR"
        Write-Host "[ERROR] Database password must be at least 4 characters" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    if ($Script:DBPort -lt 1 -or $Script:DBPort -gt 65535) {
        Write-Log "ERROR: Database port must be between 1 and 65535" "ERROR"
        Write-Host "[ERROR] Database port must be between 1 and 65535" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    Write-Log "Database credentials loaded from input.json"
    Write-Host "[OK] Database credentials loaded from input.json" -ForegroundColor Green
    Write-Host "[INFO] Username: $DBUsername" -ForegroundColor Cyan
    Write-Host "[INFO] Host: $DBHost" -ForegroundColor Cyan
    Write-Host "[INFO] Port: $DBPort" -ForegroundColor Cyan
    Write-Host "[INFO] Database: $DBName" -ForegroundColor Cyan
    Write-Host "[INFO] Password: ***" -ForegroundColor Cyan
} catch {
    Write-Log "ERROR: Failed to read input.json - $_" "ERROR"
    Write-Host "[ERROR] Failed to read input.json" -ForegroundColor Red
    Write-Host "[ERROR] Please ensure input.json is valid JSON format" -ForegroundColor Red
    Write-Host "[ERROR] Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host ""

# ============================================================
#  STEP 7: PostgreSQL Installation + Database Setup + Table Initialization
# ============================================================
Set-LmsConsolePhase -Percent 70 -Status "Configuring the database..."

# Check if PostgreSQL is already installed AND functional
$postgresInstalled = $false
$psqlPath = Resolve-PsqlExecutable -PreferredVersion $Script:PostgresVersion
$commonPaths = @(
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
)

# First, find psql.exe (kept for compatibility; Resolve-PsqlExecutable is authoritative)
if (-not $psqlPath) {
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            break
        }
    }
}

if (-not $psqlPath) {
    # Try to find in PATH
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) {
        $psqlPath = $psqlCmd.Source
    }
}

# If psql.exe found, verify PostgreSQL is actually functional
if ($psqlPath) {
    Write-Host "[INFO] Found psql.exe at: $psqlPath" -ForegroundColor Yellow
    Write-Host "[INFO] Verifying PostgreSQL installation..." -ForegroundColor Yellow
    
    # Check 1: Verify PostgreSQL service exists
    $pgServiceName = $null
    $services = Get-Service | Where-Object { $_.Name -like "*postgresql*" } -ErrorAction SilentlyContinue
    if ($services) {
        $pgServiceName = $services[0].Name
        Write-Host "[INFO] Found PostgreSQL service: $pgServiceName" -ForegroundColor Yellow
        
        # Check 2: Verify service is running
        $service = Get-Service -Name $pgServiceName -ErrorAction SilentlyContinue
        if ($service) {
            if ($service.Status -eq "Running") {
                Write-Host "[INFO] PostgreSQL service is running" -ForegroundColor Yellow
                
                # Check 3: Try to connect to PostgreSQL (verify it's functional)
                try {
                    # Try connecting to postgres database (using password from input.json)
                    $env:PGPASSWORD = $Script:DBPassword
                    $testConnection = & $psqlPath -U postgres -h localhost -d postgres -c "SELECT 1;" 2>&1
                    $env:PGPASSWORD = $null
                    
                    # If connection succeeds or fails with authentication (meaning server is responding), consider it functional
                    if ($LASTEXITCODE -eq 0 -or ($testConnection -notmatch "could not connect" -and $testConnection -notmatch "Connection refused")) {
                        $postgresInstalled = $true
                        Write-Host "[OK] PostgreSQL is installed and functional" -ForegroundColor Green
                        Write-Log "INFO: PostgreSQL verified as installed and functional"
                    } else {
                        Write-Host "[WARNING] PostgreSQL service found but connection test suggests it's not fully functional" -ForegroundColor Yellow
                        Write-Host "[INFO] PostgreSQL may need to be reinstalled or configured" -ForegroundColor Yellow
                        Write-Log "WARNING: PostgreSQL found but connection test failed"
                    }
                } catch {
                    Write-Host "[WARNING] Could not verify PostgreSQL connection: $_" -ForegroundColor Yellow
                    Write-Host "[INFO] PostgreSQL may need to be reinstalled or configured" -ForegroundColor Yellow
                    Write-Log "WARNING: PostgreSQL found but connection verification failed"
                } finally {
                    $env:PGPASSWORD = $null
                }
            } else {
                Write-Host "[WARNING] PostgreSQL service exists but is not running (Status: $($service.Status))" -ForegroundColor Yellow
                Write-Host "[INFO] Attempting to start service..." -ForegroundColor Yellow
                
                try {
                    Invoke-WithRetry -ScriptBlock {
                        Start-Service -Name $pgServiceName -ErrorAction Stop
                        Start-Sleep -Seconds 5
                        $service.Refresh()
                        if ($service.Status -ne "Running") {
                            throw "Service started but status is $($service.Status)"
                        }
                    } -OperationName "Start PostgreSQL service" -MaxRetries 3 -InitialDelay 3
                    
                    Write-Host "[OK] PostgreSQL service started successfully" -ForegroundColor Green
                    
                    # Try connection test after starting
                    try {
                        $env:PGPASSWORD = $Script:DBPassword
                        $testConnection = & $psqlPath -U postgres -h localhost -d postgres -c "SELECT 1;" 2>&1
                        $env:PGPASSWORD = $null
                        if ($LASTEXITCODE -eq 0 -or ($testConnection -notmatch "could not connect" -and $testConnection -notmatch "Connection refused")) {
                            $postgresInstalled = $true
                            Write-Host "[OK] PostgreSQL is installed and functional" -ForegroundColor Green
                            Write-Log "INFO: PostgreSQL verified as installed and functional"
                        } else {
                            Write-Host "[WARNING] Service started but connection test failed" -ForegroundColor Yellow
                        }
                    } catch {
                        Write-Host "[WARNING] Service started but connection test failed" -ForegroundColor Yellow
                    } finally {
                        $env:PGPASSWORD = $null
                    }
                } catch {
                    Write-Host "[WARNING] Could not start PostgreSQL service: $_" -ForegroundColor Yellow
                    Write-Host "[INFO] PostgreSQL installation may be incomplete" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "[WARNING] PostgreSQL service found but could not query status" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] psql.exe found but no PostgreSQL service detected" -ForegroundColor Yellow
        Write-Host "[INFO] PostgreSQL installation may be incomplete" -ForegroundColor Yellow
        Write-Log "WARNING: psql.exe found but no PostgreSQL service"
    }
}

if ($postgresInstalled) {
    Write-Host "[INFO] PostgreSQL is already installed and functional" -ForegroundColor Yellow
    Write-Host "[INFO] Found psql at: $psqlPath" -ForegroundColor Yellow
    Write-Host "[INFO] Skipping PostgreSQL installation" -ForegroundColor Yellow
    Write-Log "INFO: PostgreSQL already installed and verified"
} elseif (-not $SkipPostgres) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  INSTALL COMPONENT?" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Component: PostgreSQL $PostgresVersion"
    Write-Host ""
    $installPostgres = Read-Host "Do you want to install PostgreSQL $PostgresVersion? (Y/N) [Default: Y]"
    
    # Handle default value (empty input = Y)
    if ([string]::IsNullOrWhiteSpace($installPostgres)) {
        $installPostgres = "Y"
    }
    
    if ($installPostgres -eq "N" -or $installPostgres -eq "n") {
        Write-Host "[INFO] Installation of PostgreSQL skipped by user" -ForegroundColor Yellow
        Write-Log "INFO: PostgreSQL installation skipped by user"
    } else {
        Write-Host "[INFO] Proceeding with installation of PostgreSQL..." -ForegroundColor Yellow
        
        try {
            # Download PostgreSQL installer
            # Note: PostgreSQL installer URL may need to be updated based on actual download location
            $postgresInstallerUrl = "https://get.enterprisedb.com/postgresql/postgresql-$PostgresVersion-1-windows-x64.exe"
            $postgresInstallerPath = Join-Path $env:TEMP "postgresql-$PostgresVersion-installer.exe"
            
            Test-InternetConnectivity
            
            Invoke-DownloadWithRetry -Url $postgresInstallerUrl -DestinationPath $postgresInstallerPath -Description "PostgreSQL $PostgresVersion installer" -MaxRetries 3
            
            Write-Host "[INFO] Installing PostgreSQL $PostgresVersion (this may take several minutes)..." -ForegroundColor Yellow
            Write-Host "[INFO] Using password from input.json for PostgreSQL superuser" -ForegroundColor Yellow
            Write-Host "[INFO] This may take 5-10 minutes. Please wait..." -ForegroundColor Yellow
            Write-Log "Installing PostgreSQL $PostgresVersion"
            
            # Install PostgreSQL silently using password from input.json
            $installArgs = @(
                "--mode", "unattended",
                "--unattendedmodeui", "none",
                "--disable-components", "stackbuilder",
                "--superaccount", "postgres",
                "--superpassword", "`"$Script:DBPassword`"",
                "--servicename", "postgresql-x64-$PostgresVersion",
                "--servicepassword", "`"$Script:DBPassword`"",
                "--serverport", "$Script:DBPort"
            )
            
            # Start the installer process with a timeout mechanism
            Write-Host "[INFO] Starting PostgreSQL installer..." -ForegroundColor Yellow
            $process = Start-Process -FilePath $postgresInstallerPath -ArgumentList $installArgs -PassThru -WindowStyle Hidden
            
            if (-not $process) {
                throw "Failed to start PostgreSQL installer process"
            }
            
            Write-Host "[INFO] Installer process started (PID: $($process.Id)). Waiting for completion..." -ForegroundColor Yellow
            Write-Log "PostgreSQL installer process started with PID: $($process.Id)"
            
            # Wait for process with timeout (15 minutes max) with animated progress
            $timeout = 900  # 15 minutes in seconds
            $elapsed = 0
            $checkInterval = 2  # Check every 2 seconds for smoother animation
            $spinnerIndex = 0
            $lastProgressUpdate = 0
            
            # Estimate: PostgreSQL installation typically takes 5-8 minutes
            $estimatedDuration = 420  # 7 minutes in seconds
            
            Write-Host "[INFO] Installation in progress..." -ForegroundColor Yellow
            
            while (-not $process.HasExited -and $elapsed -lt $timeout) {
                Start-Sleep -Seconds $checkInterval
                $elapsed += $checkInterval
                
                # Update spinner every check interval
                $spinnerIndex++
                
                # Calculate estimated progress (cap at 95% until actually done)
                $estimatedProgress = [math]::Min([math]::Floor(($elapsed / $estimatedDuration) * 100), 95)
                $minutes = [math]::Floor($elapsed / 60)
                $seconds = $elapsed % 60
                $status = "Elapsed: $minutes min $seconds sec"
                
                # Show progress with spinner every 2 seconds
                Show-SpinnerProgress -Percent $estimatedProgress -Status $status -SpinnerIndex $spinnerIndex
                
                # Also show detailed status every 15 seconds
                if ($elapsed - $lastProgressUpdate -ge 15) {
                    $lastProgressUpdate = $elapsed
                    Write-Host ""  # New line for detailed status
                    Write-Host "[INFO] Installation is proceeding normally. Please wait..." -ForegroundColor Yellow
                }
            }
            
            # Clear the progress line
            Write-Host "`r" -NoNewline
            Write-Host (" " * 100) -NoNewline
            Write-Host "`r" -NoNewline
            
            # Check if process is still running (timeout)
            $exitCode = -1
            if (-not $process.HasExited) {
                Write-Host "[WARNING] PostgreSQL installer is taking longer than expected..." -ForegroundColor Yellow
                Write-Host "[INFO] Waiting additional 2 minutes..." -ForegroundColor Yellow
                $process.WaitForExit(120000)  # Wait 2 more minutes
            }
            
            # Get exit code
            if ($process.HasExited) {
                $exitCode = $process.ExitCode
                Write-Host "[INFO] Installer process completed with exit code: $exitCode" -ForegroundColor Yellow
            } else {
                Write-Host "[ERROR] PostgreSQL installer timed out or is still running" -ForegroundColor Red
                Write-Host "[INFO] Attempting to check if installation completed..." -ForegroundColor Yellow
                
                # Check if PostgreSQL was installed despite timeout
                $psqlPath = Resolve-PsqlExecutable -PreferredVersion $PostgresVersion
                if ($psqlPath) {
                    Write-Host "[OK] PostgreSQL appears to be installed (found psql.exe)" -ForegroundColor Green
                    $exitCode = 0
                } else {
                    throw "PostgreSQL installer timed out and installation not verified"
                }
            }
            
            if ($exitCode -eq 0) {
                Write-Host "[OK] PostgreSQL $PostgresVersion installed successfully" -ForegroundColor Green
                Write-Log "PostgreSQL installation completed successfully"
                
                # Wait for service to start
                Write-Host "[INFO] Waiting for PostgreSQL service to initialize..." -ForegroundColor Yellow
                Start-Sleep -Seconds 10
                
                # EDB installs under major folder (e.g. ...\17\) even when product is 17.5
                $psqlPath = Resolve-PsqlExecutable -PreferredVersion $PostgresVersion
                if ($psqlPath) {
                    Write-Host "[OK] PostgreSQL verified at: $psqlPath" -ForegroundColor Green
                    $postgresInstalled = $true
                } else {
                    Write-Host "[WARNING] PostgreSQL installed but psql.exe not found at expected location" -ForegroundColor Yellow
                    $psqlPath = $null
                }
            } else {
                throw "PostgreSQL installer exited with code: $exitCode"
            }
            
            # Clean up installer
            if (Test-Path $postgresInstallerPath) {
                Remove-Item $postgresInstallerPath -Force -ErrorAction SilentlyContinue
            }
            
            Write-Log "PostgreSQL installation completed"
        } catch {
            Write-Log "ERROR: PostgreSQL installation failed - $_" "ERROR"
            Write-Host "[ERROR] Failed to install PostgreSQL: $_" -ForegroundColor Red
            Write-Host "[ERROR] Please install PostgreSQL $PostgresVersion manually from https://www.postgresql.org/download/" -ForegroundColor Red
            Write-Host "[WARNING] Continuing with database setup assuming PostgreSQL is installed..." -ForegroundColor Yellow
        }
    }
} else {
    Write-Log "INFO: PostgreSQL installation skipped by user"
    Write-Host "[INFO] Skipping PostgreSQL installation" -ForegroundColor Yellow
}

# After PostgreSQL installation, immediately perform database setup and table initialization
# Update .env file first (using credentials from STEP 6.5)
$envFile = Join-Path $BackendDir "environment.env"
$databaseUrl = "postgresql://${DBUsername}:${DBPassword}@${DBHost}:${DBPort}/${DBName}"

# Check if .env file exists and if it needs updating
$envNeedsUpdate = $true
if (Test-Path $envFile) {
    $existingContent = Get-Content $envFile -Raw
    if ($existingContent -match 'DATABASE_HOST_URL="([^"]+)"') {
        $existingUrl = $matches[1]
        if ($existingUrl -eq $databaseUrl) {
            $envNeedsUpdate = $false
            Write-Host "[INFO] environment.env already exists with correct configuration" -ForegroundColor Yellow
            Write-Host "[INFO] Skipping environment file update" -ForegroundColor Yellow
            Write-Log "INFO: environment.env already configured correctly"
        }
    }
}

if ($envNeedsUpdate) {
    # Only ask if different from input.json
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  UPDATE ENVIRONMENT FILE?" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Current configuration in environment.env is different from input.json"
    Write-Host "Do you want to update environment.env file?"
    Write-Host "   1. Yes, update environment.env"
    Write-Host "   2. No, keep existing environment.env"
    Write-Host ""
    $updateEnv = Read-Host "Choose an option (1/2) [Default: 1]"
    
    if ([string]::IsNullOrWhiteSpace($updateEnv)) {
        $updateEnv = "1"
    }
    
    if ($updateEnv -eq "2") {
        Write-Host "[INFO] Environment file update skipped by user" -ForegroundColor Yellow
        Write-Log "INFO: Environment file update skipped by user"
    } else {
        Write-Host "[INFO] Updating environment.env file..." -ForegroundColor Yellow
        
        # Read existing content to preserve format
        $content = if (Test-Path $envFile) {
            # Read with utf-8-sig to handle BOM if present, then convert to string
            $reader = New-Object System.IO.StreamReader($envFile, [System.Text.Encoding]::UTF8)
            $existingContent = $reader.ReadToEnd()
            $reader.Close()
            $existingContent
        } else {
            ""
        }
        
        # Update or add DATABASE_HOST_URL line
        if ($content -match 'DATABASE_HOST_URL\s*=') {
            $content = $content -replace 'DATABASE_HOST_URL\s*=.*', "DATABASE_HOST_URL=`"$databaseUrl`""
        } else {
            if ($content -and -not $content.EndsWith("`n") -and -not $content.EndsWith("`r`n")) {
                $content += "`r`n"
            }
            $content += "DATABASE_HOST_URL=`"$databaseUrl`""
        }
        
        # Write without BOM (UTF-8 without BOM) with retry
        Invoke-WithRetry -ScriptBlock {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($envFile, $content, $utf8NoBom)
        } -OperationName "Write environment.env file" -MaxRetries 3 -InitialDelay 1
        
        Write-Host "[OK] environment.env file updated" -ForegroundColor Green
        Write-Log "environment.env file updated"
    }
} else {
    # File doesn't exist, create it automatically
    if (-not (Test-Path $envFile)) {
        Write-Host "[INFO] Creating environment.env file..." -ForegroundColor Yellow
        
        # Create content without BOM (UTF-8 without BOM) with retry
        $content = "DATABASE_HOST_URL=`"$databaseUrl`""
        Invoke-WithRetry -ScriptBlock {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($envFile, $content, $utf8NoBom)
        } -OperationName "Create environment.env file" -MaxRetries 3 -InitialDelay 1
        
        Write-Host "[OK] environment.env file created" -ForegroundColor Green
        Write-Log "environment.env file created"
    }
}
Write-Host ""

# LMS-001: API refuses to start without JWT_SECRET (must not be the leaked default).
if (Test-Path $envFile) {
    $jwtEnv = Get-Content $envFile -Raw
    $needsJwtSecret = ($jwtEnv -notmatch '(?m)^\s*JWT_SECRET\s*=') -or ($jwtEnv -match '(?m)^\s*JWT_SECRET\s*=\s*"?super-secret-key"?\s*$')
    if ($needsJwtSecret) {
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $jwtBytes = New-Object byte[] 48
        $rng.GetBytes($jwtBytes)
        $jwtSecret = [Convert]::ToBase64String($jwtBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
        if ($jwtEnv -match '(?m)^\s*JWT_SECRET\s*=') {
            $jwtEnv = $jwtEnv -replace '(?m)^\s*JWT_SECRET\s*=.*', "JWT_SECRET=`"$jwtSecret`""
        } else {
            if (-not $jwtEnv.EndsWith("`n") -and -not $jwtEnv.EndsWith("`r`n")) {
                $jwtEnv += "`r`n"
            }
            $jwtEnv += "JWT_SECRET=`"$jwtSecret`"`r`n"
        }
        Invoke-WithRetry -ScriptBlock {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($envFile, $jwtEnv, $utf8NoBom)
        } -OperationName "Write JWT_SECRET to environment.env" -MaxRetries 3 -InitialDelay 1
        Write-Host "[OK] JWT_SECRET written to environment.env" -ForegroundColor Green
        Write-Log "JWT_SECRET written to environment.env"
    }
}

# LMS-002: API refuses to start without SMTP_FERNET_KEY (must not be the leaked key).
# Fernet requires url-safe base64 of 32 bytes with padding. Do not strip '='.
if (Test-Path $envFile) {
    $fernetEnv = Get-Content $envFile -Raw
    $leakedFernet = 'D_5uU3ImkAl7O58-Lb1v4jU2Pf8Aq5PYs9Lx6Nj66tU='
    $leakedFernetPattern = '(?m)^\s*SMTP_FERNET_KEY\s*=\s*"?' + [regex]::Escape($leakedFernet) + '"?\s*$'
    $needsFernetKey = ($fernetEnv -notmatch '(?m)^\s*SMTP_FERNET_KEY\s*=') -or ($fernetEnv -match $leakedFernetPattern)
    if ($needsFernetKey) {
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $fernetBytes = New-Object byte[] 32
        $rng.GetBytes($fernetBytes)
        $fernetKey = [Convert]::ToBase64String($fernetBytes).Replace('+','-').Replace('/','_')
        if ($fernetEnv -match '(?m)^\s*SMTP_FERNET_KEY\s*=') {
            $fernetEnv = $fernetEnv -replace '(?m)^\s*SMTP_FERNET_KEY\s*=.*', "SMTP_FERNET_KEY=`"$fernetKey`""
        } else {
            if (-not $fernetEnv.EndsWith("`n") -and -not $fernetEnv.EndsWith("`r`n")) {
                $fernetEnv += "`r`n"
            }
            $fernetEnv += "SMTP_FERNET_KEY=`"$fernetKey`"`r`n"
        }
        Invoke-WithRetry -ScriptBlock {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($envFile, $fernetEnv, $utf8NoBom)
        } -OperationName "Write SMTP_FERNET_KEY to environment.env" -MaxRetries 3 -InitialDelay 1
        Write-Host "[OK] SMTP_FERNET_KEY written to environment.env" -ForegroundColor Green
        Write-Log "SMTP_FERNET_KEY written to environment.env"
    }
}

# LMS-003: monitoring ingest refuses to start without a site-specific token.
if (Test-Path $envFile) {
    $ingestEnv = Get-Content $envFile -Raw
    $leakedIngestToken = 'f2-test-ingest-secret'
    $leakedIngestPattern = '(?m)^\s*MONITORING_INGEST_TOKEN\s*=\s*"?' + [regex]::Escape($leakedIngestToken) + '"?\s*$'
    $needsIngestToken = ($ingestEnv -notmatch '(?m)^\s*MONITORING_INGEST_TOKEN\s*=') -or ($ingestEnv -match $leakedIngestPattern)
    if ($needsIngestToken) {
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $ingestBytes = New-Object byte[] 32
        $rng.GetBytes($ingestBytes)
        $ingestToken = [Convert]::ToBase64String($ingestBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
        if ($ingestEnv -match '(?m)^\s*MONITORING_INGEST_TOKEN\s*=') {
            $ingestEnv = $ingestEnv -replace '(?m)^\s*MONITORING_INGEST_TOKEN\s*=.*', "MONITORING_INGEST_TOKEN=`"$ingestToken`""
        } else {
            if (-not $ingestEnv.EndsWith("`n") -and -not $ingestEnv.EndsWith("`r`n")) {
                $ingestEnv += "`r`n"
            }
            $ingestEnv += "MONITORING_INGEST_TOKEN=`"$ingestToken`"`r`n"
        }
        Invoke-WithRetry -ScriptBlock {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($envFile, $ingestEnv, $utf8NoBom)
        } -OperationName "Write MONITORING_INGEST_TOKEN to environment.env" -MaxRetries 3 -InitialDelay 1
        Write-Host "[OK] MONITORING_INGEST_TOKEN written to environment.env" -ForegroundColor Green
        Write-Log "MONITORING_INGEST_TOKEN written to environment.env"
    }
}

# LMS-007: CORS allowlist for the SPA (:3000). Do not overwrite a non-empty valid list.
if (Test-Path $envFile) {
    $corsEnv = Get-Content $envFile -Raw
    $corsValue = $null
    if ($corsEnv -match '(?m)^\s*CORS_ALLOWED_ORIGINS\s*=\s*"?([^"\r\n]*)"?\s*$') {
        $corsValue = $matches[1].Trim()
    }
    $needsCors = [string]::IsNullOrWhiteSpace($corsValue) -or ($corsValue -eq '*')
    if ($needsCors) {
        $corsOrigins = [System.Collections.Generic.List[string]]::new()
        [void]$corsOrigins.Add('http://localhost:3000')
        [void]$corsOrigins.Add('http://127.0.0.1:3000')

        $corsLanIp = $null
        try {
            if (Test-Path $InputJson) {
                $corsInput = (Get-Content $InputJson -Raw) | ConvertFrom-Json
                if ($null -ne $corsInput.hosting) {
                    $hostingBlock = $corsInput.hosting
                    $lanEnabled = $false
                    if ($null -ne $hostingBlock.ip_configuration) {
                        $lanEnabled = [bool]$hostingBlock.ip_configuration
                    }
                    if ($lanEnabled -and $hostingBlock.PSObject.Properties.Name -contains 'ip' -and -not [string]::IsNullOrWhiteSpace($hostingBlock.ip)) {
                        $corsLanIp = $hostingBlock.ip.Trim()
                    }
                }
            }
        } catch {
            Write-Host "[WARNING] Could not read hosting.ip for CORS_ALLOWED_ORIGINS: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        if (-not [string]::IsNullOrWhiteSpace($corsLanIp)) {
            [void]$corsOrigins.Add(("http://{0}:3000" -f $corsLanIp))
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
        Invoke-WithRetry -ScriptBlock {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($envFile, $corsEnv, $utf8NoBom)
        } -OperationName "Write CORS_ALLOWED_ORIGINS to environment.env" -MaxRetries 3 -InitialDelay 1
        Write-Host "[OK] CORS_ALLOWED_ORIGINS written to environment.env" -ForegroundColor Green
        Write-Log "CORS_ALLOWED_ORIGINS written to environment.env: $corsLine"
    } else {
        Write-Host "[INFO] CORS_ALLOWED_ORIGINS already set; leaving existing value" -ForegroundColor Yellow
    }
}

# LMS-008: disable Swagger/ReDoc/OpenAPI in production. Do not overwrite an explicit value.
if (Test-Path $envFile) {
    $docsEnv = Get-Content $envFile -Raw
    $hasDocsFlag = $docsEnv -match '(?m)^\s*ENABLE_API_DOCS\s*='
    if (-not $hasDocsFlag) {
        if (-not $docsEnv.EndsWith("`n") -and -not $docsEnv.EndsWith("`r`n")) {
            $docsEnv += "`r`n"
        }
        $docsEnv += "ENABLE_API_DOCS=false`r`n"
        Invoke-WithRetry -ScriptBlock {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($envFile, $docsEnv, $utf8NoBom)
        } -OperationName "Write ENABLE_API_DOCS to environment.env" -MaxRetries 3 -InitialDelay 1
        Write-Host "[OK] ENABLE_API_DOCS=false written to environment.env" -ForegroundColor Green
        Write-Log "ENABLE_API_DOCS=false written to environment.env"
    } else {
        Write-Host "[INFO] ENABLE_API_DOCS already set; leaving existing value" -ForegroundColor Yellow
    }
}

# Setup database (check exists, create if needed)
# First check if database already exists
$dbAlreadyExists = $false
# Re-resolve before any psql call (stale ...\17.5\ path must not be used).
if (-not $psqlPath -or -not (Test-Path -LiteralPath $psqlPath)) {
    $psqlPath = Resolve-PsqlExecutable -PreferredVersion $Script:PostgresVersion
}
if ($null -ne $psqlPath) {
    try {
        $env:PGPASSWORD = $Script:DBPassword
        $dbCheck = & $psqlPath -U $Script:DBUsername -h $Script:DBHost -p $Script:DBPort -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname = '$Script:DBName';" 2>&1
        $exitCode = $LASTEXITCODE
        $env:PGPASSWORD = $null
        
        if ($exitCode -eq 0 -and $null -ne $dbCheck -and -not [string]::IsNullOrWhiteSpace($dbCheck) -and $dbCheck.Trim() -eq "1") {
            $dbAlreadyExists = $true
            Write-Host "[INFO] Database '$Script:DBName' already exists" -ForegroundColor Yellow
            Write-Host "[INFO] Skipping database setup" -ForegroundColor Yellow
            Write-Log "INFO: Database already exists, skipping setup"
        }
    } catch {
        # Error checking, will proceed to setup
    }
}

if (-not $dbAlreadyExists) {
    # Auto-create if missing (AUTOMATED - NO PROMPT)
    Write-Host "[INFO] Database '$DBName' not found - creating..." -ForegroundColor Yellow
    try {
        # Always re-resolve: installer may leave a stale/non-existent ...\17.5\ path.
        if (-not $psqlPath -or -not (Test-Path -LiteralPath $psqlPath)) {
            $psqlPath = Resolve-PsqlExecutable -PreferredVersion $Script:PostgresVersion
        }

        if (-not $psqlPath) {
            throw "psql not found. Please ensure PostgreSQL is installed and in PATH."
        }
        
        Write-Host "[OK] Found psql at: $psqlPath" -ForegroundColor Green
        
        # Find PostgreSQL service dynamically
        $pgServiceName = $null
        $services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }
        if ($services) {
            $pgServiceName = $services[0].Name
            Write-Host "[INFO] Found PostgreSQL service: $pgServiceName" -ForegroundColor Yellow
            
            # Check if service is running
            $service = Get-Service -Name $pgServiceName -ErrorAction SilentlyContinue
            if ($service.Status -ne "Running") {
                Write-Host "[INFO] PostgreSQL service is not running - attempting to start..." -ForegroundColor Yellow
                Invoke-WithRetry -ScriptBlock {
                    Start-Service -Name $pgServiceName -ErrorAction Stop
                    $service.WaitForStatus("Running", (New-TimeSpan -Seconds 30))
                    if ($service.Status -ne "Running") {
                        throw "Service did not start - status is $($service.Status)"
                    }
                } -OperationName "Start PostgreSQL service for database setup" -MaxRetries 3 -InitialDelay 3
                Write-Host "[OK] PostgreSQL service started successfully" -ForegroundColor Green
                Start-Sleep -Seconds 3
            } else {
                Write-Host "[OK] PostgreSQL service is already running" -ForegroundColor Green
            }
        } else {
            Write-Host "[WARNING] PostgreSQL service not found - assuming it's running" -ForegroundColor Yellow
        }
        
        # Test connection with retry logic (exponential backoff)
        Write-Host "[INFO] Testing database connection..." -ForegroundColor Yellow
        $connectionSuccess = $false
        $retryDelay = 2
        for ($i = 1; $i -le 10; $i++) {
            $env:PGPASSWORD = $Script:DBPassword
            $result = & $psqlPath -U $Script:DBUsername -h $Script:DBHost -p $Script:DBPort -d postgres -c "SELECT version();" 2>&1
            $exitCode = $LASTEXITCODE
            $env:PGPASSWORD = $null
            
            if ($exitCode -eq 0) {
                $connectionSuccess = $true
                break
            }
            
            if ($i -lt 10) {
                Write-Host "[INFO] Connection attempt $i/10 failed, retrying in $retryDelay seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds $retryDelay
                $retryDelay = [Math]::Min($retryDelay + 1, 10)
            }
        }
        
        if (-not $connectionSuccess) {
            Write-Host "[ERROR] Database connection failed after 10 attempts" -ForegroundColor Red
            Write-Host ""
            Write-Host "[TROUBLESHOOTING]" -ForegroundColor Yellow
            if ($pgServiceName) {
                Write-Host "1. Check PostgreSQL service is running: net start `"$pgServiceName`"" -ForegroundColor Yellow
            } else {
                Write-Host "1. Check PostgreSQL service is running: net start postgresql-x64-17" -ForegroundColor Yellow
            }
            Write-Host "2. Verify password matches PostgreSQL installation password" -ForegroundColor Yellow
            Write-Host "3. Check firewall allows connections on port $DBPort" -ForegroundColor Yellow
            Write-Host "4. Verify credentials in input.json:" -ForegroundColor Yellow
            Write-Host "   - Username: $DBUsername" -ForegroundColor Yellow
            Write-Host "   - Host: $DBHost" -ForegroundColor Yellow
            Write-Host "   - Port: $DBPort" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
        
        Write-Host "[OK] Database connection successful" -ForegroundColor Green
        
        # Check if database exists
        $env:PGPASSWORD = $Script:DBPassword
        $dbCheck = & $psqlPath -U $Script:DBUsername -h $Script:DBHost -p $Script:DBPort -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname = '$Script:DBName';" 2>&1
        $exitCode = $LASTEXITCODE
        $env:PGPASSWORD = $null
        
        if ($exitCode -ne 0) {
            throw "Failed to check if database exists (exit code: $exitCode)"
        }
        
        # Handle null or empty dbCheck safely
        $dbExists = $false
        if ($null -ne $dbCheck -and -not [string]::IsNullOrWhiteSpace($dbCheck)) {
            $dbExists = ($dbCheck.Trim() -eq "1")
        }
        
        if (-not $dbExists) {
            Write-Host "[INFO] Creating database '$Script:DBName'..." -ForegroundColor Yellow
            $env:PGPASSWORD = $Script:DBPassword
            $createOutput = & $psqlPath -U $Script:DBUsername -h $Script:DBHost -p $Script:DBPort -d postgres -c "CREATE DATABASE `"$Script:DBName`";" 2>&1
            $createExitCode = $LASTEXITCODE
            $env:PGPASSWORD = $null
            
            if ($createExitCode -ne 0) {
                Write-Host "[ERROR] Database creation failed. psql output: $createOutput" -ForegroundColor Red
                throw "Failed to create database (exit code: $createExitCode)"
            }
            
            Write-Host "[OK] Database '$Script:DBName' created successfully" -ForegroundColor Green
            Start-Sleep -Seconds 2
            Write-Log "Database created successfully"
        } else {
            Write-Host "[INFO] Database '$Script:DBName' already exists" -ForegroundColor Yellow
            Write-Log "Database already exists"
        }
    } catch {
            Write-Log "ERROR: Database creation failed - $_" "ERROR"
            Write-Host "[ERROR] Database creation failed" -ForegroundColor Red
            Write-Host "[ERROR] Cannot continue without database" -ForegroundColor Red
            Write-Host "[ERROR] Error: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
}
Write-Host ""

# Initialize database tables (MANDATORY - must be done before superadmin creation)
# Check if tables already exist
$tablesExist = $false
if ($null -ne $psqlPath -and $null -ne $Script:pythonExe) {
    try {
        $env:PGPASSWORD = $Script:DBPassword
        $tableCheck = & $psqlPath -U $Script:DBUsername -h $Script:DBHost -p $Script:DBPort -d $Script:DBName -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';" 2>&1
        $env:PGPASSWORD = $null
        
        if ($LASTEXITCODE -eq 0 -and $tableCheck.Trim() -eq "1") {
            $tablesExist = $true
            Write-Host "[INFO] Database tables already exist" -ForegroundColor Yellow
            Write-Host "[INFO] Skipping table initialization" -ForegroundColor Yellow
            Write-Log "INFO: Database tables already exist, skipping initialization"
        }
    } catch {
        # Error checking, will proceed to initialization
    }
}

if (-not $tablesExist) {
    # Auto-initialize if missing (AUTOMATED - NO PROMPT)
    Write-Host "[INFO] Database tables not found - initializing..." -ForegroundColor Yellow
        try {
        Test-FilePermissions
        
        # Verify required Python packages are installed
        Write-Host "[INFO] Verifying required Python packages..." -ForegroundColor Yellow
        $packageCheck = & $Script:pythonExe -c "import sqlalchemy, psycopg2, passlib.context" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Python package check output:" -ForegroundColor Red
            Write-LmsTechnicalLog -Object $packageCheck
            throw "Required Python packages are missing. Please ensure requirements.txt is installed correctly."
        }
        Write-Host "[OK] All required Python packages verified" -ForegroundColor Green
        
        # Initialize tables using Python
        Write-Host "[INFO] Running table initialization..." -ForegroundColor Yellow
        Write-Host "[INFO] Backend directory: $BackendDir" -ForegroundColor Cyan
        Write-Host "[INFO] Environment file: $envFile" -ForegroundColor Cyan
        
        $initScript = @"
import os
import sys
import traceback

# Flush output immediately
sys.stdout.flush()
sys.stderr.flush()

# Set backend directory
backend_dir = r'$BackendDir'
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

# Ensure environment file is loaded if using python-dotenv
env_file = r'$envFile'
if os.path.exists(env_file):
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print(f'Loaded environment from: {env_file}')
        sys.stdout.flush()
    except ImportError:
        print('Warning: python-dotenv not available, assuming environment is set')
        sys.stdout.flush()
    except Exception as e:
        print(f'Warning: Could not load .env file: {e}')
        sys.stdout.flush()

try:
    print('Importing database session...')
    sys.stdout.flush()
    from app.database.session import Base, engine
    print('Importing models...')
    sys.stdout.flush()
    from app.models import *
    print('Creating database tables...')
    sys.stdout.flush()
    Base.metadata.create_all(bind=engine)
    print('Tables created successfully')
    sys.stdout.flush()
except Exception as e:
    print('=' * 60, file=sys.stderr)
    print('ERROR: Table initialization failed', file=sys.stderr)
    print('=' * 60, file=sys.stderr)
    print(f'Error type: {type(e).__name__}', file=sys.stderr)
    print(f'Error message: {str(e)}', file=sys.stderr)
    print('', file=sys.stderr)
    print('Full traceback:', file=sys.stderr)
    print('-' * 60, file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    print('-' * 60, file=sys.stderr)
    sys.stderr.flush()
    sys.exit(1)
"@
        
        # Capture full output including errors
        Write-Host "[INFO] Executing Python initialization script..." -ForegroundColor Cyan
        
        # Execute Python script with retry logic
        $pythonOutput = $null
        $exitCode = -1
        try {
            $scriptOutput = Invoke-WithRetry -ScriptBlock {
                $output = $initScript | & $Script:pythonExe 2>&1 | Out-String
                $code = $LASTEXITCODE
                if ($code -ne 0) {
                    throw "Python script exited with code: $code. Output: $output"
                }
                return $output
            } -OperationName "Initialize database tables" -MaxRetries 3 -InitialDelay 5 -RetryableErrors @("connection", "timeout", "database", "network")
            
            $pythonOutput = $scriptOutput
            $exitCode = 0
        } catch {
            # If retry failed, try one more time to get output for error reporting
            try {
                $pythonOutput = $initScript | & $Script:pythonExe 2>&1 | Out-String
                $exitCode = $LASTEXITCODE
            } catch {
                $pythonOutput = "Failed to execute Python script: $_"
                $exitCode = 1
            }
            throw
        }
        
        # Display output immediately (before checking exit code)
        if ($pythonOutput) {
            Write-Host ""
            Write-Host "Python script output:" -ForegroundColor Cyan
            Write-LmsTechnicalLog -Object $pythonOutput
            Write-Log "Table initialization output: $pythonOutput"
        } else {
            Write-Host "[WARNING] No output from Python script" -ForegroundColor Yellow
        }
        
        if ($exitCode -ne 0) {
            Write-Host ""
            Write-Host "============================================" -ForegroundColor Red
            Write-Host "  TABLE INITIALIZATION FAILED" -ForegroundColor Red
            Write-Host "============================================" -ForegroundColor Red
            Write-Host "[ERROR] Exit code: $exitCode" -ForegroundColor Red
            if ($pythonOutput) {
                Write-Host ""
                Write-Host "[ERROR] Full error output:" -ForegroundColor Red
                Write-LmsTechnicalLog -Object $pythonOutput
            } else {
                Write-Host "[ERROR] No error output captured. Check Python installation and database connection." -ForegroundColor Red
            }
            Write-Log "ERROR: Table initialization failed - Exit code: $exitCode, Output: $pythonOutput" "ERROR"
            throw "Table initialization failed. Exit code: $exitCode"
        }
            
            Write-Log "Database tables initialized successfully"
            Write-Host "[OK] Database tables initialized successfully" -ForegroundColor Green
        } catch {
            Write-Log "ERROR: Table initialization failed - $_" "ERROR"
            Write-Host "[ERROR] Table initialization failed" -ForegroundColor Red
            Write-Host "[ERROR] Cannot continue without database tables" -ForegroundColor Red
            Write-Host "[ERROR] The installer will now exit" -ForegroundColor Red
            Write-Host "[ERROR] Error: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
} else {
    Write-Host "[OK] Database tables already exist" -ForegroundColor Green
}
Write-Host ""

# ============================================================
#  STEP 8: Load Superadmin Configuration and Create Superadmin
# ============================================================
Set-LmsConsolePhase -Percent 80 -Status "Configuring the administrator account..."

# Initialize variables
$Script:AdminUsername = $null
$Script:AdminEmail = $null
$Script:AdminPassword = $null

# Check if input.json exists
if (-not (Test-Path $InputJson)) {
    Write-Log "ERROR: input.json file not found at: $InputJson" "ERROR"
    Write-Host "[ERROR] input.json file not found at: $InputJson" -ForegroundColor Red
    Write-Host "[ERROR] Please create input.json with required configuration" -ForegroundColor Red
    Write-Host "[ERROR] Cannot continue without input.json" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Read superadmin configuration from JSON
try {
    $jsonContent = Get-Content $InputJson -Raw -Encoding UTF8
    $jsonData = $jsonContent | ConvertFrom-Json
    
    $adminConfig = $jsonData.superadmin
    if ($null -ne $adminConfig) {
        $Script:AdminUsername = $adminConfig.username
        $Script:AdminEmail = $adminConfig.email
        $Script:AdminPassword = $adminConfig.password
    }
    
    Write-Log "Superadmin configuration loaded from input.json"
} catch {
    Write-Log "ERROR: Failed to read input.json - $_" "ERROR"
    Write-Host "[ERROR] Failed to read input.json" -ForegroundColor Red
    Write-Host "[ERROR] Please ensure input.json is valid JSON format" -ForegroundColor Red
    Write-Host "[ERROR] Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if superadmin email already exists (AUTOMATED CHECK)
Write-Host "[INFO] Checking if superadmin email already exists in database..." -ForegroundColor Yellow

$emailExists = $false
if ($null -ne $psqlPath -and $null -ne $Script:AdminEmail) {
    try {
        $env:PGPASSWORD = $Script:DBPassword
        # First, check if users table exists and has email column
        $emailCheck = & $psqlPath -U $Script:DBUsername -h $Script:DBHost -p $Script:DBPort -d $Script:DBName -t -A -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email';" 2>&1
        if ($LASTEXITCODE -eq 0 -and $null -ne $emailCheck -and -not [string]::IsNullOrWhiteSpace($emailCheck) -and $emailCheck.Trim() -eq "1") {
            $emailExistsCheck = & $psqlPath -U $Script:DBUsername -h $Script:DBHost -p $Script:DBPort -d $Script:DBName -t -A -c "SELECT COUNT(*) FROM users WHERE email = '$AdminEmail';" 2>&1
            if ($LASTEXITCODE -eq 0 -and $null -ne $emailExistsCheck -and -not [string]::IsNullOrWhiteSpace($emailExistsCheck) -and $emailExistsCheck.Trim() -eq "1") {
                $emailExists = $true
            }
        }
    } catch {
        # Error checking, will proceed to ask user
    } finally {
        $env:PGPASSWORD = $null
    }
}

if ($emailExists) {
    Write-Host "[INFO] Superadmin user with email '$AdminEmail' already exists" -ForegroundColor Yellow
    Write-Host "[INFO] Skipping superadmin creation" -ForegroundColor Yellow
    Write-Log "INFO: Superadmin user already exists, skipping creation"
} else {
    # Only ask if email doesn't exist
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  CREATE SUPERADMIN USER?" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Superadmin user with email '$AdminEmail' does not exist in database."
    Write-Host "Do you want to create superadmin user?"
    Write-Host "   1. Yes, create superadmin user"
    Write-Host "   2. No, skip superadmin creation"
    Write-Host ""
    $createSuperadmin = Read-Host "Choose an option (1/2) [Default: 1]"
    
    if ([string]::IsNullOrWhiteSpace($createSuperadmin)) {
        $createSuperadmin = "1"
    }
    
    if ($createSuperadmin -eq "2") {
        Write-Host "[INFO] Superadmin creation skipped by user" -ForegroundColor Yellow
        Write-Log "INFO: Superadmin creation skipped by user"
    } else {
        # Validate superadmin fields if user wants to create
        if ([string]::IsNullOrWhiteSpace($AdminUsername)) {
            Write-Log "ERROR: Superadmin username is missing in input.json" "ERROR"
            Write-Host "[ERROR] Superadmin username is missing in input.json" -ForegroundColor Red
            Write-Host "[ERROR] Please fill input.json with superadmin username" -ForegroundColor Red
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
        
        if ([string]::IsNullOrWhiteSpace($AdminEmail)) {
            Write-Log "ERROR: Superadmin email is missing in input.json" "ERROR"
            Write-Host "[ERROR] Superadmin email is missing in input.json" -ForegroundColor Red
            Write-Host "[ERROR] Please fill input.json with superadmin email" -ForegroundColor Red
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
        
        if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
            Write-Log "ERROR: Superadmin password is missing in input.json" "ERROR"
            Write-Host "[ERROR] Superadmin password is missing in input.json" -ForegroundColor Red
            Write-Host "[ERROR] Please fill input.json with superadmin password" -ForegroundColor Red
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
        
        # Validate email format
        if ($AdminEmail -notmatch '^[^@]+@[^@]+\.[^@]+$') {
            Write-Log "ERROR: Superadmin email format is invalid" "ERROR"
            Write-Host "[ERROR] Superadmin email format is invalid" -ForegroundColor Red
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
        
        # Create superadmin (tables already initialized in STEP 7)
        Write-Host ""
        Write-Host "[INFO] Creating superadmin user..." -ForegroundColor Yellow
        Write-Host "[INFO] Checking if email already exists..." -ForegroundColor Yellow
        
        try {
            # Create temporary Python script file
            $tempScriptPath = Join-Path $env:TEMP "create_superadmin_$(Get-Date -Format 'yyyyMMddHHmmss').py"
        
            $createSuperadminScript = @"
from passlib.context import CryptContext
import psycopg2
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash(sys.argv[3])

try:
    conn = psycopg2.connect(host="$($Script:DBHost)", database="$($Script:DBName)", user="$($Script:DBUsername)", password="$($Script:DBPassword)", port=$($Script:DBPort))
    cursor = conn.cursor()
    
    # Query actual column names from users table
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position")
    columns = [row[0] for row in cursor.fetchall()]
    
    # Map to expected column names
    username_col = next((c for c in columns if c.lower() in ['username', 'name', 'user_name', 'full_name']), None)
    email_col = next((c for c in columns if c.lower() == 'email'), None)
    password_col = next((c for c in columns if c.lower() in ['password_hash', 'password', 'passwordhash', 'hashed_password']), None)
    role_col = next((c for c in columns if c.lower() == 'role'), None)
    change_password_col = next((c for c in columns if c.lower() in ['change_password', 'change_password_required', 'must_change_password']), None)
    is_active_col = next((c for c in columns if c.lower() in ['is_active', 'active', 'enabled']), None)
    
    if not all([username_col, email_col, password_col, role_col]):
        print(f"ERROR: Missing required columns. Found: {columns}")
        sys.exit(1)
    
    # Check if user already exists by email
    cursor.execute(f"SELECT {email_col} FROM users WHERE {email_col} = %s", (sys.argv[2],))
    existing_user = cursor.fetchone()
    if existing_user:
        print(f"INFO: User with email {sys.argv[2]} already exists - Skipping creation")
        cursor.close()
        conn.close()
        sys.exit(0)
    
    # Build INSERT statement
    insert_cols = [username_col, email_col, password_col, role_col]
    insert_vals = [sys.argv[1], sys.argv[2], hashed_password, 'Superadmin']
    
    if change_password_col:
        insert_cols.append(change_password_col)
        insert_vals.append(False)
    
    if is_active_col:
        insert_cols.append(is_active_col)
        insert_vals.append(True)
    
    placeholders = ', '.join(['%s'] * len(insert_cols))
    columns_str = ', '.join(insert_cols)
    
    cursor.execute(f"INSERT INTO users ({columns_str}) VALUES ({placeholders})", tuple(insert_vals))
    conn.commit()
    print(f"SUCCESS: Superadmin user {sys.argv[1]} created successfully")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: Error creating superadmin: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
"@
            
            # Write script to temporary file
            $createSuperadminScript | Out-File -FilePath $tempScriptPath -Encoding UTF8
            
            # Execute script with retry logic
            $pythonOutput = $null
            $exitCode = -1
            try {
                $scriptOutput = Invoke-WithRetry -ScriptBlock {
                    $output = & $Script:pythonExe $tempScriptPath "$AdminUsername" "$AdminEmail" "$AdminPassword" 2>&1
                    $code = $LASTEXITCODE
                    if ($code -ne 0) {
                        throw "Python script exited with code: $code. Output: $output"
                    }
                    return $output
                } -OperationName "Create superadmin user" -MaxRetries 3 -InitialDelay 2 -RetryableErrors @("connection", "timeout", "database", "network")
                
                $pythonOutput = $scriptOutput
                $exitCode = 0
            } catch {
                # If retry failed, try one more time to get output for error reporting
                try {
                    $pythonOutput = & $Script:pythonExe $tempScriptPath "$AdminUsername" "$AdminEmail" "$AdminPassword" 2>&1
                    $exitCode = $LASTEXITCODE
                } catch {
                    $pythonOutput = "Failed to execute Python script: $_"
                    $exitCode = 1
                }
                throw
            }
            
            # Display output
            if ($pythonOutput) {
                    Write-LmsTechnicalLog -Object $pythonOutput
            }
            
            # Check exit code
            if ($exitCode -eq 0) {
                # Check if user already existed (output contains "already exists")
                if ($pythonOutput -match "already exists") {
                    Write-Log "INFO: Superadmin user already exists, skipping creation"
                    Write-Host "[INFO] Superadmin user with email '$AdminEmail' already exists - Skipping creation" -ForegroundColor Yellow
                } else {
                    Write-Log "Superadmin created successfully"
                    Write-Host "[OK] Superadmin user created successfully" -ForegroundColor Green
                }
            } else {
                Write-Log "ERROR: Superadmin creation failed with exit code: $exitCode" "ERROR"
                Write-Host "[ERROR] Superadmin creation failed" -ForegroundColor Red
                Write-Host "[ERROR] Please check database connection and try again" -ForegroundColor Red
                throw "Superadmin creation failed with exit code: $exitCode"
            }
            
            # Clean up temp file
            if (Test-Path $tempScriptPath) {
                Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Log "ERROR: Superadmin creation failed - $_" "ERROR"
            Write-Host "[ERROR] Superadmin creation failed" -ForegroundColor Red
            Write-Host "[ERROR] Please check database connection and try again" -ForegroundColor Red
            Write-Host "[ERROR] Error: $_" -ForegroundColor Red
            
            # Clean up temp file on error
            if (Test-Path $tempScriptPath) {
                Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
            }
            
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
    }
}
Write-Host ""

Write-Log "Configuration loaded and database setup completed"
Write-Host "[OK] Configuration loaded and database setup completed" -ForegroundColor Green
Write-Host ""

# ============================================================
#  STEP 11: Create Log Files
# ============================================================
Set-LmsConsolePhase -Percent 87 -Status "Creating application logs..."

try {
    $backendLogDir = Join-Path $BackendDir "logs"
    $frontendLogDir = Join-Path $FrontendDir "logs"
    
    if (-not (Test-Path $backendLogDir)) {
        New-Item -ItemType Directory -Path $backendLogDir -Force | Out-Null
    }
    
    if (-not (Test-Path $frontendLogDir)) {
        New-Item -ItemType Directory -Path $frontendLogDir -Force | Out-Null
    }
    
    $backendLogFile = Join-Path $backendLogDir "backend.log"
    $frontendLogFile = Join-Path $frontendLogDir "frontend.log"
    
    "" | Out-File $backendLogFile -Force
    "" | Out-File $frontendLogFile -Force
    
    Write-Log "Log files created"
    Write-Host "[OK] Log files created" -ForegroundColor Green
} catch {
    Write-Log "WARNING: Log file creation encountered issues - $_" "WARNING"
    Write-Host "[WARNING] Log file creation encountered issues" -ForegroundColor Yellow
}
Write-Host ""

# Cleanup
Write-Host "[INFO] Cleaning up temporary files..." -ForegroundColor Yellow
$tempFiles = @(
    "$env:TEMP\python-installer.exe",
    "$env:TEMP\node-installer.msi",
    "$env:TEMP\postgresql-installer.exe",
    "$RootDir\create_superadmin.py"
)
foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        Remove-Item $file -ErrorAction SilentlyContinue
    }
}

# ============================================================
#  STEP 12: PM2 process manager (backend + frontend)
# ============================================================
Set-LmsConsolePhase -Percent 92 -Status "Configuring application services..."

try {
    $pm2Lib = Join-Path $PSScriptRoot "LMS_pm2.ps1"
    if (-not (Test-Path $pm2Lib) -and $scriptPathForDir) {
        $pm2Lib = Join-Path (Split-Path $scriptPathForDir -Parent) "LMS_pm2.ps1"
    }
    if (-not (Test-Path $pm2Lib)) {
        throw "LMS_pm2.ps1 not found next to LMS_installation.ps1"
    }
    . $pm2Lib
    Write-Host "[INFO] Removing leftover NSSM backend service (if present) before PM2 starts..." -ForegroundColor Yellow
    Remove-LmsLegacyNssmBackendService
    Assert-LmsLegacyNssmBackendRemoved
    $null = Install-LmsPm2Stack -RootDir $Script:RootDir -BackendDir $Script:BackendDir -FrontendDir $Script:FrontendDir
    Write-Log "PM2 configured and runtime verified"
} catch {
    Write-Log "ERROR: PM2 configuration failed - $_" "ERROR"
    Write-Host "[ERROR] PM2 configuration failed: $_" -ForegroundColor Red
    Write-Host "[ERROR] Installation aborted. Fix the error and re-run the installer." -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host ""

Write-Log "Setup completed successfully"
Complete-LmsConsole -Message "Installation Complete" -Detail "Application installed successfully.`n`nDashboard:`nhttp://localhost:3000"
Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

