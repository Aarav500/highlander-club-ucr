---
description: "DSPy v4 + Auto-Optimizers — Self-improving agent prompt chains with MIPRO v3 + multi-model ensemble"
---

# DSPy v4 Workflow (V8.0)

> Self-improving agent chains with MIPRO v3, BetterTogether optimization, multi-hop reasoning, agent self-improvement loops, prompt mutation + selection, and cross-model transfer.

---

## V8.0 Upgrades

| Feature | V7.0 (dspy-v3) | V8.0 (dspy-v4) |
|---------|----------------|----------------|
| Optimizer | MIPRO v2 | **MIPRO v3** + **BetterTogether** |
| Reasoning | CoT distillation | + **Multi-hop** + **ReAct** + **Reflexion** |
| Optimization | Basic | **Self-improving agent chains** |
| Metrics | Manual | **Auto-metric discovery** + LiveBench eval |
| Models | Single-model | **Multi-model ensemble** optimization |
| Mutation | None | **Prompt mutation + selection** |
| Transfer | None | **Cross-model transfer learning** |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DSPy v4 Auto-Optimizer V8.0                       │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  Optimization  │  Reasoning     │  Self-Improve  │  Evaluation      │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ MIPRO v3       │ Multi-hop      │ Mutation       │ LiveBench        │
│ BetterTogether │ ReAct          │ Selection      │ Auto-metrics     │
│ Ensemble       │ Reflexion      │ Cross-model    │ A/B testing      │
│ Bayesian       │ Chain-of-Tbl   │ Feedback loop  │ Regression       │
└────────────────┴────────────────┴────────────────┴──────────────────┘
```

---

## Step 1: MIPRO v3 Optimization

```python
import dspy
from dspy.teleprompt import MIPROv3

# Define a DSPy program
class CodeReviewer(dspy.Module):
    def __init__(self):
        self.analyze = dspy.ChainOfThought("code, context -> issues")
        self.prioritize = dspy.Predict("issues -> ranked_issues")
        self.suggest = dspy.ChainOfThought("ranked_issues, code -> suggestions")

    def forward(self, code, context):
        issues = self.analyze(code=code, context=context)
        ranked = self.prioritize(issues=issues.issues)
        return self.suggest(ranked_issues=ranked.ranked_issues, code=code)

# MIPRO v3 optimization
optimizer = MIPROv3(
    metric=code_review_quality_metric,
    num_candidates=30,
    num_threads=8,
    max_bootstrapped_demos=8,
    max_labeled_demos=16,
    # V8.0: multi-model candidates
    candidate_models=["claude-4.6-sonnet", "gemini-3.1-pro", "grok-4.20"],
)

optimized_reviewer = optimizer.compile(
    CodeReviewer(),
    trainset=code_review_trainset,
    eval_kwargs={"num_threads": 8},
)
```

---

## Step 2: Multi-Model Ensemble Optimization (V8.0 NEW)

```python
class EnsembleOptimizer(dspy.Module):
    """Optimize across multiple models simultaneously."""

    def __init__(self, models: list[str]):
        self.models = models
        self.router = dspy.Predict("task_type, complexity -> best_model")
        self.modules = {
            model: dspy.ChainOfThought("input -> output")
            for model in models
        }

    def forward(self, input, task_type="general"):
        # Route to best model based on task
        routing = self.router(task_type=task_type, complexity=self.estimate_complexity(input))
        best_model = routing.best_model

        # Run on selected model
        with dspy.context(lm=self.models[best_model]):
            result = self.modules[best_model](input=input)

        return result
```

---

## Step 3: Self-Improving Agent Chains (V8.0 NEW)

```python
class SelfImprovingAgent:
    """Agent that improves its own prompts through iterative optimization."""

    async def improve_loop(self, program: dspy.Module, trainset, max_iterations=10):
        current_score = await self.evaluate(program, trainset)

        for iteration in range(max_iterations):
            # Step 1: Mutate prompts
            mutations = self.generate_mutations(program, n=5)

            # Step 2: Evaluate mutations
            scored_mutations = []
            for mutation in mutations:
                score = await self.evaluate(mutation, trainset)
                scored_mutations.append((mutation, score))

            # Step 3: Select best
            best_mutation, best_score = max(scored_mutations, key=lambda x: x[1])

            # Step 4: Accept or reject
            if best_score > current_score:
                program = best_mutation
                current_score = best_score
                print(f"Iteration {iteration}: Improved to {current_score:.3f}")
            else:
                print(f"Iteration {iteration}: No improvement ({current_score:.3f})")

            # Step 5: Early stopping
            if current_score >= 0.95:
                break

        return program

    def generate_mutations(self, program, n=5):
        """Generate prompt mutations: rephrase, add examples, restructure."""
        mutations = []
        for _ in range(n):
            mutation = copy.deepcopy(program)
            strategy = random.choice(["rephrase", "add_demo", "restructure", "simplify", "elaborate"])
            self.apply_mutation(mutation, strategy)
            mutations.append(mutation)
        return mutations
```

---

## Step 4: Auto-Metric Discovery (V8.0 NEW)

```python
class AutoMetricDiscovery:
    """Automatically discover evaluation metrics from task examples."""

    async def discover_metrics(self, task_description: str, examples: list) -> list[Metric]:
        # Use LLM to analyze examples and propose metrics
        proposed = await self.model.generate(
            f"Given this task and examples, propose 3-5 evaluation metrics:\n"
            f"Task: {task_description}\n"
            f"Examples: {examples[:5]}\n"
            f"For each metric, provide: name, description, scoring function (python)"
        )

        metrics = self.parse_metrics(proposed)

        # Validate metrics on held-out examples
        validated = []
        for metric in metrics:
            correlation = self.validate_metric(metric, examples)
            if correlation > 0.7:
                validated.append(metric)

        return validated
```

---

## Commands

```bash
# Optimize a DSPy program
/dspy-v4 --optimize --program CodeReviewer --trainset data/train.json

# Self-improving agent loop (V8.0)
/dspy-v4 --self-improve --program CodeReviewer --iterations 10

# Multi-model ensemble (V8.0)
/dspy-v4 --ensemble --models claude-4.6,gemini-3.1,grok-4.20 --task code-review

# Auto-discover metrics (V8.0)
/dspy-v4 --auto-metrics --task "code review" --examples data/examples.json

# Prompt mutation + selection (V8.0)
/dspy-v4 --mutate --program CodeReviewer --mutations 10

# Cross-model transfer (V8.0)
/dspy-v4 --transfer --from claude-4.6 --to gemini-3.1 --program CodeReviewer

# Evaluate with LiveBench
/dspy-v4 --eval --benchmark livebench --program CodeReviewer

# Export optimized program
/dspy-v4 --export --program CodeReviewer --format json
```

---

## Integration

| Workflow | How DSPy v4 Connects |
|----------|------------------------------|
| `swe-bench-agent.md` | AI repair loop uses DSPy-optimized prompts |
| `benchmark-live.md` | LiveBench eval feeds optimization metrics |
| `swarm-v3.md` | Swarm agents use DSPy-optimized chains |
| `agent-governance.md` | Constitutional constraints apply to DSPy programs |
