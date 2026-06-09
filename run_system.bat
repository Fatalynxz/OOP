@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo   GrabEat Clean Run
echo ========================================
echo.

if not exist ".env" (
  echo [ERROR] .env file not found.
  echo Create .env first and add your Supabase DATABASE_URL.
  pause
  exit /b 1
)

echo [1/6] Cleaning generated files...
if exist "dist" rmdir /s /q "dist"
if exist ".vite" rmdir /s /q ".vite"
if exist ".pytest_cache" rmdir /s /q ".pytest_cache"

for /d /r %%D in (__pycache__) do (
  if exist "%%D" rmdir /s /q "%%D"
)

echo [2/6] Stopping old servers on ports 8000 and 5173...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>nul
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>nul

echo [3/6] Checking Python dependencies...
python -c "import django, dj_database_url, psycopg" >nul 2>nul
if errorlevel 1 (
  echo Installing backend dependencies...
  python -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [ERROR] Backend dependency install failed.
    pause
    exit /b 1
  )
)

echo [4/6] Checking Node dependencies...
if not exist "node_modules" (
  echo Installing frontend dependencies...
  npm install
  if errorlevel 1 (
    echo [ERROR] Frontend dependency install failed.
    pause
    exit /b 1
  )
)

echo [5/6] Applying database migrations...
python manage.py migrate
if errorlevel 1 (
  echo [ERROR] Migration failed. Check your Supabase DATABASE_URL in .env.
  pause
  exit /b 1
)

echo [6/6] Starting backend and frontend...
start "GrabEat Django Backend" cmd /k "cd /d ""%~dp0"" && python manage.py runserver 127.0.0.1:8000"
start "GrabEat React Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev -- --host 127.0.0.1"

echo.
echo System is starting.
echo Backend:  http://127.0.0.1:8000/api/
echo Frontend: http://127.0.0.1:5173/
echo.
pause
