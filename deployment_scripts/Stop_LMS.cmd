@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM  Lutron LMS Stop Launcher
REM  Double-click this file to stop the application
REM ============================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if not exist "scripts\LMS_stop.ps1" (
    echo.
    echo [ERROR] LMS_stop.ps1 not found in: %SCRIPT_DIR%\scripts
    echo.
    pause
    exit /b 1
)

REM Launch visible PowerShell progress window; CMD exits immediately (no extra console).
start "Lutron LMS Stop" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -File "%~dp0scripts\LMS_stop.ps1"
exit /b 0
