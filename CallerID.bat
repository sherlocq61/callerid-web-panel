@echo off
echo ========================================
echo   CallerID Electron App
echo ========================================
echo.

cd /d "%~dp0"

echo Starting CallerID...
start /B npx electron electron/main.js

echo.
echo CallerID App is running!
echo Close this window to keep the app running.
echo.
pause
