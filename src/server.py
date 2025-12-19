from flask import Flask, render_template, jsonify, request, send_from_directory, session, redirect, url_for
from flask_cors import CORS
import psutil
import requests
import time
import socket
import threading
import os

app = Flask(__name__)
# Secret key needed for session. In production, use a random secure value.
app.secret_key = 'super_secret_ollama_key' 
CORS(app)

# Configuration
OLLAMA_HOST = "http://localhost:11434"
DASHBOARD_PASSWORD = "dncks"

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

# --- Routes ---

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == DASHBOARD_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('dashboard_view'))
        else:
            return render_template('login.html', error="ACCESS DENIED")
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard_view():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('dashboard.html')

# --- Chat App Routes ---

@app.route('/chat')
@app.route('/chat/')
def chat_home():
    return render_template('chat.html')

# -----------------------

@app.route('/api/stats')
def get_stats():
    # System Stats
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    
    # Ollama Stats
    ollama_info = get_ollama_status()
    
    # Client Stats - Format for frontend
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

if __name__ == '__main__':
    # Get local IP to print access URL
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"🚀 Dashboard running at: http://{local_ip}:5000")
    print(f"🔒 Local access: http://127.0.0.1:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
