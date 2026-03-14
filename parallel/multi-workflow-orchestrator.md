# Multi-Workflow Orchestrator — Parallel Streams

> Run **research + production + security + performance + observability** simultaneously.
> A single trigger fans out to 5 agent streams, each executing its own workflow
> concurrently. Results merge at a barrier before a unified summary is produced.
>
> **10× faster** than sequential pipeline execution.

---

## Architecture

```
                         ┌──────────────────┐
                         │     Trigger      │  ← GitHub issue / CLI / n8n webhook
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  Parallel        │
                         │  Dispatcher      │  ← Parse payload, build per-stream context
                         └──┬──┬──┬──┬──┬───┘
                            │  │  │  │  │
             ┌──────────────┘  │  │  │  └──────────────┐
             │        ┌───────┘  │  └───────┐          │
             ▼        ▼         ▼          ▼          ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
        │Research │ │Productn │ │Security │ │  Perf   │ │Observe  │
        │ Stream  │ │ Stream  │ │ Stream  │ │ Stream  │ │ Stream  │
        └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
             │           │           │           │           │
             └─────┬─────┴─────┬─────┴─────┬─────┘           │
                   │           │           │                  │
                   └───────────┴───────────┴──────────────────┘
                                  │
                         ┌────────▼─────────┐
                         │  Barrier / Merge │  ← Wait for all streams; collect results
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  Unified Summary │  ← Aggregate into single report
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  Notify (Slack)  │
                         └──────────────────┘
```

---

## Trigger

The orchestrator accepts a single input payload from any of these sources:

| Source | Mechanism |
|--------|-----------|
| GitHub issue | n8n GitHub Trigger on `issues.opened` with label `parallel` |
| CLI | `npx parallel-dispatch --topic "..." --spec specs/<slug>-spec.md` |
| n8n webhook | `POST /parallel/dispatch` with JSON body |

### Payload Schema

```json
{
  "topic": "string — research topic or feature idea",
  "spec_path": "string | null — path to existing spec if available",
  "app_slug": "string — slug for naming artifacts",
  "streams": ["research", "production", "security", "perf", "observability"]
}
```

If `streams` is omitted, **all 5 run by default**.

---

## Stream Definitions

Each stream maps to an existing workflow and runs independently.

### Stream 1 — Research

| Field | Value |
|-------|-------|
| **Workflow** | `.agent/workflows/research-director.md` |
| **Agent role** | `researcher` |
| **Input** | `topic` from payload |
| **Output** | `research/reports/<slug>-research.md`, `specs/<slug>-spec.md` |
| **Model tier** | 1 (Opus) |

Runs the full Research Director pipeline (Phases A–E). Produces landscape analysis and an implementation-ready spec.

### Stream 2 — Production

| Field | Value |
|-------|-------|
| **Workflow** | `.agent/workflows/new-production-app.md` |
| **Agent role** | `implementer` |
| **Input** | `spec_path` from payload (or output from Research stream if chained) |
| **Output** | Implementation plan, code in `apps/`, passing tests |
| **Model tier** | 2 (Sonnet) |

Requires a spec. If `spec_path` is null and the Research stream is also running, Production waits for Research to emit a spec before starting Phase 2.

### Stream 3 — Security

| Field | Value |
|-------|-------|
| **Workflow** | `.agent/workflows/security-scan.md` |
| **Agent role** | `reviewer` |
| **Input** | `app_slug`, current codebase |
| **Output** | Security findings report per `security/checklist.md` |
| **Model tier** | 2 (Sonnet) |

Runs OWASP Top 10 review + threat model check (`security/threat-model.md`). Starts immediately — does not need to wait for other streams.

### Stream 4 — Performance

| Field | Value |
|-------|-------|
| **Workflow** | `.agent/workflows/perf-baseline.md` |
| **Agent role** | `verifier` |
| **Input** | `app_slug`, target endpoints |
| **Output** | Performance baseline report |
| **Model tier** | 3 (Haiku) |

Captures P50/P95/P99 latency and throughput baselines. Starts immediately.

### Stream 5 — Observability

| Field | Value |
|-------|-------|
| **Workflow** | `observability/n8n-workflow.md` (design reference) |
| **Agent role** | `ops` |
| **Input** | `app_slug`, log pipeline config |
| **Output** | Observability setup validation, alert config review |
| **Model tier** | 3 (Haiku) |

