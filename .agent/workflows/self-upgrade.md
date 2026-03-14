---
description: Scan codebase for quality issues and apply prioritized improvements with human approval
---

# Self-Upgrade Workflow

Proactively identify and fix code quality, performance, security, and DX issues across a target scope.

> **Model tier:** Tier 2 (Standard). Escalate to Tier 1 for Architecture category findings.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `scope` | ✅ | Target directory or file pattern (e.g., `apps/api-node/src/`, `apps/web/`) |
| `categories` | Optional | Categories from `self-improvement/strategy.md`. Default: Code Quality + Performance + DX |
| `max_items` | Optional | Max improvements to propose. Default: 10 |

---

## Steps

### 1 — Prepare

1. Read `self-improvement/strategy.md` to understand scope categories and constraints.
2. Read `self-improvement/checklist.md` to load the evaluation criteria.
3. Read any relevant codemaps in `docs/CODEMAPS/` for the target scope.
4. Note the current test status: run `npm test` in `apps/api-node/` and `npm run build` in `apps/web/` to establish baseline.

### 2 — Scan

For each checklist item in the selected categories:

1. Search the `scope` directory for violations using grep, AST analysis, or manual inspection.
2. For each finding, record:
   - **What:** description of the issue.
   - **Where:** file path and line range.
   - **Why:** impact if left unaddressed (e.g., "unused import bloats bundle", "missing error handler causes unhandled rejection crash").
   - **Fix:** proposed change as a diff or description.
   - **Risk:** Low / Medium / High.
   - **Effort:** Quick-fix (<5 min) / Moderate (5–30 min) / Significant (>30 min).

### 3 — Report

Produce a **Self-Improvement Report** artifact (`plans/<scope-slug>-self-improvement-report.md`) containing:

1. **Summary** — scope scanned, categories evaluated, total findings.
2. **Findings** — prioritized list (quick-fix + high-severity first).
3. **Recommendation** — which items to apply now, which to defer, which need further investigation.

**⏸️ STOP — Present the report to the user. Wait for approval on which items to apply.**

### 4 — Apply

For each approved item:

1. Implement the fix.
2. Re-run tests: `cd apps/api-node && npm test` and/or `cd apps/web && npm run build`.
3. If tests break:
   - Attempt fix (max 2 retries).
   - If still broken after 2 retries, revert the change and flag for manual review.
4. Log the change in the report artifact (mark as ✅ applied, ❌ reverted, or ⏭️ skipped).

### 5 — Summary

After all approved items are processed:

1. Update the report artifact with final status of each item.
2. If structural changes were made, run `/update-codemaps`.
3. Produce a one-paragraph summary of what changed.

**⏸️ STOP — Present the summary to the user for final review.**

---

## Constraints

- **Max 10 items per run** — prevents unbounded scope creep.
- **Max 2 retry loops per item** — if a fix fails twice, skip and flag.
- **No scope expansion** — only files in the declared `scope` may be changed.
- **No new dependencies** — do not add npm packages without explicit approval.
- **Tests must stay green** — revert any change that breaks tests.
- **Architecture findings require Tier 1** — escalate to the best available model.

## Related Workflows

| Workflow | Relationship |
|----------|-------------|
| `self-review` | Polishes recently-completed features (narrower scope) |
| `security-scan` | Deep security-specific audit (overlaps Security category) |
| `perf-baseline` | Performance benchmarking (overlaps Performance category) |
| `build-error-resolver` | Fixes build failures (use when self-upgrade breaks something) |
