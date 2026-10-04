@echo off
echo ========================================================
echo     LAUNCHING ENTERPRISE HRMS SYSTEM QA AUDIT
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-qa-audit.ps1"
echo.
pause
