# ============================================================
#  Lutron LMS — PM2 process manager (install / start / stop / uninstall)
#  Manages only lutron-backend and lutron-frontend.
#  PostgreSQL remains a Windows Service. RuntimeSupervisor children
#  stay inside the backend process tree.
# ============================================================

$script:LmsPm2AppBackend = "lutron-backend"
$script:LmsPm2AppFrontend = "lutron-frontend"
$script:LmsPm2TaskName = "LutronPM2Startup"
$script:LmsPm2Home = $null
$script:LmsNodeExe = $null
$script:LmsPm2Bin = $null
$script:LmsRootDir = $null
$script:LmsBackendDir = $null
$script:LmsFrontendDir = $null
$script:LmsPm2RuntimeDir = $null
$script:LmsEcosystemPath = $null
$script:LmsResurrectCmd = $null
$script:LmsResurrectVbs = $null
$script:LmsPm2LogrotateModule = "pm2-logrotate"
# Official pm2-logrotate keys. 10 x 100M compressed archives stay near 1 GB.
$script:LmsPm2LogrotateSettings = [ordered]@{
    max_size       = "100M"
    retain         = "10"
    compress       = "true"
    rotateInterval = "0 0 * * *"
    workerInterval = "30"
    dateFormat     = "YYYY-MM-DD_HH-mm-ss"
}

function ConvertTo-LmsJsString {
    param([string]$Value)
    if ($null -eq $Value) { return "" }
    return ($Value -replace '\\', '\\' -replace '"', '\"')
}

function Get-LmsHostingForPm2 {
    param([string]$RootDir)

    $config = [PSCustomObject]@{
        BackendHostForUvicorn = "127.0.0.1"
        IsIpConfigEnabled     = $false
        ConfiguredIp          = ""
    }

    $inputJsonPath = Join-Path $RootDir "deployment_scripts\input.json"
    if (-not (Test-Path $inputJsonPath)) {
        return $config
    }

    try {
        $inputConfig = Get-Content $inputJsonPath -Raw | ConvertFrom-Json
        if ($null -eq $inputConfig.hosting) { return $config }
        $hosting = $inputConfig.hosting
        if ($null -ne $hosting.ip_configuration) {
            $config.IsIpConfigEnabled = [bool]$hosting.ip_configuration
        }
        if ($hosting.PSObject.Properties.Name -contains "ip" -and -not [string]::IsNullOrWhiteSpace($hosting.ip)) {
            $config.ConfiguredIp = $hosting.ip
        }
        if ($config.IsIpConfigEnabled) {
            $config.BackendHostForUvicorn = "0.0.0.0"
        } else {
            $config.BackendHostForUvicorn = "127.0.0.1"
        }
    } catch {
        Write-Host "[WARNING] Failed to read hosting from input.json; using 127.0.0.1" -ForegroundColor Yellow
    }
    return $config
}

function Initialize-LmsPm2Context {
    param(
        [Parameter(Mandatory = $true)][string]$RootDir,
        [string]$BackendDir,
        [string]$FrontendDir
    )

    $script:LmsRootDir = (Resolve-Path $RootDir).Path
    if ([string]::IsNullOrWhiteSpace($BackendDir)) {
        $BackendDir = Join-Path $script:LmsRootDir "lutron_backend"
        if (-not (Test-Path $BackendDir)) {
            $BackendDir = Join-Path $script:LmsRootDir "backend"
        }
    }
    if ([string]::IsNullOrWhiteSpace($FrontendDir)) {
        $FrontendDir = Join-Path $script:LmsRootDir "lutron_frontend"
        if (-not (Test-Path $FrontendDir)) {
            $FrontendDir = Join-Path $script:LmsRootDir "frontend"
        }
    }
    $script:LmsBackendDir = (Resolve-Path $BackendDir).Path
    $script:LmsFrontendDir = (Resolve-Path $FrontendDir).Path
    # Runtime artifacts live under deployment_scripts\pm2_runtime (not repo root).
    # Templates remain in deployment_scripts\pm2.
    $script:LmsPm2RuntimeDir = Join-Path $script:LmsRootDir "deployment_scripts\pm2_runtime"
    if (-not (Test-Path -LiteralPath $script:LmsPm2RuntimeDir)) {
        New-Item -ItemType Directory -Path $script:LmsPm2RuntimeDir -Force | Out-Null
    }
    $script:LmsPm2Home = Join-Path $script:LmsPm2RuntimeDir ".pm2"
    $script:LmsEcosystemPath = Join-Path $script:LmsPm2RuntimeDir "ecosystem.config.js"
    $script:LmsResurrectCmd = Join-Path $script:LmsPm2RuntimeDir "pm2-resurrect.cmd"
    $script:LmsResurrectVbs = Join-Path $script:LmsPm2RuntimeDir "pm2-resurrect.vbs"
    $env:PM2_HOME = $script:LmsPm2Home

    if (-not (Test-Path -LiteralPath $script:LmsPm2Home)) {
        New-Item -ItemType Directory -Path $script:LmsPm2Home -Force | Out-Null
    }
}

function Resolve-LmsNodeAndPm2 {
    $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        $defaultNode = Join-Path $env:ProgramFiles "nodejs\node.exe"
        if (Test-Path $defaultNode) {
            $script:LmsNodeExe = $defaultNode
        } else {
            throw "Node.js is not installed or not on PATH."
        }
    } else {
        $script:LmsNodeExe = $nodeCmd.Source
    }

    $npmRoot = $null
    $windowTitle = $Host.UI.RawUI.WindowTitle
    try {
        try { $npmRoot = (& npm.cmd root -g 2>$null | Select-Object -Last 1) } catch { }
    } finally {
        $Host.UI.RawUI.WindowTitle = $windowTitle
    }
    if ([string]::IsNullOrWhiteSpace($npmRoot)) {
        $npmRoot = Join-Path $env:APPDATA "npm\node_modules"
    }
    $pm2Bin = Join-Path $npmRoot "pm2\bin\pm2"
    if (-not (Test-Path $pm2Bin)) {
        $pm2Cmd = Get-Command pm2.cmd -ErrorAction SilentlyContinue
        if ($pm2Cmd) {
            $script:LmsPm2Bin = $pm2Cmd.Source
            return
        }
        throw "PM2 is not installed. Expected: $pm2Bin"
    }
    $script:LmsPm2Bin = $pm2Bin
}

