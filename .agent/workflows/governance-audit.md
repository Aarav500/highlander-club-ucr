---
description: Run a quarterly governance audit across all apps registered in labs-config.yaml
model_tier: 1  # Tier 1 (Deep) — compliance and security audit
---

# Governance Audit Workflow

Conduct periodic compliance and security audits across all apps in the portfolio, driven by `labs-config.yaml` and `governance/policy.yaml`.

> **This is the agent-invocable entry point.** For the full audit process design, see `governance/audit-workflow.md`. For n8n automation, see `governance/n8n-security-audit.md`.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `quarter` | ✅ | Audit period, e.g., `2026-Q1` |
| `scope` | Optional | `all` (default), a specific SLA tier, or a single app name |

---

## Steps

### 1 — Gather App Inventory

1. Read `labs-config.yaml` to enumerate all registered apps.
2. Read `governance/policy.yaml` to determine which tiers are due for audit this period:
   - `quarterly` → `standard` and `critical` apps
   - `semi_annual` (Q2, Q4) → `basic` apps
   - `annual` (Q4) → `experimental` apps
3. If `scope` was provided, filter to only matching apps.
4. Produce a checklist of apps to audit with their tier, owner, and `critical_paths`.

### 2 — Per-App Audit

For each app in scope, check against the requirements for its SLA tier (from `governance/policy.yaml`):

| Check | How |
|-------|-----|
| **Dependency audit** | `npm audit` — flag critical/high CVEs open > 7 days |
| **Secrets scan** | Verify Gitleaks CI is active and passing |
| **Security checklist** | Run `security-scan` workflow against the codebase |
| **Observability** | Verify structured logging configured; `/metrics` endpoint for standard+ |
| **CI/CD active** | GitHub Actions ran successfully in last 30 days |
| **Critical path hardening** | For standard+: verify `critical-path-hardening` has run on `critical_paths` |
| **Perf baseline** | For standard+: verify `perf/` results are < 90 days old |
| **Access review** | Verify MFA enabled, least-privilege adhered to |

### 3 — Produce Audit Report

Generate `governance/reports/audit-<quarter>.md` with:

- Executive summary table (pass/fail by tier)
- Per-app findings with severity ratings
- Action items with owners and due dates
- Trend comparison vs. previous quarter

**⏸️ STOP — Present the audit report to the human for review and sign-off.**

### 4 — Remediation Tracking

After approval:

1. Create a GitHub issue for each critical/high finding.
2. Assign to the app's `owner` from `labs-config.yaml`.
3. Set due dates per policy (critical: 7 days, high: 14 days, medium: 30 days).
4. Schedule follow-up audit for failed apps 30 days after the report.

**⏸️ STOP — Confirm issue creation with the human.**

---

## Related Files

| File | Role |
|------|------|
| `governance/policy.yaml` | SLA tier definitions and security baselines |
| `governance/audit-workflow.md` | Detailed audit process design |
| `governance/n8n-security-audit.md` | n8n automation for quarterly audits |
| `governance/n8n-sla-monitoring.md` | Continuous SLA compliance monitoring |
| `labs-config.yaml` | App registry with SLA tiers and owners |
