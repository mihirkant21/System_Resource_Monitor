@echo off
echo ========================================================
echo  Launching System Resource Monitor (Full-Stack)
echo ========================================================
echo Starting Backend Server on http://127.0.0.1:8000 ...
start "System Monitor - Backend" cmd /k "%~dp0run_backend.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server on http://localhost:5173 ...
start "System Monitor - Frontend" cmd /k "%~dp0run_frontend.bat"

echo.
echo Application started!
echo Backend Swagger API Docs: http://127.0.0.1:8000/docs
echo Frontend Dashboard:      http://localhost:5173
echo.
pause