function Invoke-LmsPm2 {
    param([Parameter(Mandatory = $true)][string[]]$Pm2Args)
    if (-not $script:LmsNodeExe -or -not $script:LmsPm2Bin) {
        Resolve-LmsNodeAndPm2
    }
    $prevEap = $ErrorActionPreference
    $prevNative = $env:__PSNativeCommandErrorActionPreference
    $ErrorActionPreference = "Continue"
    if ($null -eq $prevNative) {
        $env:__PSNativeCommandErrorActionPreference = "SilentlyContinue"
    }
    try {
        $lines = [System.Collections.Generic.List[string]]::new()
        & $script:LmsNodeExe $script:LmsPm2Bin @Pm2Args 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) {
                [void]$lines.Add($_.ToString())
            } else {
                [void]$lines.Add([string]$_)
            }
        }
        $output = ($lines -join [Environment]::NewLine)
        if (-not [string]::IsNullOrWhiteSpace($output) -and (Get-Command Write-LmsTechnicalLog -ErrorAction SilentlyContinue)) {
            Write-LmsTechnicalLog -Object $output
        }
        return @{
            ExitCode = $LASTEXITCODE
            Output   = $output
        }
    } finally {
        $ErrorActionPreference = $prevEap
        if ($null -eq $prevNative) {
            Remove-Item Env:\__PSNativeCommandErrorActionPreference -ErrorAction SilentlyContinue
        } else {
            $env:__PSNativeCommandErrorActionPreference = $prevNative
        }
    }
}

function Get-LmsPm2OwnedDaemon {
    $pidPath = Join-Path $script:LmsPm2Home "pm2.pid"
    if (-not (Test-Path -LiteralPath $pidPath)) {
        return $null
    }

    $daemonPid = 0
    [void][int]::TryParse((Get-Content -LiteralPath $pidPath -Raw -ErrorAction SilentlyContinue).Trim(), [ref]$daemonPid)
    if ($daemonPid -le 0) {
        return $null
    }

    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $daemonPid" -ErrorAction SilentlyContinue
    if ($null -eq $process -or $process.Name -notmatch '^node(\.exe)?$') {
        return $null
    }

    $homePattern = [regex]::Escape($script:LmsPm2Home)
    if ($process.CommandLine -notmatch '(?i)pm2[\\/]lib[\\/]Daemon\.js' -or
        $process.CommandLine -notmatch "(?i)$homePattern") {
        return $null
    }
    return $process
}

function Clear-LmsPm2StaleIpcState {
    if ($null -ne (Get-LmsPm2OwnedDaemon)) {
        return $false
    }

    foreach ($name in @("rpc.sock", "pub.sock")) {
        $path = Join-Path $script:LmsPm2Home $name
        if (Test-Path -LiteralPath $path) {
            Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
        }
    }
    return $true
}

function Get-LmsPm2FailureClass {
    param([string]$Output)

    if ($Output -match '(?i)EPERM|rpc\.sock|pub\.sock') {
        return "EPERM"
    }
    if ($Output -match '(?i)daemon.*not running|daemon.*not found|no daemon|not launched|ENOENT') {
        return "DaemonNotRunning"
    }
    return "Other"
}

function Test-LmsPm2Ready {
    $ping = Invoke-LmsPm2 -Pm2Args @("ping")
    if ($ping.ExitCode -ne 0 -or $ping.Output -notmatch '(?i)pong|online') {
        return @{ Ready = $false; Failure = $ping; Output = $ping.Output }
    }

    $list = Invoke-LmsPm2 -Pm2Args @("list")
    if ($list.ExitCode -ne 0) {
        return @{ Ready = $false; Failure = $list; Output = $list.Output }
    }
    return @{ Ready = $true; Failure = $null; Output = $list.Output }
}

function Ensure-LmsPm2DaemonReady {
    $readiness = Test-LmsPm2Ready
    if ($readiness.Ready) {
        return
    }

    $failureClass = Get-LmsPm2FailureClass -Output $readiness.Output
    if ($failureClass -eq "DaemonNotRunning") {
        if (-not (Clear-LmsPm2StaleIpcState)) {
            throw "PM2 daemon state is active; refusing IPC cleanup."
        }
    } elseif ($failureClass -eq "EPERM") {
        $daemon = Get-LmsPm2OwnedDaemon
        if ($null -eq $daemon) {
            throw "PM2 EPERM state could not be attributed to this PM2_HOME; refusing to kill another daemon."
        }
        Stop-Process -Id $daemon.ProcessId -Force -ErrorAction Stop
    } else {
        throw "PM2 readiness failed without a recoverable daemon or IPC-state error:`n$($readiness.Output)"
    }

    $recovered = Test-LmsPm2Ready
    if (-not $recovered.Ready) {
        throw "PM2 readiness failed after recovery:`n$($recovered.Output)"
    }
}

function Test-LmsPm2PackagePresent {
    try {
        Resolve-LmsNodeAndPm2
        $r = Invoke-LmsPm2 -Pm2Args @("-v")
        return ($r.ExitCode -eq 0)
    } catch {
        return $false
    }
}

function Install-LmsPm2PackageIfMissing {
    if (Test-LmsPm2PackagePresent) {
        Write-Host "[OK] PM2 already installed: $((Invoke-LmsPm2 -Pm2Args @('-v')).Output.Trim())" -ForegroundColor Green
        return
    }
    Write-Host "[INFO] Installing PM2 globally (npm install -g pm2)..." -ForegroundColor Yellow
    $windowTitle = $Host.UI.RawUI.WindowTitle
    try {
        & npm.cmd install -g pm2 >> $script:LmsConsoleTechnicalLog 2>&1
    } finally {
        $Host.UI.RawUI.WindowTitle = $windowTitle
    }
    if ($LASTEXITCODE -ne 0) {
        throw "npm install -g pm2 failed with exit code $LASTEXITCODE"
    }
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    Resolve-LmsNodeAndPm2
    $ver = Invoke-LmsPm2 -Pm2Args @("-v")
    if ($ver.ExitCode -ne 0) {
        throw "PM2 installed but is not runnable."
    }
    Write-Host "[OK] PM2 installed: $($ver.Output.Trim())" -ForegroundColor Green
}

function Get-LmsPm2TemplateDir {
    return (Join-Path $script:LmsRootDir "deployment_scripts\pm2")
}

