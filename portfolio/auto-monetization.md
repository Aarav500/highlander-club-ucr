# Auto-Monetization — Portfolio Revenue Intelligence

> Spots upsell, cross-sell, and new revenue opportunities across the entire
> portfolio by correlating usage data with billing tiers.
>
> Every app you build adds signal. The portfolio gets smarter at making money.

---

## Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                  Auto-Monetization Engine                   │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Usage Data   │  │ Billing Data │  │ Cross-App        │ │
│  │ (analytics)  │  │ (platform/   │  │ Analytics        │ │
│  │              │  │  billing)    │  │ (portfolio/)     │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                    │           │
│         └─────────┬───────┴────────┬───────────┘           │
│                   │                │                        │
│          ┌────────▼──────┐  ┌──────▼──────────┐            │
│          │  Opportunity  │  │  Revenue        │            │
│          │  Detector     │  │  Forecaster     │            │
│          └────────┬──────┘  └──────┬──────────┘            │
│                   │                │                        │
│          ┌────────▼────────────────▼──────────┐            │
│          │        Action Proposals            │            │
│          └────────────────────────────────────┘            │
└────────────────────────────────────────────────────────────┘
```

---

## Opportunity Types

### 1. Upsell Signals

Users approaching or exceeding their current plan limits.

| Signal | Detection Rule | Opportunity |
|--------|---------------|-------------|
| **Quota ceiling** | Usage ≥ 80% of plan limit for 3+ consecutive days | Prompt upgrade to next tier |
| **Feature gate hits** | User attempts premium feature 3+ times on free plan | Show upgrade CTA with feature preview |
| **Power user** | User in top 10% by event volume on a lower-tier plan | Personalized upgrade offer |
| **Team growth** | User invites 3+ collaborators on a single-seat plan | Suggest team plan |

```sql
-- Users approaching quota ceiling
SELECT
  pe.app_slug,
  pe.user_id,
  bc.plan_id,
  bc.plan_limits->>'api_calls'                    AS plan_limit,
  COUNT(*)                                         AS usage_7d,
  ROUND(
    COUNT(*)::numeric
    / NULLIF((bc.plan_limits->>'api_calls')::int, 0) * 100, 1
  )                                                AS usage_pct
FROM portfolio_events pe
JOIN billing_customers bc ON pe.user_id = bc.user_id AND pe.app_slug = bc.app_slug
WHERE pe.created_at >= NOW() - INTERVAL '7 days'
  AND pe.event_name = 'api_request'
GROUP BY pe.app_slug, pe.user_id, bc.plan_id, bc.plan_limits
HAVING COUNT(*)::numeric / NULLIF((bc.plan_limits->>'api_calls')::int, 0) >= 0.8
ORDER BY usage_pct DESC;
```

### 2. Cross-Sell Signals

Users of App A who would benefit from App B.

| Signal | Detection Rule | Opportunity |
|--------|---------------|-------------|
| **Complementary workflow** | User in App A performs actions that App B automates | Suggest App B with context |
| **Data overlap** | User manages same entity type in 2+ apps without integration | Offer integration or bundle |
| **Peer behavior** | Users with similar profiles adopted App B (collaborative filtering) | "Users like you also use..." |

```sql
-- Users in App A who match the profile of App B adopters
WITH app_b_users AS (
  SELECT DISTINCT global_user_id
  FROM portfolio_events pe
  JOIN global_users gu ON pe.user_id = gu.local_user_id AND pe.app_slug = gu.app_slug
  WHERE pe.app_slug = 'app-b'
),
app_a_only AS (
  SELECT gu.global_user_id, ARRAY_AGG(DISTINCT pe.event_name) AS behaviors
  FROM portfolio_events pe
  JOIN global_users gu ON pe.user_id = gu.local_user_id AND pe.app_slug = gu.app_slug
  WHERE pe.app_slug = 'app-a'
    AND gu.global_user_id NOT IN (SELECT global_user_id FROM app_b_users)
  GROUP BY gu.global_user_id
)
SELECT global_user_id, behaviors
FROM app_a_only
WHERE behaviors && (
  -- Overlap with behaviors common among App B adopters
  SELECT ARRAY_AGG(DISTINCT event_name)
  FROM portfolio_events
  WHERE app_slug = 'app-a'
    AND user_id IN (SELECT local_user_id FROM global_users WHERE global_user_id IN (SELECT global_user_id FROM app_b_users))
);
```

### 3. New Revenue Streams

Portfolio-wide patterns that indicate unmet paid needs.

| Signal | Detection Rule | Opportunity |
|--------|---------------|-------------|
| **Feature request clustering** | Same feature requested across 3+ apps via GitHub issues | Build as premium platform module |
| **Workaround detection** | Users performing multi-step manual flows that could be automated | Offer automation as paid add-on |
| **Export volume** | High CSV/PDF export usage suggests users need a reporting add-on | Launch reporting tier |
| **API integration attempts** | Users hitting undocumented endpoints or requesting API access | Offer API tier with metered billing |

---

## Revenue Forecasting

For each detected opportunity, estimate potential revenue:

```
estimated_mrr = eligible_users × conversion_rate × target_plan_price
```

| Input | Source |
|-------|--------|
| `eligible_users` | Count from detection query |
| `conversion_rate` | Historical upgrade rate from `platform/billing` data (default: 5%) |
| `target_plan_price` | From billing plan config in `platform/billing/billing-notes.md` |

### Opportunity Report Format

```markdown
## Monetization Opportunity: <signal-name>

