---
description: Harden critical flows with thorough edge-case testing and failure-mode analysis
model_tier: 1  # Tier 1 (Opus) — critical-path correctness
---

# Critical-Path Hardening Workflow

Systematically strengthen the correctness of an app's most important flows — the ones where bugs cost money, trust, or data integrity.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `app_slug` | ✅ | App identifier, used to locate the spec at `specs/<app_slug>-spec.md` |
| `critical_flows` | ✅ | Comma-separated list of flow names (e.g., `checkout, auth login, inventory allocation`) |

---

## Steps

### 1 — Map Critical Flows to Code

For each flow in `critical_flows`:

1. Read the app spec (`specs/<app_slug>-spec.md`) and any implementation plan (`plans/<app_slug>-plan.md`).
2. Identify the **endpoints**, **service functions**, **DB operations**, and **frontend components** involved.
3. Produce a mapping table:

   | Flow | Endpoints | Services / Functions | DB Tables | Frontend Pages/Components |
   |------|-----------|----------------------|-----------|---------------------------|
   | checkout | `POST /api/orders` | `orderService.create()` | `orders`, `payments` | `CheckoutPage`, `PaymentForm` |
   | auth login | `POST /api/auth/login` | `authService.login()` | `users`, `sessions` | `LoginPage` |

### 2 — Enumerate Edge Cases and Failure Modes

For each critical flow, enumerate:

- **Happy path** — the default success scenario (baseline).
- **Input edge cases** — empty strings, nulls, boundary values, special characters, extremely long input, duplicate submissions.
- **Concurrency issues** — race conditions, double-spend, double-submit.
- **Dependency failures** — DB down, S3 timeout, external API 5xx, network partition.
- **Authorization failures** — unauthenticated, wrong role, expired token, CSRF.
- **Data integrity** — partial writes, orphaned records, constraint violations.
- **Idempotency** — what happens if the same request is sent twice?

Document these in a structured list per flow.

### 3 — Write / Update Tests

For each edge case identified in Step 2, write or update tests:

#### Unit Tests

- File: `apps/api-node/tests/critical-<flow-name>.test.js`
- Test each service function in isolation with mocked dependencies.
- Cover every edge case from Step 2.

#### Integration Tests

- File: `apps/api-node/tests/critical-<flow-name>.integration.test.js`
- Test the full endpoint (HTTP request → response) with a real or in-memory database where feasible.
- Verify DB state after each operation (row counts, field values, constraint enforcement).

#### Property-Based Tests (Optional)

- If the flow involves numerical calculations (pricing, discounts, tax), inventory math, or token generation:
  - Use a property-based testing library (e.g., `fast-check`) to generate randomized inputs.
  - Assert invariants: `total >= 0`, `inventory_after <= inventory_before`, `token.length === 64`, etc.

#### Frontend Tests (If Testing Setup Exists)

- Note any critical UI flows that need component or E2E tests (e.g., form validation, payment form error states).
- If Playwright or similar is set up, propose E2E test scenarios.
- If no frontend testing is configured, note this as a gap.

### 4 — Run Tests and Summarize

1. Run `cd apps/api-node && npm test` and capture results.
2. If any tests fail, diagnose and fix before proceeding.
3. Re-run until all tests pass.

### 5 — Output: Critical Path Hardening Summary

Create an artifact titled **`<app_slug>-critical-path-summary.md`** containing:

#### Flows Covered

| Flow | Unit Tests | Integration Tests | Property Tests | Status |
|------|-----------|-------------------|---------------|--------|
| checkout | 12 | 5 | 2 | ✅ All pass |
| auth login | 8 | 3 | — | ✅ All pass |

#### New Tests Added

- List every new test file and the number of test cases.

#### Edge Cases Addressed

- Per-flow summary of which edge cases are now covered.

#### Remaining Gaps

- Flows or edge cases that are **not yet covered** and why (e.g., requires staging environment, needs external API mock, frontend testing not set up).
- Recommendations for closing those gaps.

---

**⏸️ STOP — Present the summary to the user for review.**
