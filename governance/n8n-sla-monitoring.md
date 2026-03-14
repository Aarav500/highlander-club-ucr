# n8n: SLA Compliance Monitoring

A continuously running n8n workflow that monitors SLA compliance across all apps and alerts when targets are at risk.

## Trigger

- **Type:** Cron
- **Schedule:** Every hour (for uptime checks), daily (for compliance rollup)

---

## Workflow Nodes

### Node 1: Read App Registry (Daily)

- **Type:** Cron (daily at 08:00) → Function
- Read `labs-config.yaml` for all apps and their SLA tiers.
- Read `governance/policy.yaml` for tier-specific targets.
- Output: app list with expected uptime, response time, and requirements.

### Node 2: Uptime Check (Hourly)

- **Type:** Cron (hourly) → Split In Batches → HTTP Request
- For each app with an uptime target:
  - `GET <app_url>/health` — expect 200 within 5 seconds.
  - Record: `app_name`, `timestamp`, `status` (up/down), `response_time_ms`.
- Store results in a time-series DB or append to a CSV/JSON log.

### Node 3: Calculate Uptime (Daily)

- **Type:** Function
- For each app, compute rolling 30-day uptime percentage.
- Compare against the app's SLA tier target:
  - `basic`: 95%
  - `standard`: 99.5%
  - `critical`: 99.9%
- Flag apps below their target or within 1% of breaching.

### Node 4: Compliance Dashboard Data

- **Type:** Function → HTTP Request
- For each app, check:

  | Metric | Source | Target |
  |--------|--------|--------|
  | Uptime | Node 3 calculation | Per-tier from policy.yaml |
  | Last security scan | GitHub Actions API | Within 30 days |
  | Open critical CVEs | npm audit results | 0 |
  | Observability active | `GET /metrics` | Returns data |
  | Last perf baseline | Check `perf/` directory | Within 90 days (standard+) |
  | CI/CD passing | GitHub Actions API | Last run green |

### Node 5: Alert on Violations

- **Type:** Switch → Slack

  **Tier-based alerting:**

  | Condition | Alert Channel | Urgency |
  |-----------|---------------|---------|
  | Critical app uptime < 99.9% | `#incidents` | 🚨 Immediate |
  | Standard app uptime < 99.5% | `#governance` | ⚠️ Warning |
  | Any app: critical CVE open > 7 days | `#security` | 🚨 Immediate |
  | Any app: security scan > 30 days old | `#governance` | ⚠️ Warning |
  | Critical app: no perf baseline in 90 days | `#governance` | 📊 Info |

  **Alert format:**

  ```
  ⚠️ SLA Compliance Alert

  App: <app_name> (<sla> tier)
  Owner: <owner>
  Issue: Uptime at 99.2% (target: 99.5%)
  Period: Last 30 days
  Action: Investigate downtime events and update ops playbook
  ```

### Node 6: Weekly SLA Report

- **Type:** Cron (Monday 09:00) → Function → Slack
- Compile a weekly summary:

  ```markdown
  ## SLA Compliance Report — Week of YYYY-MM-DD

  | App | Tier | Uptime | Target | Status | Issues |
  |-----|------|--------|--------|--------|--------|
  | inventory-app | standard | 99.7% | 99.5% | ✅ | — |
  | research-6g | experimental | — | — | ✅ | — |
  | payments-api | critical | 99.85% | 99.9% | ⚠️ | 2 downtime events |

  **Apps at risk:** payments-api (0.05% below target)
  **Action required:** Review payments-api incident logs
  ```

- Post to `#governance`.

### Node 7: Monthly Trend Report

- **Type:** Cron (1st of month) → Function → Slack
- Compare this month vs. last month:
  - Uptime trend (improving/declining)
  - Open vulnerability trend
  - Compliance rate across tiers
- Save to `governance/reports/sla-YYYY-MM.md`.

---

## Prerequisites

- All apps must expose a `/health` endpoint.
- Standard+ apps must expose a `/metrics` endpoint.
- GitHub API token for checking CI/CD status.
- Time-series storage for uptime data (InfluxDB, Prometheus, or simple JSON log).
- Slack webhook or bot token for alert channels.

## Status

> [!NOTE]
> This is a design document. The n8n nodes described above need to be created and connected in the n8n UI. The health check and metrics endpoints are already implemented in the `fullstack-template` backend.
