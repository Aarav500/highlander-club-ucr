# n8n Governance Schedule

> Consolidated cron schedule for all governance-related n8n workflows.

## Scheduled Workflows

| Workflow | Cron Schedule | Scope | Reference |
|----------|--------------|-------|-----------|
| **Quarterly Security Audit** | 1st Monday of Jan/Apr/Jul/Oct | All apps per tier schedule | `governance/n8n-security-audit.md` |
| **SLA Compliance — Uptime Checks** | Hourly | All apps with uptime targets | `governance/n8n-sla-monitoring.md` |
| **SLA Compliance — Daily Rollup** | Daily at 08:00 | All apps | `governance/n8n-sla-monitoring.md` |
| **SLA Compliance — Weekly Report** | Monday at 09:00 | All apps | `governance/n8n-sla-monitoring.md` |
| **SLA Compliance — Monthly Trends** | 1st of each month | All apps | `governance/n8n-sla-monitoring.md` |
| **Observability Digest** | Daily at 09:00 | All apps emitting logs | `observability/n8n-workflow.md` |
| **Follow-Up Reminder** | 30 days after audit findings | Apps with unresolved findings | `governance/n8n-security-audit.md` |

## Weekly Security Scans (Gold/Critical Tier)

In addition to the quarterly audit, `standard` and `critical` tier apps receive **weekly** automated security scans:

- **Cron:** Monday 02:00 UTC
- **Action:** Dispatch `secrets-scan` GitHub Action + `npm audit` for each `standard`/`critical` app in `labs-config.yaml`.
- **Alert:** If critical/high findings detected, post to `#security` Slack channel immediately.
- **No-findings:** Silent — no notification if clean.

## Configuration

All cron schedules are configured in the n8n UI. This document serves as the **source of truth** for what should be scheduled and when.

### Required n8n Credentials

| Credential | Used By |
|------------|---------|
| GitHub API token | Triggering Actions, reading repos, creating issues |
| Slack bot token | Alert channels (`#governance`, `#security`, `#observability-alerts`) |
| Time-series DB | SLA uptime data storage (InfluxDB/Prometheus) |

### Required App Endpoints

| Endpoint | Required For |
|----------|-------------|
| `GET /health` | Uptime checks (all apps with uptime targets) |
| `GET /metrics` | Observability checks (`standard`+ apps) |

## Status

> [!NOTE]
> This is a design document. Each scheduled workflow needs to be created and configured in the n8n UI. The individual workflow designs are documented in their respective files listed above.
