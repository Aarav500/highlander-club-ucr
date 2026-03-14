---
description: Diagnose build or test failures from logs and propose minimal fixes
model_tier: 3  # Tier 3 (Haiku) — build/test error diagnosis
---

# Build Error Resolver

> **Input:** Either a path to a log file (e.g., `ci-output.log`) or pasted error logs.
>
> **Output:** Diagnosis, categorized root cause, and a fix plan — with optional automated fix if permitted.

---

## Step 1) Load Context

Read the following files:

1. `CLAUDE.md` — stack, conventions, work phases
2. `.antigravity/rules.md` — repo rules
3. `docs/CODEMAPS/backend.md` and `docs/CODEMAPS/frontend.md` — architecture context (if exists)

---

## Step 2) Ingest Logs

Read the provided build/test logs. Accept input in one of two ways:

- **File path:** Read the log file directly (e.g., `cat ci-output.log`).
- **Pasted logs:** Accept inline log content from the user.

---

## Step 3) Categorize the Error

Classify the failure into one of these categories:

| Category | Examples |
|----------|---------|
| **Infra / Environment** | Missing env vars, wrong Node version, unavailable database, Docker issues, port conflicts. |
| **Build / Compile** | TypeScript errors, missing imports, Next.js build failures, ESLint violations. |
| **Test Failures** | Failing unit tests, assertion errors, timeout issues, missing test fixtures. |
| **Dependency** | Missing packages, version conflicts, broken peer dependencies, `npm install` failures. |
| **Runtime** | Crashes on startup, unhandled promise rejections, segfaults. |

Present the categorization and root cause analysis.

---

## Step 4) Propose Fix

Generate a fix plan with:

1. **Root Cause** — one-sentence explanation of what went wrong.
2. **Affected Files** — list of files that need changes.
3. **Minimal Fix** — the smallest change that resolves the error. Prefer targeted fixes over broad refactors.
4. **Verification Command** — the exact command to confirm the fix works (e.g., `cd apps/api-node && npm test`).

**⏸️ STOP — Wait for user to decide: apply fix automatically or just keep the plan.**

---

## Step 5) Apply Fix (if permitted)

If the user approves automatic fixing:

1. Make the proposed changes — only the files listed in Step 4.
2. Run the verification command.
3. If the fix resolves the error, report success.
4. If new errors appear, return to Step 3 and iterate (max 3 attempts).
5. If unable to resolve after 3 attempts, report the situation and request human intervention.

If the user chooses plan-only mode:

1. Output the fix plan as a structured artifact.
2. Do NOT modify any files.

---

## Step 6) Report

Produce a **Build Error Resolution** artifact:

```markdown
# Build Error Resolution — <date>

## Error Category
<Infra / Build / Test / Dependency / Runtime>

## Root Cause
<One-sentence explanation>

## Fix Applied
<Yes / No (plan only)>

## Changes Made
- `<file>`: <description of change>

## Verification
- Command: `<command>`
- Result: <PASS / FAIL>

## Notes
<Any caveats, related issues, or follow-up recommendations>
```
