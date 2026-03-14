# Usage Metering — Track API Calls, Storage, and Compute

> Instrument any app built from `fullstack-template` with usage tracking,
> quota enforcement, and optional Stripe metered billing integration.

---

## Usage Event Schema

Every metered action produces a usage event:

```json
{
  "customerId": "cust_abc123",
  "metric": "api_calls",
  "quantity": 1,
  "timestamp": "2026-03-12T10:00:00Z",
  "metadata": { "endpoint": "/api/examples", "method": "POST" }
}
```

### Supported Metrics

| Metric | Unit | Example |
|--------|------|---------|
| `api_calls` | count | Each REST API request |
| `storage_bytes` | bytes | File uploads to S3 |
| `compute_minutes` | minutes | Long-running job execution time |

---

## Database Schema

```sql
-- Usage events (raw)
CREATE TABLE IF NOT EXISTS usage_events (
  id          BIGSERIAL PRIMARY KEY,
  customer_id TEXT        NOT NULL,
  metric      TEXT        NOT NULL,
  quantity    BIGINT      NOT NULL DEFAULT 1,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_customer_metric ON usage_events (customer_id, metric, created_at);

-- Usage rollups (aggregated)
CREATE TABLE IF NOT EXISTS usage_rollups (
  id          BIGSERIAL PRIMARY KEY,
  customer_id TEXT        NOT NULL,
  metric      TEXT        NOT NULL,
  period      TEXT        NOT NULL,  -- 'hourly' | 'daily'
  period_start TIMESTAMPTZ NOT NULL,
  total       BIGINT      NOT NULL DEFAULT 0,
  UNIQUE (customer_id, metric, period, period_start)
);
```

---

## Backend Implementation (`apps/api-node/`)

### 1. Usage Recording Service

```
src/services/usage.js
```

```js
const { query } = require("../db");

/**
 * Record a usage event.
 * @param {string} customerId
 * @param {string} metric - 'api_calls' | 'storage_bytes' | 'compute_minutes'
 * @param {number} quantity - amount to record (default 1)
 * @param {object} metadata - optional context
 */
async function recordUsage(customerId, metric, quantity = 1, metadata = {}) {
  await query(
    `INSERT INTO usage_events (customer_id, metric, quantity, metadata)
     VALUES ($1, $2, $3, $4)`,
    [customerId, metric, quantity, metadata]
  );
}

/**
 * Get current-period usage for a customer.
 * @param {string} customerId
 * @param {string} metric
 * @param {Date} periodStart - beginning of the current billing period
 */
async function getUsage(customerId, metric, periodStart) {
  const result = await query(
    `SELECT COALESCE(SUM(quantity), 0) AS total
     FROM usage_events
     WHERE customer_id = $1 AND metric = $2 AND created_at >= $3`,
    [customerId, metric, periodStart]
  );
  return parseInt(result.rows[0].total, 10);
}

module.exports = { recordUsage, getUsage };
```

### 2. Quota Enforcement Middleware

```
src/middleware/quota.js
```

```js
const { getUsage } = require("../services/usage");

/**
 * Plan limits — in production, load from database or config.
 */
const PLAN_LIMITS = {
  free:  { api_calls: 1000,   storage_bytes: 100 * 1024 * 1024 },
  basic: { api_calls: 10000,  storage_bytes: 1000 * 1024 * 1024 },
  pro:   { api_calls: 100000, storage_bytes: 10000 * 1024 * 1024 },
};

/**
 * Middleware that checks usage against plan limits.
 * Requires `req.subscription.plan` (set by billingMiddleware)
 * and `req.user.id` to be available.
 */
function enforceQuota(metric) {
  return async (req, res, next) => {
    const plan = req.subscription?.plan || "free";
    const limits = PLAN_LIMITS[plan];

    if (!limits || !limits[metric]) return next();

    const periodStart = req.subscription?.currentPeriodStart || new Date(
      new Date().getFullYear(), new Date().getMonth(), 1
    );

    const currentUsage = await getUsage(req.user.id, metric, periodStart);

    if (currentUsage >= limits[metric]) {
      return res.status(429).json({
        error: "Usage limit exceeded",
        metric,
        limit: limits[metric],
        current: currentUsage,
        plan,
        upgrade_url: "/billing/upgrade",
      });
    }

    next();
  };
}

module.exports = { enforceQuota, PLAN_LIMITS };
```

### 3. API Call Tracking Middleware

```
src/middleware/track-api-calls.js
```

```js
const { recordUsage } = require("../services/usage");

/**
 * Middleware that records an api_calls usage event for every request.
 * Place after auth middleware so req.user is available.
 */
function trackApiCalls(req, res, next) {
  res.on("finish", () => {
    if (req.user?.id && res.statusCode < 500) {
      recordUsage(req.user.id, "api_calls", 1, {
        endpoint: req.route?.path || req.path,
        method: req.method,
        status: res.statusCode,
      }).catch((err) => {
        console.error("Usage tracking error:", err.message);
      });
    }
  });
  next();
}

module.exports = { trackApiCalls };
```

---

## Aggregation

Roll up raw events into hourly/daily summaries for efficient querying and Stripe reporting:

```sql
-- Hourly rollup (run via cron or pg_cron)
INSERT INTO usage_rollups (customer_id, metric, period, period_start, total)
SELECT
  customer_id,
  metric,
  'hourly',
  date_trunc('hour', created_at),
  SUM(quantity)
FROM usage_events
WHERE created_at >= date_trunc('hour', now() - interval '1 hour')
  AND created_at < date_trunc('hour', now())
GROUP BY customer_id, metric, date_trunc('hour', created_at)
ON CONFLICT (customer_id, metric, period, period_start)
DO UPDATE SET total = EXCLUDED.total;
```

---

## Stripe Metered Billing Integration

For apps using Stripe's metered billing, push usage records after each aggregation:

```js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function reportUsageToStripe(subscriptionItemId, quantity, timestamp) {
  await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: Math.floor(timestamp.getTime() / 1000),
    action: "set",  // 'set' replaces; 'increment' adds
  });
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| `billing/stripe-checkout.md` | Stripe Checkout and subscription setup |
| `billing/new-saas-app-workflow.md` | Combined app + billing workflow |
| `platform/billing/billing-notes.md` | Full design notes and config schema |
| `observability/schema.md` | Structured log format (usage events follow similar pattern) |