function Write-LmsTemplatedFile {
    param(
        [Parameter(Mandatory = $true)][string]$TemplateName,
        [Parameter(Mandatory = $true)][string]$DestPath,
        [Parameter(Mandatory = $true)][hashtable]$Tokens
    )
    $templatePath = Join-Path (Get-LmsPm2TemplateDir) $TemplateName
    if (-not (Test-Path -LiteralPath $templatePath)) {
        throw "PM2 template missing: $templatePath"
    }
    $text = Get-Content -LiteralPath $templatePath -Raw -Encoding UTF8
    foreach ($key in $Tokens.Keys) {
        $text = $text.Replace("{{${key}}}", [string]$Tokens[$key])
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($DestPath, $text, $utf8NoBom)
}

function Write-LmsEcosystemConfig {
    Resolve-LmsNodeAndPm2

    # pythonw.exe avoids a blank console window under PM2 on Windows (python.exe opens one).
    $venvPython = Join-Path $script:LmsBackendDir ".venv\Scripts\pythonw.exe"
    if (-not (Test-Path -LiteralPath $venvPython)) {
        $venvPython = Join-Path $script:LmsBackendDir ".venv\Scripts\python.exe"
    }
    if (-not (Test-Path -LiteralPath $venvPython)) {
        throw "Virtual environment Python not found in .venv\Scripts"
    }
    $serveJs = Join-Path $script:LmsFrontendDir "node_modules\serve\build\main.js"
    if (-not (Test-Path -LiteralPath $serveJs)) {
        throw "Frontend serve binary not found: $serveJs (run npm install / npm run build first)"
    }
    $frontendBuildIndex = Join-Path $script:LmsFrontendDir "build\index.html"
    if (-not (Test-Path -LiteralPath $frontendBuildIndex)) {
        throw "Frontend production build not found: $frontendBuildIndex (run npm run build first)"
    }

    $venvPython = (Resolve-Path -LiteralPath $venvPython).Path
    $serveJs = (Resolve-Path -LiteralPath $serveJs).Path
    $nodeExe = (Resolve-Path -LiteralPath $script:LmsNodeExe).Path

    $hosting = Get-LmsHostingForPm2 -RootDir $script:LmsRootDir
    $backendArgs = "-m uvicorn app.main:app --host $($hosting.BackendHostForUvicorn) --port 8000"
    $frontendArgs = "$serveJs -s build -l 3000"

    $backendLogs = Join-Path $script:LmsBackendDir "logs"
    $frontendLogs = Join-Path $script:LmsFrontendDir "logs"
    if (-not (Test-Path $backendLogs)) { New-Item -ItemType Directory -Path $backendLogs -Force | Out-Null }
    if (-not (Test-Path $frontendLogs)) { New-Item -ItemType Directory -Path $frontendLogs -Force | Out-Null }

    Write-LmsTemplatedFile -TemplateName "ecosystem.config.js.template" -DestPath $script:LmsEcosystemPath -Tokens @{
        BACKEND_NAME    = (ConvertTo-LmsJsString $script:LmsPm2AppBackend)
        BACKEND_CWD     = (ConvertTo-LmsJsString $script:LmsBackendDir)
        BACKEND_SCRIPT  = (ConvertTo-LmsJsString $venvPython)
        BACKEND_ARGS    = (ConvertTo-LmsJsString $backendArgs)
        BACKEND_OUT     = (ConvertTo-LmsJsString (Join-Path $backendLogs "pm2-backend-out.log"))
        BACKEND_ERR     = (ConvertTo-LmsJsString (Join-Path $backendLogs "pm2-backend-error.log"))
        FRONTEND_NAME   = (ConvertTo-LmsJsString $script:LmsPm2AppFrontend)
        FRONTEND_CWD    = (ConvertTo-LmsJsString $script:LmsFrontendDir)
        FRONTEND_SCRIPT = (ConvertTo-LmsJsString $nodeExe)
        FRONTEND_ARGS   = (ConvertTo-LmsJsString $frontendArgs)
        FRONTEND_OUT    = (ConvertTo-LmsJsString (Join-Path $frontendLogs "pm2-frontend-out.log"))
        FRONTEND_ERR    = (ConvertTo-LmsJsString (Join-Path $frontendLogs "pm2-frontend-error.log"))
    }
    Write-Host "[OK] Wrote ecosystem: $($script:LmsEcosystemPath)" -ForegroundColor Green
}

function Assert-LmsEcosystemConfig {
    if (-not (Test-Path -LiteralPath $script:LmsEcosystemPath)) {
        throw "Ecosystem config not found: $($script:LmsEcosystemPath)"
    }
    $text = Get-Content -LiteralPath $script:LmsEcosystemPath -Raw -Encoding UTF8

    $backendScript = [regex]::Match($text, 'name:\s*"' + [regex]::Escape($script:LmsPm2AppBackend) + '"[\s\S]*?script:\s*"([^"]*)"').Groups[1].Value
    $frontendScript = [regex]::Match($text, 'name:\s*"' + [regex]::Escape($script:LmsPm2AppFrontend) + '"[\s\S]*?script:\s*"([^"]*)"').Groups[1].Value
    $frontendArgs = [regex]::Match($text, 'name:\s*"' + [regex]::Escape($script:LmsPm2AppFrontend) + '"[\s\S]*?args:\s*"([^"]*)"').Groups[1].Value

    if ([string]::IsNullOrWhiteSpace($backendScript)) {
        throw "Ecosystem config has empty $($script:LmsPm2AppBackend) script path"
    }
    if ([string]::IsNullOrWhiteSpace($frontendScript)) {
        throw "Ecosystem config has empty $($script:LmsPm2AppFrontend) script path"
    }
    if (-not (Test-Path -LiteralPath $backendScript)) {
        throw "Backend script not found: $backendScript"
    }
    if (-not (Test-Path -LiteralPath $frontendScript)) {
        throw "Frontend script not found: $frontendScript"
    }
    if ($frontendArgs -notmatch '\.js') {
        throw "Ecosystem config has invalid frontend args: $frontendArgs"
    }
    if ($frontendArgs -match '^([A-Za-z]:\\[^\s]+\.js)') {
        $servePath = $matches[1]
        if (-not (Test-Path -LiteralPath $servePath)) {
            throw "Frontend serve script not found: $servePath"
        }
    }
}

function Get-LmsNssmExecutable {
    $candidates = [System.Collections.Generic.List[string]]::new()
    $cmd = Get-Command nssm -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) { [void]$candidates.Add($cmd.Source) }
    if ($script:LmsBackendDir) {
        [void]$candidates.Add((Join-Path $script:LmsBackendDir "scripts\nssm.exe"))
    }
    [void]$candidates.Add("D:\Tools\nssm-2.24\win64\nssm.exe")
    [void]$candidates.Add((Join-Path $env:ProgramFiles "nssm\nssm.exe"))
    if (${env:ProgramFiles(x86)}) {
        [void]$candidates.Add((Join-Path ${env:ProgramFiles(x86)} "nssm\nssm.exe"))
    }
    foreach ($path in $candidates) {
        if ($path -and (Test-Path -LiteralPath $path)) { return $path }
    }
    return $null
}

