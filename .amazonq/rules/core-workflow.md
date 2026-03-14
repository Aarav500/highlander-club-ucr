# Core Workflow — Amazon Q Orchestrator

> **Role:** Amazon Q is the top-level orchestrator for this repository.
> It manages the AI-Driven Development Lifecycle (AI-DLC) across three
> stages and delegates work to Antigravity workflows and Claude Code sessions.

## Stack & Tools

- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express + PostgreSQL + Amazon S3
- **Infra:** AWS EC2 + GitHub Actions CI/CD
- **AI Agents:** Antigravity, Claude Code, everything-claude-code skills
- **Key Workflows:** `research-director`, `new-production-app`, `security-scan`, `e2e-test-gen`, `build-error-resolver`

---

## AI-DLC Stages

### Stage 1 — Inception

**When:** A new idea, frontier topic, or exploratory request arrives.

1. Delegate to the **`research-director`** workflow (`.agent/workflows/research-director.md`).
   - Input: the raw idea or topic.
   - Outputs: `research/reports/<slug>-research.md` and `specs/<slug>-spec.md`.
2. Use CLAUDE codemap skills (`docs/CODEMAPS/`) to understand existing architecture before proposing new modules.
3. Produce a **decision summary** → save to `docs/decisions/<date>-<slug>-inception.md`.

**Exit criteria:** Research report and spec are reviewed and approved by the human.

---

### Stage 2 — Construction

**When:** An approved spec exists and is ready for implementation.

1. Delegate to **`new-production-app`** workflow (`.agent/workflows/new-production-app.md`).
2. Enforce the PLAN → IMPLEMENT → REVIEW → VERIFY pipeline:
   - Plan and spec **must be approved** before code is written.
   - Backend tests pass (`cd apps/api-node && npm test`).
   - Frontend builds cleanly (`cd apps/web && npm run build`).
   - Code review completed; critical issues resolved.
3. Use `build-error-resolver` for any build/test failures.
4. Produce a **decision summary** → save to `docs/decisions/<date>-<slug>-construction.md`.

**Exit criteria:** All tests green, build passes, deploy-ready artifact produced.

---

### Stage 3 — Operations

**When:** The app is deployed and changes involve maintenance, security, or iteration.

1. Run **`security-scan`** before and after operational changes.
2. Run **`e2e-test-gen`** to generate/update Playwright tests for affected flows.
3. Require a **change impact analysis** for every operational change:
   - What modules are affected?
   - What tests must be re-run?
   - Are there breaking API or schema changes?
4. If an ops-playbook workflow exists, follow it for runbooks and incident response.
5. Produce a **decision summary** → save to `docs/decisions/<date>-<slug>-operations.md`.

**Exit criteria:** Tests re-run and green, security scan clean, change documented.

---

## Orchestrator Responsibilities

| Responsibility | Details |
|----------------|---------|
| **Stage transitions** | Q decides when to move Inception → Construction → Operations based on exit criteria. |
| **Delegation** | Q dispatches to Antigravity workflows or Claude Code sessions — it does not implement directly. |
| **Audit trail** | Every stage transition produces a decision summary in `docs/decisions/`. |
| **Human gates** | Q pauses for human approval at spec, plan, review, and deploy-ready checkpoints. |
| **Safety** | No automatic deployments. No `git merge/rebase/reset`. No new top-level folders without approval. |

## Decision Log Format

Each file in `docs/decisions/` should contain:

```
# Decision: [Title]
Date: YYYY-MM-DD
Stage: Inception | Construction | Operations
Status: Approved | Pending | Rejected

## Context
[Why this decision was needed.]

## Decision
[What was decided.]

## Consequences
[Expected impact, trade-offs, follow-ups.]
```
