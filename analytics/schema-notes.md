# Analytics Event Schema — Design Notes

## Overview

A generic, append-only events table that any app built from `fullstack-template` can adopt. The actual column set may vary per product, but this pattern covers 90 % of product analytics needs out of the box.

## Default Schema

```sql
CREATE TABLE events (
  id            BIGSERIAL     PRIMARY KEY,
  event_name    TEXT          NOT NULL,   -- e.g. 'page_view', 'signup_completed', 'button_clicked'
  user_id       UUID,                     -- nullable for anonymous/pre-auth events
  session_id    UUID,                     -- ties events to a browsing session
  metadata      JSONB         NOT NULL DEFAULT '{}',  -- flexible payload
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Recommended indexes
CREATE INDEX idx_events_name       ON events (event_name);
CREATE INDEX idx_events_user       ON events (user_id);
CREATE INDEX idx_events_created    ON events (created_at);
CREATE INDEX idx_events_metadata   ON events USING GIN (metadata);
```

## Column Reference

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `BIGSERIAL` | Auto-incrementing primary key |
| `event_name` | `TEXT` | Machine-readable event identifier (snake_case) |
| `user_id` | `UUID` | The authenticated user, if any |
| `session_id` | `UUID` | Groups events into a single session for funnel analysis |
| `metadata` | `JSONB` | Arbitrary payload — page URL, button label, error code, latency ms, etc. |
| `created_at` | `TIMESTAMPTZ` | Server-side timestamp of when the event was recorded |

## Usage Pattern

**Backend (Express):** Create a thin `trackEvent(name, userId, metadata)` helper that inserts into this table. Attach it as middleware or call it directly in route handlers.

**Frontend (Next.js):** Fire a `POST /api/events` call (or use a lightweight client SDK) that forwards events to the backend helper.

## Adapting for Your App

- **Add columns** if you need first-class fields (e.g., `org_id` for multi-tenant apps, `device_type`).
- **Partition by time** if volume exceeds ~10 M rows/month — Postgres native partitioning on `created_at` works well.
- **Ship to a warehouse** for heavier analytics — export to BigQuery, Redshift, or ClickHouse via a nightly ETL or CDC pipeline.

## Status

> [!NOTE]
> This is a design reference, not a migration script. Actual implementation depends on the specific app's data model and scale requirements.
