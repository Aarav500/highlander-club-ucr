---
description: "End-to-end AI Production Lab pipeline for this template"
model_tier: 2  # Tier 2 (Sonnet) — feature implementation
---

# New Production App — End-to-End Workflow

> Turns a short idea into a production-ready app using the fullstack-template
> building blocks. **Does NOT deploy automatically** — deployment is triggered
> by a human via `git push main`.

---

## Phase 1 — PLAN

**Input:** `idea` — a short, plain-language app description.

### Steps

1. **Generate spec and plan** — invoke the `new-app-from-idea` workflow (or run
   the planning agent manually) with the `idea` as input.
   - Produce `specs/<slug>-spec.md` using `spec-template.md` as the base.
   - Produce `plans/<slug>-plan.md` with 10–20 discrete, testable tasks grouped
     by area (backend, frontend, infra, CI).
   - Reference prompts as needed:
     - `prompts/00-product-definition.md`
     - `prompts/01-schema-design.md`
     - `prompts/02-api-backend.md`
     - `prompts/03-frontend-ui.md`

2. **Read existing codemaps** — review `docs/CODEMAPS/architecture.md` and any
   domain-specific codemap to avoid duplicating or conflicting with existing
   modules.

3. **Billing gate — Does this app need billing?**
   - If the spec mentions payments, subscriptions, pricing tiers, or usage
     limits → **auto-wire Stripe** into the plan:
     - Add billing tasks referencing `billing/stripe-checkout.md` (Checkout
       routes, webhook handler, subscription middleware).
     - Add usage metering tasks referencing `billing/usage-metering.md` if the
       app has metered features (API call limits, storage quotas).
     - Note that `billing/new-saas-app-workflow.md` provides an extended
       end-to-end flow with billing-specific review and verification steps.
   - If the spec does **not** mention billing → skip this step and proceed.

4. **Distribution gate — SEO + viral sharing (always applied)**
   - Add an SEO task referencing `distribution/seo-template.md` (metadata,
     Open Graph, JSON-LD, sitemap, robots).
   - Add a landing page task referencing
     `distribution/landing-page-generator.md` (Hero, Features, Pricing, FAQ
     sections auto-generated from the spec).
   - Add viral sharing tasks referencing `distribution/viral-loops.md`
     (ShareButtons component on landing page and key app pages).
   - If the app has user accounts → also add referral program tasks
     (referral routes, referral widget, UTM tracking).

5. **⏸️ STOP — Wait for human review and approval of the spec and plan before
   proceeding.**

---

## Phase 2 — IMPLEMENT

### 2A — Backend (`apps/api-node/`)

1. Read the approved plan; execute **only** the backend tasks listed.
2. Implement Express routes, middleware, services, and database queries
   following repo conventions (see `CLAUDE.md § Conventions`).
3. Write or update tests alongside every new endpoint and service function.
4. Run backend tests and confirm they pass:
   ```bash
   cd apps/api-node && npm test
   ```
5. Ensure:
   - Consistent error format: `{ error: string, details?: any }`.
   - All config read from environment variables — no hardcoded secrets.
   - SQL queries parameterized — no string concatenation.
   - **Observability instrumented** — every new endpoint must emit structured
     JSON logs via the request-logging middleware in `app.js` (request ID,
     method, path, status, latency). Verify that the `/metrics` endpoint
     reflects the new routes. See `observability/schema.md` for the required
     log format.

### 2B — Frontend (`apps/web/`)

1. Read the approved plan; execute **only** the frontend tasks listed.
2. Implement pages, components, and layouts using Next.js App Router, Tailwind
   CSS, and Framer Motion.
3. Target high-quality, modern SaaS design:
   - Strong typography, visual hierarchy, grid discipline, micro-interactions.
   - Mobile responsiveness tested at 375 px, 768 px, and 1280 px.
   - `prefers-reduced-motion` respected — wrap Framer Motion animations in
     motion-safe checks.
4. Wire API calls to the backend endpoints defined in the spec.
5. Handle loading, error, and empty states for every data-fetching component.
6. **Landing page** — generate or customize the marketing landing page per
   `distribution/landing-page-generator.md` using content extracted from the
   spec (headline, features, pricing, FAQ).
7. **Distribution wiring** — add SEO metadata per `distribution/seo-template.md`
   and `ShareButtons` component per `distribution/viral-loops.md` on the
   landing page and key app pages.

### ⏸️ STOP — Wait for human review after backend and frontend are complete.

---

## Phase 3 — REVIEW

1. **Run code review** — use the `/code-review` slash command (code-reviewer
   agent from everything-claude-code) against all changed files.
   - If the plugin is not installed, perform a manual review using the checklist
     in `CLAUDE.md § Quality Bars`.

2. **Produce a Review Notes artifact** — create
   `plans/<slug>-review-notes.md` summarizing:
   - Issues found (critical vs. minor).
   - Suggestions and trade-offs.
   - Risk areas.

3. **Apply critical fixes** — address all critical issues before proceeding.
   Document any accepted trade-offs in the review notes.

### ⏸️ STOP — Wait for human sign-off on the review notes before proceeding.

---

## Phase 4 — VERIFY

### Required checks

1. **Backend tests:**
   ```bash
   cd apps/api-node && npm test
   ```
2. **Frontend build:**
   ```bash
   cd apps/web && npm run build
   ```

### Optional checks (run when available)

3. **Security scan** — run the `security-scan` workflow (`/security-scan`).
   Record findings.
4. **E2E tests** — run the `e2e-test-gen` workflow (`/e2e`) to generate
   Playwright tests for critical flows, then execute them.

### On failure

- Use the `build-error-resolver` workflow (`/build-fix`) to auto-diagnose and
  fix any failing command.
- Re-run the failed check until it passes.
- **Do NOT proceed until all required checks are green.**

### ⏸️ STOP — Wait for human review of verification results.

---

## Phase 5 — DEPLOY-READY SUMMARY

Produce a final **Deploy-Ready Artifact** (`plans/<slug>-deploy-ready.md`)
containing:

| Section | Contents |
|---------|----------|
| **App name & slug** | Human-readable name and kebab-case slug. |
| **Key features** | Bullet list of implemented user stories. |
| **API endpoints** | Table of routes (`METHOD /path → description`). |
| **Main screens** | List of frontend pages/routes with brief descriptions. |
| **Test results** | Backend test count/pass rate, build status. |
| **Security scan** | Summary of findings (or "not run" if skipped). |
| **E2E results** | Summary of E2E tests (or "not run" if skipped). |
| **Known risks / TODOs** | Open items, accepted trade-offs, pre-deploy tasks. |

> **Deployment is NOT automatic.**
> When the human is satisfied, they trigger deployment by pushing to `main`:
>
> ```bash
> git push origin main
> ```
>
> The GitHub Actions pipeline (`.github/workflows/deploy-ec2.yml`) handles
> build, test, and deploy to EC2 via `infra/deploy/deploy.sh`.

---

## Safety Rules (apply to every phase)

- **No `git merge`, `git rebase`, or `git reset --hard`** — leave branch
  integration to the human.
- **No new top-level folders** without explicit human approval.
- **No changes to git remotes or deployment targets.**
- **No automatic deployment** — this workflow ends at DEPLOY-READY.
- **All secrets from environment variables** — never commit credentials.
