# n8n: Quarterly Security Audit

An n8n workflow that automates the quarterly security audit across all apps registered in `labs-config.yaml`.

## Trigger

- **Type:** Cron
- **Schedule:** First Monday of January, April, July, October (quarterly)
- **Fallback:** Manual webhook trigger at `/governance/audit/start`

## Workflow Nodes

### Node 1: Read App Registry

- **Type:** Function
- Read `labs-config.yaml` from the repo.
- Read `governance/policy.yaml` to determine which SLA tiers are due.
- Output: list of apps to audit with `name`, `repo_url`, `owner`, `sla`, `envs`.

### Node 2: Filter by Audit Schedule

- **Type:** Function
- Determine the current quarter.
- Filter apps based on `audit_frequency` from their SLA tier:
  - Quarterly: `standard`, `critical`
  - Semi-annual (Q2, Q4): `basic`
  - Annual (Q4): `experimental`
- Output: filtered app list.

### Node 3: Per-App Security Scan (Loop)

- **Type:** Split In Batches → HTTP Request
- For each app:
  1. **Trigger GitHub Action:** dispatch the `secrets-scan` workflow via GitHub API.
  2. **Run npm audit:** fetch the latest `package-lock.json` and analyze.
  3. **Check CI status:** query GitHub Actions API for recent workflow runs.
  4. **Check observability:** `GET <app_url>/metrics` — verify it returns data.

### Node 4: Collect Results

- **Type:** Function
- Aggregate pass/fail for each check per app.
- Calculate compliance rates by tier.

### Node 5: Generate Report

- **Type:** Function
- Produce the markdown audit report following the template in `governance/audit-workflow.md`.
- Save to `governance/reports/audit-YYYY-QN.md` via GitHub API commit.

### Node 6: Create Issues for Findings

- **Type:** GitHub (Create Issue) — Loop
- For each critical/high finding:
  - Title: `[Audit] <app_name>: <finding_summary>`
  - Labels: `governance`, `security`, severity tag
  - Assignees: app's `owner`
  - Body: finding details, remediation guidance, due date

### Node 7: Slack Notification

- **Type:** Slack
- Channel: `#governance`
- Message:

  ```
  📋 Quarterly Security Audit — YYYY-QN

  Apps audited: <count>
  Pass rate: <rate>%
  Critical findings: <count>

  Full report: <link to governance/reports/audit-YYYY-QN.md>
  ```

### Node 8: Follow-Up Reminder (30 days later)

- **Type:** Wait (30 days) → Function → Slack
- Check if critical/high issues are still open.
- Post reminder to `#governance` with list of unresolved items.

---

## Prerequisites

- GitHub API token with repo access (stored as n8n credential).
- Slack webhook or bot token.
- Apps must expose `/metrics` endpoint for observability checks.
- `labs-config.yaml` and `governance/policy.yaml` must be up to date.

## Status

> [!NOTE]
> This is a design document. The n8n workflow nodes described above need to be created in the n8n UI and connected.
