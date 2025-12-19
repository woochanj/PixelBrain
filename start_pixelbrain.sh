#!/bin/bash

echo "==================================================="
echo "          PixelBrain 실행 (Start for macOS)"
echo "==================================================="

# 0. Kill existing processes
# Kill process checking specific port or name if possible, mimicking the bat file logic
pkill -f "src/backend/app.py" 2>/dev/null
# Using pkill node might be too aggressive if user has other node apps, but let's follow the bat logic for pixelbrain context
pkill -f "vite" 2>/dev/null 

# Setup Check
if [ ! -d "venv" ]; then
    echo "[경고] 가상환경(venv)이 없습니다."
    echo "먼저 './setup_pixelbrain.sh'를 실행해 주세요."
    exit 1
fi
if [ ! -d "src/frontend/node_modules" ]; then
    echo "[경고] React 설정이 완료되지 않았습니다."
    echo "먼저 './setup_pixelbrain.sh'를 실행해 주세요."
    exit 1
fi

# Run
echo ""
echo "[1/3] Ollama 서비스 확인..."
if pgrep -x "ollama" > /dev/null; then
    echo "  - Ollama가 이미 실행 중입니다."
else
    echo "  - Ollama를 시작합니다..."
    ollama serve &> /dev/null &
    echo "  - 3초 대기..."
    sleep 3
fi

echo ""
echo "[2/3] 백엔드 서버 시작 (Backend)..."
source venv/bin/activate
python3 src/backend/app.py &
BACKEND_PID=$!

echo "[2/2] 프론트엔드 시작 (Frontend)..."
echo "브라우저가 열릴 때까지 잠시만 기다려주세요."
cd src/frontend
npm run dev &
FRONTEND_PID=$!

# Handle exit
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait
