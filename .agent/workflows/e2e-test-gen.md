---
description: Generate end-to-end tests for critical user journeys based on the app spec
model_tier: 3  # Tier 3 (Haiku) — test generation
---

# E2E Test Generation

> **Input:** App slug (matches a spec in `specs/<slug>-spec.md`).
>
> **Output:** Playwright test files in `tests/e2e/` covering the top 3–5 critical user journeys.

---

## Step 1) Load Context

Read the following files:

1. `CLAUDE.md` — stack, conventions, work phases
2. `specs/<slug>-spec.md` — the app specification (user stories, screens, API endpoints)
3. `plans/<slug>-plan.md` — the implementation plan (if exists)
4. `.antigravity/rules.md` — repo rules

---

## Step 2) Identify Critical User Journeys

From the spec, identify the **top 3–5 critical user journeys** — flows that, if broken, would make the app unusable. Examples:

- User registration → login → access protected page
- Create resource → view resource → edit resource → delete resource
- Search/filter → view results → navigate to detail page

Present the list of journeys as an artifact.

**Artifact:** Proposed E2E Test Journeys
**⏸️ STOP — Wait for user review and approval of the journeys before generating test code.**

---

## Step 3) Generate Test Code

// turbo

For each approved journey, generate a Playwright test file:

1. Create `tests/e2e/` directory at the repo root (if it doesn't exist).
2. Create a Playwright config at `tests/e2e/playwright.config.ts`:
   - Base URL: `http://localhost:3000` (frontend) and `http://localhost:4000` (API)
   - Browser: Chromium
   - Retries: 1
   - Screenshots on failure
3. For each journey, create `tests/e2e/<journey-slug>.spec.ts`:
   - Use Page Object Model pattern where appropriate
   - Include setup/teardown (API seeding if needed)
   - Assert on visible UI elements — not implementation details
   - Handle loading states and async operations

**Artifact:** Generated Test Files
**⏸️ STOP — Wait for user review of test code before proceeding.**

---

## Step 4) Add Run Instructions

// turbo

1. Add a `test:e2e` script to the root `package.json`:
   ```json
   "test:e2e": "npx playwright test --config=tests/e2e/playwright.config.ts"
   ```

2. Document local run instructions:
   ```bash
   # Install Playwright browsers (first time only)
   npx playwright install chromium

   # Start the app (both frontend and backend)
   npm run dev

   # In a separate terminal, run E2E tests
   npm run test:e2e

   # Run with UI mode for debugging
   npx playwright test --config=tests/e2e/playwright.config.ts --ui
   ```

3. If applicable, suggest a CI addition for `.github/workflows/deploy-ec2.yml`:
   - Run E2E tests after unit tests pass
   - Produce a **CI Update Plan** artifact if changes are needed
   - **⏸️ STOP — Wait for approval before editing CI files.**

---

## Step 5) Verify

1. Run `npx playwright test --config=tests/e2e/playwright.config.ts` to confirm tests execute.
2. If failures occur, diagnose and fix test code (not application code).
3. Report results.

**Artifact:** E2E Test Results Summary
