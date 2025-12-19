:: @echo off
setlocal
chcp 65001 > nul

echo [PixelBrain] 시스템 설정을 시작합니다...

:: 1. Python 감지
set PYTHON_CMD=python
%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% equ 0 goto :CHECK_VENV

echo [INFO] 'python' 명령어 실패. 'py' 시도...
set PYTHON_CMD=py
%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% equ 0 goto :CHECK_VENV

:: Python 없음
echo [ERROR] Python이 설치되어 있지 않습니다.
pause
exit /b

:CHECK_VENV
echo [INFO] Python 감지됨: %PYTHON_CMD%
pause

:: 2. VENV 존재 확인
if exist "venv" goto :VENV_EXISTS

echo [INFO] 가상 환경(venv) 생성 중...
%PYTHON_CMD% -m venv venv
if %errorlevel% neq 0 goto :VENV_FAIL
goto :ACTIVATE_VENV

:VENV_EXISTS
echo [INFO] 기존 가상 환경 감지됨.

:ACTIVATE_VENV
pause
:: 3. 가상 환경 활성화
if not exist "venv\Scripts\activate.bat" goto :ACTIVATE_FAIL

call venv\Scripts\activate.bat
if %errorlevel% neq 0 goto :ACTIVATE_FAIL_RUN

echo [INFO] 가상 환경 활성화 완료.
pause

:: 4. 라이브러리 설치
if not exist "requirements.txt" goto :SKIP_REQ

echo [INFO] 라이브러리 설치/업데이트...
pip install -r requirements.txt
if %errorlevel% neq 0 goto :INSTALL_FAIL
goto :CHECK_OLLAMA

:SKIP_REQ
echo [WARNING] requirements.txt 없음. 건너뜀.

:CHECK_OLLAMA
pause
:: 5. Ollama 확인
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe" >NUL
if "%ERRORLEVEL%"=="0" goto :OLLAMA_RUNNING

echo [INFO] Ollama 실행 시도...
start "" "ollama" serve
echo [INFO] 5초 대기...
timeout /t 5 > nul

:OLLAMA_RUNNING
echo [INFO] Ollama 준비 완료.
pause

:: 6. 서버 실행
echo.
echo [INFO] PixelBrain 서버 시작...
echo [INFO] http://localhost:5000
echo.
%PYTHON_CMD% dashboard/server.py
if %errorlevel% neq 0 goto :SERVER_FAIL

pause
endlocal
exit /b

:: --- 에러 처리 구간 ---
:VENV_FAIL
echo [ERROR] 가상 환경 생성 실패.
pause
exit /b

:ACTIVATE_FAIL
echo [ERROR] activate.bat 파일이 없음.
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
