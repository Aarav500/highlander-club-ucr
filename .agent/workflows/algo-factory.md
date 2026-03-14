---
description: "Novel algorithm generator — DSPy prompt optimization + Lean 4 formal proofs + patent drafts"
---

# Algo Factory Workflow

> Problem → Literature → Design → Implement → Prove → Patent. End-to-end novel algorithm pipeline.

---

## Pipeline

```
  Problem Statement
        │
        ▼
  Literature Search (Semantic Scholar, arXiv)
        │
        ▼
  Gap Analysis — identify what's missing in existing approaches
        │
        ▼
  Algorithm Design — DSPy-optimized prompt chain
        │
        ▼
  Implementation (Python / Rust / C++)
        │
        ▼
  Formal Verification (Lean 4 proofs)
        │
        ▼
  Benchmarking (vs baselines)
        │
        ▼
  Patent Draft (provisional application)
```

---

## Phase 1: Problem & Literature

1. **Define problem** — formal problem statement with input/output specification.
2. **Search existing solutions:**
   - arXiv API for recent papers
   - Semantic Scholar for citation networks
   - Patent databases (Google Patents, USPTO) for prior art
3. **Gap analysis** — identify limitations of existing approaches.
4. **⏸️ STOP — Review problem definition and gap analysis.**

---

## Phase 2: DSPy-Optimized Algorithm Design

Use DSPy to optimize the prompt chain for algorithm discovery:

```python
import dspy

class AlgorithmDesigner(dspy.Module):
    def __init__(self):
        self.problem_analyst = dspy.ChainOfThought("problem -> constraints, objectives, complexity_target")
        self.approach_generator = dspy.ChainOfThought("constraints, objectives, gap_analysis -> novel_approaches")
        self.algorithm_synthesizer = dspy.ChainOfThought("novel_approaches, complexity_target -> pseudocode, correctness_argument")

    def forward(self, problem, gap_analysis):
        analysis = self.problem_analyst(problem=problem)
        approaches = self.approach_generator(
            constraints=analysis.constraints,
            objectives=analysis.objectives,
            gap_analysis=gap_analysis,
        )
        algorithm = self.algorithm_synthesizer(
            novel_approaches=approaches.novel_approaches,
            complexity_target=analysis.complexity_target,
        )
        return algorithm
```

---

## Phase 3: Implementation

1. Generate implementation in target language (Python/Rust/C++).
2. Write comprehensive test suite.
3. Profile performance (time, memory, correctness).

---

## Phase 4: Lean 4 Formal Verification

1. **Translate algorithm to Lean 4:**
   ```lean
   theorem algorithm_correctness :
     ∀ (input : InputType),
       valid_input input →
       correct_output (algorithm input) :=
   by
     intro input h_valid
     -- proof steps
     sorry  -- to be filled by prover
   ```

2. **Prove properties:**
   - Correctness (outputs match specification)
   - Termination (algorithm halts on all valid inputs)
   - Complexity bounds (time/space within target)

3. **Auto-proof search** — attempt `omega`, `simp`, `aesop` tactics before manual proof.

---

## Phase 5: Benchmark & Patent

1. **Benchmark** against baselines on standard datasets.
2. **Generate patent draft** with claims, description, and figures.
3. **Produce research paper** (feeds into `/arxiv-bot`).

---

## Commands

```bash
/algo-factory --problem "optimal sorting for partially ordered data" --prove --patent
/algo-factory --novel --domain "graph algorithms" --target-complexity "O(n log n)"
/algo-factory --problem "zero-knowledge proof for HFT" --prove --patent
```
