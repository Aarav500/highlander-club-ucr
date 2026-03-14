---
description: "LLM Leaderboard Integration — LiveBench + ARC-AGI-2 automated benchmark runner + model comparison"
---

# LLM Benchmark Live Workflow (V8.0)

> Automated model evaluation across reasoning, coding, math, and abstraction. Compare Claude, Gemini, Grok, Phi-4 on lab tasks. Feed results into model tier selection and DSPy optimization.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    LLM Benchmark Live V8.0                           │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  LiveBench     │  ARC-AGI-2     │  Lab Tasks     │  Leaderboard     │
│  (Reasoning)   │  (Abstraction) │  (Domain)      │  (Rankings)      │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ Math           │ Pattern recog. │ Code gen       │ Auto-rank        │
│ Coding         │ Visual puzzles │ Code review    │ Tier recommend   │
│ Data analysis  │ Concept learn  │ Bug fixing     │ Cost analysis    │
│ Language       │ Generalization │ Architecture   │ Historical trend │
│ Reasoning      │ Abstraction    │ Testing        │ Alert on regress │
└────────────────┴────────────────┴────────────────┴──────────────────┘
```

---

## Step 1: LiveBench Integration

```python
from livebench import LiveBenchRunner

class LiveBenchIntegration:
    """Run LiveBench evaluations across all lab models."""

    MODELS = [
        {"id": "claude-4.6-opus", "provider": "anthropic", "tier": 0},
        {"id": "claude-4.6-sonnet", "provider": "anthropic", "tier": 2},
        {"id": "gemini-3.1-pro", "provider": "google", "tier": 1},
        {"id": "grok-4.20", "provider": "xai", "tier": 1},
        {"id": "phi-4-14b", "provider": "microsoft", "tier": 3},
    ]

    CATEGORIES = [
        "math",           # Competition math, word problems
        "coding",         # Code generation, debugging
        "reasoning",      # Logical reasoning, inference
        "language",       # Comprehension, summarization
        "data_analysis",  # Table QA, chart reasoning
        "instruction",    # Instruction following
    ]

    async def run_benchmark(self, models: list = None, categories: list = None) -> dict:
        models = models or self.MODELS
        categories = categories or self.CATEGORIES
        results = {}

        for model in models:
            runner = LiveBenchRunner(model_id=model["id"], provider=model["provider"])
            model_results = {}

            for category in categories:
                score = await runner.evaluate(category=category, n_samples=100)
                model_results[category] = {
                    "score": score.accuracy,
                    "latency_p50_ms": score.latency_p50,
                    "latency_p99_ms": score.latency_p99,
                    "cost_per_1k": score.cost_per_1k_tokens,
                }

            results[model["id"]] = {
                "scores": model_results,
                "overall": sum(s["score"] for s in model_results.values()) / len(model_results),
                "tier": model["tier"],
            }

        return results
```

---

## Step 2: ARC-AGI-2 Benchmark

```python
class ARCAGI2Runner:
    """ARC-AGI-2 benchmark for abstract reasoning and generalization."""

    CHALLENGE_SETS = [
        "pattern_completion",     # Complete visual patterns
        "transformation_rules",   # Infer transformation rules
        "novel_concept_learning", # Learn new concepts from examples
        "spatial_reasoning",      # 2D/3D spatial manipulation
        "analogical_reasoning",   # A:B :: C:? analogies
    ]

    async def evaluate(self, model_id: str, challenge_set: str = "all") -> dict:
        challenges = self._load_challenges(challenge_set)
        results = {"correct": 0, "total": len(challenges), "details": []}

        for challenge in challenges:
            # Present training examples
            prompt = self._format_prompt(challenge.train_examples)
            prompt += self._format_test(challenge.test_input)

            # Get model response
            response = await self.model.generate(prompt)
            prediction = self._parse_grid(response)

            # Score
            correct = prediction == challenge.test_output
            results["correct"] += int(correct)
            results["details"].append({
                "id": challenge.id,
                "correct": correct,
                "difficulty": challenge.difficulty,
            })

        results["accuracy"] = results["correct"] / results["total"]
        return results