Validates that structured logging, metrics export, and alert rules are configured for the app. Starts immediately.

---

## Parallel Execution Rules

### Independence

Each stream runs in its own isolated context. Streams:
- Do **not** share file writes (each writes to its own output paths).
- Do **not** read each other's in-progress artifacts.
- **Can** read shared repo files (source code, specs, docs) read-only.

### Stream Dependencies

Most streams are fully independent. The only dependency:

```
Research ──(spec)──► Production
```

If both Research and Production are requested and `spec_path` is null:
1. Production enters a **wait state**.
2. Research runs Phases A–D to produce `specs/<slug>-spec.md`.
3. Research emits a handoff artifact per `agents/protocol.md`.
4. Production picks up the handoff and begins Phase 2.

All other streams (Security, Perf, Observability) start immediately with no wait.

### Failure Isolation

| Scenario | Behavior |
|----------|----------|
| One stream fails | Other streams continue. Failed stream is marked `failed` in the merge report. |
| Research fails (Production waiting) | Production is marked `skipped` with reason. Other streams unaffected. |
| All streams fail | Barrier still completes. Summary reports all failures. Human is notified. |

---

## Barrier / Merge

After all streams complete (or fail/timeout), the barrier collects results:

```json
{
  "orchestration_id": "parallel-<uuid>",
  "timestamp": "2026-03-12T10:30:00Z",
  "app_slug": "<slug>",
  "streams": {
    "research":      { "status": "completed", "artifacts": ["research/reports/..."] },
    "production":    { "status": "completed", "artifacts": ["plans/...", "apps/..."]  },
    "security":      { "status": "completed", "findings": { "critical": 0, "high": 1 } },
    "perf":          { "status": "completed", "p95_ms": 180 },
    "observability": { "status": "completed", "alerts_configured": true }
  },
  "overall_status": "completed",
  "wall_clock_ms": 42000
}
```

### Timeout

Default stream timeout: **10 minutes**. If a stream exceeds this, it is marked `timeout` and the barrier proceeds without it.

---

## Unified Summary

The merge step feeds results into an AI Agent node (or inline template) to produce a human-readable summary:

```markdown
## Parallel Orchestration Report — <slug>

| Stream | Status | Key Result |
|--------|--------|------------|
| Research | ✅ Completed | Spec ready at `specs/<slug>-spec.md` |
| Production | ✅ Completed | Plan approved, code in `apps/` |
| Security | ⚠️ Completed | 1 high finding — review `security/` |
| Performance | ✅ Completed | P95 = 180ms (within SLA) |
| Observability | ✅ Completed | Alerts configured |

**Wall-clock time:** 42s (vs ~210s sequential — **5× speedup**)

### Next Steps
1. Review the high security finding before merging.
2. Human triggers deploy via `git push main`.
```

Posted to `#lab-parallel` Slack channel and commented on the triggering GitHub issue.

---

## Handoff Protocol

Each stream emits a standard handoff artifact per `agents/protocol.md`:

- **`from`** — the stream's agent role and workflow
- **`to`** — the barrier/merge step
- **`status`** — `completed` | `failed` | `timeout`
- **Saved to** — `plans/<slug>-parallel-<stream>-handoff.json`

The barrier reads all 5 handoff files to build the merge report.

---

## Usage

### Via n8n (recommended)

See the **Parallel Fan-Out Workflow** section in `docs/n8n.md`. The n8n workflow sends one webhook per stream and merges responses automatically.

### Via CLI

```bash
# Run all 5 streams
npx parallel-dispatch --topic "real-time dashboards" --slug "rt-dashboard"

# Run specific streams only
npx parallel-dispatch --topic "..." --slug "..." --streams research,security
```

### Via Agent Protocol

An orchestrating agent can spawn 5 sub-agents by emitting 5 handoff artifacts simultaneously, one per stream.

---

## Safety Rules

- **No deploys.** The orchestrator prepares artifacts but never triggers a deploy.
- **Isolation.** Streams must not write to each other's output paths.
- **Notify always.** Every orchestration run must produce a summary notification.
- **Respect model tiers.** Each stream uses the model tier specified in its workflow's frontmatter.
- **Human in the loop.** Production stream still respects `⏸️ STOP` gates for plan approval.
