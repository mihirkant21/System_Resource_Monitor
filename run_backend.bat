@echo off
echo ========================================================
echo  System Resource Monitor - Backend Server (FastAPI)
echo ========================================================
set PYTHONPATH=backend
cd /d "%~dp0"
call backend\venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

