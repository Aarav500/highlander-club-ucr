# Agent Handoff Protocol

Defines how agents pass work to each other. Every workflow phase transition produces a **handoff artifact** so the receiving agent has full context without re-reading the entire codebase.

---

## Handoff Format

```json
{
  "handoff": {
    "id": "handoff-<uuid>",
    "timestamp": "2026-03-12T06:00:00Z",
    "from": {
      "agent": "researcher",
      "workflow": "research-director",
      "phase": "Phase C — Feasibility"
    },
    "to": {
      "agent": "implementer",
      "workflow": "new-production-app",
      "phase": "Phase 2 — Implement"
    },
    "context": {
      "app_slug": "inventory-tracker",
      "spec_path": "specs/inventory-tracker-spec.md",
      "plan_path": "plans/inventory-tracker-plan.md",
      "relevant_files": [
        "docs/CODEMAPS/backend.md",
        "apps/api-node/src/routes/example.js"
      ],
      "decisions": [
        "Using PostgreSQL for storage",
        "JWT auth via platform/auth module"
      ]
    },
    "task": {
      "description": "Implement the backend API per the approved plan",
      "acceptance_criteria": [
        "All endpoints from spec are implemented",
        "Tests pass with npm test",
        "No security scan findings above medium"
      ],
      "model_tier": 2,
      "constraints": [
        "Do not modify files outside apps/api-node/",
        "Follow .antigravity/rules.md"
      ]
    },
    "artifacts": {
      "inputs": [
        "specs/inventory-tracker-spec.md",
        "plans/inventory-tracker-plan.md"
      ],
      "expected_outputs": [
        "apps/api-node/src/routes/*.js",
        "apps/api-node/tests/*.test.js",
        "plans/inventory-tracker-review.md"
      ]
    },
    "status": "pending"
  }
}
```

---

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique handoff identifier |
| `timestamp` | ISO 8601 | When the handoff was created |
| `from.agent` | string | Role of sending agent (`researcher`, `implementer`, `reviewer`, `verifier`, `ops`) |
| `from.workflow` | string | Workflow file that produced this handoff |
| `from.phase` | string | Phase/step that just completed |
| `to.agent` | string | Role of receiving agent |
| `to.workflow` | string | Workflow the receiving agent should execute |
| `to.phase` | string | Phase/step to begin |
| `context.app_slug` | string | App identifier |
| `context.spec_path` | string | Path to the app spec |
| `context.plan_path` | string | Path to the implementation plan |
| `context.relevant_files` | string[] | Files the receiving agent should read first |
| `context.decisions` | string[] | Key decisions already made |
| `task.description` | string | What the receiving agent should do |
| `task.acceptance_criteria` | string[] | How to know the task is done |
| `task.model_tier` | integer | Recommended model tier (1/2/3) |
| `task.constraints` | string[] | Boundaries the agent must respect |
| `artifacts.inputs` | string[] | Files the receiving agent needs as input |
| `artifacts.expected_outputs` | string[] | Files the receiving agent should produce |
| `status` | string | `pending` → `accepted` → `completed` / `failed` |

---

## Agent Roles

