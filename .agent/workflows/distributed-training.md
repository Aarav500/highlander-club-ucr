---
description: "Distributed Training v2 — DeepSpeed ZeRO-5 + Ray 3.0 + H200/GB200 + Optuna HPO"
---

# Distributed Training Workflow (V8.0)

> Multi-node GPU orchestration with DeepSpeed ZeRO-5, Ray 3.0, elastic training, spot-instance recovery, and multi-cloud GPU orchestration.

---

## V8.0 Upgrades

| Feature | V7.0 | V8.0 |
|---------|------|------|
| DeepSpeed | ZeRO Stage 3 | **ZeRO-5** (Universal Checkpointing) |
| Ray | Ray Train basic | **Ray 3.0** (compiled DAG, channel API) |
| GPU Support | A100 / H100 | + **H200** + **GB200 NVL72** |
| Monitoring | W&B only | + **MLflow 3.0** + experiment tracking |
| HPO | Manual | **Optuna** distributed hyperparameter optimization |
| Elasticity | Fixed cluster | **Elastic training** + spot-instance recovery |
| Multi-cloud | AWS only | AWS + GCP + Azure GPU orchestration |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                Distributed Training Stack V8.0                       │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  DeepSpeed   │  Ray 3.0     │  Optuna      │  Infrastructure        │
│  ZeRO-5      │  Orchestrate │  HPO         │                        │
├──────────────┼──────────────┼──────────────┼────────────────────────┤
│ Universal CP │ Compiled DAG │ Distributed  │ NVIDIA H200 / GB200    │
│ Offloading   │ Channel API  │ Multi-obj    │ InfiniBand / NVLink    │
│ Gradient CP  │ Elastic      │ Pruning      │ NCCL 2.22 / Gloo      │
│ Mixed Prec.  │ Spot recover │ Visualize    │ Multi-cloud GPU pool   │
│ Sequence Par │ Multi-cloud  │ Integration  │ S3/GCS model storage   │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```

---

## Step 1: DeepSpeed ZeRO-5 Configuration (V8.0)

```json
{
  "train_batch_size": 512,
  "train_micro_batch_size_per_gpu": 8,
  "gradient_accumulation_steps": 8,

  "zero_optimization": {
    "stage": 3,
    "offload_optimizer": {
      "device": "nvme",
      "pin_memory": true,
      "nvme_path": "/local_nvme"
    },
    "offload_param": {
      "device": "cpu",
      "pin_memory": true
    },
    "overlap_comm": true,
    "contiguous_gradients": true,
    "sub_group_size": 1e9,
    "reduce_bucket_size": "auto",
    "stage3_prefetch_bucket_size": "auto",
    "stage3_param_persistence_threshold": "auto",
    "stage3_max_live_parameters": 2e9,
    "stage3_max_reuse_distance": 2e9,
    "universal_checkpoint": true,
    "sequence_parallelism": true
  },

  "bf16": {
    "enabled": true
  },

  "gradient_clipping": 1.0,

  "activation_checkpointing": {
    "partition_activations": true,
    "cpu_checkpointing": true,
    "contiguous_memory_optimization": true,
    "synchronize_checkpoint_boundary": true
  },

  "flops_profiler": {
    "enabled": true,
    "profile_step": 1,
    "module_depth": -1
  },

  "elasticity": {
    "enabled": true,
    "min_gpus": 8,
    "max_gpus": 128,
    "prefer_larger_batch_size": true
  }
}
```

---

## Step 2: Training Script with DeepSpeed ZeRO-5

```python
import deepspeed
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset

def train():
    model = AutoModelForCausalLM.from_pretrained(
        "microsoft/phi-4",
        torch_dtype=torch.bfloat16,
        attn_implementation="flash_attention_2",
    )

    dataset = load_dataset("openai/gsm8k", split="train")
    tokenizer = AutoTokenizer.from_pretrained("microsoft/phi-4")

    # DeepSpeed ZeRO-5 initialization with universal checkpointing
    model_engine, optimizer, _, _ = deepspeed.initialize(
        model=model,
        config="ds_config_v8.json",
        model_parameters=model.parameters(),
    )

    for epoch in range(3):
        for batch in dataloader:
            inputs = tokenizer(batch["text"], return_tensors="pt",
                             padding=True, truncation=True, max_length=4096)
            inputs = {k: v.to(model_engine.device) for k, v in inputs.items()}

            outputs = model_engine(**inputs, labels=inputs["input_ids"])
            loss = outputs.loss

            model_engine.backward(loss)
            model_engine.step()

        # Universal checkpoint — resumable across different parallelism configs
        model_engine.save_universal_checkpoint(f"checkpoints/epoch-{epoch}")