**Type:** Upsell / Cross-sell / New Revenue
**Estimated MRR impact:** $X,XXX
**Eligible users:** N across M apps
**Confidence:** High / Medium / Low

### Evidence
- 45 users at >80% API quota on free plan in `inventory-lab-app`
- 12 users hit feature gate for "bulk export" 5+ times this week

### Recommended Action
1. Enable in-app upgrade prompt for users at >80% quota
2. A/B test upgrade CTA placement (banner vs. modal)
3. Track conversion with event `plan_upgraded` (see analytics/schema-notes.md)

### Revenue Model
| Scenario | Users converting | MRR |
|----------|-----------------|-----|
| Conservative (3%) | 1 | $29 |
| Expected (5%) | 2 | $58 |
| Optimistic (10%) | 5 | $145 |
```

---

## Automation

| Trigger | Frequency | Action |
|---------|-----------|--------|
| Daily scan | Cron (06:00 UTC) | Run all detection queries, update opportunity index |
| Quota threshold crossed | Real-time | Push in-app upsell CTA via `BillingProvider` context |
| New opportunity found (MRR > $500) | On detection | Alert `#revenue-ops` Slack, create GitHub issue |
| Weekly digest | Cron (Monday 09:00 UTC) | Post revenue opportunity summary to `#portfolio-digest` |

### n8n Integration

1. **Schedule Trigger** — daily cron
2. **Function** — run detection queries against portfolio events
3. **AI Agent** — classify opportunities and estimate revenue
4. **Switch** — route by opportunity type (upsell / cross-sell / new)
5. **Slack** — post to `#revenue-ops`
6. **GitHub** — create issues for P0 opportunities

---

## Integration

- **Reads from** — `portfolio/cross-app-analytics.md` (usage data), `platform/billing/` (plan tiers, revenue data), `labs-config.yaml` (app registry)
- **Writes to** — `portfolio/reports/<date>-monetization-opportunities.md`
- **Feeds into** — billing plan adjustments, in-app upgrade prompts, product roadmap prioritization
- **Feeds from** — `portfolio/pattern-miner.md` (feature extraction → premium module candidates)

---

## Privacy & Ethics

- **No PII in reports.** Opportunity reports use aggregate counts and user IDs, never names or emails.
- **Opt-out respected.** Users who opt out of analytics are excluded from all detection queries.
- **Transparent pricing.** Upsell prompts always show clear pricing; no dark patterns.
- **Human approval.** All new monetization actions require human sign-off before activation.

---

## Status

> [!NOTE]
> Design document. Requires `portfolio/cross-app-analytics.md` infrastructure
> (portfolio_events view, global_users table) and `platform/billing` integration
> to be implemented before detection queries can run.