function Get-LmsLegacyNssmBackendService {
    return Get-Service -Name "LutronLMSBackend" -ErrorAction SilentlyContinue
}

function Assert-LmsLegacyNssmBackendRemoved {
    $svc = Get-LmsLegacyNssmBackendService
    if ($svc) {
        throw "Legacy service 'LutronLMSBackend' still present (Status=$($svc.Status), StartType=$($svc.StartType)). PM2 cannot be the only supervisor until it is removed."
    }
}

# Stop, disable, and delete leftover NSSM LutronLMSBackend. No-op if absent.
# Does not touch PostgreSQL.
function Remove-LmsLegacyNssmBackendService {
    $svcName = "LutronLMSBackend"
    $svc = Get-LmsLegacyNssmBackendService
    if (-not $svc) {
        Write-Host "[OK] Legacy service '$svcName' is not installed." -ForegroundColor Green
        return
    }

    Write-Host "[INFO] Removing leftover NSSM service '$svcName' so PM2 is the only app supervisor..." -ForegroundColor Yellow

    try {
        if ($svc.Status -ne "Stopped") {
            Stop-Service -Name $svcName -Force -ErrorAction Stop
            $svc.WaitForStatus("Stopped", (New-TimeSpan -Seconds 30))
        }
    } catch {
        Write-Host "[WARNING] Stop-Service failed for '$svcName': $_" -ForegroundColor Yellow
        $nssm = Get-LmsNssmExecutable
        if ($nssm) {
            & $nssm stop $svcName confirm 2>$null
        } else {
            sc.exe stop $svcName | Out-Null
        }
        Start-Sleep -Seconds 3
        $cim = Get-CimInstance Win32_Service -Filter "Name='$svcName'" -ErrorAction SilentlyContinue
        if ($cim -and $cim.ProcessId -gt 0) {
            $null = cmd /c "taskkill /PID $($cim.ProcessId) /F /T 2>nul"
            Start-Sleep -Seconds 2
        }
    }

    try {
        Set-Service -Name $svcName -StartupType Disabled -ErrorAction Stop
        Write-Host "[OK] Disabled '$svcName'" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Could not disable '$svcName': $_" -ForegroundColor Yellow
    }

    $nssm = Get-LmsNssmExecutable
    if ($nssm) {
        Write-Host "[INFO] nssm remove $svcName ($nssm)" -ForegroundColor Yellow
        & $nssm remove $svcName confirm 2>$null
        Start-Sleep -Seconds 1
    }
    sc.exe delete $svcName | Out-Null
    Start-Sleep -Seconds 2

    $retries = 0
    while ($retries -lt 5 -and (Get-LmsLegacyNssmBackendService)) {
        sc.exe delete $svcName | Out-Null
        Start-Sleep -Seconds 1
        $retries++
    }

    Assert-LmsLegacyNssmBackendRemoved
    Write-Host "[OK] Removed legacy service '$svcName'." -ForegroundColor Green
}

function Remove-LmsLegacyAutoStartTask {
    $legacy = "LutronAutoStart"
    $task = Get-ScheduledTask -TaskName $legacy -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $legacy -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "[INFO] Removed scheduled task '$legacy'." -ForegroundColor Yellow
    }
}

function Remove-LmsOpenDashboardTask {
    $name = "LutronLMSOpenDashboard"
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "[INFO] Removed leftover scheduled task '$name'." -ForegroundColor Yellow
    }
}

function Register-LutronAutoStartTask {
    param([string]$StartScriptPath)

    if (-not $StartScriptPath) {
        $candidates = @(
            (Join-Path $PSScriptRoot "LMS_start.ps1")
        )
        if ($PSCommandPath) {
            $candidates += (Join-Path (Split-Path $PSCommandPath -Parent) "LMS_start.ps1")
        }
        foreach ($c in $candidates) {
            if ($c -and (Test-Path -LiteralPath $c)) {
                $StartScriptPath = $c
                break
            }
        }
    }
    if (-not (Test-Path -LiteralPath $StartScriptPath)) {
        throw "LMS_start.ps1 not found for LutronAutoStart: $StartScriptPath"
    }
    $StartScriptPath = (Resolve-Path -LiteralPath $StartScriptPath).Path
    $scriptsDir = Split-Path -Parent $StartScriptPath
    $vbsPath = Join-Path $scriptsDir "LMS_start.vbs"
    $taskName = "LutronAutoStart"

    Remove-LmsOpenDashboardTask
    Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue |
        ForEach-Object { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue }

    $installUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $wscriptExe = Join-Path $env:SystemRoot "System32\wscript.exe"
    if ((Test-Path -LiteralPath $vbsPath) -and (Test-Path -LiteralPath $wscriptExe)) {
        $action = New-ScheduledTaskAction -Execute $wscriptExe -Argument "//B //Nologo `"$vbsPath`"" -WorkingDirectory $scriptsDir
    } else {
        $powershellExe = (Get-Command powershell.exe).Source
        $actionArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScriptPath`" -Silent"
        $action = New-ScheduledTaskAction -Execute $powershellExe -Argument $actionArgs -WorkingDirectory $scriptsDir
    }

    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $installUser
    # Limited (not Highest): Highest + Interactive often never runs at logon (no UAC),
    # and an elevated Start-Process cannot open the user's default browser.
    $principal = New-ScheduledTaskPrincipal -UserId $installUser -LogonType Interactive -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew -Hidden
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null

    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
    if ($task.State -eq "Disabled") {
        Enable-ScheduledTask -TaskName $taskName -ErrorAction Stop | Out-Null
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
    }
    if ($task.State -eq "Disabled") {
        throw "$taskName is Disabled after registration"
    }
    if ($task.Triggers[0].CimClass.CimClassName -notmatch "Logon") {
        throw "$taskName trigger is $($task.Triggers[0].CimClass.CimClassName); expected At logon"
    }
    if ($task.Principal.RunLevel -eq "Highest") {
        throw "$taskName RunLevel is Highest; expected Limited so the browser can open"
    }
    Write-Host "[OK] Logon task '$taskName' reuses LMS_start.ps1 to open the browser after login (hidden)." -ForegroundColor Green
}

