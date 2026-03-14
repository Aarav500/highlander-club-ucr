---
description: "LangGraph + Claude Opus 4.6 — 20-agent parallel build system with TerminalBench 2.0 benchmarks"
---

# Agent Swarm v3 Workflow

> 20 specialized agents execute in parallel via a LangGraph DAG. Adaptive wave scheduling, agent self-improvement loop, and TerminalBench 2.0 benchmark scoring.

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │         Orchestrator v3          │
                    │  (LangGraph StateGraph v2)       │
                    │  Engine: Claude Opus 4.6         │
                    └──────────────┬──────────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
        ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
        │  Wave 1      │    │  Wave 2      │    │  Wave 3      │
        │  Foundation   │    │  Build       │    │  Finish      │
        │  (5 agents)  │    │  (9 agents)  │    │  (6 agents)  │
        └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
               │                  │                  │
    ┌────┬────┬────┬────┐  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐  ┌──┬──┬──┬──┬──┬──┐
    │Arch│Res │DB  │Sec │  │FE│FE│BE│BE│ML│Data│DevO│RAG│Edge│  │Rev│Test│Doc│Dep│Gov│Perf│
    │    │    │    │    │  │1 │2 │1 │2 │  │   │ps │   │   │  │   │   │   │  │   │   │
    │    │Eval│    │    │  │  │  │  │  │  │   │   │   │   │  │   │   │   │  │   │   │
    └────┴────┴────┴────┘  └──┴──┴──┴──┴──┴───┴───┴───┴───┘  └──┴───┴───┴──┴───┴───┘
               │                  │                  │
               └──────────────────┼──────────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │   LLM Judge v2          │
                    │   Conflict Resolution   │
                    │   + TerminalBench Score  │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Unified Output        │
                    │   + SWARM_REPORT_V3.md  │
                    └─────────────────────────┘
