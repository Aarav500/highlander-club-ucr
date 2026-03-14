---
description: "Operations incident response and change management playbook"
model_tier: 1  # Tier 1 (Opus) — production incident response
---

# Ops Playbook Workflow

> Assists with production incidents, risky changes, and operations work.
> Produces a structured incident summary with root cause, fix, and rollback plan.
>
> **Scope:** READ application code and logs. WRITE only to the incident artifact.
> Code fixes follow the standard IMPLEMENT → VERIFY pipeline.

---

## Inputs

| Input | Description |
|-------|-------------|
| `issue` | Description of the production issue or risky change. |
| `severity` | `critical`, `high`, `medium`, or `low` (default: `medium`). |

## Outputs

| Artifact | Location |
|----------|----------|
| Ops Incident Summary | `docs/decisions/<date>-<slug>-ops.md` |

---

## Step 1 — Triage

1. Read the `issue` description and classify:
   - **Is the app down?** → Critical path: skip to Step 2 immediately.
   - **Is data at risk?** → Check `security/threat-model.md` for relevant threats.
   - **Is it a performance issue?** → Focus on logs and metrics.
   - **Is it a planned risky change?** → Focus on impact analysis.

2. Identify the affected components:
   - Backend (`apps/api-node/`) — routes, services, DB queries.
   - Frontend (`apps/web/`) — pages, API calls, rendering.
   - Infra — EC2, S3, GitHub Actions, PM2.

---

## Step 2 — Root Cause Analysis

1. **Inspect logs and errors:**
   - Check PM2 logs on EC2 (if accessible).
   - Review recent CI/CD runs in `.github/workflows/`.
   - Search application code for the error message or failing endpoint.

2. **Identify likely root causes** — list top 1–3 hypotheses with evidence:
   - Code regression (recent commit introduced the bug).
   - Configuration drift (env var missing or changed).
   - External dependency failure (S3, database, third-party API).
   - Resource exhaustion (memory, connections, disk).

3. **Suggest metrics/logs to inspect:**
   - PM2 process status and restart count.
   - PostgreSQL connection pool usage.
   - Express request/error logs.
   - S3 access logs (if storage-related).

---

## Step 3 — Propose Fix

1. Design a **minimal, targeted fix** — smallest change that resolves the issue.
   - Do not refactor unrelated code during an incident.
   - Reference the relevant section of `security/checklist.md` if the fix
     touches auth, input handling, or logging.

2. Write the fix following the standard IMPLEMENT phase:
   - Fix goes in the affected app directory (`apps/api-node/` or `apps/web/`).
   - Add or update a test that reproduces the issue and verifies the fix.

3. **Define a rollback plan:**
   - Identify the last known good commit or deployment.
   - Document the rollback command (e.g., `git revert <sha>` + redeploy).
   - If the fix involves a database migration, document how to reverse it.

---

## Step 4 — Verify

1. Run backend tests:
   ```bash
   cd apps/api-node && npm test
   ```
2. Run frontend build:
   ```bash
   cd apps/web && npm run build
   ```
3. If any check fails, use `build-error-resolver` workflow to diagnose.
4. For critical/high severity: run `security-scan` workflow to ensure the fix
   doesn't introduce new vulnerabilities.

---

## Step 5 — Incident Summary

Produce an **Ops Incident Summary** artifact:

```markdown
# Ops Incident: [Title]

**Date:** YYYY-MM-DD
**Severity:** critical / high / medium / low
**Status:** Resolved / Mitigated / Investigating

## Issue
[Description of what happened.]

## Root Cause
[What caused it and evidence.]

## Fix Applied
[What was changed, with file references.]

## Rollback Plan
[How to revert if the fix causes a regression.]

## Tests
- Backend: [pass/fail, count]
- Frontend build: [pass/fail]
- Security scan: [clean / findings]

## Follow-ups
- [ ] [Any remaining action items.]
```

Save to `docs/decisions/<date>-<slug>-ops.md`.

### ⏸️ STOP — Present the summary to the human. Deploy only after approval.

---

## Safety Rules

- **Do not deploy automatically.** Deployment is triggered by the human via `git push main`.
- **Minimal fixes only** during incidents — no scope creep.
- **Always define a rollback plan** before applying a fix.
- **For critical severity**, notify the human immediately and propose a hotfix path.
