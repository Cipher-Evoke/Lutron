# Shared path resolver — works on any drive (C:, D:, E:, etc.)
# Detects paths from script location, then searches all drives as fallback.

function Get-LutronPaths {
    param(
        [string]$FromPath
    )

    $deploymentDir = $null
    $rootDir = $null

    # --- Resolve starting point ---
    if ($FromPath) {
        if ((Get-Item $FromPath -ErrorAction SilentlyContinue).PSIsContainer) {
            $startDir = (Resolve-Path $FromPath).Path
        }
        else {
            $startDir = (Resolve-Path (Split-Path -Parent $FromPath)).Path
        }
    }
    elseif ($PSScriptRoot) {
        $startDir = $PSScriptRoot
    }
    else {
        $startDir = (Get-Location).Path
    }

    # Walk up from start dir looking for deployment_scripts + scripts folder
    $searchDir = $startDir
    for ($i = 0; $i -lt 8; $i++) {
        if ((Split-Path -Leaf $searchDir) -eq 'scripts' -and
            (Split-Path -Leaf (Split-Path -Parent $searchDir)) -eq 'deployment_scripts') {
            $deploymentDir = Split-Path -Parent $searchDir
            $rootDir = Split-Path -Parent $deploymentDir
            break
        }

        if ((Split-Path -Leaf $searchDir) -eq 'deployment_scripts' -and
            (Test-Path (Join-Path $searchDir 'scripts\LMS_installation.ps1'))) {
            $deploymentDir = $searchDir
            $rootDir = Split-Path -Parent $deploymentDir
            break
        }

        if ((Split-Path -Leaf $searchDir) -eq 'monitoring' -and
            (Test-Path (Join-Path $searchDir 'ecosystem.config.cjs'))) {
            $rootDir = Split-Path -Parent $searchDir
            $deploymentDir = Join-Path $rootDir 'deployment_scripts'
            break
        }

        $parent = Split-Path -Parent $searchDir
        if (-not $parent -or $parent -eq $searchDir) { break }
        $searchDir = $parent
    }

    # --- Search all drives if not found ---
    if (-not $deploymentDir -or -not (Test-Path $deploymentDir)) {
        $found = Find-DeploymentScriptsDir
        if ($found) {
            $deploymentDir = $found
            $rootDir = Split-Path -Parent $deploymentDir
        }
    }

    if (-not $rootDir) {
        return $null
    }

    $rootDir = (Resolve-Path $rootDir).Path
    if ($deploymentDir -and (Test-Path $deploymentDir)) {
        $deploymentDir = (Resolve-Path $deploymentDir).Path
    }

    # --- Backend / Frontend ---
    $backendDir = Resolve-AppDir -RootDir $rootDir -Preferred 'lutron_backend' -Alternate 'backend'
    $frontendDir = Resolve-AppDir -RootDir $rootDir -Preferred 'lutron_frontend' -Alternate 'frontend'

    # --- Monitoring ---
    $monitoringDir = Join-Path $rootDir 'monitoring'
    if (-not (Test-Path (Join-Path $monitoringDir 'ecosystem.config.cjs'))) {
        $foundMonitoring = Find-MonitoringDir -RootDir $rootDir
        if ($foundMonitoring) {
            $monitoringDir = $foundMonitoring
            if (-not $rootDir -or -not (Test-Path $rootDir)) {
                $rootDir = Split-Path -Parent $monitoringDir
            }
        }
    }

    if (Test-Path $monitoringDir) {
        $monitoringDir = (Resolve-Path $monitoringDir).Path
    }

    $inputJson = Join-Path $deploymentDir 'input.json'
    if (-not (Test-Path $inputJson)) {
        $inputJson = Join-Path $rootDir 'deployment_scripts\input.json'
    }

    $logDir = Join-Path $rootDir 'logs'

    return [PSCustomObject]@{
        RootDir           = $rootDir
        DeploymentDir     = $deploymentDir
        BackendDir        = $backendDir
        FrontendDir       = $frontendDir
        MonitoringDir     = $monitoringDir
        InputJson         = $inputJson
        LogDir            = $logDir
        InstallPm2Script  = if ($deploymentDir) { Join-Path $deploymentDir 'scripts\Install-Pm2Monitoring.ps1' } else { $null }
    }
}

