@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM  Lutron LMS Installation Launcher
REM  Double-click this file to run the installation
REM ============================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Elevate the launcher once, before PowerShell starts.
net session >nul 2>&1
if not "%ERRORLEVEL%"=="0" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs -WorkingDirectory '%~dp0'"
    exit /b 0
)

if not exist "scripts\LMS_installation.ps1" (
    echo.
    echo [ERROR] LMS_installation.ps1 not found in: %SCRIPT_DIR%\scripts
    echo.
    pause
    exit /b 1
)

title Lutron LMS Installation
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -File "%~dp0scripts\LMS_installation.ps1"
exit /b 0
