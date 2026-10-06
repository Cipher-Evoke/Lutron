# Explicit presentation-only console UI for the Lutron LMS deployment scripts.

$script:LmsConsoleTitle = "LUTRON LMS"
$script:LmsConsoleSubtitle = ""
$script:LmsConsoleWindowTitle = $null
$script:LmsConsoleEnabled = $true
$script:LmsConsoleBarLength = 28
$script:LmsConsoleBarRow = 0
$script:LmsConsoleStatusRow = 0
$script:LmsConsoleScreenWidth = 50
$script:LmsConsoleTechnicalLog = $null
$script:LmsConsoleFailureShown = $false

function Write-LmsConsoleHost {
    param(
        [Parameter(Position = 0)][object]$Object,
        [ConsoleColor]$ForegroundColor
    )

    if ($PSBoundParameters.ContainsKey("ForegroundColor")) {
        Microsoft.PowerShell.Utility\Write-Host $Object -ForegroundColor $ForegroundColor
    } else {
        Microsoft.PowerShell.Utility\Write-Host $Object
    }
}

function Initialize-LmsConsole {
    param(
        [Parameter(Mandatory = $true)][string]$Subtitle,
        [string]$WindowTitle,
        [string]$TechnicalLogPath,
        [switch]$Silent
    )

    $script:LmsConsoleSubtitle = $Subtitle
    $script:LmsConsoleWindowTitle = $WindowTitle
    $script:LmsConsoleEnabled = -not $Silent
    $operation = ($Subtitle -replace '\s+', '-').ToLowerInvariant()
    $script:LmsConsoleTechnicalLog = if ($TechnicalLogPath) {
        $TechnicalLogPath
    } else {
        Join-Path $env:TEMP ("lutron-{0}-{1}.log" -f $operation, (Get-Date -Format 'yyyyMMdd-HHmmss'))
    }
    $script:LmsConsoleFailureShown = $false
    "" | Out-File -FilePath $script:LmsConsoleTechnicalLog -Force
    if ($WindowTitle) {
        $Host.UI.RawUI.WindowTitle = $WindowTitle
    }
    if ($Silent) { return }

    Clear-Host
    Write-LmsConsoleHost "==================================================" -ForegroundColor Cyan
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost (Get-LmsConsoleCenteredText -Text $script:LmsConsoleTitle) -ForegroundColor Cyan
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost (Get-LmsConsoleCenteredText -Text $script:LmsConsoleSubtitle) -ForegroundColor White
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost "==================================================" -ForegroundColor Cyan
    Write-LmsConsoleHost ""
    $script:LmsConsoleBarRow = [Console]::CursorTop
    Write-LmsConsoleHost ("[{0}] {1,3}%" -f ("." * $script:LmsConsoleBarLength), 0) -ForegroundColor Green
    Write-LmsConsoleHost ""
    $script:LmsConsoleStatusRow = [Console]::CursorTop
    Write-LmsConsoleHost "Starting..." -ForegroundColor White
}

function Get-LmsConsoleCenteredText {
    param([string]$Text, [int]$Width = 50)
    $padding = [Math]::Max(0, [Math]::Floor(($Width - $Text.Length) / 2))
    return ((" " * $padding) + $Text)
}

function Set-LmsConsolePhase {
    param(
        [Parameter(Mandatory = $true)][int]$Percent,
        [Parameter(Mandatory = $true)][string]$Status
    )

    if (-not $script:LmsConsoleEnabled) { return }
    if ($script:LmsConsoleWindowTitle) {
        $Host.UI.RawUI.WindowTitle = $script:LmsConsoleWindowTitle
    }
    $safePercent = [Math]::Min([Math]::Max($Percent, 0), 100)
    $filled = [Math]::Floor(($safePercent / 100) * $script:LmsConsoleBarLength)
    $bar = ("#" * $filled) + ("." * ($script:LmsConsoleBarLength - $filled))
    [Console]::SetCursorPosition(0, $script:LmsConsoleBarRow)
    Write-LmsConsoleHost (("[{0}] {1,3}%" -f $bar, $safePercent) + (" " * 8)) -ForegroundColor Green
    [Console]::SetCursorPosition(0, $script:LmsConsoleStatusRow)
    Write-LmsConsoleHost (($Status.PadRight($script:LmsConsoleScreenWidth - 2)) + "  ") -ForegroundColor White
}

function Complete-LmsConsole {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [string]$Detail = ""
    )

    if (-not $script:LmsConsoleEnabled) { return }
    if ($script:LmsConsoleWindowTitle) {
        $Host.UI.RawUI.WindowTitle = $script:LmsConsoleWindowTitle
    }
    Clear-Host
    Write-LmsConsoleHost "==================================================" -ForegroundColor Green
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost (Get-LmsConsoleCenteredText -Text $script:LmsConsoleTitle) -ForegroundColor Green
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost (Get-LmsConsoleCenteredText -Text $Message) -ForegroundColor White
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost "==================================================" -ForegroundColor Green
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost $Message -ForegroundColor White
    if ($Detail) {
        Write-LmsConsoleHost ""
        Write-LmsConsoleHost $Detail -ForegroundColor White
    }
}

function Write-LmsTechnicalLog {
    param([object]$Object)
    if ($null -ne $script:LmsConsoleTechnicalLog) {
        Add-Content -Path $script:LmsConsoleTechnicalLog -Value ([string]$Object)
    }
}

function Show-LmsFailurePrompt {
    param(
        [string]$Message,
        [string[]]$RecoveryCommands = @()
    )

    if ($script:LmsConsoleFailureShown) { return }
    $script:LmsConsoleFailureShown = $true
    Show-LmsConsoleFailure -Message $Message
    Write-LmsConsoleHost "Technical details have been saved." -ForegroundColor White
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost "Log:" -ForegroundColor White
    Write-LmsConsoleHost $script:LmsConsoleTechnicalLog -ForegroundColor White
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost "[D] View diagnostics" -ForegroundColor Yellow
    Write-LmsConsoleHost "[R] Show recovery commands" -ForegroundColor Yellow
    Write-LmsConsoleHost "[Any other key] Exit" -ForegroundColor Yellow
    try {
        $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        if ($key.Character -eq 'd' -or $key.Character -eq 'D') {
            Write-LmsConsoleHost ""
            Get-Content -Path $script:LmsConsoleTechnicalLog | ForEach-Object {
                Microsoft.PowerShell.Utility\Write-Host $_
            }
        } elseif (($key.Character -eq 'r' -or $key.Character -eq 'R') -and $RecoveryCommands.Count -gt 0) {
            Write-LmsConsoleHost ""
            $RecoveryCommands | ForEach-Object { Write-LmsConsoleHost $_ -ForegroundColor Cyan }
        }
    } catch { }
}

function Show-LmsConsoleFailure {
    param(
        [Parameter(Mandatory = $true)][string]$Message
    )

    if (-not $script:LmsConsoleEnabled) { return }
    if ($script:LmsConsoleWindowTitle) {
        $Host.UI.RawUI.WindowTitle = $script:LmsConsoleWindowTitle
    }
    Clear-Host
    Write-LmsConsoleHost "==================================================" -ForegroundColor Red
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost (Get-LmsConsoleCenteredText -Text $script:LmsConsoleTitle) -ForegroundColor Red
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost (Get-LmsConsoleCenteredText -Text "Operation Failed") -ForegroundColor Red
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost "==================================================" -ForegroundColor Red
    Write-LmsConsoleHost ""
    Write-LmsConsoleHost $Message -ForegroundColor Red
    Write-LmsConsoleHost ""
}
