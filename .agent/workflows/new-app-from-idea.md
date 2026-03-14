---
description: Generate a full-stack app from a short idea — spec, plan, backend, frontend, deploy-ready
model_tier: 2  # Tier 2 (Sonnet) — full-stack feature implementation
---

# New App from Idea

> **Input:** `idea` — a short description of the app you want to build (1–3 sentences).
>
> **Output:** A production-shaped full-stack app with backend, frontend, CI/CD — ready to push.

---

# ═══════════════════════════════════════
# PHASE 1: PLAN
# ═══════════════════════════════════════

## 1.1) Load Context

Read the following files to understand the project structure and rules:

1. `CLAUDE.md` — stack, conventions, agent roles, work phases
2. `spec-template.md` — spec format
3. `.antigravity/rules.md` — repo rules (spec-driven, plan-first, review-driven, codemap discipline)
4. `prompts/00-product-definition.md` — how to create a spec
5. `docs/CODEMAPS/` — existing architecture maps (if any)

Confirm you understand the stack (Next.js + Express + Postgres + S3 → EC2).

---

## 1.2) Create Spec

// turbo

Follow the instructions in `prompts/00-product-definition.md`:

1. Take the `idea` input.
2. Create `specs/<slug>-spec.md` using `spec-template.md` as the format.
3. Fill ALL 6 sections:
   - Product summary
   - Core user stories (5–10)
   - Data model (Postgres tables with columns/types/constraints)
   - API endpoints (method, path, auth, request/response)
   - Screens / components (page layouts and component breakdowns)
   - Non-functional requirements & Definition of Done

**Artifact:** Spec Draft
**⏸️ STOP — Wait for user review before proceeding.**

---

## 1.3) Create Plan

// turbo

Follow the instructions in `prompts/01-schema-design.md` and `prompts/02-api-backend.md`:

1. Read existing codemaps in `docs/CODEMAPS/` to understand current module responsibilities.
2. Create `plans/<slug>-plan.md` with 10–20 implementation tasks.
3. Group tasks into phases:
   - **Schema & DB** — migrations, seed data
   - **Backend API** — routes, middleware, auth
   - **Frontend Layout** — shared components, navigation
   - **Frontend Pages** — page implementations, API wiring
   - **Polish** — animations, responsive, error states
4. Each task should be specific and testable.
5. Reference codemap findings to avoid duplicating existing modules.

**Artifact:** Implementation Plan
**⏸️ STOP — Wait for user review before proceeding.**

---

# ═══════════════════════════════════════
# PHASE 2: IMPLEMENT
# ═══════════════════════════════════════

> Execute **only** the tasks in the approved plan. No scope creep.
>
> **Research-first rule:** If a task involves new libraries, unfamiliar APIs, complex patterns, or services you haven't used in this repo before, complete the RESEARCH sub-step below before writing code. Skip it for well-understood, routine work.

## 2.0) RESEARCH (if needed)

For any non-trivial or unfamiliar aspect of the plan:

1. Identify what is unfamiliar (e.g., a new npm package, an AWS service, a complex animation technique, a security pattern).
2. Research using the **search-first** skill:
   - Read official documentation.
   - Find best practices and common pitfalls.
   - Locate example implementations or starter code.
3. Produce a short **Research Artifact** (`plans/<slug>-research.md`) with:
   - Options considered (with links).
   - Recommended approach and rationale.
   - Risks or limitations discovered.
4. **⏸️ STOP — Wait for user approval of the research findings before implementing.**

> Skip this step if the plan only involves well-understood patterns already used in this codebase.

---

## 2.1) Backend Implementation

Follow `prompts/02-api-backend.md`:

1. Work ONLY in `apps/api-node/`.
2. Create migrations in `apps/api-node/src/migrations/`.
3. Implement Express routes in `apps/api-node/src/routes/`.
4. Register routes in `src/app.js`.
5. Add input validation and error handling.
6. Use `src/db.js` for all database queries.
7. Read all config from environment variables.
8. **Write or update tests** for all new/changed endpoints and logic in `tests/`.
9. **Run `npm test` in `apps/api-node`.** If any tests fail, debug and fix them before marking this step complete. Do NOT proceed with failing tests.

**Artifact:** Backend Changes & Tests (must include test commands run and pass/fail results)

**Checklist (backend) — verify before requesting review:**
- [ ] Tests added/updated for every new/changed endpoint?
- [ ] Error and edge cases handled (invalid input, missing fields, empty results)?
- [ ] Logging reasonable (errors logged, no sensitive data)?
- [ ] SQL queries parameterized (no string concatenation)?
- [ ] All config from environment variables (no hardcoded secrets)?

**⏸️ STOP — Wait for user review before proceeding.**

---

## 2.2) Frontend Experience

Follow `prompts/03-frontend-ui.md`:

1. Work ONLY in `apps/web/`.
2. Build shared components in `src/components/`:
   - Navbar, Footer, Button, Card, Input, etc.
3. Implement pages in `src/app/`:
   - Follow the spec screen definitions
   - Handle loading, error, and empty states
