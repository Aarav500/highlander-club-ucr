# Experiments & Feature Flags — Schema

Data model for A/B experiments and feature flags. Designed for PostgreSQL; adapt column types for other databases.

---

## Tables

### `feature_flags`

Controls which features are enabled globally, per-user, or per-segment.

```sql
CREATE TABLE feature_flags (
  id            SERIAL PRIMARY KEY,
  key           VARCHAR(100) UNIQUE NOT NULL,   -- e.g. 'new_checkout_flow'
  description   TEXT,
  enabled       BOOLEAN DEFAULT false,          -- global kill switch
  rollout_pct   INTEGER DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  segments      JSONB DEFAULT '[]',             -- e.g. [{"type":"user_id","values":["abc"]}, {"type":"role","values":["beta"]}]
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Purpose |
|--------|---------|
| `key` | Stable identifier used in code: `if (flag('new_checkout_flow'))` |
| `enabled` | Master on/off — overrides rollout_pct when false |
| `rollout_pct` | Percentage of users who see the feature (deterministic hash) |
| `segments` | JSON array of targeting rules for allow/deny lists |

### `experiments`

Tracks A/B tests with variants, metrics, and lifecycle.

```sql
CREATE TABLE experiments (
  id            SERIAL PRIMARY KEY,
  key           VARCHAR(100) UNIQUE NOT NULL,   -- e.g. 'checkout_v2_test'
  description   TEXT,
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft', 'running', 'paused', 'concluded')),
  variants      JSONB NOT NULL DEFAULT '[
                  {"name": "control", "weight": 50},
                  {"name": "treatment", "weight": 50}
                ]',
  metric_key    VARCHAR(100),                   -- primary success metric event name
  start_date    TIMESTAMPTZ,
  end_date      TIMESTAMPTZ,
  concluded_variant VARCHAR(50),                -- winning variant after analysis
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Purpose |
|--------|---------|
| `key` | Stable identifier, referenced in code and analytics |
| `variants` | JSON array of `{name, weight}` — weights must sum to 100 |
| `metric_key` | Maps to an event in `analytics/schema-notes.md` |
| `status` | Lifecycle: draft → running → paused/concluded |
| `concluded_variant` | Set when the experiment ends — records the winner |

### `experiment_assignments`

Records which variant each user was assigned to (for consistent bucketing).

```sql
CREATE TABLE experiment_assignments (
  id              SERIAL PRIMARY KEY,
  experiment_key  VARCHAR(100) NOT NULL REFERENCES experiments(key),
  user_id         VARCHAR(255) NOT NULL,
  variant         VARCHAR(50) NOT NULL,
  assigned_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_key, user_id)
);
```

---

## Bucketing Algorithm

Assignment is **deterministic** — the same user always gets the same variant for a given experiment:

```
bucket = hash(experiment_key + user_id) % 100
```

Walk through variants in order, accumulating weights. The first variant whose cumulative weight exceeds `bucket` is the assignment.

This avoids storing assignments for simple rollouts (feature flags use the same logic with `rollout_pct`).

For experiments, persist the assignment in `experiment_assignments` on first exposure to guarantee consistency even if variant weights change later.

---

## Feature Flag Evaluation Order

1. **Flag disabled** (`enabled = false`) → return `false`
2. **Segment match** → if user matches any allow-segment, return `true`
3. **Rollout percentage** → hash user into 0–99, return `bucket < rollout_pct`
4. **Default** → return `false`

---

## Integration Points

- **Backend middleware:** `req.flag(key)` and `req.experiment(key)` — see `apps/api-node/src/middleware/experiments.js`
- **Frontend:** fetch flags from `GET /api/flags` at page load; cache in React context
- **Analytics:** log `experiment_exposure` events with `{experiment_key, variant, user_id}` to measure outcomes
- **Observability:** flag evaluations are logged as structured events per `observability/schema.md`
