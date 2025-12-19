from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import psutil
import time
import threading

app = Flask(__name__)
# Allow CORS for React frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
OLLAMA_HOST = "http://localhost:11434"

# Store connected clients (IPs)
connected_clients = {}

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

@app.before_request
def track_client():
    """Middleware to track connected clients."""
    if request.path.startswith('/static') or request.path.startswith('/api'):
        return
        
    client_ip = request.remote_addr
    connected_clients[client_ip] = time.time()

# Clean up old clients
def cleanup_clients():
    while True:
        time.sleep(60)
        cutoff = time.time() - 300 
        to_remove = [ip for ip, last_seen in connected_clients.items() if last_seen < cutoff]
        for ip in to_remove:
            del connected_clients[ip]

threading.Thread(target=cleanup_clients, daemon=True).start()

# --- API Routes ---

@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok", "message": "PixelBrain Backend is running"})

@app.route('/api/stats')
def get_stats():
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    ollama_info = get_ollama_status()
    active_clients = [
        {"ip": ip, "last_seen": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ts))}
        for ip, ts in connected_clients.items()
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

@app.route('/api/generate', methods=['POST'])
def proxy_generate():
    """Proxy chat generation to Ollama."""
    try:
        resp = requests.post(f"{OLLAMA_HOST}/api/generate", json=request.json, stream=True)
        return app.response_class(resp.iter_content(chunk_size=None), content_type=resp.headers['Content-Type'])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tags', methods=['GET'])
def proxy_tags():
    """Proxy model tags check to Ollama."""
    try:
        resp = requests.get(f"{OLLAMA_HOST}/api/tags")
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 PixelBrain Backend running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