```

---

## What's New in v3 (vs v2)

| Feature | v2 | v3 |
|---------|----|----|
| Agent count | 15 | **20** |
| Orchestrator LLM | GPT-4o | **Claude Opus 4.6** |
| Wave scheduling | Fixed 3 waves | **Adaptive** (dynamic dependency resolution) |
| Benchmarks | None | **TerminalBench 2.0** scoring |
| Self-improvement | None | **Agent meta-learning loop** |
| New agents | — | `governance-auditor`, `perf-engineer`, `edge-deployer`, `rag-specialist`, `eval-runner` |

---

## Agent Roster (20 agents)

| # | Agent | Role | Wave | Specialty |
|---|-------|------|------|-----------|
| 1 | `architect` | System Design | 1 | Architecture docs, module boundaries, data flow |
| 2 | `researcher` | Research | 1 | Literature, competitive analysis, prior art |
| 3 | `db-engineer` | Database | 1 | Schema, migrations, query optimization |
| 4 | `security-lead` | Security | 1 | Threat model, auth, OWASP validation |
| 5 | `eval-runner` | Benchmarks | 1 | TerminalBench 2.0 challenge setup, baseline metrics |
| 6 | `frontend-1` | UI/UX Lead | 2 | Page layouts, design system, responsive |
| 7 | `frontend-2` | UI Components | 2 | Interactive components, animations, charts |
| 8 | `backend-1` | API Lead | 2 | REST/tRPC endpoints, middleware, validation |
| 9 | `backend-2` | Services | 2 | Business logic, integrations, background jobs |
| 10 | `ml-engineer` | ML/AI | 2 | Model integration, inference, embeddings |
| 11 | `data-engineer` | Data | 2 | ETL pipelines, analytics, transformations |
| 12 | `devops` | Infrastructure | 2 | Docker, CI/CD, K8s, monitoring |
| 13 | `rag-specialist` | RAG Pipelines | 2 | Vector stores, chunking, retrieval, reranking |
| 14 | `edge-deployer` | Edge Infra | 2 | WebGPU, TFLite, WASM, on-device deployment |
| 15 | `reviewer` | Quality | 3 | Code review, security scan, performance audit |
| 16 | `tester` | Testing | 3 | Unit, E2E, load tests |
| 17 | `docs-writer` | Documentation | 3 | API docs, README, architecture docs, codemaps |
| 18 | `deployer` | Release | 3 | Build, deploy, health checks, rollback |
| 19 | `governance-auditor` | Compliance | 3 | Policy enforcement, audit trail, SOC2/FedRAMP checks |
| 20 | `perf-engineer` | Performance | 3 | Latency profiling, load testing, optimization |

---

## Phase 1: Adaptive Task Decomposition

1. **Parse the user's task** into a structured brief.

2. **Generate an adaptive dependency DAG** using LangGraph `StateGraph`:
   ```python
   from langgraph.graph import StateGraph, END
   from langgraph.checkpoint.memory import MemorySaver

   graph = StateGraph(SwarmStateV3)

   # Wave 1 — Foundation (no deps)
   for agent in ["architect", "researcher", "db_engineer", "security_lead", "eval_runner"]:
       graph.add_node(agent, agent_registry[agent])

   # Wave 2 — Build (depends on Wave 1)
   for agent in ["frontend_1", "frontend_2", "backend_1", "backend_2",
                  "ml_engineer", "data_engineer", "devops", "rag_specialist", "edge_deployer"]:
       graph.add_node(agent, agent_registry[agent])

   # Wave 3 — Finish (depends on Wave 2)
   for agent in ["reviewer", "tester", "docs_writer", "deployer",
                  "governance_auditor", "perf_engineer"]:
       graph.add_node(agent, agent_registry[agent])

   # Adaptive edges — resolved at runtime based on task analysis
   graph.add_conditional_edges("architect", route_by_task_type)
   ```

3. **Adaptive wave scheduling** — agents with no unmet dependencies execute immediately, regardless of nominal wave assignment. If `db-engineer` finishes early, `backend-2` starts without waiting for other Wave 1 agents.

4. **⏸️ STOP — Review DAG and task assignments before execution.**

---

## Phase 2: Wave Execution

### Wave 1 — Foundation (5 agents, parallel)

| Agent | Produces |
|-------|----------|
| `architect` | Architecture doc, module diagram, API surface spec |
| `researcher` | Literature review, technology recommendations |
| `db-engineer` | Schema SQL, migration files, seed data |
| `security-lead` | Threat model, auth flow, security requirements |
| `eval-runner` | TerminalBench challenge suite, baseline metrics, scoring rubric |

**Timeout:** 120s per agent. Partial output accepted.

### Wave 2 — Build (9 agents, parallel, depends on Wave 1)

| Agent | Produces |
|-------|----------|
| `frontend-1` | Page layouts, routing, design system tokens |
| `frontend-2` | Interactive components, charts, animations |
| `backend-1` | API routes, middleware, request/response types |
| `backend-2` | Service layer, integrations, background workers |
| `ml-engineer` | Model configs, inference endpoints, embeddings |
| `data-engineer` | ETL scripts, analytics queries, transformers |
| `devops` | Dockerfile, CI/CD, K8s manifests, monitoring |
| `rag-specialist` | Vector store setup, chunking strategy, retrieval pipeline |
| `edge-deployer` | WebGPU runtime, TFLite models, WASM bundles |

**Timeout:** 180s per agent.

### Wave 3 — Finish (6 agents, parallel, depends on Wave 2)

| Agent | Produces |
|-------|----------|
| `reviewer` | Code review, security findings, perf notes |
| `tester` | Unit tests, E2E tests, load test scripts |
| `docs-writer` | README, API reference, architecture codemap |
| `deployer` | Build artifacts, deploy scripts, health checks |
| `governance-auditor` | Compliance report, policy violations, audit trail |
| `perf-engineer` | Latency benchmarks, bottleneck analysis, optimization recs |

**Timeout:** 120s per agent.

---

## Phase 3: LLM Judge Merge (Claude Opus 4.6)

1. **Non-overlapping files** → include directly
2. **Conflicting files** → Claude Opus 4.6 resolves using priority matrix (same as v2, extended):

| Conflict Type | Winner | Reason |
|---------------|--------|--------|
| Architecture decisions | `architect` | System design authority |
| API contracts | `backend-1` | API is the contract |
| UI components | `frontend-1` | Design lead authority |
| Database schema | `db-engineer` | Schema is canonical |
| Security concerns | `security-lead` | Security trumps convenience |
| ML model interfaces | `ml-engineer` | Algorithm output is canonical |
| RAG pipeline | `rag-specialist` | Retrieval contracts are canonical |
| Edge deployment | `edge-deployer` | Hardware constraints are canonical |
| Compliance | `governance-auditor` | Compliance trumps speed |
| Performance | `perf-engineer` | Perf data overrides assumptions |

3. **Generate `SWARM_REPORT_V3.md`** — agent contributions, conflicts, quality scores, TerminalBench results

---

## Phase 4: TerminalBench 2.0 Scoring

After merge, run the TerminalBench 2.0 evaluation harness:

```python
class TerminalBenchV2:
    """Multi-step engineering benchmark for agentic systems."""

    CHALLENGE_SUITES = {
        "code_gen": {
            "description": "Generate working code from spec",
            "metrics": ["compilation_success", "test_pass_rate", "cyclomatic_complexity"],
            "weight": 0.25,
        },
        "debugging": {
            "description": "Diagnose and fix bugs from error logs",
            "metrics": ["fix_accuracy", "time_to_fix", "regression_rate"],
            "weight": 0.20,
        },
        "refactoring": {
            "description": "Refactor code while preserving behavior",
            "metrics": ["test_pass_rate", "complexity_reduction", "loc_change"],
            "weight": 0.15,
        },
        "deployment": {
            "description": "Deploy and verify in target environment",
            "metrics": ["deploy_success", "health_check_pass", "rollback_speed"],
            "weight": 0.15,
        },
        "multi_step": {
            "description": "Multi-step engineering tasks (research → plan → build → test)",
            "metrics": ["step_completion", "coherence", "final_quality"],
            "weight": 0.25,
        },
    }

    def score(self, swarm_output: SwarmOutput) -> BenchmarkReport:
        """Score swarm output across all challenge suites."""
        ...
