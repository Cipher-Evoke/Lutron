@echo off
REM Console launcher. The server keeps running after this window closes.
cd /d "%~dp0"
if exist "Start_LMS.cmd" (
    call "Start_LMS.cmd"
) else if exist "Start_LMS.exe" (
    Start_LMS.exe
) else if exist "start_server.exe" (
    start "" /B start_server.exe --service --no-browser
) else (
    echo start_server.exe not found
    pause
)