function Unregister-LmsPm2NamedApps {
    foreach ($name in @($script:LmsPm2AppBackend, $script:LmsPm2AppFrontend)) {
        $null = Invoke-LmsPm2 -Pm2Args @("delete", $name)
    }
}

function Test-LmsPm2AppsOnline {
    return (
        (Get-LmsPm2AppOnline -Name $script:LmsPm2AppBackend) -and
        (Get-LmsPm2AppOnline -Name $script:LmsPm2AppFrontend)
    )
}

function Start-LmsPm2Apps {
    Remove-LmsLegacyNssmBackendService
    Write-LmsEcosystemConfig
    Assert-LmsEcosystemConfig
    Ensure-LmsPm2DaemonReady

    $resurrect = Invoke-LmsPm2 -Pm2Args @("resurrect")
    if (-not [string]::IsNullOrWhiteSpace($resurrect.Output)) {
        Write-LmsTechnicalLog -Object $resurrect.Output
    }
    Start-Sleep -Seconds 2
    if (Test-LmsPm2AppsOnline) {
        Write-Host "[OK] PM2 resurrect restored both applications." -ForegroundColor Green
        return
    }

    Unregister-LmsPm2NamedApps
    $start = Invoke-LmsPm2 -Pm2Args @("start", $script:LmsEcosystemPath)
    if (-not [string]::IsNullOrWhiteSpace($start.Output)) {
        Write-LmsTechnicalLog -Object $start.Output
    }
    Start-Sleep -Seconds 2
    if (-not (Test-LmsPm2AppsOnline)) {
        throw "pm2 start failed:`n$($start.Output)"
    }
    Write-Host "[OK] PM2 started $($script:LmsPm2AppBackend) and $($script:LmsPm2AppFrontend)." -ForegroundColor Green
}

function Get-LmsPm2LogrotateModuleDir {
    if (-not $script:LmsPm2Home) { return $null }
    return (Join-Path $script:LmsPm2Home "modules\$($script:LmsPm2LogrotateModule)")
}

function Get-LmsPm2ModuleConfPath {
    if (-not $script:LmsPm2Home) { return $null }
    return (Join-Path $script:LmsPm2Home "module_conf.json")
}

function Test-LmsPm2LogrotateInstalled {
    $list = Invoke-LmsPm2 -Pm2Args @("prettylist")
    if ($list.Output -match [regex]::Escape($script:LmsPm2LogrotateModule)) {
        return $true
    }
    # Daemon unreachable: on-disk module still counts so uninstall can clean it.
    if ($list.Output -match "EPERM|connect |daemon") {
        $pkg = Get-LmsPm2LogrotateModuleDir
        if ($pkg -and (Test-Path (Join-Path $pkg "package.json"))) { return $true }
    }
    return $false
}

function Get-LmsPm2LogrotateConfigObject {
    $confPath = Get-LmsPm2ModuleConfPath
    if (-not $confPath -or -not (Test-Path $confPath)) { return $null }
    try {
        $raw = Get-Content -LiteralPath $confPath -Raw -ErrorAction Stop | ConvertFrom-Json
        $name = $script:LmsPm2LogrotateModule
        if ($raw.PSObject.Properties.Name -contains $name) { return $raw.$name }
    } catch { }
    return $null
}

function Install-LmsPm2LogrotateModule {
    if (-not (Test-LmsPm2PackagePresent)) {
        throw "PM2 must be installed before pm2-logrotate."
    }
    Resolve-LmsNodeAndPm2
    if (Test-LmsPm2LogrotateInstalled) {
        Write-Host "[OK] $($script:LmsPm2LogrotateModule) is already installed." -ForegroundColor Green
        return
    }
    Write-Host "[INFO] Installing $($script:LmsPm2LogrotateModule)..." -ForegroundColor Yellow
    $inst = Invoke-LmsPm2 -Pm2Args @("install", $script:LmsPm2LogrotateModule)
    Write-LmsTechnicalLog -Object $inst.Output
    $ready = $false
    for ($i = 0; $i -lt 15; $i++) {
        if (Test-LmsPm2LogrotateInstalled) { $ready = $true; break }
        Start-Sleep -Seconds 2
    }
    if (-not $ready) {
        throw "pm2 install $($script:LmsPm2LogrotateModule) did not register the module.`n$($inst.Output)"
    }
    Write-Host "[OK] $($script:LmsPm2LogrotateModule) installed." -ForegroundColor Green
}

