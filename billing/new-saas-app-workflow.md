---
description: "New SaaS App — app + Stripe billing wired in one flow"
model_tier: 2  # Tier 2 (Sonnet) — feature implementation
---

# New SaaS App Workflow — App + Billing in One Flow

> Extends the `new-production-app` pipeline to produce an app **with Stripe
> billing built in** from day one. Use this when the answer to "Does this app
> need billing?" is **yes**.
>
> **Prerequisite:** Read `billing/stripe-checkout.md` and
> `billing/usage-metering.md` before running this workflow.

---

## Inputs

| Input | Description |
|-------|-------------|
| `idea` | Short, plain-language app description |
| `billing_model` | `one-time`, `subscription`, or `metered` |
| `plans` | List of pricing tiers (e.g., free / basic / pro) |

---

## Phase 1 — PLAN (extends `new-production-app` Phase 1)

1. Run all steps from `new-production-app` Phase 1 (spec, plan, codemaps).

2. **Billing addendum** — add a `## Billing` section to the plan covering:
   - Pricing model (`one-time`, `subscription`, or `metered`).
   - Plan tiers and limits (API calls, storage, features per plan).
   - Which endpoints are gated behind a paid plan.
   - Whether usage metering is needed (and which metrics to track).

3. **Stripe config** — add the required environment variables to the plan:
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_KEY`
   - Stripe Price IDs for each plan tier.

### ⏸️ STOP — Wait for human review of the spec + plan + billing addendum.

---

## Phase 2 — IMPLEMENT (extends `new-production-app` Phase 2)

### 2A — Backend Billing Routes

1. Install `stripe` in `apps/api-node/`.
2. Create checkout route following `billing/stripe-checkout.md § Backend Setup`.
3. Create webhook handler following `billing/stripe-checkout.md § Webhook Handler`.
4. Add `billingMiddleware` and `requirePlan()` gate following
   `billing/stripe-checkout.md § Subscription Middleware`.
5. Register webhook route **before** `express.json()` in `app.js`.
6. Register billing routes after `express.json()`.

### 2B — Usage Metering (if `billing_model` = `metered`)

1. Create usage tables following `billing/usage-metering.md § Database Schema`.
2. Add `recordUsage` service and `enforceQuota` middleware following
   `billing/usage-metering.md § Backend Implementation`.
3. Add `trackApiCalls` middleware to metered routes.
4. Set up aggregation query (hourly rollup) following
   `billing/usage-metering.md § Aggregation`.

### 2C — Frontend Billing UI

1. Add Stripe.js checkout button following
   `billing/stripe-checkout.md § Frontend Setup`.
2. Create a `/billing` page with:
   - Current plan display
   - Upgrade/downgrade buttons
   - Usage dashboard (if metered)
   - Billing history link (Stripe Customer Portal)
3. Create `/billing/success` and `/billing/cancel` callback pages.

### 2D — Standard App Features

1. Execute all remaining backend and frontend tasks from the approved plan
   (same as `new-production-app` Phase 2).

### ⏸️ STOP — Wait for human review of backend + frontend + billing.

---

## Phase 3 — REVIEW (same as `new-production-app` Phase 3)

1. Run `/code-review` or manual review using `CLAUDE.md § Quality Bars`.
2. **Additional billing checks:**
   - Webhook signature verification is in place.
   - No raw Stripe keys in client-side code.
   - Checkout sessions created server-side only.
   - Plan gate middleware applied to all premium endpoints.
   - Usage metering covers all declared metrics.
3. Produce review notes including billing-specific findings.

### ⏸️ STOP — Wait for human sign-off.

---

## Phase 4 — VERIFY (extends `new-production-app` Phase 4)

### Required checks

1. Backend tests: `cd apps/api-node && npm test`
2. Frontend build: `cd apps/web && npm run build`

### Billing-specific checks

3. **Webhook test** — use Stripe CLI to forward and trigger test events:
   ```bash
   stripe listen --forward-to localhost:4000/api/stripe/webhook
   stripe trigger checkout.session.completed
   stripe trigger invoice.payment_failed
   ```
4. **Checkout flow** — manually verify:
   - POST `/api/billing/checkout` returns a valid Stripe URL.
   - Completing checkout triggers `checkout.session.completed` webhook.
   - User's plan is updated after successful payment.
5. **Quota enforcement** (if metered) — verify quota middleware returns 429
   when limits are exceeded.

### On failure

- Use `build-error-resolver` workflow for build/test failures.
- For Stripe-specific failures, check webhook logs in the Stripe Dashboard.

### ⏸️ STOP — Wait for human review of all verification results.

---

## Phase 5 — DEPLOY-READY SUMMARY

Same as `new-production-app` Phase 5, with additional rows:

| Section | Contents |
|---------|----------|
| **Billing model** | One-time / Subscription / Metered |
| **Plan tiers** | Table of plans with limits and Stripe Price IDs |
| **Billing endpoints** | `/api/billing/checkout`, `/api/stripe/webhook`, etc. |
| **Stripe config** | Required env vars (names only — no values) |
| **Usage metrics** | Tracked metrics and quota limits (if metered) |

---

## Safety Rules (same as `new-production-app` + billing additions)

- All `new-production-app` safety rules apply.
- **No real Stripe keys in code, docs, or examples.** Use test-mode keys during development.
- **Webhook endpoint must NOT be behind auth middleware** — Stripe sends requests directly.
- **All payment mutations use idempotency keys** to prevent double-charges.
- **No client-side price manipulation** — Checkout sessions created server-side with fixed Price IDs.

---

## Related Files

| File | Purpose |
|------|---------|
| `.agent/workflows/new-production-app.md` | Base production pipeline (this workflow extends it) |
| `billing/stripe-checkout.md` | Stripe Checkout integration guide |
| `billing/usage-metering.md` | Usage tracking and quota enforcement |
| `platform/billing/billing-notes.md` | Full design notes and future plans |
