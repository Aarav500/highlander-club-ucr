---
description: "DSPy v3 + Auto-Optimizers — Self-improving agent prompt chains"
---

# DSPy v3 Workflow

> Self-improving agent prompt chains with MIPRO v2 optimization, automatic metric discovery, chain-of-thought distillation, and prompt bootstrapping.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DSPy v3 Stack                         │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Signatures  │  Optimizers  │  Evaluators  │  Registry  │
│  (Programs)  │  (Auto-tune) │  (Metrics)   │  (Cache)   │
├──────────────┼──────────────┼──────────────┼────────────┤
│ ChainOfThought│ MIPRO v2   │ Auto-Metric  │ Prompt DB  │
│ ReAct        │ BootstrapFS │ LLM Judge    │ Versioning │
│ ProgramOfThT │ COPRO      │ Human-in-Loop│ A/B Test   │
│ MultiHop     │ Ensemble   │ Regression   │ Rollback   │
└──────────────┴──────────────┴──────────────┴────────────┘
```

---

## Core Concepts

### Signatures — Typed Prompts

```python
import dspy

class CodeReview(dspy.Signature):
    """Review code for bugs, style issues, and security vulnerabilities."""
    code: str = dspy.InputField(desc="Source code to review")
    language: str = dspy.InputField(desc="Programming language")
    review: str = dspy.OutputField(desc="Detailed review with line references")
    severity: str = dspy.OutputField(desc="Overall severity: low/medium/high/critical")
    suggestions: list[str] = dspy.OutputField(desc="Specific improvement suggestions")

class SpecToCode(dspy.Signature):
    """Generate implementation code from a product specification."""
    spec: str = dspy.InputField(desc="Product specification")
    tech_stack: str = dspy.InputField(desc="Target technology stack")
    code: str = dspy.OutputField(desc="Complete implementation code")
    tests: str = dspy.OutputField(desc="Test suite for the implementation")
```

### Programs — Composable Chains

```python
class AgentChain(dspy.Module):
    """Multi-step agent that plans, implements, and reviews."""

    def __init__(self):
        self.planner = dspy.ChainOfThought(SpecToCode)
        self.reviewer = dspy.ChainOfThought(CodeReview)
        self.refiner = dspy.ChainOfThought("code, review -> improved_code")

    def forward(self, spec: str, tech_stack: str):
        # Step 1: Generate code from spec
        plan_result = self.planner(spec=spec, tech_stack=tech_stack)

        # Step 2: Review generated code
        review_result = self.reviewer(
            code=plan_result.code, language=tech_stack
        )

        # Step 3: Refine based on review
        if review_result.severity in ("high", "critical"):
            refined = self.refiner(
                code=plan_result.code, review=review_result.review
            )
            return dspy.Prediction(
                code=refined.improved_code,
                tests=plan_result.tests,
                review=review_result,
            )

        return dspy.Prediction(
            code=plan_result.code,
            tests=plan_result.tests,
            review=review_result,
        )
```

---

## Optimizers

### MIPRO v2 — Multi-prompt Instruction Proposal

```python
from dspy.teleprompt import MIPROv2

# Define evaluation metric
def code_quality_metric(example, prediction, trace=None):
    # Run tests
    test_pass = run_tests(prediction.code, prediction.tests)
    # Check style
    lint_score = run_linter(prediction.code)
    # Security scan
    security_ok = security_scan(prediction.code)

    return (test_pass * 0.5) + (lint_score * 0.3) + (security_ok * 0.2)

# Optimize
optimizer = MIPROv2(
    metric=code_quality_metric,
    num_candidates=20,
    num_trials=50,
    max_bootstrapped_demos=4,
    max_labeled_demos=8,
    auto_generate_metrics=True,  # v3: auto-discover additional metrics
)

optimized_chain = optimizer.compile(
    AgentChain(),
    trainset=training_examples,
    eval_kwargs={"num_threads": 8},
)
```

### Bootstrap Few-Shot

```python
from dspy.teleprompt import BootstrapFewShot

bootstrap = BootstrapFewShot(
    metric=code_quality_metric,
    max_bootstrapped_demos=4,
    max_labeled_demos=4,
    max_rounds=3,
)

optimized = bootstrap.compile(AgentChain(), trainset=examples)
```

### Ensemble Optimizer

```python
from dspy.teleprompt import Ensemble

ensemble = Ensemble(
    reduce_fn=dspy.majority,  # or custom merge function
    size=5,
)

ensemble_chain = ensemble.compile(
    [optimizer_1.compile(...), optimizer_2.compile(...), ...]
)
```

---

## Auto-Metric Discovery (v3 Feature)

```python
# DSPy v3 — automatically discover evaluation metrics
from dspy.evaluate import AutoMetric

auto_metric = AutoMetric(
    task_description="Code generation from product specs",
    example_inputs=training_examples,
    candidate_metrics=[
        "test_pass_rate",
        "code_complexity",
        "readability_score",
        "security_vulnerabilities",
        "performance_benchmarks",
    ],
)

# Discovers which metrics correlate with human preferences
discovered_metrics = auto_metric.discover(
    human_ratings=human_preference_data,
    num_trials=100,
)

# Use discovered metric composition
composite_metric = auto_metric.compose(discovered_metrics)
```

---

## Chain-of-Thought Distillation

```python
# Distill large model CoT into smaller model
from dspy.teleprompt import KNNFewShot

# Teacher: Claude Opus 4.6
teacher_lm = dspy.LM("anthropic/claude-opus-4.6")

# Student: Phi-4 (local)
student_lm = dspy.LM("ollama/phi-4")

# Generate teacher demonstrations
with dspy.context(lm=teacher_lm):
    teacher_chain = optimizer.compile(AgentChain(), trainset=examples)
    teacher_demos = teacher_chain.demos

# Distill to student
with dspy.context(lm=student_lm):
    distilled = KNNFewShot(k=5, trainset=teacher_demos).compile(AgentChain())
```

---

## Integration with Lab Workflows

```python
# Apply DSPy optimization to any lab workflow agent
from dspy_lab import optimize_agent

# Optimize the swarm-v3 architect agent
optimized_architect = optimize_agent(
    agent_name="architect",
    workflow="swarm-v3",
    metric=architecture_quality_metric,
    training_data="benchmarks/architecture-examples.json",
    optimizer="mipro_v2",
    num_trials=30,
)

# Save optimized prompts
optimized_architect.save("~/.claude/skills/learned/swarm-v3/architect_optimized.json")
```

---

## Commands

```bash
# Optimize an agent chain
/dspy-v3 --optimize --program AgentChain --metric code_quality --trials 50

# Auto-discover metrics
/dspy-v3 --auto-metric --task "code review" --examples examples.json

# Distill CoT from large to small model
/dspy-v3 --distill --teacher claude-opus --student phi-4 --task code_gen

# Bootstrap few-shot examples
/dspy-v3 --bootstrap --program AgentChain --demos 8

# Evaluate optimized vs baseline
/dspy-v3 --evaluate --baseline AgentChain --optimized optimized_chain --test test.json

# Apply to lab workflow
/dspy-v3 --apply --workflow swarm-v3 --agent architect --trials 30
```
