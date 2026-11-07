@echo off
title DEK-SA Server (Production)
echo ========================================================
echo    DEK-SA Fullstack Server (Node.js + Express + React)
echo ========================================================
echo.
echo    Local URL:    http://localhost:5000
echo    LAN/Wi-Fi:    http://192.168.1.114:5000
echo.
echo    Press Ctrl+C to stop the server.
echo ========================================================
echo.
cd /d "%~dp0server"
node server.js
pause
