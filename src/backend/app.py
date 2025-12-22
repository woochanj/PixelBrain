from flask import Flask
from flask_cors import CORS
import threading
# 만든 모듈들을 가져옵니다
from routes.chat import chat_bp
from routes.dashboard import dashboard_bp, cleanup_clients
# from routes.excel import excel_bp # 나중에 사용

app = Flask(__name__)
CORS(app) # 전체 허용

# --- Blueprint 등록 ---
# 기존 URL 구조 유지:
# /api/generate -> chat_bp
# /api/tags -> chat_bp
# /api/stats -> dashboard_bp
# /api/health -> dashboard_bp

app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
# app.register_blueprint(excel_bp, url_prefix='/api/excel')

# 백그라운드 작업 실행 (클라이언트 청소)
threading.Thread(target=cleanup_clients, daemon=True).start()

if __name__ == '__main__':
    print("🚀 PixelBrain Backend running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
