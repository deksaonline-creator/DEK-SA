@echo off
title DEK-SA Dev Server (Vite + Backend)
echo ========================================================
echo    DEK-SA Dev Server with Hot-Reload (Vite + Express)
echo ========================================================
echo.
echo    Vite Dev URL:  http://localhost:5173
echo    API Backend:   http://localhost:5000
echo.
echo    Press Ctrl+C to stop.
echo ========================================================
echo.
cd /d "%~dp0"
call npm.cmd run dev
pause
