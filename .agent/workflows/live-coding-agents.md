---
description: Live execution frameworks — Replit AI agents + Cursor v4 SWE-bench 90% + Zed v0.19 AI-native IDE
---

# Live Coding Agents (V9.0)

> Real-time AI pair programming across three leading execution environments. Agents write, test, and deploy code live — no batch mode, no waiting.

## Prerequisites

- Replit account with AI Agent access
- Cursor v4 with SWE-bench leader mode enabled
- Zed v0.19+ with Context Server protocol
- `CLAUDE.md` context loaded in all three IDEs

## When to Use

- Real-time collaborative AI coding sessions
- SWE-bench 90%+ quality code generation
- Multi-IDE parallel execution (write in one, verify in another)
- Live demo environments for conferences and workshops

---

## Phase 1: Environment Setup

### 1.1 Replit AI Agent Configuration

```yaml
# .replit-agent.yaml
agent:
  version: "2026.1"
  model: claude-4.6-opus
  capabilities:
    - live-coding
    - test-generation
    - deployment
    - debugging
  context:
    load: ["CLAUDE.md", "specs/*.md", "plans/*.md"]
  sandbox:
    runtime: nodejs-22
    ports: [3000, 4000]
    persistence: true
  collaboration:
    mode: pair
    human_override: true
    auto_commit: false
```

### 1.2 Cursor v4 SWE-bench 90% Mode

```yaml
# .cursor/swe-bench-90.yaml
swe_bench:
  target: 90
  mode: leader
  pipeline:
    - lint: [eslint-v9, biome-v2, oxlint]
    - test: [vitest, playwright, stryker-mutation]
    - review: [5-agent-pr-review]
    - repair: [auto-repair-loop, max_iterations: 5]
  composer_ai:
    enabled: true
    model: claude-4.6
    context_window: 200k
    multi_file: true
    codebase_aware: true
  live_execution:
    enabled: true
    stream_output: true
    hot_reload: true
```

### 1.3 Zed v0.19 AI-Native Configuration

```yaml
# .zed/settings.json (V9.0 additions)
zed_ai:
  version: "0.19"
  context_server:
    protocol: "lsp-ai-v2"
    model: claude-4.6
    providers: [anthropic, google, local-ollama]
  inline_assist:
    enabled: true
    multi_buffer: true
    tree_sitter_aware: true
  collaboration:
    live_share: true
    ai_participants: true
    conflict_resolution: ai-assisted
  terminal:
    ai_commands: true
    auto_complete: true
```

---

## Phase 2: Multi-IDE Parallel Execution

### 2.1 Parallel Agent Dispatch

```yaml
# infra/live-exec/parallel-config.yaml
parallel_execution:
  strategy: fan-out-fan-in
  ides:
    replit:
      role: rapid-prototype
      strengths: [sandbox, deployment, iteration-speed]
      tasks: [scaffolding, demo-builds, quick-fixes]
    cursor:
      role: quality-leader
      strengths: [swe-bench, multi-file-edit, codebase-aware]
      tasks: [feature-implementation, refactoring, code-review]
    zed:
      role: performance-specialist
      strengths: [speed, tree-sitter, multi-buffer]
      tasks: [performance-optimization, real-time-editing, collaboration]
  merge:
    strategy: llm-judge
    model: claude-4.6
    conflict_resolution: best-quality-wins
    test_gate: all-pass
```

### 2.2 Live Agent Pairing Protocol

1. **Dispatch** — Task router assigns sub-tasks to each IDE agent based on strengths
2. **Execute** — Each IDE agent works independently with real-time streaming
3. **Sync** — Changes are synced via Git branch merge with conflict detection
4. **Judge** — LLM judge evaluates conflicting implementations, selects best
5. **Verify** — Combined output runs through SWE-bench 90% quality gate

---

## Phase 3: SWE-bench 90% Pipeline

### 3.1 Quality Gate Configuration

```yaml
quality_gates:
  swe_bench:
    target: 90
    minimum: 85
    measurement: automated-eval-harness
  lint:
    engines: [eslint-v9, biome-v2, oxlint]
    zero_tolerance: true
  test:
    coverage: 98
    mutation_score: 85
    e2e_pass: 100
  review:
    agents: 5
    consensus: 4-of-5
    categories:
      - correctness
      - performance
      - security
      - maintainability
      - accessibility
```

### 3.2 Auto-Repair Loop

```
Code Generation → Lint → Test → Review → Score
     ↑                                    │
     └── Auto-Repair (if score < 90%) ────┘
         Max 5 iterations
         Escalate to human if stuck
```

---

## Phase 4: Live Demo Environments

### 4.1 Instant Demo Scaffolding

```bash
# Create a live demo environment from any spec
/live-exec --demo --spec specs/my-app-spec.md --ide replit

# Multi-IDE parallel demo build
/live-exec --parallel --task "Build dashboard" --ides replit,cursor,zed

# SWE-bench 90% mode
/live-exec --swe-bench-90 --task "Fix auth bypass CVE-2026-XXXX"
```

### 4.2 Conference Demo Mode

```yaml
demo_mode:
  hot_reload: true
  error_recovery: automatic
  fallback: pre-recorded
  audience_display:
    terminal: split-view
    code: syntax-highlighted
    output: live-preview
  recording:
    enabled: true
    format: [mp4, gif]
    auto_caption: true
```

---

## Slash Commands

```bash
# Live execution
/live-exec --ide replit --task "description"          — Replit AI agent
/live-exec --ide cursor --swe-bench-90               — Cursor v4 leader mode
/live-exec --ide zed --context-server                 — Zed v0.19 AI-native
/live-exec --parallel --ides all --task "description" — Multi-IDE parallel

# SWE-bench 90%
/swarm-live --agents 25 --swe-bench 90               — 25-agent live swarm
/swe-bench-90 --task "description" --auto-repair      — SWE-bench 90% pipeline

# Demo
/live-exec --demo --spec specs/*.md                   — Instant demo env
/live-exec --conference --mode rehearsal               — Conference rehearsal
```

## Agent Roles

| Role | Responsibility |
|------|---------------|
| `live-exec-engineer` | Orchestrates multi-IDE parallel execution (V9.0) |
| `replit-agent` | Rapid prototyping and sandbox deployment |
| `cursor-leader` | SWE-bench 90% quality enforcement |
| `zed-native` | Performance-optimized real-time editing |

## Model Tier

**Tier 0 — Frontier**: Claude Opus 4.6 for live coding orchestration. Tier 2 for individual IDE agents.
