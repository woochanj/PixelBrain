@echo off
setlocal
chcp 65001 > nul
title PixelBrain Launcher

echo [DEBUG] Script Started.
echo ===================================================
echo          PixelBrain Launcher (Start - DEBUG MODE)
echo ===================================================
pause

:: 0. KILL OLD PROCESSES
echo [0/3] Cleaning up old processes...
taskkill /FI "WINDOWTITLE eq PixelBrain Backend" /F >nul 2>&1
taskkill /IM node.exe /F >nul 2>&1
echo [DEBUG] Cleanup finished.
pause

:: SETUP CHECK
if not exist "venv" (
    echo [ERROR] Virtual Environment 'venv' not found.
    echo Please run 'setup_pixelbrain.bat' first.
    pause
    exit /b
)
if not exist "src\frontend\node_modules" (
    echo [ERROR] 'node_modules' not found in frontend.
    echo Please run 'setup_pixelbrain.bat' first.
    pause
    exit /b
)
echo [DEBUG] Setup checks passed.
pause

:: PYTHON CHECK
echo [DEBUG] Checking Python...
py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    goto :CHECK_OLLAMA
)
set PYTHON_CMD=python
echo [DEBUG] Using %PYTHON_CMD%

:CHECK_OLLAMA
echo [1/3] Checking Ollama Service...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo   - Ollama is already running.
) else (
    echo   - Starting Ollama...
    start "Ollama Service" /min cmd /c "ollama serve"
    echo   - Waiting 3 seconds for Ollama to initialize...
    timeout /t 3 >nul
)
echo [DEBUG] Ollama check passed.
pause

:RUN
echo [2/3] Starting Backend Server...
start "PixelBrain Backend" /min cmd /c "venv\Scripts\activate && python src\backend\app.py"
echo [DEBUG] Backend start command sent.
pause

echo [3/3] Starting Frontend Server...
echo The browser will open automatically.
cd src\frontend

:: CALL NPM (Crucial)
echo [DEBUG] Running 'npm run dev'...
call npm run dev

echo.
echo [INFO] Frontend Server Closed.
pause
exit /b

:ACTIVATE_FAIL_RUN
echo [ERROR] 활성화 스크립트 실행 실패.
pause
exit /b

:INSTALL_FAIL
echo [ERROR] pip install 실패.
pause
exit /b

:SERVER_FAIL
echo [ERROR] 서버 실행 중 오류 발생.
pause
exit /b
