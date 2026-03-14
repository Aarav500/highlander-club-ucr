---
description: "Set up local LLM inference with Ollama + vLLM + NVIDIA NIM"
---

# Local LLM Infrastructure Workflow

> Run models locally: Ollama for dev, vLLM for production throughput, NVIDIA NIM for enterprise GPU inference.

---

## Architecture

```
  Agent Workflows       Model Router              Inference Backends
  ──────────────────────────────────────────────────────────────────
                      ┌──────────────┐
  /swarm-v2     →     │              │  →  Ollama     (dev, CPU/GPU)
  /arxiv-bot    →     │ Model Router │  →  vLLM       (prod, GPU)
  /algo-factory →     │              │  →  NVIDIA NIM (enterprise GPU)
                      └──────────────┘
                             ↑
                      router-config.yaml
                      (task → model mapping)
```

---

## Phase 1: Ollama Setup (Dev / Local)

1. **Install Ollama:**
   ```bash
   # macOS / Linux
   curl -fsSL https://ollama.ai/install.sh | sh

   # Windows
   winget install Ollama.Ollama
   ```

2. **Pull models from registry:**
   ```bash
   # Code generation
   ollama pull codellama:34b
   ollama pull deepseek-coder-v2:16b

   # General reasoning
   ollama pull llama3.1:70b
   ollama pull mistral-large:latest

   # Small / fast
   ollama pull phi-3:mini
   ollama pull gemma2:9b
   ```

3. **Verify:**
   ```bash
   ollama list
   ollama run llama3.1:70b "Hello, test inference"
   ```

4. **API endpoint:** `http://localhost:11434/api/generate`

---

## Phase 2: vLLM Setup (Production Throughput)

1. **Install vLLM:**
   ```bash
   pip install vllm
   ```

2. **Start vLLM server:**
   ```bash
   python -m vllm.entrypoints.openai.api_server \
     --model meta-llama/Meta-Llama-3.1-70B-Instruct \
     --tensor-parallel-size 2 \
     --max-model-len 32768 \
     --gpu-memory-utilization 0.9 \
     --port 8000
   ```

3. **API endpoint:** OpenAI-compatible at `http://localhost:8000/v1`

4. **Batch inference:**
   ```bash
   python -m vllm.entrypoints.openai.api_server \
     --model deepseek-ai/DeepSeek-Coder-V2-Instruct \
     --max-num-batched-tokens 65536 \
     --port 8001
   ```

---

## Phase 3: NVIDIA NIM Setup (Enterprise GPU)

1. **Pull NIM container:**
   ```bash
   docker pull nvcr.io/nim/meta/llama-3.1-70b-instruct:latest
   ```

2. **Run with GPU passthrough:**
   ```bash
   docker run -d --gpus all \
     -p 8000:8000 \
     -e NGC_API_KEY=$NGC_API_KEY \
     nvcr.io/nim/meta/llama-3.1-70b-instruct:latest
   ```

3. **API endpoint:** OpenAI-compatible at `http://localhost:8000/v1`

---

## Phase 4: Docker Compose (All-in-One)

Use the Docker Compose config in `infra/local-inference/docker-compose.yaml`:

```bash
cd infra/local-inference
docker compose up -d
```

This starts:
- Ollama on port `11434`
- vLLM on port `8000`
- NIM on port `8001`

---

## Phase 5: Model Router Configuration

Configure `infra/local-inference/router-config.yaml` to route tasks to the right backend:

| Task Type | Model | Backend | Reason |
|-----------|-------|---------|--------|
| Code generation | DeepSeek Coder V2 | vLLM | Best code quality |
| Research writing | Llama 3.1 70B | vLLM | Strong reasoning |
| Quick edits | Phi-3 Mini | Ollama | Fast, low resource |
| Security audit | Llama 3.1 70B | NIM | Enterprise compliance |
| Summarization | Gemma 2 9B | Ollama | Efficient for summaries |

---

## Phase 6: Integration with Agent Workflows

Update agent workflows to use local models when available:

```yaml
# In any workflow, agents check local availability first:
model_routing:
  prefer: local           # Use local if available
  fallback: cloud         # Fall back to cloud API
  local_endpoint: http://localhost:8000/v1
  cloud_endpoint: https://api.anthropic.com/v1
```

---

## Health Check & Benchmarks

```bash
# Check all backends
curl http://localhost:11434/api/tags    # Ollama
curl http://localhost:8000/v1/models    # vLLM
curl http://localhost:8001/v1/models    # NIM

# Benchmark throughput
python -c "
import time, requests
start = time.time()
r = requests.post('http://localhost:8000/v1/completions', json={
    'model': 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    'prompt': 'Write a Python function to sort a list',
    'max_tokens': 200
})
print(f'Latency: {time.time()-start:.2f}s')
print(f'Tokens/s: {r.json()[\"usage\"][\"completion_tokens\"]/(time.time()-start):.1f}')
"
```

---

## Commands

```bash
# Set up local inference (interactive)
/local-llm --setup

# Pull specific models
/local-llm --pull codellama:34b,llama3.1:70b

# Start all backends
/local-llm --start

# Health check
/local-llm --health

# Benchmark
/local-llm --benchmark --model llama3.1:70b

# Route agent workflows to local
/local-llm --integrate
```
