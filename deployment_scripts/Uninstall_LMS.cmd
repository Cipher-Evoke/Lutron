@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM  Lutron LMS Uninstall Launcher
REM  Stops PM2 apps, removes startup registration, leaves PostgreSQL.
REM ============================================================

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

if not exist "scripts\LMS_uninstall.ps1" (
    echo.
    echo [ERROR] LMS_uninstall.ps1 not found in: %SCRIPT_DIR%\scripts
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Lutron LMS Uninstall
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Normal -File "%~dp0scripts\LMS_uninstall.ps1"

set "EXIT_CODE=%ERRORLEVEL%"
echo.
if %EXIT_CODE% EQU 0 (
    echo   Uninstall Completed
) else (
    echo   Uninstall Failed  Exit code: %EXIT_CODE%
    pause
)
exit /b %EXIT_CODE%