```

**Scoring output:**
```json
{
  "swarm_id": "swarm-v3-<uuid>",
  "overall_score": 87.3,
  "suites": {
    "code_gen": {"score": 92, "details": "..."},
    "debugging": {"score": 85, "details": "..."},
    "refactoring": {"score": 88, "details": "..."},
    "deployment": {"score": 79, "details": "..."},
    "multi_step": {"score": 90, "details": "..."}
  },
  "agent_leaderboard": [
    {"agent": "backend-1", "contribution_score": 95},
    {"agent": "architect", "contribution_score": 93}
  ]
}
```

---

## Phase 5: Agent Self-Improvement Loop

After each swarm execution, agents learn from their performance:

1. **Performance analysis** — identify which agents underperformed and why
2. **Prompt refinement** — DSPy v3 auto-optimizes agent system prompts
3. **Strategy adaptation** — adjust wave scheduling based on task patterns
4. **Knowledge transfer** — successful patterns saved to `~/.claude/skills/learned/swarm-v3/`

---

## Quality Gate

Pause for human review if:

- [ ] Any agent reported `failed` status
- [ ] Conflict resolution touched > 5 files
- [ ] Security-sensitive changes detected
- [ ] TerminalBench overall score < 70
- [ ] Governance audit found compliance violations
- [ ] Performance benchmarks regressed > 10%

---

## Commands

```bash
# Full 20-agent parallel build
/swarm-v3 --task "build quant trading platform"

# Run with TerminalBench scoring
/swarm-v3 --benchmarks terminalbench2.0 --task "portfolio dashboard"

# Specify agent count
/swarm-v3 --agents 20 --parallel --task "AI-powered CRM"

# Dry run (no file writes)
/swarm-v3 --dry-run --task "smoke test swarm v3"

# Run specific challenge bench
/swarm-v3 --benchmarks terminalbench2.0 --suite multi_step --task "end-to-end SaaS"

# View last swarm report
/swarm-report --last --version v3
```

---

## Performance Targets

| Metric | v2 (15 agents) | v3 (20 agents) |
|--------|-----------------|-----------------|
| Task completion | ~90s | **~60s** (1.5× faster) |
| Quality | Best-of-15 | **Best-of-20 + meta-learning** |
| Coverage | All domains | **All domains + RAG + Edge + Governance** |
| Resilience | 12/15 continue | **16/20 continue if 4 fail** |
| Benchmarks | None | **TerminalBench 2.0 (87+ target)** |
| Self-improvement | None | **DSPy v3 prompt optimization** |
