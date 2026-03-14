# Self-Improvement Strategy

> Agents that review and upgrade their own code — systematically, safely, and with human oversight.

## Purpose

The self-improvement capability lets agents proactively identify and fix quality issues across the codebase **without waiting for a human to notice them**. Unlike `self-review` (which polishes recently-completed features), self-improvement targets the **entire codebase** for structural and quality upgrades.

## Scope Categories

When running a self-improvement cycle, agents pick one or more categories:

| Category | What Agents Look For | Risk Level |
|----------|---------------------|------------|
| **Code Quality** | Dead code, duplicated logic, inconsistent patterns, missing error handling | Low |
| **Performance** | Unoptimized queries, missing caching, unnecessary re-renders, large bundle imports | Medium |
| **Security** | Hardcoded values, missing input validation, outdated dependencies with CVEs | High |
| **Developer Experience** | Missing types, unclear naming, outdated docs, missing tests for critical paths | Low |
| **Architecture** | Misplaced abstractions, circular dependencies, violated module boundaries | High |

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `scope` | ✅ | Target directory or file pattern (e.g., `apps/api-node/`, `apps/web/src/components/`) |
| `categories` | Optional | One or more categories from above. Default: all Low + Medium risk categories |
| `max_items` | Optional | Maximum number of improvements to propose. Default: 10 |

## Output

A **Self-Improvement Report** artifact containing:

1. **Summary** — scope scanned, categories evaluated, items found.
2. **Findings** — prioritized list of improvements, each with:
   - What: description of the issue.
   - Where: file path and line range.
   - Why: impact if left unaddressed.
   - Fix: proposed change (diff or description).
   - Risk: Low / Medium / High.
3. **Recommendation** — which items to apply now vs. defer.

## Constraints

> These constraints are **non-negotiable** for safety.

1. **Human approval required** — agents MUST present the report and wait for approval before applying any changes.
2. **Tests must stay green** — after each applied change, re-run `npm test` (backend) and/or `npm run build` (frontend). Revert if broken.
3. **Max 10 items per run** — prevents unbounded scope creep.
4. **Max 2 retry loops per item** — if a fix fails twice, skip it and flag for manual review.
5. **No scope expansion** — only the files in the declared `scope` may be changed.
6. **No dependency additions** — self-improvement must not add new npm packages without explicit approval.
7. **Architecture changes require Tier 1 model** — any finding in the Architecture category must be evaluated by a Tier 1 model before being applied.

## Integration

- **Workflow:** `.agent/workflows/self-upgrade.md`
- **Checklist:** `self-improvement/checklist.md` (item-level evaluation criteria)
- **Trigger:** manual (`/self-upgrade`) or scheduled (e.g., weekly CI job)
- **Complements:** `self-review` (feature polish) + `security-scan` (security-specific) + `perf-baseline` (perf-specific)