```

---

## Step 3: Lab Task Benchmarks

```python
class LabTaskBenchmark:
    """Custom benchmarks testing models on lab-specific tasks."""

    TASK_SUITES = {
        "code_generation": [
            "Generate Express REST endpoint from spec",
            "Create React component from Figma design",
            "Write database migration from schema diff",
        ],
        "code_review": [
            "Find security vulnerability in auth code",
            "Identify performance bottleneck in query",
            "Detect race condition in async handler",
        ],
        "bug_fixing": [
            "Fix flaky test caused by timing issue",
            "Resolve TypeScript strict mode errors",
            "Debug production 500 error from logs",
        ],
        "architecture": [
            "Design microservice decomposition",
            "Plan database schema for new feature",
            "Propose caching strategy for hot endpoint",
        ],
    }

    async def run(self, model_id: str) -> dict:
        results = {}
        for suite_name, tasks in self.TASK_SUITES.items():
            suite_results = []
            for task in tasks:
                result = await self._evaluate_task(model_id, task)
                suite_results.append(result)
            results[suite_name] = {
                "avg_score": sum(r["score"] for r in suite_results) / len(suite_results),
                "tasks": suite_results,
            }
        return results
```

---

## Step 4: Auto-Leaderboard + Tier Recommendation

```python
class AutoLeaderboard:
    """Maintain and update model rankings, recommend tier assignments."""

    def generate_leaderboard(self, benchmark_results: dict) -> dict:
        leaderboard = []
        for model_id, results in benchmark_results.items():
            entry = {
                "model": model_id,
                "livebench_overall": results["livebench"]["overall"],
                "arc_agi2_accuracy": results["arc_agi2"]["accuracy"],
                "lab_task_score": results["lab_tasks"]["avg_score"],
                "composite_score": self._weighted_composite(results),
                "cost_efficiency": results["cost_per_1k"] / results["composite"],
            }
            leaderboard.append(entry)

        leaderboard.sort(key=lambda x: x["composite_score"], reverse=True)

        return {
            "leaderboard": leaderboard,
            "recommended_tiers": self._assign_tiers(leaderboard),
            "timestamp": datetime.utcnow().isoformat(),
            "next_eval": "scheduled in 7 days",
        }

    def _assign_tiers(self, leaderboard: list) -> dict:
        """Auto-assign model tiers based on benchmark performance."""
        return {
            "tier_0_frontier": [m["model"] for m in leaderboard if m["composite_score"] >= 90],
            "tier_1_deep": [m["model"] for m in leaderboard if 80 <= m["composite_score"] < 90],
            "tier_2_standard": [m["model"] for m in leaderboard if 60 <= m["composite_score"] < 80],
            "tier_3_fast": [m["model"] for m in leaderboard if m["composite_score"] < 60],
        }
```

---

## Integration

| Workflow | How Benchmark Live Connects |
|----------|------------------------------|
| `swe-bench-agent.md` | SWE-bench scores feed the leaderboard |
| `dspy-v4.md` | Benchmark results guide prompt optimization |
| `swarm-v3.md` | Tier recommendations select models for swarm agents |
| `self-upgrade.md` | Identifies model regressions for pipeline switches |

---

## Commands

```bash
# Run full benchmark suite across all models
/benchmark-live --run --all

# Run LiveBench only
/benchmark-live --livebench --models claude-4.6-opus,gemini-3.1-pro

# Run ARC-AGI-2 only
/benchmark-live --arc-agi2 --model claude-4.6-opus

# Run lab task benchmarks
/benchmark-live --lab-tasks --model claude-4.6-sonnet

# View leaderboard
/benchmark-live --leaderboard

# Get tier recommendations
/benchmark-live --recommend-tiers

# Schedule periodic evaluation
/benchmark-live --schedule --interval 7d

# Compare two models head-to-head
/benchmark-live --compare --models claude-4.6-opus,gemini-3.1-pro

# Export results
/benchmark-live --export --format json --output benchmark-results.json
```
