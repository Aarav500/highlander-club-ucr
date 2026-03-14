# Support Agent — Auto-Respond to Common Issues

> AI-powered first-responder that triages GitHub issues and Slack messages,
> auto-resolves common problems, and escalates complex ones to human support.
> Runs as an n8n workflow triggered by new GitHub issues or Slack messages.

---

## Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  GitHub Issue │────▶│  Classify    │────▶│  Route       │
│  or Slack msg │     │  (AI)        │     │              │
└──────────────┘     └──────────────┘     └──┬───┬───┬───┘
                                             │   │   │
                          ┌──────────────────▼┐  │  ┌▼──────────────────┐
                          │  Auto-Response    │  │  │  Escalate to      │
                          │  (known issues)   │  │  │  Human Support    │
                          └──────────────────┘  │  └───────────────────┘
                                    ┌───────────▼───────────┐
                                    │  Feature Request      │
                                    │  Router               │
                                    └───────────────────────┘
```

---

## Issue Classification

The support agent classifies every incoming issue into one of these categories:

| Category | Action | Example |
|----------|--------|---------|
| `bug-known` | Auto-respond with fix/workaround | "Login fails on Safari" |
| `bug-new` | Label + notify on-call dev | "API returns 500 on /checkout" |
| `how-to` | Auto-respond with docs link | "How do I reset my password?" |
| `feature-request` | Route to feature-request-router | "I wish I could export to CSV" |
| `billing` | Auto-respond + flag for review | "I was charged twice" |
| `outage` | Trigger ops-playbook | "Site is down" |
| `praise` | Log as promoter signal | "Love this product!" |

---

## Knowledge Base

The support agent draws from a structured knowledge base of known issues
and standard responses:

```yaml
# customer/knowledge-base.yaml (create as issues accumulate)

known_issues:
  - id: login-safari
    keywords: ["login", "safari", "sign in", "authentication"]
    category: bug-known
    response: |
      This is a known issue with Safari's cookie handling. To fix:
      1. Go to Safari → Settings → Privacy
      2. Uncheck "Prevent cross-site tracking"
      3. Reload the page and try again
      We're working on a permanent fix (tracked in #142).
    issue_ref: "#142"

  - id: slow-dashboard
    keywords: ["slow", "dashboard", "loading", "performance"]
    category: bug-known
    response: |
      We've identified a performance issue with the dashboard on large
      datasets. Workaround: use the date filter to limit the time range.
      Fix shipping in v2.3 (tracked in #198).
    issue_ref: "#198"

  - id: reset-password
    keywords: ["reset", "password", "forgot", "locked out"]
    category: how-to
    response: |
      To reset your password:
      1. Go to /login and click "Forgot Password"
      2. Enter your email address
      3. Check your inbox for the reset link (check spam too)
      If you don't receive the email within 5 minutes, contact us.

standard_responses:
  billing: |
    Thanks for reporting this billing issue. I've flagged it for our
    billing team who will review within 24 hours. If this is urgent,
    please reply to this thread.
  
  outage: |
    We're aware of this issue and our team is investigating. Follow
    our status page at status.yourapp.com for real-time updates.
    We'll post a root cause analysis within 48 hours of resolution.
```

---

## n8n Workflow: Issue Triage + Auto-Response

```yaml
# n8n workflow nodes (pseudocode)

1. Trigger - GitHub Issue Created:
   event: "issues.opened"
   repo: "fullstack-template"

2. AI Node - Classify Issue:
   prompt: |
     Classify this GitHub issue into one category:
     bug-known, bug-new, how-to, feature-request, billing, outage, praise
     
     Title: {{issue.title}}
     Body: {{issue.body}}
     Labels: {{issue.labels}}
     
     Also extract:
     - severity: critical | high | medium | low
     - sentiment: positive | neutral | negative | frustrated
     - key_entities: product areas mentioned
     
     Respond in JSON.

3. Switch Node - Route by Category:

   Case "bug-known":
     3a. Match against knowledge base entries
     3b. Post auto-response comment on issue
     3c. Add labels: ["auto-responded", "bug-known"]
     3d. Link to tracking issue

   Case "bug-new":
     3a. Add labels: ["needs-triage", "bug"]
     3b. Assign to on-call dev (from labs-config.yaml owner field)
     3c. If severity == "critical": notify Slack #incidents

   Case "how-to":
     3a. Match against knowledge base
     3b. Post docs link as comment
     3c. Add labels: ["auto-responded", "docs"]

   Case "feature-request":
     3a. Route to feature-request-router workflow
     3b. Add labels: ["feature-request"]

   Case "billing":
     3a. Post standard billing response
     3b. Add labels: ["billing", "needs-review"]
     3c. Notify Slack #billing

   Case "outage":
     3a. Post standard outage response
     3b. Trigger ops-playbook workflow
     3c. Notify Slack #incidents with @channel

   Case "praise":
     3a. Add labels: ["praise"]
     3b. Log as promoter signal for NPS tracking

4. Metrics Node - Record:
   - category, severity, sentiment, response_time
   - auto_resolved: true/false
   - Store in usage_events table for analytics
```

---

## Escalation Rules

| Condition | Action |
|-----------|--------|
| Sentiment = "frustrated" + severity ≥ "high" | Immediate Slack alert to team lead |
| Same user filing 3+ issues in 7 days | Flag as churn risk, notify customer success |
| Issue unresolved after 48 hours | Auto-bump priority, re-notify assignee |
| Billing category + any severity | Always human review within 24 hours |
| Outage category | Trigger ops-playbook immediately |

---

## Metrics & Dashboard

Track support agent effectiveness:

```sql
-- Auto-resolution rate
SELECT
  DATE_TRUNC('week', created_at) AS week,
  COUNT(*) AS total_issues,
  COUNT(*) FILTER (WHERE auto_resolved = true) AS auto_resolved,
  ROUND(COUNT(*) FILTER (WHERE auto_resolved = true)::numeric / COUNT(*) * 100, 1) AS auto_rate_pct
FROM support_events
GROUP BY week ORDER BY week DESC;

-- Top issue categories
SELECT category, COUNT(*) AS count, AVG(resolution_hours)::numeric(5,1) AS avg_resolution_hrs
FROM support_events
WHERE created_at >= now() - interval '30 days'
GROUP BY category ORDER BY count DESC;
```

---

## Related Files

| File | Purpose |
|------|---------|
| `customer/nps-workflow.md` | NPS surveys — detractor feedback routes here |
| `customer/feature-request-router.md` | Feature requests extracted by this agent |
| `.agent/workflows/ops-playbook.md` | Triggered for outage-category issues |
| `docs/n8n.md` | n8n automation layer documentation |
