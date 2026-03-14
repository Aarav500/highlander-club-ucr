# Shared Billing Module — Design Notes

## Overview

A platform-level billing module providing Stripe integration, usage metering, and subscription management that any app built from `fullstack-template` can import.

## Planned Capabilities

### Payments

- **Stripe Checkout** — hosted payment pages for one-time and subscription purchases.
- **Payment intents** — custom payment flows with client-side confirmation.
- **Webhook handler** — verified Stripe webhook processing for payment events (`payment_intent.succeeded`, `invoice.paid`, `customer.subscription.updated`, etc.).
- **Idempotency** — all payment operations use idempotency keys to prevent double-charges.

### Subscriptions

- **Plan management** — CRUD for subscription plans (free, basic, pro, enterprise).
- **Lifecycle hooks** — callbacks on `created`, `upgraded`, `downgraded`, `cancelled`, `past_due`.
- **Trial support** — configurable trial periods with auto-convert or cancel.
- **Proration** — automatic proration on mid-cycle plan changes.

### Usage Metering

- **Event ingestion** — record usage events (`api_calls`, `storage_bytes`, `compute_minutes`).
- **Aggregation** — hourly/daily rollups per customer.
- **Stripe reporting** — push usage records to Stripe for metered billing.
- **Quota enforcement** — middleware that checks usage limits before allowing API calls.

### Integration Surface

| Export | Type | Description |
|--------|------|-------------|
| `billingMiddleware()` | Express middleware | Attaches `req.subscription` with current plan and limits |
| `requirePlan(plan)` | Express middleware | Rejects if user's subscription doesn't include the plan |
| `createCheckout(params)` | Function | Creates a Stripe Checkout session |
| `handleWebhook(req)` | Function | Verifies and processes Stripe webhook events |
| `recordUsage(event)` | Function | Records a usage event for metered billing |
| `BillingProvider` | React context | Client-side subscription state (plan, limits, usage) |

### Configuration

```yaml
billing:
  provider: stripe
  stripe:
    secretKey: ${STRIPE_SECRET_KEY}
    webhookSecret: ${STRIPE_WEBHOOK_SECRET}
    publishableKey: ${NEXT_PUBLIC_STRIPE_KEY}
  plans:
    - id: free
      limits: { api_calls: 1000, storage_mb: 100 }
    - id: basic
      stripe_price_id: price_xxx
      limits: { api_calls: 10000, storage_mb: 1000 }
    - id: pro
      stripe_price_id: price_yyy
      limits: { api_calls: 100000, storage_mb: 10000 }
  usage:
    metering_interval: hourly
    quota_enforcement: true
```

## Security Considerations

- **Webhook verification** — all incoming Stripe webhooks validated with `stripe.webhooks.constructEvent()`.
- **PCI compliance** — no card data touches the server; Stripe.js + Elements handle all card input.
- **Secrets management** — all Stripe keys via environment variables, never in code.
- **Idempotency** — all mutation operations use idempotency keys stored in the database.

## Open Questions

- Should the billing module own the `subscriptions` table, or use Stripe as the source of truth with local caching?
- How to handle multi-currency for international apps?
- Package distribution: local workspace dependency vs. private npm registry?
- Should usage metering be real-time (Redis) or batch (Postgres + cron)?

## Status

**Not implemented.** This file captures the target design for future extraction.
