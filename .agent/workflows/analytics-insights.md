---
description: Propose analytics queries and dashboards for an app based on its spec and DB schema
model_tier: 2  # Tier 2 (Sonnet) — analytics and query generation
---

# Analytics Insights Workflow

Given an app's spec and database schema, generate a tailored set of analytics queries and dashboard recommendations.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `app_slug` | ✅ | The app's short name (kebab-case), used to locate its spec and name the output file |
| `spec_path` | Optional | Path to the app spec, defaults to `specs/<app_slug>-spec.md` |
| `db_notes` | Optional | Path to DB/schema notes (migration files, ERD, or `analytics/schema-notes.md`) |

---

## Steps

### 1 — Read Context

1. Open and read the app spec at `spec_path` (or `specs/<app_slug>-spec.md`).
2. Read any DB/schema notes provided in `db_notes`.
3. Read `analytics/schema-notes.md` for the generic events schema pattern.
4. Read `analytics/queries-template.md` for the output format.

### 2 — Identify Key Product Questions

Based on the spec, propose **3–5 product questions** that analytics should answer. Examples:

1. **What does success look like?** — Which user action represents the "aha" moment?
2. **Where might users drop off?** — What are the critical funnel steps from signup to value?
3. **Which features drive retention?** — What events correlate with users coming back?
4. **Where are the performance bottlenecks?** — Which endpoints or pages are slowest?
5. **What errors are users hitting?** — Which failure modes are most common?

Tailor these to the specific app domain (e.g., for an e-commerce app, add "cart abandonment rate").

### 3 — Propose Queries and Dashboards

For each product question, produce:

- **SQL queries** targeting PostgreSQL (using the `events` table schema or the app's actual tables).
- **Dashboard section** recommendation — describe what visualization type to use and what tool (Superset, Metabase, or Grafana) it maps to.

Follow the structure in `analytics/queries-template.md`:

1. Activation funnel
2. Retention / cohort analysis
3. Feature usage breakdown
4. Error & latency analysis
5. Dashboard section mapping

Add app-specific query sections as needed (e.g., revenue metrics, content engagement, API usage by customer).

### 4 — Output

Write the results to:

```
analytics/<app_slug>-insights.md
```

The file should contain:

- App name and a one-line description
- The 3–5 product questions identified in Step 2
- SQL queries for each question (tested against the schema)
- Dashboard section recommendations with visualization types
- Open questions or data gaps that need human input

### 5 — Review

**⏸️ STOP — Present the insights file to the user for review.**

Use `notify_user` with `BlockedOnUser: true` and include the output file path in `PathsToReview`.

---

## Notes

- This workflow produces **analysis documents only** — it does not create database tables, run migrations, or deploy dashboards.
- For apps that haven't instrumented the `events` table yet, the output should include a section on **recommended instrumentation points** (which events to track and where to add `trackEvent()` calls).
- Queries should be written for **PostgreSQL** syntax. If the app uses a different database, note where syntax adjustments are needed.