function Resolve-AppDir {
    param(
        [string]$RootDir,
        [string]$Preferred,
        [string]$Alternate
    )

    $preferredPath = Join-Path $RootDir $Preferred
    if (Test-Path $preferredPath) {
        return (Resolve-Path $preferredPath).Path
    }

    $alternatePath = Join-Path $RootDir $Alternate
    if (Test-Path $alternatePath) {
        return (Resolve-Path $alternatePath).Path
    }

    return $preferredPath
}

function Find-DeploymentScriptsDir {
    $drives = Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root

    foreach ($drive in $drives) {
        # Common known layouts on any drive
        $candidates = @(
            (Join-Path $drive 'lutron\deployment_scripts')
            (Join-Path $drive 'lutron1\deployment_scripts')
        )

        foreach ($candidate in $candidates) {
            if (Test-Path (Join-Path $candidate 'scripts\LMS_installation.ps1')) {
                return (Resolve-Path $candidate).Path
            }
        }

        # Broader search: deployment_scripts folder within 3 levels of drive root
        try {
            $found = Get-ChildItem -Path $drive -Directory -Filter 'deployment_scripts' -Recurse -Depth 3 -ErrorAction SilentlyContinue |
                Where-Object { Test-Path (Join-Path $_.FullName 'scripts\LMS_installation.ps1') } |
                Select-Object -First 1

            if ($found) {
                return $found.FullName
            }
        }
        catch {
            # ignore search errors on restricted paths
        }
    }

    return $null
}

function Ensure-MonitoringAtRoot {
    param(
        [string]$RootDir,
        [string]$DeploymentDir
    )

    if (-not $RootDir) { return $null }

    $target = Join-Path $RootDir 'monitoring'
    if (Test-Path (Join-Path $target 'ecosystem.config.cjs')) {
        return (Resolve-Path $target).Path
    }

    $sourceCandidates = @()
    if ($DeploymentDir) {
        $sourceCandidates += Join-Path $DeploymentDir 'monitoring'
    }

    foreach ($source in $sourceCandidates) {
        if (-not (Test-Path (Join-Path $source 'ecosystem.config.cjs'))) { continue }

        Write-Host "[INFO] Deploying monitoring folder to: $target" -ForegroundColor Yellow
        New-Item -ItemType Directory -Force -Path $RootDir | Out-Null
        if (Test-Path $target) {
            Remove-Item $target -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item -Path $source -Destination $target -Recurse -Force
        return (Resolve-Path $target).Path
    }

    $found = Find-MonitoringDir -RootDir $RootDir
    if ($found -and (Test-Path (Join-Path $found 'ecosystem.config.cjs'))) {
        $resolvedFound = (Resolve-Path $found).Path
        $resolvedTarget = Resolve-Path $target -ErrorAction SilentlyContinue
        if ($resolvedTarget -and $resolvedFound -ieq $resolvedTarget.Path) {
            return $resolvedFound
        }

        Write-Host "[INFO] Copying monitoring from: $resolvedFound" -ForegroundColor Yellow
        New-Item -ItemType Directory -Force -Path $RootDir | Out-Null
        if (Test-Path $target) {
            Remove-Item $target -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item -Path $resolvedFound -Destination $target -Recurse -Force
        return (Resolve-Path $target).Path
    }

    return $null
}

function Resolve-PathIfExists {
    param([string]$Path)

    if ($Path -and (Test-Path $Path)) {
        return (Resolve-Path $Path).Path
    }
    return $Path
}

function Find-MonitoringDir {
    param([string]$RootDir)

    $localMonitoring = Join-Path $RootDir 'monitoring'
    if (Test-Path (Join-Path $localMonitoring 'ecosystem.config.cjs')) {
        return (Resolve-Path $localMonitoring).Path
    }

    $drives = Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root

    foreach ($drive in $drives) {
        $candidates = @(
            (Join-Path $drive 'lutron\monitoring')
            (Join-Path $drive 'lutron1\monitoring')
        )

        foreach ($candidate in $candidates) {
            if (Test-Path (Join-Path $candidate 'ecosystem.config.cjs')) {
                return (Resolve-Path $candidate).Path
            }
        }

        try {
            $found = Get-ChildItem -Path $drive -Directory -Filter 'monitoring' -Recurse -Depth 4 -ErrorAction SilentlyContinue |
                Where-Object { Test-Path (Join-Path $_.FullName 'ecosystem.config.cjs') } |
                Select-Object -First 1

            if ($found) {
                return $found.FullName
            }
        }
        catch {
            # ignore
        }
    }

    return $null
}
