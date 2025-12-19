@echo off
setlocal
chcp 65001 > nul

echo ===================================================
echo       PixelBrain 초기 설정 (Setup)
echo ===================================================
echo.

:: 1. Python 감지
echo [1/4] Python 확인 중...
py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    goto :PYTHON_FOUND
)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    goto :PYTHON_FOUND
)
echo [오류] Python을 찾을 수 없습니다. Python을 설치해 주세요.
pause
exit /b 1

:PYTHON_FOUND
echo   - Python 감지됨: %PYTHON_CMD%

:: 2. 가상환경(venv) 생성
echo.
echo [2/4] 가상환경(venv) 구성 중...
if exist "venv" (
    echo   - 기존 가상환경이 존재하여 건너뜁니다.
) else (
    echo   - 가상환경을 생성합니다...
    %PYTHON_CMD% -m venv venv
    if %errorlevel% neq 0 (
        echo [오류] 가상환경 생성 실패.
        pause
        exit /b 1
    )
    echo   - 생성 완료.
)

:: 3. Python 라이브러리 설치
echo.
echo [3/4] Python 라이브러리 설치 중...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [오류] 가상환경 진입 실패.
    pause
    exit /b 1
)
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [오류] 라이브러리 설치 실패.
    pause
    exit /b 1
)
echo   - 설치 완료.

:: 4. React 의존성 설치
echo.
echo [4/4] React 프론트엔드 설정 중...
if not exist "src\frontend\package.json" (
    echo [오류] src\frontend 폴더에 React 프로젝트가 없습니다.
    pause
    exit /b 1
)

cd src\frontend
if not exist "node_modules" (
    echo   - npm install 실행 중 (시간이 조금 걸립니다)...
    call npm install
    if %errorlevel% neq 0 (
        echo [오류] npm install 실패. Node.js가 설치되어 있는지 확인하세요.
        pause
        exit /b 1
    )
) else (
    echo   - node_modules가 이미 존재합니다. (건너뜀)
)

echo.
echo ===================================================
echo          설정 완료! (Setup Complete)
echo ===================================================
echo.
echo 이제 'start_pixelbrain.bat'을 실행하여 시작하세요.
echo.
pause
