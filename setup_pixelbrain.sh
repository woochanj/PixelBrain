#!/bin/bash

echo "==================================================="
echo "       PixelBrain 초기 설정 (Setup for macOS)"
echo "==================================================="
echo ""

# 1. Check Python
echo "[1/4] Python 확인 중..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    echo "  - Python 감지됨: $PYTHON_CMD"
else
    echo "[오류] Python3를 찾을 수 없습니다. (brew install python)"
    exit 1
fi

# 2. Create venv
echo ""
echo "[2/4] 가상환경(venv) 구성 중..."
if [ -d "venv" ]; then
    echo "  - 기존 가상환경이 존재하여 건너뜁니다."
else
    echo "  - 가상환경을 생성합니다..."
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo "[오류] 가상환경 생성 실패."
        exit 1
    fi
    echo "  - 생성 완료."
fi

# 3. Install Requirements
echo ""
echo "[3/4] Python 라이브러리 설치 중..."
source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[오류] 라이브러리 설치 실패."
    exit 1
fi
echo "  - 설치 완료."

# 4. Install React Dependencies
echo ""
echo "[4/4] React 프론트엔드 설정 중..."
if [ ! -f "src/frontend/package.json" ]; then
    echo "[오류] src/frontend 폴더에 React 프로젝트가 없습니다."
    exit 1
fi

cd src/frontend
if [ ! -d "node_modules" ]; then
    echo "  - npm install 실행 중 (시간이 조금 걸립니다)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[오류] npm install 실패. Node.js가 설치되어 있는지 확인하세요."
        exit 1
    fi
else
    echo "  - node_modules가 이미 존재합니다. (건너뜀)"
fi

echo ""
echo "==================================================="
echo "          설정 완료! (Setup Complete)"
echo "==================================================="
echo ""
echo "이제 './start_pixelbrain.sh'를 실행하여 시작하세요."
echo "('chmod +x *.sh' 명령어로 실행 권한을 줘야 할 수도 있습니다)"
echo ""
