---
description: "Small Language Models — Phi-4 + Gemma 3 on-device deployment with quantization"
---

# Small Language Models Workflow

> On-device LLM deployment: Phi-4 + Gemma 3 with GGUF quantization, llama.cpp/MLX inference, and mobile deployment via Core ML / NNAPI.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│               Small LM Deployment Stack                │
├──────────────┬──────────────┬──────────────────────────┤
│  Models      │  Quantization│  Runtimes                │
├──────────────┼──────────────┼──────────────────────────┤
│ Phi-4 (14B)  │ GGUF Q4_K_M  │ llama.cpp (CPU/GPU)     │
│ Gemma 3 (9B) │ GGUF Q5_K_S  │ MLX (Apple Silicon)     │
│ Qwen 2.5     │ AWQ (GPU)    │ Core ML (iOS)           │
│ Mistral v0.4 │ GPTQ (GPU)   │ NNAPI (Android)         │
│ SmolLM2      │ BitsAndBytes │ WASM (Browser)           │
└──────────────┴──────────────┴──────────────────────────┘
```

---

## Step 1: Model Selection Guide

| Model | Params | MMLU | Context | Best For |
|-------|--------|------|---------|----------|
| Phi-4 | 14B | 84.8 | 16K | Reasoning, code, math |
| Gemma 3 | 2B/9B/27B | 72-83 | 128K | General, multilingual |
| Qwen 2.5 | 3B/7B/14B | 70-79 | 128K | Code, tool use |
| SmolLM2 | 135M/360M/1.7B | 35-55 | 8K | Ultra-lightweight |

**Selection criteria:**
- **<2GB RAM:** SmolLM2 (135M-360M Q4)
- **2-4GB RAM:** Gemma 3 2B Q4 or SmolLM2 1.7B Q4
- **4-8GB RAM:** Phi-4 Q4 or Gemma 3 9B Q4
- **8-16GB RAM:** Phi-4 Q8 or Gemma 3 27B Q4

---

## Step 2: GGUF Quantization

```bash
# Clone and build llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make -j$(nproc)

# Convert HuggingFace model to GGUF
python convert_hf_to_gguf.py \
  --model microsoft/phi-4 \
  --outfile phi-4-fp16.gguf \
  --outtype f16

# Quantize to different levels
./llama-quantize phi-4-fp16.gguf phi-4-Q4_K_M.gguf Q4_K_M
./llama-quantize phi-4-fp16.gguf phi-4-Q5_K_S.gguf Q5_K_S
./llama-quantize phi-4-fp16.gguf phi-4-Q8_0.gguf Q8_0
```

### Quantization Size/Quality Tradeoffs

| Quantization | Size (Phi-4 14B) | Quality | Speed |
|-------------|-------------------|---------|-------|
| FP16 | 28 GB | Baseline | 1× |
| Q8_0 | 14 GB | ~99% of FP16 | 1.5× |
| Q5_K_S | 9.8 GB | ~97% of FP16 | 2× |
| Q4_K_M | 8.4 GB | ~95% of FP16 | 2.5× |
| Q3_K_S | 6.4 GB | ~90% of FP16 | 3× |
| Q2_K | 5.2 GB | ~85% of FP16 | 3.5× |

---

## Step 3: Local Inference

### llama.cpp Server

```bash
# Start local inference server
./llama-server \
  --model phi-4-Q4_K_M.gguf \
  --port 8080 \
  --ctx-size 4096 \
  --n-gpu-layers 35 \
  --threads 8 \
  --flash-attn

# OpenAI-compatible API
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "phi-4",
    "messages": [{"role": "user", "content": "Write a binary search in Python"}],
    "temperature": 0.7,
    "max_tokens": 512
  }'
```

### MLX (Apple Silicon)

```python
# MLX — optimized for M1/M2/M3/M4
from mlx_lm import load, generate

model, tokenizer = load("mlx-community/phi-4-4bit")

response = generate(
    model, tokenizer,
    prompt="Explain quantum computing in simple terms",
    max_tokens=256,
    temp=0.7,
)
print(response)
```

---

## Step 4: Mobile Deployment

### iOS (Core ML)

```python
# Convert to Core ML format
import coremltools as ct

# From ONNX
mlmodel = ct.convert(
    "phi-4-int8.onnx",
    convert_to="mlprogram",
    compute_precision=ct.precision.FLOAT16,
    minimum_deployment_target=ct.target.iOS17,
)

mlmodel.save("Phi4.mlpackage")
```

```swift
// Swift — Core ML inference
import CoreML

let config = MLModelConfiguration()
config.computeUnits = .cpuAndNeuralEngine

let model = try Phi4(configuration: config)
let input = Phi4Input(text: "Summarize this article:")
let output = try model.prediction(input: input)
print(output.generatedText)
```

### Android (NNAPI / TFLite)

```kotlin
// Android — TensorFlow Lite with NNAPI
val options = Interpreter.Options().apply {
    addDelegate(NnApiDelegate())
    numThreads = 4
}

val interpreter = Interpreter(loadModel("gemma-3-2b-q4.tflite"), options)
```

---

## Step 5: Browser Deployment (WASM)

```javascript
// Browser — llama.cpp WASM
import { LlamaCpp } from '@anthropic-ai/llama-cpp-wasm';

const llm = await LlamaCpp.init({
  modelUrl: '/models/smollm2-360m-q4.gguf',
  threads: navigator.hardwareConcurrency,
});

const response = await llm.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  maxTokens: 128,
  temperature: 0.7,
});
```

---

## Commands

```bash
# Download and quantize model
/small-language-models --download phi-4 --quantize Q4_K_M

# Start local server
/small-language-models --serve --model phi-4-Q4_K_M.gguf --port 8080

# Convert for iOS
/small-language-models --convert coreml --model phi-4 --target ios17

# Convert for Android
/small-language-models --convert tflite --model gemma-3-2b

# Benchmark on device
/small-language-models --benchmark --model phi-4-Q4_K_M --suite mmlu,humaneval

# Compare quantization levels
/small-language-models --compare-quant --model phi-4 --levels Q4_K_M,Q5_K_S,Q8_0
```