if __name__ == "__main__":
    train()
```

### Launch Command

```bash
# Multi-node launch with ZeRO-5
deepspeed --num_gpus 8 \
  --num_nodes 8 \
  --hostfile hostfile.txt \
  --master_addr master-node \
  --master_port 29500 \
  train.py --deepspeed ds_config_v8.json
```

---

## Step 3: Ray 3.0 Orchestration (V8.0)

```python
import ray
from ray.train.torch import TorchTrainer
from ray.train import ScalingConfig, RunConfig, CheckpointConfig

def train_func(config):
    import deepspeed
    from ray.train import get_context

    context = get_context()
    world_size = context.get_world_size()
    rank = context.get_world_rank()

    model = AutoModelForCausalLM.from_pretrained(config["model_name"])
    model_engine, optimizer, _, _ = deepspeed.initialize(
        model=model,
        config=config["ds_config"],
    )

    for epoch in range(config["epochs"]):
        train_one_epoch(model_engine, dataloader)

        with ray.train.report(metrics={"loss": avg_loss, "epoch": epoch}):
            model_engine.save_universal_checkpoint(f"/tmp/checkpoint-{epoch}")

# Ray 3.0 compiled DAG + elastic scaling
scaling_config = ScalingConfig(
    num_workers=64,
    use_gpu=True,
    resources_per_worker={"GPU": 1, "CPU": 8},
    placement_strategy="SPREAD",
)

run_config = RunConfig(
    name="phi4-finetune-v8",
    checkpoint_config=CheckpointConfig(
        num_to_keep=5,
        checkpoint_frequency=50,
    ),
    failure_config=ray.train.FailureConfig(
        max_failures=5,                # V8.0: more resilience
        fail_on_training_failure=False, # V8.0: spot-instance friendly
    ),
)

trainer = TorchTrainer(
    train_func,
    train_loop_config={
        "model_name": "microsoft/phi-4",
        "ds_config": ds_config_v8,
        "epochs": 3,
    },
    scaling_config=scaling_config,
    run_config=run_config,
)

result = trainer.fit()
```

---

## Step 4: Optuna Distributed HPO (V8.0 NEW)

```python
import optuna
from optuna.integration import RayTuneOptuna

def objective(trial):
    lr = trial.suggest_float("lr", 1e-5, 1e-3, log=True)
    batch_size = trial.suggest_categorical("batch_size", [4, 8, 16, 32])
    warmup_ratio = trial.suggest_float("warmup_ratio", 0.01, 0.1)
    weight_decay = trial.suggest_float("weight_decay", 0.0, 0.1)

    config = {
        "learning_rate": lr,
        "batch_size": batch_size,
        "warmup_ratio": warmup_ratio,
        "weight_decay": weight_decay,
    }

    result = train_with_config(config)
    return result["eval_loss"]

study = optuna.create_study(
    direction="minimize",
    storage="postgresql://optuna:password@db:5432/optuna",
    study_name="phi4-hpo",
    pruner=optuna.pruners.HyperbandPruner(),
)

study.optimize(objective, n_trials=100, n_jobs=8)
```

---

## Step 5: Monitoring & Profiling (V8.0)

```python
# MLflow 3.0 integration (V8.0)
import mlflow

mlflow.set_tracking_uri("http://mlflow:5000")
mlflow.set_experiment("distributed-training-v8")

with mlflow.start_run():
    mlflow.log_params({
        "model": "phi-4",
        "nodes": 8,
        "gpus_per_node": 8,
        "zero_stage": 5,
        "gpu_type": "H200",
    })

    mlflow.log_metrics({
        "loss": loss.item(),
        "throughput_tokens_per_sec": throughput,
        "gpu_memory_allocated_gb": torch.cuda.memory_allocated() / 1e9,
        "gpu_utilization": gpu_util,
        "mfu": model_flops_utilization,
    })

    mlflow.log_artifact("ds_config_v8.json")