function Repair-LmsPm2LogrotateParseBool {
    # pm2-logrotate 3.0.0 parseBool only accepts the string 'true'.
    # pmx Autocast turns pm2 set values into boolean true, so compress never enables.
    $appJs = Join-Path (Get-LmsPm2LogrotateModuleDir) "node_modules\pm2-logrotate\app.js"
    if (-not (Test-Path $appJs)) {
        Write-Host "[WARNING] pm2-logrotate app.js not found; compress repair skipped." -ForegroundColor Yellow
        return
    }
    $text = Get-Content -LiteralPath $appJs -Raw -Encoding UTF8
    if ($text -match "str === true \|\| str === 'true'") {
        Write-Host "[OK] pm2-logrotate compress boolean handling already present." -ForegroundColor Green
        return
    }
    $updated = [regex]::Replace(
        $text,
        "const parseBool = \(str, defaultVal = false\) => \{\s*if \(str === 'true'\) return true;\s*if \(str === 'false'\) return false;\s*return defaultVal;\s*\};",
        "const parseBool = (str, defaultVal = false) => {`r`n  if (str === true || str === 'true') return true;`r`n  if (str === false || str === 'false') return false;`r`n  return defaultVal;`r`n};"
    )
    if ($updated -eq $text) {
        Write-Host "[WARNING] pm2-logrotate parseBool pattern not found; compress may stay off on this version." -ForegroundColor Yellow
        return
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($appJs, $updated, $utf8NoBom)
    Write-Host "[OK] Repaired pm2-logrotate parseBool so compress=true is honored." -ForegroundColor Green
    $null = Invoke-LmsPm2 -Pm2Args @("restart", $script:LmsPm2LogrotateModule)
}

function Set-LmsPm2LogrotateConfig {
    $current = Get-LmsPm2LogrotateConfigObject
    foreach ($key in $script:LmsPm2LogrotateSettings.Keys) {
        $want = [string]$script:LmsPm2LogrotateSettings[$key]
        $have = $null
        if ($current -and $current.PSObject.Properties.Name -contains $key) {
            $have = [string]$current.$key
        }
        if ($have -and ($have.ToLowerInvariant() -eq $want.ToLowerInvariant())) {
            Write-Host "[OK] pm2-logrotate:$key already $want" -ForegroundColor Green
            continue
        }
        Write-Host "[INFO] Setting pm2-logrotate:$key = $want" -ForegroundColor Yellow
        $set = Invoke-LmsPm2 -Pm2Args @("set", "$($script:LmsPm2LogrotateModule):$key", $want)
        if ($set.ExitCode -ne 0 -and $set.Output -notmatch "successfully|Module") {
            Write-LmsTechnicalLog -Object $set.Output
        }
    }
}

function Assert-LmsPm2LogrotateConfigured {
    $current = Get-LmsPm2LogrotateConfigObject
    if (-not $current) {
        $conf = Invoke-LmsPm2 -Pm2Args @("conf", $script:LmsPm2LogrotateModule)
        throw "pm2-logrotate configuration was not found after install.`n$($conf.Output)"
    }
    $errors = New-Object System.Collections.Generic.List[string]
    foreach ($key in $script:LmsPm2LogrotateSettings.Keys) {
        $want = [string]$script:LmsPm2LogrotateSettings[$key]
        $have = $null
        if ($current.PSObject.Properties.Name -contains $key) {
            $have = [string]$current.$key
        }
        $haveNorm = if ($have) { $have.ToLowerInvariant() } else { "" }
        if ($haveNorm -ne $want.ToLowerInvariant()) {
            $errors.Add("pm2-logrotate:$key is '$have' (expected '$want')")
        }
    }
    if ($errors.Count -gt 0) {
        throw "pm2-logrotate configuration verification failed:`n - $($errors -join "`n - ")"
    }
    if (-not (Test-LmsPm2LogrotateInstalled)) {
        throw "pm2-logrotate is configured but the module is not installed."
    }
    Write-Host "[OK] pm2-logrotate configuration verified (100M x 10, compress, daily)." -ForegroundColor Green
}

function Uninstall-LmsPm2LogrotateModule {
    if (-not $script:LmsPm2Bin) { return }
    if (-not (Test-LmsPm2LogrotateInstalled)) {
        Write-Host "[OK] $($script:LmsPm2LogrotateModule) is not installed." -ForegroundColor Green
        return
    }
    Write-Host "[INFO] Removing $($script:LmsPm2LogrotateModule)..." -ForegroundColor Yellow
    $null = Invoke-LmsPm2 -Pm2Args @("uninstall", $script:LmsPm2LogrotateModule)
    $modDir = Get-LmsPm2LogrotateModuleDir
    if ($modDir -and (Test-Path $modDir)) {
        Remove-Item $modDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-LmsPm2LogrotateInstalled) {
        Write-Host "[WARNING] $($script:LmsPm2LogrotateModule) still present after uninstall." -ForegroundColor Yellow
    } else {
        Write-Host "[OK] $($script:LmsPm2LogrotateModule) removed." -ForegroundColor Green
    }
}

function Save-LmsPm2Dump {
    $r = Invoke-LmsPm2 -Pm2Args @("save")
    if ($r.ExitCode -ne 0) {
        throw "pm2 save failed:`n$($r.Output)"
    }
    Write-Host "[OK] pm2 save completed" -ForegroundColor Green
}

function Write-LmsPm2ResurrectWrapper {
    Resolve-LmsNodeAndPm2
    $nodeDir = Split-Path $script:LmsNodeExe -Parent
    $tokens = @{
        PM2_HOME = $script:LmsPm2Home
        NODE_DIR = $nodeDir
        NODE_EXE = $script:LmsNodeExe
        PM2_BIN  = $script:LmsPm2Bin
    }
    Write-LmsTemplatedFile -TemplateName "pm2-resurrect.cmd.template" -DestPath $script:LmsResurrectCmd -Tokens $tokens
    Write-LmsTemplatedFile -TemplateName "pm2-resurrect.vbs.template" -DestPath $script:LmsResurrectVbs -Tokens $tokens
}

function Register-LmsPm2Startup {
    Write-LmsPm2ResurrectWrapper

    if (-not (Test-Path $script:LmsPm2Home)) {
        New-Item -ItemType Directory -Path $script:LmsPm2Home -Force | Out-Null
    }
    try {
        # Directory ACE only — do not recurse (/T) while a PM2 daemon may hold files.
        icacls $script:LmsPm2Home /grant "SYSTEM:(OI)(CI)F" /grant "Administrators:(OI)(CI)F" | Out-Null
    } catch {
        Write-Host "[WARNING] Could not grant SYSTEM ACL on PM2 home: $_" -ForegroundColor Yellow
    }

    Write-Host "[INFO] Running pm2 startup (Windows has no systemd; a Scheduled Task is registered automatically)..." -ForegroundColor Yellow
    $startup = Invoke-LmsPm2 -Pm2Args @("startup")
    $cmdMatch = [regex]::Match($startup.Output, '(?m)^\s*((?:sudo\s+)?(?:env\s+.*?)?(?:pm2|pm2-startup)\s+\S.+)$')
    if ($cmdMatch.Success) {
        Write-Host "[INFO] Executing PM2-generated command: $($cmdMatch.Groups[1].Value)" -ForegroundColor Yellow
        cmd.exe /c $cmdMatch.Groups[1].Value
    } elseif ($startup.Output -match "Init system not found") {
        Write-Host "[INFO] PM2 has no Windows init system. Registering Scheduled Task '$($script:LmsPm2TaskName)'." -ForegroundColor Yellow
    }

    Get-ScheduledTask -ErrorAction SilentlyContinue |
        Where-Object { $_.TaskName -eq $script:LmsPm2TaskName } |
        ForEach-Object {
            Unregister-ScheduledTask -TaskName $_.TaskName -TaskPath $_.TaskPath -Confirm:$false -ErrorAction SilentlyContinue
        }

    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        throw "Administrator privileges are required to register '$($script:LmsPm2TaskName)' at Windows startup (SYSTEM, Highest)."
    }

    $wscriptExe = Join-Path $env:SystemRoot "System32\wscript.exe"
    if (-not (Test-Path -LiteralPath $wscriptExe)) {
        throw "wscript.exe not found at $wscriptExe"
    }
    if (-not (Test-Path -LiteralPath $script:LmsResurrectVbs)) {
        throw "Hidden resurrect launcher missing: $($script:LmsResurrectVbs)"
    }
    $action = New-ScheduledTaskAction -Execute $wscriptExe -Argument "//B //Nologo `"$($script:LmsResurrectVbs)`"" -WorkingDirectory $script:LmsPm2RuntimeDir
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $trigger.Delay = "PT30S"
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -Hidden
    Register-ScheduledTask -TaskName $script:LmsPm2TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null

    try {
        [Environment]::SetEnvironmentVariable("PM2_HOME", $script:LmsPm2Home, "Machine")
        [Environment]::SetEnvironmentVariable("PM2_HOME", $script:LmsPm2Home, "User")
        $env:PM2_HOME = $script:LmsPm2Home
    } catch {
        Write-Host "[WARNING] Could not persist PM2_HOME: $_" -ForegroundColor Yellow
    }

    $taskHits = @(Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskName -eq $script:LmsPm2TaskName })
    if ($taskHits.Count -ne 1) {
        throw "Expected exactly one '$($script:LmsPm2TaskName)' task, found $($taskHits.Count)"
    }
    $trigClass = $taskHits[0].Triggers[0].CimClass.CimClassName
    if ($trigClass -notmatch "Boot") {
        throw "LutronPM2Startup trigger is $trigClass; expected At startup (MSFT_TaskBootTrigger)"
    }
    if ($taskHits[0].Principal.RunLevel -ne "Highest") {
        throw "LutronPM2Startup RunLevel is $($taskHits[0].Principal.RunLevel); expected Highest"
    }
    $pm2Exe = [string]$taskHits[0].Actions[0].Execute
    if ($pm2Exe -notlike "*wscript.exe") {
        throw "LutronPM2Startup execute is $pm2Exe; expected wscript.exe (hidden)"
    }
    Write-Host "[OK] Startup registered: Scheduled Task '$($script:LmsPm2TaskName)' runs at Windows startup as SYSTEM (Highest) after 30s (hidden)." -ForegroundColor Green
}

function Unregister-LmsPm2Startup {
    $task = Get-ScheduledTask -TaskName $script:LmsPm2TaskName -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $script:LmsPm2TaskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "[OK] Removed scheduled task $($script:LmsPm2TaskName)" -ForegroundColor Green
    }
    $null = Invoke-LmsPm2 -Pm2Args @("unstartup")
    foreach ($scope in @("User", "Machine")) {
        $stored = [Environment]::GetEnvironmentVariable("PM2_HOME", $scope)
        if ($stored -and $script:LmsPm2Home -and ($stored -eq $script:LmsPm2Home)) {
            [Environment]::SetEnvironmentVariable("PM2_HOME", $null, $scope)
        }
    }
}

function Get-LmsPm2AppOnline {
    param([string]$Name)
    $r = Invoke-LmsPm2 -Pm2Args @("pid", $Name)
    $pidLine = ($r.Output -split "`r?`n" | Where-Object { $_ -match '^\d+$' } | Select-Object -Last 1)
    if ([string]::IsNullOrWhiteSpace($pidLine)) { return $false }
    return ([int]$pidLine -gt 0)
}

function Get-LmsSpawnChildCount {
    $listen = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listen) { return 0 }
    $worker = $listen.OwningProcess
    return @(Get-CimInstance Win32_Process -Filter "Name='python.exe' OR Name='pythonw.exe'" | Where-Object {
        $_.ParentProcessId -eq $worker
    }).Count
}

function Test-LmsPm2Runtime {
    param([int]$TimeoutSec = 60)

    $errors = New-Object System.Collections.Generic.List[string]
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $healthBody = $null
    do {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 3
            $healthBody = $resp.Content
            if ($healthBody -match '"status"\s*:\s*"healthy"') { break }
        } catch {
            $healthBody = $null
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)

    if (-not (Get-LmsPm2AppOnline -Name $script:LmsPm2AppBackend)) {
        $errors.Add("PM2 app '$($script:LmsPm2AppBackend)' is not online")
    }
    if (-not (Get-LmsPm2AppOnline -Name $script:LmsPm2AppFrontend)) {
        $errors.Add("PM2 app '$($script:LmsPm2AppFrontend)' is not online")
    }
    if ($healthBody -notmatch '"status"\s*:\s*"healthy"') {
        $errors.Add("/health is not healthy: $healthBody")
    }

    $spawn = Get-LmsSpawnChildCount
    if ($spawn -ne 3) {
        $errors.Add("Expected exactly 3 RuntimeSupervisor children, found $spawn")
    }

    $lockPath = Join-Path $env:TEMP "energy_logger.lock"
    $energyOk = $false
    if (Test-Path $lockPath) {
        $lockPid = ((Get-Content $lockPath -Raw).Trim() -split "\s+")[0]
        if ($lockPid -match "^\d+$") {
            $energyOk = [bool](Get-Process -Id ([int]$lockPid) -ErrorAction SilentlyContinue)
        }
    }
    if (-not $energyOk) {
        $errors.Add("Energy Logger lock PID is missing or not running")
    }

    $feReady = $false
    try {
        $fe = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
        if ($fe.StatusCode -eq 200) { $feReady = $true }
    } catch { }
    if (-not $feReady) {
        $errors.Add("Frontend is not responding on http://127.0.0.1:3000")
    }

    $legacy = Get-LmsLegacyNssmBackendService
    if ($legacy) {
        $errors.Add("Legacy service 'LutronLMSBackend' still exists (Status=$($legacy.Status), StartType=$($legacy.StartType))")
    }
    $bePids = @(Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
    if ($bePids.Count -ne 1) {
        $errors.Add("Expected exactly one backend listener on :8000, found $($bePids.Count)")
    }

    return [PSCustomObject]@{
        Success      = ($errors.Count -eq 0)
        Errors       = $errors
        Health       = $healthBody
        SpawnCount   = $spawn
        EnergyAlive  = $energyOk
        BackendOnline = (Get-LmsPm2AppOnline -Name $script:LmsPm2AppBackend)
        FrontendOnline = (Get-LmsPm2AppOnline -Name $script:LmsPm2AppFrontend)
    }
}

function Install-LmsPm2Stack {
    param(
        [Parameter(Mandatory = $true)][string]$RootDir,
        [string]$BackendDir,
        [string]$FrontendDir
    )

    Initialize-LmsPm2Context -RootDir $RootDir -BackendDir $BackendDir -FrontendDir $FrontendDir
    if (-not (Get-Command node.exe -ErrorAction SilentlyContinue) -and -not (Test-Path (Join-Path $env:ProgramFiles "nodejs\node.exe"))) {
        throw "Node.js is required before PM2 can be installed."
    }
    Install-LmsPm2PackageIfMissing
    Resolve-LmsNodeAndPm2
    $indexHtml = Join-Path $script:LmsFrontendDir "build\index.html"
    if (-not (Test-Path $indexHtml)) {
        Write-Host "[INFO] Frontend production build missing - running npm run build..." -ForegroundColor Yellow
        Push-Location $script:LmsFrontendDir
        try {
            $env:NODE_OPTIONS = "--max-old-space-size=1536"
            & npm run build
            if ($LASTEXITCODE -ne 0 -or -not (Test-Path $indexHtml)) {
                throw "npm run build failed; cannot start lutron-frontend"
            }
        } finally {
            Pop-Location
        }
        Write-Host "[OK] Frontend production build completed" -ForegroundColor Green
    }
    $legacyHomes = @(
        (Join-Path $env:USERPROFILE ".pm2")
        (Join-Path $script:LmsRootDir ".pm2")
    ) | Select-Object -Unique
    foreach ($legacyHome in $legacyHomes) {
        if ($legacyHome -ne $script:LmsPm2Home -and (Test-Path $legacyHome)) {
            Write-Host "[INFO] Stopping any lutron-* apps on previous PM2 home ($legacyHome) to avoid duplicates..." -ForegroundColor Yellow
            $prevHome = $env:PM2_HOME
            $env:PM2_HOME = $legacyHome
            $null = Invoke-LmsPm2 -Pm2Args @("delete", $script:LmsPm2AppBackend)
            $null = Invoke-LmsPm2 -Pm2Args @("delete", $script:LmsPm2AppFrontend)
            $null = Invoke-LmsPm2 -Pm2Args @("save")
            $env:PM2_HOME = $prevHome
        }
    }
    Remove-LmsOpenDashboardTask
    Remove-LmsLegacyNssmBackendService
    Assert-LmsLegacyNssmBackendRemoved
    Write-LmsEcosystemConfig
    Start-LmsPm2Apps
    Install-LmsPm2LogrotateModule
    Repair-LmsPm2LogrotateParseBool
    Set-LmsPm2LogrotateConfig
    Assert-LmsPm2LogrotateConfigured
    Save-LmsPm2Dump
    Register-LmsPm2Startup
    Register-LutronAutoStartTask
    Write-Host "[INFO] Verifying PM2 runtime..." -ForegroundColor Yellow
    $check = Test-LmsPm2Runtime -TimeoutSec 90
    if (-not $check.Success) {
        Write-Host "[ERROR] PM2 startup verification failed:" -ForegroundColor Red
        foreach ($e in $check.Errors) {
            Write-Host "  - $e" -ForegroundColor Red
        }
        throw "Critical PM2 verification failed. Installation aborted."
    }
    Write-Host "[OK] PM2 runtime verified (backend, frontend, /health, 3 children)." -ForegroundColor Green
    return $check
}

function Stop-LmsPm2Apps {
    param([switch]$Delete)
    if (-not $script:LmsRootDir) {
        throw "Initialize-LmsPm2Context must be called first."
    }
    try { Resolve-LmsNodeAndPm2 } catch {
        Write-Host "[INFO] PM2 not available; skipping pm2 stop." -ForegroundColor Yellow
        return
    }
    $action = if ($Delete) { "delete" } else { "stop" }
    foreach ($name in @($script:LmsPm2AppBackend, $script:LmsPm2AppFrontend)) {
        $null = Invoke-LmsPm2 -Pm2Args @($action, $name)
    }
}

function Uninstall-LmsPm2Stack {
    param(
        [Parameter(Mandatory = $true)][string]$RootDir,
        [string]$BackendDir,
        [string]$FrontendDir
    )

    Initialize-LmsPm2Context -RootDir $RootDir -BackendDir $BackendDir -FrontendDir $FrontendDir
    Remove-LmsLegacyNssmBackendService
    try { Resolve-LmsNodeAndPm2 } catch {
        Write-Host "[INFO] PM2 CLI not present; removing files and startup only." -ForegroundColor Yellow
    }

    if ($script:LmsPm2Bin) {
        try { Uninstall-LmsPm2LogrotateModule } catch {
            Write-Host "[WARNING] pm2-logrotate uninstall reported: $_" -ForegroundColor Yellow
        }
        Stop-LmsPm2Apps -Delete
        $null = Invoke-LmsPm2 -Pm2Args @("save")
        $null = Invoke-LmsPm2 -Pm2Args @("kill")
    }

    Unregister-LmsPm2Startup
    Remove-LmsLegacyAutoStartTask
    Remove-LmsOpenDashboardTask

    foreach ($path in @($script:LmsEcosystemPath, $script:LmsResurrectCmd, $script:LmsResurrectVbs)) {
        if ($path -and (Test-Path $path)) {
            Remove-Item $path -Force -ErrorAction SilentlyContinue
            Write-Host "[OK] Removed $path" -ForegroundColor Green
        }
    }
    if ($script:LmsPm2Home -and (Test-Path $script:LmsPm2Home)) {
        Remove-Item $script:LmsPm2Home -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Removed PM2 home $($script:LmsPm2Home)" -ForegroundColor Green
    }
    Assert-LmsLegacyNssmBackendRemoved
}
