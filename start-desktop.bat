@echo off
REM BiasharaLedger Desktop Launcher for Windows
REM Requires: Node.js 18+ and npm dependencies installed

cd /d "%~dp0"

echo Checking for production server...
curl -s -o nul http://localhost:3000/ >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Starting production server...
  start /B npm start
  echo Waiting for server...
  timeout /t 15 /nobreak
)

echo Launching BiasharaLedger Desktop...
npx electron electron/desktop.cjs

pause
