# Governance Audit Workflow

Conduct quarterly (or periodic) compliance and security audits across all apps registered in `labs-config.yaml`.

## Purpose

At scale (100+ apps), manual compliance tracking is unsustainable. This workflow defines a repeatable process that agents and n8n can execute to verify every app meets its SLA tier requirements.

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `quarter` | ✅ | Audit period, e.g., `2026-Q1` |
| `tier_filter` | Optional | Audit only apps at a specific SLA tier (default: all tiers due for audit per `governance/policy.yaml`) |

---

## Steps

### 1 — Gather App Inventory

1. Read `labs-config.yaml` to enumerate all registered apps.
2. Read `governance/policy.yaml` to determine which tiers are due for audit this period:
   - `quarterly` → `standard` and `critical` apps
   - `semi_annual` → `basic` apps (in Q2 and Q4)
   - `annual` → `experimental` apps (in Q4)
3. Produce a checklist of apps to audit with their tier and owner.

### 2 — Per-App Security Scan

For each app in scope:

1. **Dependency audit:**
   - Run `npm audit` (or equivalent) against the app's `package.json`.
   - Flag critical and high vulnerabilities.
   - Check if vulnerabilities have been open longer than 7 days.

2. **Secrets scan:**
   - Verify Gitleaks CI workflow is active and passing.
   - Check last scan date — must be within the last 30 days.

3. **Security checklist:**
   - Run the `security-scan` workflow against the app's codebase.
   - Record findings by severity (critical/high/medium/low).

4. **Observability check:**
   - Verify structured logging middleware is configured.
   - For `standard`+ tiers: verify `/metrics` endpoint exists and returns data.
   - For `critical` tier: verify OpenTelemetry tracing is configured.

### 3 — SLA Compliance Check

For each app:

| Check | How to Verify |
|-------|---------------|
| **Uptime** | Query monitoring data for the period; compare to tier target |
| **Incident response** | Review `docs/decisions/` for incident summaries; check response times |
| **CI/CD active** | Verify GitHub Actions workflows ran successfully in the last 30 days |
| **Environments** | Confirm the app's declared `envs` in `labs-config.yaml` match actual deployments |
| **Critical path hardening** | For `standard`+: check if `critical-path-hardening` has been run |
| **Perf baseline** | For `standard`+: check if `perf/` contains results less than 90 days old |

### 4 — Access Review

1. List all users/teams with access to each app's:
   - GitHub repository
   - CI/CD secrets
   - Production infrastructure
   - Database admin
2. Verify MFA is enabled for production infrastructure and CI/CD secrets (for `standard`+ tiers).
3. Flag any access that violates least-privilege principle.

### 5 — Produce Audit Report

Generate `governance/reports/audit-<quarter>.md`:

```markdown
# Governance Audit Report — <quarter>

**Generated:** <date>
**Apps audited:** <count>
**Auditor:** AI Governance Workflow + Human Review

## Executive Summary

| Tier | Apps | Pass | Fail | Compliance Rate |
|------|------|------|------|-----------------|
| critical | 5 | 4 | 1 | 80% |
| standard | 20 | 18 | 2 | 90% |
| basic | 40 | 38 | 2 | 95% |
| experimental | 35 | 35 | 0 | 100% |

## Findings by App

### <app_name> (tier: <sla>, owner: <owner>)

| Check | Status | Notes |
|-------|--------|-------|
| Dependency audit | ✅ / ❌ | <details> |
| Secrets scan | ✅ / ❌ | <details> |
| Security checklist | ✅ / ❌ | <details> |
| Observability | ✅ / ❌ | <details> |
| SLA compliance | ✅ / ❌ | <details> |
| Access review | ✅ / ❌ | <details> |

**Verdict:** PASS / FAIL — <summary>

---

## Action Items

| # | App | Issue | Severity | Owner | Due Date |
|---|-----|-------|----------|-------|----------|
| 1 | <app> | <issue> | Critical | <owner> | <date> |

## Trends

- Compared to previous quarter: <improvement/regression>
- Top recurring issue: <pattern>
```

**⏸️ STOP — Present the audit report to the human for review and sign-off.**

### 6 — Remediation Tracking

1. Create a GitHub issue for each critical/high finding.
2. Assign to the app's `owner` from `labs-config.yaml`.
3. Set due dates per policy:
   - Critical: 7 days
   - High: 14 days
   - Medium: 30 days
   - Low: next quarter
4. Schedule a follow-up audit for failed apps 30 days after the report.

---

## n8n Automation

This workflow can be automated end-to-end via n8n:

1. **Cron trigger:** first Monday of each quarter.
2. **Webhook:** notify the audit workflow agent to begin.
3. **Per-app loop:** run security scans, collect metrics, check access.
4. **Report generation:** compile findings into the markdown report.
5. **Slack notification:** post the executive summary to `#governance`.
6. **Issue creation:** open GitHub issues for each finding via the GitHub API.
7. **Follow-up cron:** 30-day reminder for unresolved critical/high findings.
