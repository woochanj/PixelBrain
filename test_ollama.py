import requests
import json

# Configuration
OLLAMA_API_URL = "http://192.168.61.249:11434/api/generate"
MODEL_NAME = "gemma3:12b"

def test_ollama():
    prompt = "Hello! Please assume you are a helpful assistant. Tell me a very short joke in Korean."
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
    
    print(f"Sending request to {OLLAMA_API_URL}...")
    print(f"Model: {MODEL_NAME}")
    print(f"Prompt: {prompt}")
    print("-" * 30)

    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        
        result = response.json()
        generated_text = result.get('response', '')
        
        print("\n[Response from Ollama]:")
        print(generated_text)
        print("-" * 30)
        print("Test successful!")
        
    except requests.exceptions.RequestException as e:
        print(f"\nError occurred: {e}")
        if hasattr(e, 'response') and e.response is not None:
             print(f"Response content: {e.response.text}")

if __name__ == "__main__":
    test_ollama()