| Role | Responsibilities | Typical Workflows |
|------|-----------------|-------------------|
| `researcher` | Deep research, landscape analysis, spec writing | `research-director` |
| `planner` | Spec creation, implementation planning | `new-app-from-idea` (Phase 1) |
| `implementer` | Code writing, feature building | `new-production-app`, `new-app-from-idea` (Phase 2) |
| `reviewer` | Code review, security scan, self-review | `self-review`, `security-scan` |
| `verifier` | Testing, build verification, CI checks | `e2e-test-gen`, `critical-path-hardening` |
| `ops` | Incident response, deployment, monitoring | `ops-playbook`, `perf-baseline` |
| `architect` | System design, module boundaries (V4.0 Swarm) | `swarm-v2` |
| `frontend` | UI/UX lead + component builder (V4.0 Swarm) | `swarm-v2` |
| `backend` | API lead + services (V4.0 Swarm) | `swarm-v2` |
| `ml-engineer` | ML/AI model integration (V4.0 Swarm) | `swarm-v2` |
| `data-engineer` | ETL, analytics pipelines (V4.0 Swarm) | `swarm-v2` |
| `devops` | Docker, K8s, CI/CD (V4.0 Swarm) | `swarm-v2`, `k8s-deploy` |
| `docs-writer` | API docs, codemaps, README (V4.0 Swarm) | `swarm-v2` |
| `deployer` | Build, deploy, health checks (V4.0 Swarm) | `swarm-v2`, `agent-gitops` |
| `governance-auditor` | Policy enforcement, compliance, audit trail (V5.0 Swarm) | `swarm-v3`, `agent-governance`, `fedramp` |
| `perf-engineer` | Latency profiling, load testing, optimization (V5.0 Swarm) | `swarm-v3`, `perf-baseline` |
| `edge-deployer` | WebGPU, TFLite, WASM, on-device deployment (V5.0 Swarm) | `swarm-v3`, `edge-ai` |
| `rag-specialist` | Vector stores, chunking, retrieval, reranking (V5.0 Swarm) | `swarm-v3` |
| `eval-runner` | TerminalBench challenges, scoring, leaderboard (V5.0 Swarm) | `swarm-v3`, `terminalbench` |
| `quantum-engineer` | Quantum circuits, hybrid pipelines (V5.0) | `quantum-ml` |
| `robotics-engineer` | ROS2, Isaac Sim, URDF, sim-to-real (V5.0) | `robotics`, `physics-sim` |
| `swe-bench-master` | Code quality 85%+, test-first, mutation testing, fuzzing, 5-agent PR review (V8.0) | `swe-bench-agent`, `code-audit-fix` |
| `design-governor` | Figma → code, drift detection, consistency audit, pattern library (V7.0) | `agentic-design`, `frontend-design-chooser` |
| `aiops-engineer` | Davis v3, Keptn, Argo Rollouts, 99.999% SLO, chaos engineering (V8.0) | `ai-ops`, `prod-deploy` |
| `benchmark-runner` | LiveBench + ARC-AGI-2 evaluation, model comparison, tier recommendation (V8.0) | `benchmark-live`, `terminalbench` |
| `venue-engineer` | Academic venue template management, CFP parsing, multi-format output (V8.0) | `venue-factory`, `arxiv-bot` |
| `prompt-optimizer` | DSPy v4 self-improving agent prompts, mutation + selection, ensemble (V8.0) | `dspy-v4`, `swarm-v3` |
| `compliance-officer` | SOC2 Type II + FedRAMP continuous monitoring, evidence collection (V8.0) | `fedramp`, `agent-governance` |
| `live-exec-engineer` | Multi-IDE parallel execution, SWE-bench 90% live, Replit + Cursor + Zed orchestration (V9.0) | `live-coding-agents`, `swe-bench-agent` |
| `finance-quant` | Jump diffusion pricing, ZK order matching, fraud detection, regulatory compliance (V9.0) | `sector-finance`, `ai-ops` |
| `health-ai-engineer` | HIPAA RAG, medical imaging, clinical NLP, PHI de-identification (V9.0) | `sector-health`, `confidential-ai` |
| `enterprise-ai-architect` | Air-gapped LLM, enterprise vector DB, private H100 inference, data sovereignty (V9.0) | `sector-enterprise`, `confidential-ai` |
| `conference-producer` | Talk generation, demo environments, rehearsal, content repurposing (V9.0) | `conference-oracle`, `venue-factory` |
| `dl-dev-engineer` | LLM fine-tuning (LoRA/QLoRA), RAG v3 training, RLHF v2 agent tuning (V9.0) | `dl-dev2026`, `distributed-training` |
| `ux-personalization-engineer` | Live sentiment → adaptive UI, dynamic content, A/B testing (V10.0) | `hyper-personalization` |
| `bug-hunter-agent` | Pre-commit AI review, pattern learning, 50% bug reduction (V10.0) | `bug-hunter`, `swe-bench-agent` |
| `micro-agent-orchestrator` | 100+ micro-agent DAGs, hot-swap runtime, marketplace (V10.0) | `modular-ai`, `swarm-v3` |
| `digital-twin-engineer` | Sora v3 world sim, synthetic users, visual regression (V10.0) | `digital-twins`, `e2e-test-gen` |
| `ai-literacy-writer` | Auto-docs, tutorials, architecture dashboards, onboarding (V10.0) | `ai-literacy` |
| `happiness-engineer` | Burnout detection, workflow optimization, team health (V10.0) | `happiness-engine` |
| `cost-optimizer-agent` | 75% cloud savings, right-sizing, spot orchestration, FinOps (V10.0) | `cost-optimizer`, `ai-ops` |
| `ethics-auditor` | Google AI Principles, bias detection, fairness metrics (V10.0) | `ai-responsibility`, `agent-governance` |
| `trend-analyst` | Weekly AI news, tech radar, roadmap adaptation (V10.0) | `trend-tracker` |
| `productivity-coach` | Sprint optimization, AI pairing, velocity forecast, standup automation (V10.0) | `productivity-booster` |

---

## Handoff Rules

1. **Every phase transition emits a handoff.** When a workflow reaches a `⏸️ STOP`, the current agent produces a handoff artifact before yielding control.

2. **Handoffs are append-only.** Never modify a previous handoff — create a new one with updated status.

3. **The receiving agent must acknowledge.** Set `status` to `accepted` before starting work, `completed` or `failed` when done.

4. **Context must be self-contained.** The `context` and `artifacts.inputs` fields must contain everything the receiving agent needs. Don't assume it has prior conversation history.

5. **Respect model tiers.** The `task.model_tier` field should match the recommendation in the target workflow's frontmatter.

6. **Failed handoffs escalate to humans.** If an agent cannot complete the task after reasonable effort, set `status` to `failed` with a `failure_reason` field and notify the human.

---

## Handoff Chains

Common multi-agent chains:

```
researcher → planner → implementer → reviewer → verifier
     ↑                                              │
     └──────────── (if verification fails) ─────────┘
```

### Research → Production

```
research-director (researcher)
  → handoff: spec complete
    → new-production-app (implementer)
      → handoff: implementation complete
        → self-review (reviewer)
          → handoff: review complete
            → critical-path-hardening (verifier)
```

### Incident Response

```
ops-playbook (ops)
  → handoff: fix proposed
    → build-error-resolver (implementer)
      → handoff: fix applied
        → security-scan (reviewer)
```

---

## Storage

Handoff artifacts are saved to:

```
plans/<app_slug>-handoff-<sequence>.json
```

Where `<sequence>` is a zero-padded counter (001, 002, ...) tracking the chain order.
