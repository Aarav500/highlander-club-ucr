# Stripe Checkout — Prebuilt Integration Guide

> Drop-in Stripe Checkout for any app built from `fullstack-template`.
> Covers one-time payments, subscriptions, webhook handling, and frontend wiring.

---

## Required Environment Variables

```bash
STRIPE_SECRET_KEY=sk_...          # Stripe API secret key
STRIPE_WEBHOOK_SECRET=whsec_...   # Webhook endpoint signing secret
NEXT_PUBLIC_STRIPE_KEY=pk_...     # Publishable key (safe for client)
```

> **Never commit real keys.** Use `sk-EXAMPLE-KEY-DO-NOT-USE` in docs and examples.

---

## Backend Setup (`apps/api-node/`)

### 1. Install Stripe SDK

```bash
cd apps/api-node && npm install stripe
```

### 2. Create Checkout Route

```
src/routes/billing.js
```

```js
const { Router } = require("express");
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();

/* ── Create Checkout Session ─────────────────────────────────────── */

router.post("/checkout", async (req, res, next) => {
  try {
    const { priceId, mode = "subscription", customerId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "priceId is required" });
    }

    const session = await stripe.checkout.sessions.create({
      mode,                          // "payment" | "subscription"
      customer: customerId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

### 3. Register the Route

In `src/app.js`:

```js
const billingRouter = require("./routes/billing");
app.use("/api/billing", billingRouter);
```

### 4. Webhook Handler

```
src/routes/stripe-webhook.js
```

```js
const { Router } = require("express");
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();

// Stripe webhooks require the raw body — register BEFORE express.json()
router.post(
  "/",
  require("express").raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Route events
    switch (event.type) {
      case "checkout.session.completed":
        // Activate subscription or fulfill order
        break;
      case "invoice.paid":
        // Extend subscription period
        break;
      case "invoice.payment_failed":
        // Notify user, mark subscription past_due
        break;
      case "customer.subscription.updated":
        // Handle plan change, proration
        break;
      case "customer.subscription.deleted":
        // Revoke access
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

module.exports = router;
```

Register **before** `express.json()` in `app.js`:

```js
const stripeWebhook = require("./routes/stripe-webhook");
app.use("/api/stripe/webhook", stripeWebhook);  // raw body — before express.json()
```

---

## Frontend Setup (`apps/web/`)

### 1. Install Stripe.js

```bash
cd apps/web && npm install @stripe/stripe-js
```

### 2. Checkout Button Component

```tsx
"use client";

import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

export default function CheckoutButton({ priceId }: { priceId: string }) {
  const handleCheckout = async () => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const { url } = await res.json();
    window.location.href = url;  // Redirect to Stripe-hosted page
  };

  return (
    <button onClick={handleCheckout} className="btn-primary">
      Subscribe
    </button>
  );
}
```

---

## Subscription Middleware

Add to `src/middleware/billing.js`:

```js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Attaches req.subscription with the user's current plan and limits.
 * Requires req.user.stripeCustomerId to be set by auth middleware.
 */
async function billingMiddleware(req, res, next) {
  if (!req.user?.stripeCustomerId) {
    req.subscription = { plan: "free", active: false };
    return next();
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: req.user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      req.subscription = {
        plan: sub.items.data[0]?.price?.lookup_key || "unknown",
        active: true,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        stripeSubscriptionId: sub.id,
      };
    } else {
      req.subscription = { plan: "free", active: false };
    }
  } catch (err) {
    console.error("Billing middleware error:", err.message);
    req.subscription = { plan: "free", active: false };
  }

  next();
}

/**
 * Gate middleware — rejects requests if user's plan doesn't match.
 */
function requirePlan(...allowedPlans) {
  return (req, res, next) => {
    if (!req.subscription?.active || !allowedPlans.includes(req.subscription.plan)) {
      return res.status(403).json({
        error: "Plan upgrade required",
        requiredPlans: allowedPlans,
        currentPlan: req.subscription?.plan || "none",
      });
    }
    next();
  };
}

module.exports = { billingMiddleware, requirePlan };
```

---

## Security Checklist

- [ ] Webhook signature verified with `stripe.webhooks.constructEvent()`
- [ ] No card data touches the server — Stripe.js handles all card input (PCI SAQ A)
- [ ] All Stripe keys from environment variables, never in code
- [ ] Idempotency keys used for all mutation operations
- [ ] Checkout sessions use server-generated URLs — no client-side price manipulation
- [ ] Webhook endpoint is not behind auth middleware (Stripe sends directly)

---

## Testing

```bash
# Install Stripe CLI for local webhook testing
stripe listen --forward-to localhost:4000/api/stripe/webhook

# Trigger a test event
stripe trigger checkout.session.completed
```

---

## Related Files

| File | Purpose |
|------|---------|
| `platform/billing/billing-notes.md` | Full design notes (plans, config schema, open questions) |
| `billing/usage-metering.md` | Usage tracking and quota enforcement |
| `billing/new-saas-app-workflow.md` | Combined app + billing workflow |