4. **Design quality targets:**
   - Modern SaaS aesthetic — dark theme, glassmorphism, gradients
   - Strong typography hierarchy (Inter font)
   - Consistent spacing (Tailwind scale)
   - Framer Motion animations:
     - Page enter: fade + slide up
     - Cards: hover lift
     - Buttons: press scale
     - Lists: staggered reveal
5. Wire all pages to backend API endpoints.
6. Use `NEXT_PUBLIC_API_URL` from env for API base URL.
7. Responsive design (mobile + desktop).

**Artifact:** UI & UX Summary

**Checklist (frontend) — verify before requesting review:**
- [ ] Mobile behavior OK (tested at 375px, 768px, 1280px)?
- [ ] `prefers-reduced-motion` respected (animations wrapped in motion-safe)?
- [ ] Accessible basics (semantic HTML, `alt` attributes, keyboard nav)?
- [ ] Design tokens consistent (color palette, spacing scale, Inter font)?
- [ ] Loading, error, and empty states handled?
- [ ] No inline secrets or API keys in client code?

**⏸️ STOP — Wait for user review before proceeding.**

---

# ═══════════════════════════════════════
# PHASE 3: REVIEW
# ═══════════════════════════════════════

## 3.1) Code Review

Run the `/code-review` command (or delegate to the code-reviewer agent) to examine all changes made during IMPLEMENT:

1. **Scope:** All new/modified files in `apps/api-node/` and `apps/web/`.
2. **Check for:**
   - Security issues (SQL injection, XSS, auth bypass)
   - Code quality (naming, duplication, dead code)
   - Spec compliance (does the implementation match the spec?)
   - Missing error handling or edge cases
   - Accessibility and responsive regressions (frontend)
3. **Produce a Review Artifact** (`plans/<slug>-review.md`) containing:
   - Issues found (critical / warning / info)
   - Suggestions for improvement
   - Risk areas and accepted trade-offs
4. **Fix critical issues** before proceeding. Document accepted trade-offs.

**Artifact:** Code Review Summary
**⏸️ STOP — Wait for user sign-off on the review before proceeding.**

---

# ═══════════════════════════════════════
# PHASE 4: VERIFY
# ═══════════════════════════════════════

> Do NOT recommend deployment until this phase succeeds with zero failures.

## 4.1) Run Tests & Build

1. **Backend tests:** `cd apps/api-node && npm test`
   - If failures occur, use `/build-fix` (build-error-resolver agent) or `/tdd` to diagnose and fix.
   - Re-run until all tests pass.
2. **Frontend build:** `cd apps/web && npm run build`
   - If build errors occur, use `/build-fix` to diagnose and fix.
   - Re-run until build succeeds.
3. **Start backend and verify health:** Start `node apps/api-node/src/index.js` and confirm `/health` responds.

---

## 4.2) CI/CD Sanity Check

1. Review `.github/workflows/deploy-ec2.yml` — confirm it still works with the new app.
   - The pipeline has a **test job** (backend `npm test` + frontend `npm run build`) that **gates** the deploy job via `needs: test`. The deploy will not run if tests fail.
2. Review `infra/deploy/deploy.sh` — confirm build commands are correct.
3. If changes are needed:
   - Produce a **CI/CD Update Plan** artifact describing proposed changes.
   - **⏸️ STOP — Wait for approval before editing any CI/CD files.**
4. Confirm that the CI test job would be green for the current code.

**Checklist (CI/CD) — verify before proceeding:**
- [ ] Test gate preserved (`needs: test` still gates deploy)?
- [ ] No existing tests removed without justification?
- [ ] Build step still runs `npm run build`?
- [ ] No unauthorized secrets added to CI?

---

## 4.3) Final Summary

Produce a **Ready to Push Summary** artifact containing:

1. **Files Changed** — high-level list of new/modified files
2. **API Endpoints** — table of implemented endpoints
3. **Screens** — list of pages with descriptions
4. **Tests** — commands run and results (e.g., `npm test` pass/fail, `npm run build` success)
5. **Review Findings** — summary of code review results and resolutions
6. **Local Dev Commands:**
   ```bash
   npm install
   cd apps/web && npm install
   cd ../api-node && npm install
   cd ../..
   npm run dev
   ```
7. **Manual Test Checklist** — steps to verify each feature works
8. **Remaining TODOs** — any known gaps or risks

> **⚠️ If any tests are failing, do NOT recommend deployment.** Fix failures first or document them as blocking issues.

**⏸️ STOP — Final review. After approval, commit and push to deploy.**

---

## Handoff Artifacts

Emit handoffs per `agents/protocol.md` at each phase boundary:

1. **Phase 1 → Phase 2:** `from: planner` → `to: implementer` — inputs: spec + plan.
2. **Phase 2 → Phase 3:** `from: implementer` → `to: reviewer` — inputs: changed files list.
3. **Phase 3 → Phase 4:** `from: reviewer` → `to: verifier` — inputs: review summary.
4. **Phase 4 → done:** `from: verifier` → mark chain `completed`, save to `plans/<slug>-handoff-NNN.json`.
