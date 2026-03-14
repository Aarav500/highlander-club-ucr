# Cross-App Analytics — Portfolio Intelligence

> Aggregate usage patterns across **every app** in `labs-config.yaml` to surface
> portfolio-wide insights that no single app can see alone.
>
> **Read-only analysis.** This module queries; it never mutates app data.

---

## Architecture

```text
┌────────────┐  ┌────────────┐  ┌────────────┐
│  App A     │  │  App B     │  │  App C     │
│  (events)  │  │  (events)  │  │  (events)  │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │
      └───────┬───────┴───────┬───────┘
              │               │
     ┌────────▼───────────────▼────────┐
     │   Cross-App Analytics Engine    │
     │                                 │
     │  1. Ingest — pull from each     │
     │     app's events table          │
     │  2. Normalize — unified schema  │
     │  3. Correlate — cross-app       │
     │     usage patterns              │
     │  4. Report — portfolio-level    │
     │     dashboards & alerts         │
     └─────────────────────────────────┘
```

---

## Data Sources

Each app built from `fullstack-template` emits events to the same schema defined
in `analytics/schema-notes.md`. The cross-app engine reads from all app databases
registered in `labs-config.yaml`.

| Source | What we read | Why |
|--------|-------------|-----|
| `events` table (per app) | Event name, user ID, timestamp, metadata | Raw usage signal |
| `labs-config.yaml` | App slug, owner, SLA tier, tags | Grouping and filtering |
| `platform/billing` | Plan tier, usage quotas | Revenue correlation |

---

## Portfolio-Level Queries

### 1. Cross-App User Journey

> Which apps do users touch, and in what order?

```sql
-- Users who appear in 2+ apps (by shared email or SSO ID)
SELECT
  u.global_user_id,
  ARRAY_AGG(DISTINCT e.app_slug ORDER BY MIN(e.created_at)) AS app_journey,
  COUNT(DISTINCT e.app_slug)                                 AS apps_touched
FROM portfolio_events e
JOIN global_users u ON e.user_id = u.local_user_id AND e.app_slug = u.app_slug
GROUP BY u.global_user_id
HAVING COUNT(DISTINCT e.app_slug) > 1
ORDER BY apps_touched DESC
LIMIT 50;
```

### 2. Feature Popularity Heatmap

> Which features are hot across the portfolio vs. which are dead?

```sql
SELECT
  app_slug,
  event_name,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*)                AS total_events,
  RANK() OVER (PARTITION BY app_slug ORDER BY COUNT(DISTINCT user_id) DESC) AS rank_in_app
FROM portfolio_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY app_slug, event_name
ORDER BY unique_users DESC;
```

### 3. Churn Risk — Cross-App Signal

> Users active in App A but dropping off in App B may be at portfolio-level churn risk.

```sql
WITH last_seen AS (
  SELECT
    global_user_id,
    app_slug,
    MAX(created_at) AS last_active
  FROM portfolio_events pe
  JOIN global_users gu ON pe.user_id = gu.local_user_id AND pe.app_slug = gu.app_slug
  GROUP BY global_user_id, app_slug
)
SELECT
  global_user_id,
  ARRAY_AGG(app_slug) FILTER (WHERE last_active < NOW() - INTERVAL '14 days') AS dormant_apps,
  ARRAY_AGG(app_slug) FILTER (WHERE last_active >= NOW() - INTERVAL '14 days') AS active_apps
FROM last_seen
GROUP BY global_user_id
HAVING COUNT(*) FILTER (WHERE last_active < NOW() - INTERVAL '14 days') > 0
   AND COUNT(*) FILTER (WHERE last_active >= NOW() - INTERVAL '14 days') > 0;
```

### 4. Portfolio Health Scorecard

> Roll up per-app metrics into a single portfolio view.

```sql
SELECT
  app_slug,
  COUNT(DISTINCT user_id)                                        AS mau,
  COUNT(*) FILTER (WHERE event_name = 'signup_completed')        AS signups_30d,
  ROUND(
    COUNT(*) FILTER (WHERE metadata->>'status_code' >= '500')::numeric
    / NULLIF(COUNT(*) FILTER (WHERE event_name = 'api_request'), 0) * 100, 2
  )                                                              AS error_rate_pct,
  lc.sla
FROM portfolio_events pe
JOIN labs_config lc ON pe.app_slug = lc.name
WHERE pe.created_at >= NOW() - INTERVAL '30 days'
GROUP BY app_slug, lc.sla
ORDER BY mau DESC;
```

---

## Dashboard Sections

| Panel | Visualization | Source |
|-------|---------------|--------|
| Portfolio MAU Trend | Stacked area chart (per app) | §4 — Health scorecard over time |
| Cross-App Journey | Sankey diagram | §1 — User journeys |
| Feature Heatmap | Heatmap (app × feature) | §2 — Feature popularity |
| Churn Risk List | Table with dormant/active split | §3 — Churn signal |
| SLA Compliance | Traffic-light table | §4 — Error rate vs SLA tier |

---

## Automation Hooks

| Trigger | Action |
|---------|--------|
| MAU drops >20% week-over-week for any app | Alert `#portfolio-alerts` Slack channel |
| New cross-app user journey pattern detected | Log to `research/notes/` for the pattern-miner |
| Error rate exceeds SLA threshold | Trigger `ops-playbook` workflow for that app |
| Feature unused by >90% of users for 30+ days | Flag for deprecation in `governance/` |

---

## Integration

- **Reads from** — per-app `events` tables, `labs-config.yaml`, `platform/billing`
- **Writes to** — `portfolio/reports/<date>-portfolio-health.md`
- **Feeds into** — `portfolio/pattern-miner.md` (pattern discovery), `portfolio/auto-monetization.md` (revenue signals)
- **n8n hook** — weekly cron runs the scorecard and posts to `#portfolio-digest`

---

## Status

> [!NOTE]
> Design document. Requires a `portfolio_events` view (or federated query) across app databases and a `global_users` identity mapping table to be implemented.
