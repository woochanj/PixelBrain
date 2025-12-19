import requests
import json
import time

# Configuration
OLLAMA_API_URL = "http://192.168.61.249:11434/api/generate"
MODEL_NAME = "gemma3:12b"
TEST_PROMPT = "Write a short poem about the speed of light."

def run_benchmark():
    payload = {
        "model": MODEL_NAME,
        "prompt": TEST_PROMPT,
        "stream": False  # Get full response statistics at once
    }

    print(f"🚀 Starting benchmark for model: {MODEL_NAME}")
    print(f"Target: {OLLAMA_API_URL}")
    print("-" * 50)
    
    try:
        start_time = time.time()
        print("Waiting for response...", end="", flush=True)
        
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        
        total_real_time = time.time() - start_time
        print(" Done!")
        print("-" * 50)

        result = response.json()
        
        # Extract metrics specifically provided by Ollama
        # Note: durations are in nanoseconds
        eval_count = result.get('eval_count', 0)  # Number of tokens generated
        eval_duration = result.get('eval_duration', 0) # Time spent generating tokens (ns)
        prompt_eval_count = result.get('prompt_eval_count', 0) # Prompt tokens
        prompt_eval_duration = result.get('prompt_eval_duration', 0) # Prompt processing time (ns)
        total_duration = result.get('total_duration', 0) # Total time (ns)

        # Calculate Tokens Per Second (TPS)
        # Convert nanoseconds to seconds: ns / 1e9
        eval_duration_sec = eval_duration / 1e9
        prompt_eval_duration_sec = prompt_eval_duration / 1e9
        
        generation_tps = eval_count / eval_duration_sec if eval_duration_sec > 0 else 0
        prompt_tps = prompt_eval_count / prompt_eval_duration_sec if prompt_eval_duration_sec > 0 else 0

        print(f"📊 Performance Report:")
        print(f"1. Token Generation Speed (TPS):  {generation_tps:.2f} tokens/sec")
        print(f"   (Higher is better - The speed of typing the answer)")
        
        print(f"\n2. Prompt Processing Speed:       {prompt_tps:.2f} tokens/sec")
        print(f"   (Higher is better - How fast it reads your question)")
        
        print(f"\n3. Total Tokens Generated:        {eval_count} tokens")
        print(f"4. Total Response Time:           {total_real_time:.2f} seconds")
        
        print("-" * 50)
        print("Raw Stats (from Ollama):")
        print(f"- Load Duration: {result.get('load_duration', 0)/1e6:.2f} ms")
        print(f"- Prompt Eval:   {prompt_eval_duration/1e6:.2f} ms")
        print(f"- Generation:    {eval_duration/1e6:.2f} ms")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Benchmark Failed: {e}")

if __name__ == "__main__":
    run_benchmark()
