from flask import Blueprint, request, jsonify, Response
import requests

# 'chat'이라는 이름의 그룹을 만듭니다
chat_bp = Blueprint('chat', __name__)

OLLAMA_HOST = "http://localhost:11434"

@chat_bp.route('/generate', methods=['POST'])
def proxy_generate():
    """Proxy chat generation to Ollama."""
    try:
        # stream=True 등 기존 로직 그대로
        resp = requests.post(f"{OLLAMA_HOST}/api/generate", json=request.json, stream=True)
        return Response(resp.iter_content(chunk_size=None), content_type=resp.headers['Content-Type'])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/tags', methods=['GET'])
def proxy_tags():
    """Proxy model tags check to Ollama."""
    try:
        resp = requests.get(f"{OLLAMA_HOST}/api/tags")
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
