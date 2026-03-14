# Analytics Queries Template

> Copy this file to `analytics/<app_slug>-insights.md` and fill in the queries for your specific app.  
> All queries assume the generic `events` table from `analytics/schema-notes.md`.

---

## 1. Activation Funnel

> Track how users progress through the key onboarding steps.

**Define your funnel stages** (example):

| Step | Event Name | Description |
|------|------------|-------------|
| 1 | `signup_started` | User opens the signup form |
| 2 | `signup_completed` | User submits and account is created |
| 3 | `onboarding_step_1` | First guided action completed |
| 4 | `first_value_moment` | User reaches the "aha" moment |

**Query — Funnel conversion by week:**

```sql
-- Replace event names with your app's actual funnel steps
WITH funnel AS (
  SELECT
    user_id,
    MIN(CASE WHEN event_name = 'signup_started'     THEN created_at END) AS step_1,
    MIN(CASE WHEN event_name = 'signup_completed'    THEN created_at END) AS step_2,
    MIN(CASE WHEN event_name = 'onboarding_step_1'   THEN created_at END) AS step_3,
    MIN(CASE WHEN event_name = 'first_value_moment'  THEN created_at END) AS step_4
  FROM events
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT
  DATE_TRUNC('week', step_1)          AS cohort_week,
  COUNT(*)                            AS started,
  COUNT(step_2)                       AS completed_signup,
  COUNT(step_3)                       AS completed_onboarding,
  COUNT(step_4)                       AS reached_value,
  ROUND(COUNT(step_4)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS pct_activated
FROM funnel
WHERE step_1 IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;
```

---

## 2. Retention / Cohort Analysis

> Measure how many users return in subsequent weeks after their first activity.

**Query — Weekly retention cohorts:**

```sql
WITH user_first AS (
  SELECT user_id, DATE_TRUNC('week', MIN(created_at)) AS cohort_week
  FROM events
  WHERE user_id IS NOT NULL
  GROUP BY user_id
),
user_activity AS (
  SELECT DISTINCT user_id, DATE_TRUNC('week', created_at) AS activity_week
  FROM events
  WHERE user_id IS NOT NULL
)
SELECT
  uf.cohort_week,
  EXTRACT(WEEK FROM ua.activity_week - uf.cohort_week)::int AS weeks_since_signup,
  COUNT(DISTINCT ua.user_id)                                AS active_users,
  COUNT(DISTINCT ua.user_id)::numeric /
    NULLIF((SELECT COUNT(DISTINCT user_id) FROM user_first WHERE cohort_week = uf.cohort_week), 0)
    * 100                                                   AS retention_pct
FROM user_first uf
JOIN user_activity ua ON uf.user_id = ua.user_id
GROUP BY 1, 2
ORDER BY 1 DESC, 2;
```

---

## 3. Feature Usage Breakdown

> Understand which features are used most and by whom.

**Query — Top events by unique users (last 30 days):**

```sql
SELECT
  event_name,
  COUNT(*)                     AS total_events,
  COUNT(DISTINCT user_id)      AS unique_users,
  ROUND(AVG(
    (metadata->>'duration_ms')::numeric
  ), 0)                        AS avg_duration_ms   -- if applicable
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_name
ORDER BY unique_users DESC
LIMIT 20;
```

**Query — Feature adoption over time:**

```sql
SELECT
  DATE_TRUNC('day', created_at) AS day,
  event_name,
  COUNT(DISTINCT user_id)       AS unique_users
FROM events
WHERE event_name IN ('feature_a_used', 'feature_b_used', 'feature_c_used')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1, 2;
```

---

## 4. Error & Latency Analysis

> Surface errors and performance regressions from event metadata.

**Query — Error rate by endpoint (last 7 days):**

```sql
SELECT
  metadata->>'endpoint'         AS endpoint,
  COUNT(*)                      AS total_requests,
  COUNT(*) FILTER (
    WHERE metadata->>'status_code' >= '400'
  )                             AS error_count,
  ROUND(
    COUNT(*) FILTER (WHERE metadata->>'status_code' >= '400')::numeric
    / NULLIF(COUNT(*), 0) * 100, 2
  )                             AS error_rate_pct
FROM events
WHERE event_name = 'api_request'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY error_rate_pct DESC;
```

**Query — P50 / P95 / P99 latency by endpoint:**

```sql
SELECT
  metadata->>'endpoint'                                      AS endpoint,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::numeric) AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::numeric) AS p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::numeric) AS p99_ms
FROM events
WHERE event_name = 'api_request'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY p95_ms DESC;
```

---

## 5. Dashboard Sections (Suggested)

> Map the queries above to dashboard panels in Superset, Metabase, or Grafana.

| Dashboard Section | Visualization | Source Query |
|-------------------|---------------|-------------|
| Activation Funnel | Horizontal funnel chart | §1 — Funnel conversion |
| Weekly Retention | Heatmap (cohort × week) | §2 — Retention cohorts |
| Feature Leaderboard | Bar chart (unique users) | §3 — Top events |
| Feature Trends | Multi-line time series | §3 — Adoption over time |
| Error Rate | Table + trend sparkline | §4 — Error rate by endpoint |
| Latency Distribution | Bar chart (P50/P95/P99) | §4 — Latency percentiles |
