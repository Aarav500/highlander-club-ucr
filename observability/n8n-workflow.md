# n8n Observability Aggregation Workflow

An n8n workflow design for aggregating observability data from multiple app repos into a central view.

## Purpose

When running multiple apps from `fullstack-template`, each emits structured logs and metrics independently. This n8n workflow collects, normalizes, and routes that data to provide a **cross-app observability layer**.

## Architecture

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  App A logs  │  │  App B logs  │  │  App C logs  │
│  (stdout)    │  │  (stdout)    │  │  (stdout)    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────────────────────────────────────────┐
│           Log Collector (Fluentd / Vector)        │
│  • Parses structured JSON                        │
│  • Adds source app label                         │
│  • Forwards to n8n webhook                       │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│                 n8n Workflow                       │
│                                                   │
│  1. Webhook: receive log batches                 │
│  2. Filter: separate errors from info            │
│  3. Enrich: lookup app metadata from             │
│     labs-config.yaml (owner, SLA tier)            │
│  4. Route:                                        │
│     • Errors → Slack alert channel               │
│     • Metrics → time-series DB (InfluxDB/Prom)   │
│     • All → long-term storage (S3/ES)            │
│  5. Digest: daily summary → Slack/email          │
└──────────────────────────────────────────────────┘
```

## n8n Workflow Nodes

### Node 1: Webhook Trigger

- **Type:** Webhook
- **Method:** POST
- **Path:** `/observability/ingest`
- **Auth:** Header token (`X-Obs-Token`)
- Receives batches of structured log events as JSON arrays.

### Node 2: Parse & Validate

- **Type:** Function
- Validate each event has required fields (`requestId`, `timestamp`, `service.name`, `level`).
- Drop malformed events, increment a `dropped_events` counter.

### Node 3: Enrich with App Metadata

- **Type:** Function
- Map `service.name` to app entry in `labs-config.yaml`.
- Attach `owner`, `sla`, and `envs` to each event.

### Node 4: Route by Severity

- **Type:** Switch
- Branches:
  - `level === "error"` → Error handling path
  - `level === "warn"` → Warning path
  - `level === "info"` → Metrics/storage path

### Node 5a: Error Alerts

- **Type:** Slack (or email)
- Channel: `#observability-alerts`
- Message format:

  ```
  🚨 Error in {service.name} ({environment})
  Request: {http.method} {http.url} → {http.statusCode}
  Error: {error.message}
  Request ID: {requestId}
  Owner: {owner}
  ```

- Throttle: max 1 alert per service per 5 minutes (dedupe by `error.message`).

### Node 5b: Metrics Aggregation

- **Type:** Function → HTTP Request
- Compute per-app, per-endpoint:
  - Request count
  - P50/P95/P99 latency
  - Error rate
- Push to time-series database (InfluxDB, Prometheus Pushgateway, or Grafana Cloud).

### Node 5c: Long-Term Storage

- **Type:** HTTP Request (or S3 node)
- Write all events to S3 (partitioned by `date/service.name/`) or Elasticsearch for full-text search.

### Node 6: Daily Digest

- **Type:** Cron (runs daily at 09:00)
- Queries the last 24 hours of data.
- Produces a summary:

  ```markdown
  ## Observability Digest — 2026-03-11

  | App | Requests | Errors | Error Rate | P95 Latency |
  |-----|----------|--------|------------|-------------|
  | inventory-lab-app | 12,450 | 23 | 0.18% | 180ms |
  | research-6g-prototype | 340 | 1 | 0.29% | 420ms |
  ```

- Posts to `#observability-digest` Slack channel.

## Setup Prerequisites

1. **n8n instance** running and accessible.
2. **Log collector** (Fluentd or Vector) configured to forward JSON logs to the n8n webhook.
3. **Slack app** with incoming webhook or bot token for alert channels.
4. **Time-series DB** (InfluxDB, Prometheus, or Grafana Cloud) for metrics storage.
5. **S3 bucket** (or Elasticsearch) for long-term log storage.

## Status

> [!NOTE]
> This is a design document. The n8n workflow nodes described above need to be created in the n8n UI and connected. The structured JSON logging middleware in `apps/api-node/src/app.js` provides the data source.