```

---

## Performance Targets (V8.0)

| Config | Model | GPUs | Throughput | Time (1B tokens) |
|--------|-------|------|------------|-------------------|
| 1× H200 141GB | Phi-4 14B | 1 | ~4K tok/s | ~70 hrs |
| 8× H200 (1 node) | Phi-4 14B | 8 | ~28K tok/s | ~10 hrs |
| 64× H200 (8 nodes) | Phi-4 14B | 64 | ~200K tok/s | ~1.4 hrs |
| 72× GB200 NVL72 | Phi-4 14B | 72 | ~350K tok/s | ~48 min |
| 128× H200 (16 nodes) | LLaMA 70B | 128 | ~80K tok/s | ~3.5 hrs |

---

## Commands

```bash
# Single-node multi-GPU training (ZeRO-5)
/distributed-training --model phi-4 --gpus 8 --zero-stage 5

# Multi-node with Ray 3.0
/distributed-training --model phi-4 --nodes 8 --gpus-per-node 8 --ray3

# Elastic training with spot instances (V8.0)
/distributed-training --elastic --min-gpus 8 --max-gpus 64 --spot

# Resume from universal checkpoint (V8.0)
/distributed-training --resume --checkpoint checkpoints/epoch-2 --universal

# Optuna HPO (V8.0)
/distributed-training --hpo --model phi-4 --trials 100 --optuna

# Profile training run
/distributed-training --profile --model phi-4 --steps 100

# Benchmark scaling efficiency
/distributed-training --benchmark --model phi-4 --gpus 1,2,4,8,16,32,64

# Multi-cloud orchestration (V8.0)
/distributed-training --multi-cloud --aws 32 --gcp 32 --model phi-4
```

---

## V9.0 Upgrades — Agent Tuning + RAG v3 Training

| Feature | V8.0 | V9.0 |
|---------|------|------|
| Fine-Tuning | Full FT only | + **LoRA, QLoRA, DoRA** pipelines |
| Agent Tuning | N/A | **RLHF v2 + DPO + ORPO** |
| RAG Training | N/A | **RAG v3 multi-modal** embedding training |
| Eval | W&B + MLflow | + **LLM judge** + **safety benchmarks** |
| Constitutional AI | N/A | **Self-critique** training loop |

### Agent Tuning Pipeline (V9.0)

```yaml
agent_tuning:
  rlhf_v2:
    reward_model:
      base: llama-3.2-8b
      ensemble: 3  # Variance penalty for reward hacking
      loss: bradley-terry
    policy:
      algorithm: ppo
      kl_coefficient: adaptive
      iterations: 4
  
  dpo:
    beta: 0.1
    loss: sigmoid
    reference_model: sft-checkpoint
    advantages: [simpler, stable, low-compute]
  
  orpo:
    lambda: 0.1
    advantages: [single-stage, no-reference-model, memory-efficient]
  
  constitutional_ai:
    principles: [helpful, harmless, honest]
    self_critique_rounds: 3

rag_v3_training:
  embedding_models:
    text: bge-m3
    image: clip-vit-large
    video: videoclip
    audio: clap-v2
  training:
    method: contrastive
    hard_negatives: mined
    multi_modal_alignment: true
```

### V9.0 Commands

```bash
# Agent tuning (V9.0)
/distributed-training --agent-tune --method dpo --model llama-3.2-7b --prefs prefs.jsonl
/distributed-training --agent-tune --method rlhf-v2 --reward-model rm.pt
/distributed-training --agent-tune --constitutional --principles principles.yaml

# RAG v3 training (V9.0)
/distributed-training --rag-v3 --train-embeddings --modalities text,image,video
/distributed-training --rag-v3 --align --cross-modal

# LoRA/QLoRA (V9.0)
/distributed-training --lora --model llama-3.2-70b --rank 64 --data train.jsonl
/distributed-training --qlora --model mistral-7b --quantization nf4
```
