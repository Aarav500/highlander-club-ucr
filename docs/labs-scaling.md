# Scaling to Multiple Apps with Labs Config

## Overview

As the number of apps built from `fullstack-template` grows, you need a single source of truth that answers:

- **What apps exist?**
- **Who owns each one?**
- **Which environments are active?**
- **What level of operational rigor applies?**

The answer is `labs-config.yaml` at the repo root — a lightweight registry that tracks every app derived from this template.

---

## labs-config.yaml Schema

```yaml
apps:
  - name: my-app              # kebab-case identifier
    repo_url: <github-url>     # where the app's code lives
    owner: <team-or-person>    # who is responsible
    envs: [dev, staging, prod] # active environments
    sla: standard              # experimental | basic | standard | critical
    last_deploy: "2026-03-11"  # ISO date of most recent prod deploy
    critical_paths: [checkout]  # user-critical flows requiring hardening
    tags: [saas, internal]      # free-form labels for filtering
```

### SLA Tiers

| Tier | Meaning | Implications |
|------|---------|--------------|
| `experimental` | Prototype / research | No uptime guarantee, dev-only env, minimal CI |
| `basic` | Internal tool or early-stage product | Standard CI, manual deploys, best-effort uptime |
| `standard` | Production app with real users | Full CI/CD, staging + prod envs, monitoring, on-call rotation |
| `critical` | Revenue or compliance-sensitive | All of `standard` + SLA targets, incident response, `critical-path-hardening` required |

---

## How Agents Use This File

### Amazon Q (Orchestrator)

Amazon Q can read `labs-config.yaml` to:

1. **Route work** — when a Slack issue or GitHub issue arrives, Q can look up which app it belongs to and dispatch to the correct repo/worktree.
2. **Enforce quality bars** — for `critical` SLA apps, Q should require the `critical-path-hardening` and `security-scan` workflows before marking work complete.
3. **Track portfolio health** — Q can enumerate all apps and their environments to produce a status dashboard or audit report.

### Antigravity (Code Agent)

Antigravity can read `labs-config.yaml` to:

1. **Scope context** — when running a workflow like `analytics-insights` or `platform-new-app`, the agent knows which apps exist and can reference their specs.
2. **Suggest integrations** — if multiple apps share an `owner`, the agent can suggest shared platform modules (auth, UI kit) from `platform/`.
3. **Environment awareness** — the agent knows which environments are active and can tailor deploy scripts, env-var checklists, and CI/CD pipelines accordingly.

### Claude Code (Reviewer / Implementer)

Claude Code treats `labs-config.yaml` as **read-only context**:

- Reference it to understand the app landscape during code reviews or architecture proposals.
- Never modify it without explicit human instruction — it is configuration, not generated output.

---

## Workflow Integration

| Workflow | How It Uses labs-config.yaml |
|----------|------------------------------|
| `platform-new-app` | Adds the new app entry after the human approves the plan |
| `analytics-insights` | Reads the app's `sla` to determine depth of analysis |
| `critical-path-hardening` | Automatically triggered for `critical` SLA apps |
| `security-scan` | Runs at higher strictness for `standard` and `critical` tiers |

---

## Adding a New App

1. Spin up the app using the `platform-new-app` workflow.
2. Once the repo exists and is configured, add an entry to `labs-config.yaml`:
   ```yaml
   - name: new-app-name
     repo_url: https://github.com/<org>/new-app-name
     owner: responsible-team
     envs: [dev]
     sla: basic
     last_deploy: null
     critical_paths: []
     tags: [new]
   ```
3. As the app matures, update `envs`, `sla`, `critical_paths`, and `tags` to reflect its current state.

## Retiring an App

Remove the entry from `labs-config.yaml` and archive the repo. Agents will stop referencing it in subsequent runs.

---

## Governance Integration

The `governance/policy.yaml` file defines requirements per SLA tier. The relationship:

```
labs-config.yaml         → lists apps and their SLA tier
governance/policy.yaml   → defines what each tier requires
governance/audit-workflow → checks compliance per tier
```

The quarterly governance audit reads both files to determine which apps to audit, what to check, and who to notify about findings.

## Platform Integration

Platform modules in `platform/` are shared across all registered apps:

- `platform-new-app` workflow reads the registry to avoid duplicate names.
- Agents suggest platform module adoption when multiple apps with the same `owner` or `tags` share common needs.
- The `tags` field enables batch operations (e.g., "run security scan on all `customer-facing` apps").

## Scaling to 100+ Apps

At enterprise scale:

- **Automate `last_deploy`** — CI/CD pipelines update the date on each production deploy.
- **Tag discipline** — establish a controlled vocabulary for `tags` to keep filtering useful.
- **SLA reviews** — quarterly review of tier assignments as apps mature.
- **Audit capacity** — n8n workflows handle per-app scans in parallel; stagger `critical` apps first.
- **Owner accountability** — the `owner` field drives all audit notifications and issue assignment.
