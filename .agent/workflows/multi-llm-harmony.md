---
description: Parallel multi-LLM task execution with Claude + Amazon Q + Grok, LLM judge merge, and conflict resolution
---

# Multi-LLM Harmony Workflow

Execute tasks using 3 specialized agents in parallel, then merge results via LLM judge.

---

## Architecture

```
                    ┌─────────────────────┐
                    │  Antigravity        │
                    │  (Orchestrator)     │
                    └────────┬────────────┘
                             │
                    ┌────────┴────────┐
                    │ Task Decomposer │
                    └───┬────┬────┬───┘
                        │    │    │
            ┌───────────┘    │    └───────────┐
            ▼                ▼                ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Claude Code  │ │  Amazon Q    │ │  Grok        │
    │  (UI/API)     │ │  (DevOps)    │ │  (Research)  │
    │               │ │              │ │              │
    │  • React      │ │  • Docker    │ │  • Algos     │
    │  • shadcn/ui  │ │  • CI/CD     │ │  • ML/Math   │
    │  • tRPC       │ │  • K8s       │ │  • Papers    │
    │  • Framer     │ │  • Vercel    │ │  • Finance   │
    └───────┬───────┘ └──────┬───────┘ └──────┬───────┘
            │                │                │
            └────────────────┼────────────────┘
                             ▼
                    ┌────────────────┐
                    │   LLM Judge    │
                    │   (Merge +     │
                    │    Vote)       │
                    └────────┬───────┘
                             ▼
                    ┌────────────────┐
                    │ Unified Output │
                    └────────────────┘
```

---

## Phase 1: Task Decomposition

Break the user's task into 3 parallel work streams.

```
Input: User task description
Output: 3 agent-specific task briefs
```

### Decomposition Rules

1. **UI/Frontend/API work** → assign to `claude-code`
2. **Infrastructure/Deploy/CI work** → assign to `amazon-q-devops`
3. **Algorithms/Research/Math work** → assign to `grok-research`
4. **Overlapping work** → assign to the primary specialist, add context to secondary
5. **Unknown domain** → assign to `claude-code` as default

### Example Decomposition

```
User: "Build a quant trading dashboard"
├── claude-code:   React dashboard + shadcn charts + tRPC API + WebSocket feeds
├── amazon-q:      Docker + GitHub Actions + Vercel deploy + monitoring
└── grok:          Custom RL trading algo + Monte Carlo sim + risk model + paper draft
```

---

## Phase 2: Parallel Execution

All 3 agents execute independently — no cross-wait.

### Execution Contract

Each agent must produce:
1. **Code artifacts** — files in their designated directories
2. **Interface manifest** — JSON describing exports, endpoints, data shapes
3. **Status report** — success/partial/failed + notes

### Interface Manifest Format

```json
{
  "agent": "claude-code",
  "status": "success",
  "artifacts": [
    {"path": "app/dashboard/page.tsx", "type": "page"},
    {"path": "components/charts/portfolio-chart.tsx", "type": "component"},
    {"path": "server/routers/portfolio.ts", "type": "api"}
  ],
  "exports": {
    "components": ["PortfolioChart", "RiskHeatmap", "TradeHistory"],
    "api_endpoints": ["/api/trpc/portfolio.getPositions", "/api/trpc/portfolio.getRisk"],
    "data_shapes": {
      "Position": {"symbol": "string", "quantity": "number", "pnl": "number"},
      "RiskMetrics": {"var_95": "number", "sharpe": "number", "max_drawdown": "number"}
    }
  },
  "dependencies": {
    "from_grok": ["algorithms/rl_agent.py → needs JSON API wrapper"],
    "from_amazon_q": ["expects /api/health endpoint for probes"]
  }
}
```

### Timeout & Fallback

| Scenario | Timeout | Fallback |
|----------|---------|----------|
| Agent completes normally | — | Use output |
| Agent takes > 120s | Soft timeout | Use partial output + flag |
| Agent fails | — | Other 2 agents continue; flag gap |
| 2+ agents fail | — | Abort; notify human |

