---
description: Multi-agent self-review loop — analyze, improve, and verify recent code changes
model_tier: 2  # Tier 2 (Sonnet) — code review and refactoring
---

# Self-Review Workflow

A structured loop where agents review their own recent work, propose improvements, implement them, and cross-verify the result. Use this as a polish pass after a feature is functionally complete.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `scope` | ✅ | File paths or git ref range (e.g., `HEAD~5..HEAD`, or `apps/api-node/src/routes/`) |
| `focus` | Optional | Area of emphasis: `style`, `performance`, `security`, `tests`, `readability`, or `all` (default: `all`) |

---

## Steps

### Phase 1 — Analyze (Reviewer Agent)

1. Gather the changes:
   - If `scope` is a git range: `git diff <range> --name-only` to list changed files, then read each.
   - If `scope` is file paths: read all specified files.

2. Evaluate the code against these dimensions:

   | Dimension | What to Look For |
   |-----------|------------------|
   | **Style** | Naming consistency, formatting, dead code, commented-out blocks, import order |
   | **Patterns** | DRY violations, inconsistent error handling, missing middleware, misuse of async/await |
   | **Test coverage** | Untested happy paths, missing edge-case tests, assertions that are too loose |
   | **Performance** | N+1 queries, unnecessary re-renders, missing indexes or caching opportunities |
   | **Security** | Unsanitized input, missing auth checks, PII exposure in logs |
   | **Readability** | Functions too long (>40 lines), unclear variable names, missing JSDoc on public APIs |

3. Produce a **Self-Review Report** with exactly 3–5 improvements, ranked by impact:

   ```markdown
   ## Self-Review Report

   **Scope:** <scope>
   **Focus:** <focus>

   ### Improvements

   1. **[HIGH] <title>**
      - File: `<path>`
      - Issue: <what's wrong>
      - Fix: <what to do>

   2. **[MEDIUM] <title>**
      - File: `<path>`
      - Issue: <what's wrong>
      - Fix: <what to do>

   3. **[LOW] <title>**
      ...
   ```

**⏸️ STOP — Present the report to the user. Proceed only if the user approves the improvements (or a subset).**

---

### Phase 2 — Implement (Implementer Agent)

1. For each approved improvement:
   - Make the code change.
   - If a test improvement: write or update the test.
   - If a refactor: update all call sites and imports.

2. After all changes:
   - Run `npm test` in `apps/api-node/` (backend).
   - Run `npm run build` in `apps/web/` (frontend, if applicable).
   - Confirm all checks pass.

3. Produce a **Change Summary** listing each improvement and what was modified.

---

### Phase 3 — Verify (Verifier Agent)

1. Review every change made in Phase 2:
   - Does the fix actually address the issue identified in Phase 1?
   - Were any new issues introduced?
   - Are tests still passing and meaningful?

2. Check for regressions:
   - Did refactors break any existing functionality?
   - Are error messages and response formats still consistent?
   - Do the codemaps need updating?

3. Produce a **Verification Verdict**:

   ```markdown
   ## Verification Verdict

   | # | Improvement | Implemented? | Correct? | Notes |
   |---|-------------|-------------|----------|-------|
   | 1 | <title> | ✅ | ✅ | Clean |
   | 2 | <title> | ✅ | ⚠️ | Minor: <note> |
   | 3 | <title> | ✅ | ✅ | Clean |

   **Overall:** PASS / PASS WITH NOTES / FAIL
   ```

4. If any item is marked FAIL:
   - Return to Phase 2 for that specific item only.
   - Max 2 retry loops before escalating to the human.

**⏸️ STOP — Present the verification verdict to the user.**

---

## Constraints

- **Max 5 improvements per run.** More than 5 creates too much change surface and makes verification unreliable. Run the workflow again for additional polish.
- **Max 2 retry loops.** If an improvement can't be cleanly implemented and verified in 2 attempts, stop and flag it for human review.
- **No scope creep.** This workflow addresses only what's in `scope`. Do not refactor unrelated code.
- **Tests must stay green.** At no point should the test suite be left in a broken state.
- **Human approval required** between Phase 1 and Phase 2. The agent cannot self-approve improvements.

---

## Handoff Artifacts

Emit handoffs per `agents/protocol.md` at each phase transition:

1. **Phase 1 → Phase 2:** `from: reviewer` → `to: implementer`, attach the Self-Review Report as input artifact.
2. **Phase 2 → Phase 3:** `from: implementer` → `to: verifier`, attach the Change Summary as input artifact.
3. **Phase 3 → done (or retry):** `from: verifier` → `to: implementer` (if FAIL) or mark handoff as `completed`.
