from flask import Blueprint, jsonify, request
import psutil
import time
import requests

dashboard_bp = Blueprint('dashboard', __name__)

# 전역 변수나 헬퍼 함수들을 이곳으로 이동
connected_clients = {}
OLLAMA_HOST = "http://localhost:11434"

def get_ollama_status():
    """Check if Ollama is running and get loaded models."""
    try:
        # Check process
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=1)
        if response.status_code == 200:
            return {"status": "online", "models": response.json().get("models", [])}
        return {"status": "error", "message": f"Status code: {response.status_code}"}
    except requests.exceptions.RequestException:
        return {"status": "offline", "message": "Connection refused"}

def cleanup_clients():
    """Clean up old clients."""
    while True:
        time.sleep(60)
        cutoff = time.time() - 300 
        to_remove = [ip for ip, last_seen in connected_clients.items() if last_seen < cutoff]
        for ip in to_remove:
            del connected_clients[ip]

# 모든 요청에 대해 클라이언트 추적 (App-wide)
@dashboard_bp.before_app_request
def track_client():
    """Middleware to track connected clients."""
    if request.path.startswith('/static'):
        return
        
    client_ip = request.remote_addr
    if client_ip:
        connected_clients[client_ip] = time.time()

@dashboard_bp.route('/stats')
def get_stats():
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    ollama_info = get_ollama_status()
    active_clients = [
        {"ip": ip, "last_seen": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ts))}
        for ip, ts in connected_clients.items()
        if ip != '127.0.0.1'
    ]
    return jsonify({
        "system": {
            "cpu": cpu_percent,
            "ram_percent": memory.percent,
            "ram_used_gb": round(memory.used / (1024**3), 2),
            "ram_total_gb": round(memory.total / (1024**3), 2)
        },
        "ollama": ollama_info,
        "clients": active_clients
    })

@dashboard_bp.route('/health')
def health_check():
    return jsonify({"status": "ok", "message": "PixelBrain Backend is running"})