---

## Phase 3: LLM Judge — Merge + Vote

Antigravity reviews all 3 outputs and produces a unified result.

### Merge Strategy

```python
# Pseudocode for merge algorithm
def merge_outputs(claude_output, amazonq_output, grok_output):
    unified = {}

    # 1. Non-overlapping files → include directly
    for output in [claude_output, amazonq_output, grok_output]:
        for file in output.artifacts:
            if file.path not in unified:
                unified[file.path] = file

    # 2. Overlapping interfaces → reconcile
    conflicts = find_conflicts(claude_output, amazonq_output, grok_output)
    for conflict in conflicts:
        resolution = llm_judge(conflict)
        unified[conflict.path] = resolution

    # 3. Integration glue → generate adapters
    adapters = generate_adapters(
        frontend=claude_output.exports,
        infra=amazonq_output.exports,
        algorithms=grok_output.exports,
    )
    unified.update(adapters)

    return unified
```

### Conflict Resolution Priority

| Conflict Type | Winner | Reason |
|---------------|--------|--------|
| API shape / types | Claude Code | tRPC types are the contract |
| Port / networking | Amazon Q | Infra defines the network |
| Algorithm interface | Grok | Math correctness > convenience |
| File naming | Claude Code | Frontend conventions dominate |
| Env vars / secrets | Amazon Q | Security authority |
| Data format / schema | Grok | Algorithm output is canonical |

### Voting (for quality decisions)

When multiple agents produce alternative solutions for the same problem:

```
1. Each agent's solution is scored on:
   - Correctness (40%)
   - Performance (25%)
   - Code quality (20%)
   - Maintainability (15%)

2. Best-of-3 wins (or weighted merge if scores are close)

3. Winning solution is adopted; others are discarded
```

---

## Phase 4: Human Review Gate

If any of these conditions are met, pause for human review:

- [ ] Conflict resolution changed > 3 files
- [ ] Any agent reported `partial` or `failed` status
- [ ] Generated code exceeds 500 lines in a single file
- [ ] Security-sensitive changes (auth, secrets, permissions)
- [ ] Deployment to production environment

Otherwise, output is delivered automatically.

---

## Phase 5: Unified Output

Final deliverable is a single cohesive project:

```
project/
├── app/                    ← Claude Code (UI)
├── components/             ← Claude Code (Design System)
├── server/                 ← Claude Code (tRPC API)
├── algorithms/             ← Grok (ML/Finance)
├── research/               ← Grok (Papers/Proofs)
├── infra/                  ← Amazon Q (Docker/K8s)
├── .github/workflows/      ← Amazon Q (CI/CD)
├── k8s/                    ← Amazon Q (Kubernetes)
├── lib/adapters/           ← Auto-generated (glue code)
└── HARMONY_REPORT.md       ← Merge report + agent contributions
```

---

## Commands

### Primary

```bash
# Full triple-LLM execution
/triple-llm --task "build quant trading platform"

# UI-focused (priority to Claude, others support)
/harmony-ui --shadcn --threejs --task "real-time dashboard"

# Deploy-focused (priority to Amazon Q, others support)
/deploy-trio --docker --vercel --kubernetes --task "deploy to production"

# Research-focused (priority to Grok, others support)
/research-trio --acm --novel-algo --proofs --task "novel attention mechanism"
```

### Demo & Testing

```bash
# Live demo with all 3 agents
/triple-llm --demo "Multi-Agent Portfolio Optimizer"

# Test mode (dry run, no file writes)
/triple-llm --test --task "smoke test harmony"

# View last harmony report
/harmony-report --last
```

---

## Expected Performance

| Metric | Sequential (V2.1) | Parallel Harmony (V2.2) |
|--------|-------------------|------------------------|
| Task completion | ~90s | ~30s (3x faster) |
| Quality score | Single model | Best-of-3 voting (95%+) |
| Coverage | One domain at a time | UI + DevOps + Research simultaneous |
| Resilience | Single point of failure | 2/3 continue if 1 fails |
