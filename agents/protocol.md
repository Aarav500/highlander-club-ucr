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
