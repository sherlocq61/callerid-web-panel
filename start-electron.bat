@echo off
echo Starting CallerID Electron App...
cd /d "%~dp0"
start /B npm run electron:dev
echo.
echo CallerID Electron App is starting...
echo Close this window to stop the app.
pause
