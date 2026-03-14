# Feature Request Router — User Requests → Specs → Prioritization

> Routes feature requests from any channel (GitHub issues, Slack, NPS feedback,
> support tickets) into structured specs and a prioritized backlog. Uses AI
> for sentiment scoring and impact estimation, n8n for automation, and GitHub
> Projects for tracking.

---

## Overview

```
┌──────────────┐  ┌──────────┐  ┌──────────┐
│ GitHub Issue  │  │  Slack   │  │  NPS     │
│ (labeled:    │  │  Message │  │  Feedback │
│  feature-req)│  │          │  │          │
└──────┬───────┘  └────┬─────┘  └────┬─────┘
       │               │             │
       └───────────────▼─────────────┘
                       │
              ┌────────▼────────┐
              │  n8n Router     │
              │  (normalize)    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  AI: Extract    │
              │  + Score        │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  GitHub Issue   │
              │  (structured)   │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Backlog        │
              │  Prioritization │
              └─────────────────┘
```

---

## Feature Request Schema

Every feature request is normalized into this structure:

```json
{
  "id": "fr-2026-0312-001",
  "title": "Export dashboard data to CSV",
  "description": "Users want to export their dashboard charts and tables as CSV files for offline analysis and reporting.",
  "source": "github-issue",
  "source_ref": "#245",
  "requester": "user@example.com",
  "category": "data-export",
  "impact_score": 7.5,
  "effort_estimate": "medium",
  "priority": "P1",
  "sentiment": "neutral",
  "vote_count": 12,
  "status": "backlog",
  "related_themes": ["reporting", "data-access"],
  "created_at": "2026-03-12T10:00:00Z"
}
```

---

## Impact Scoring

Each feature request is scored on 4 dimensions (1–10 scale):

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| **Reach** | 30% | How many users will this affect? |
| **Impact** | 30% | How much will it improve their experience? |
| **Confidence** | 20% | How sure are we about reach and impact? |
| **Effort** | 20% | How much dev time is required? (inverted: lower effort = higher score) |

**Formula:** `priority_score = (reach × 0.3) + (impact × 0.3) + (confidence × 0.2) + ((10 - effort) × 0.2)`

### Priority Mapping

| Score | Priority | Action |
|-------|----------|--------|
| 8.0–10.0 | **P0** | Schedule for next sprint |
| 6.0–7.9 | **P1** | Schedule for next 2 sprints |
| 4.0–5.9 | **P2** | Add to backlog, revisit quarterly |
| 0.0–3.9 | **P3** | Acknowledge, park for later |

---

## n8n Workflow: Feature Request Pipeline

```yaml
# n8n workflow nodes (pseudocode)

1. Trigger - Multiple Sources:
   - GitHub: issue labeled "feature-request"
   - Slack: message in #feature-requests channel
   - Webhook: POST from NPS workflow (feature themes)
   - Webhook: POST from support agent (feature-request category)

2. Normalize Node:
   # Unify all sources into the feature request schema
   title: extract from issue title / Slack message / NPS feedback
   description: extract full context
   source: "github-issue" | "slack" | "nps" | "support"
   source_ref: issue number / message URL / NPS survey ID
   requester: user who submitted

3. AI Node - Analyze & Score:
   prompt: |
     Analyze this feature request and provide:
     
     Request: "{{title}}"
     Context: "{{description}}"
     Source: {{source}}
     
     1. Category: Pick the best fit from [auth, billing, data-export,
        integrations, performance, ux, admin, api, mobile, analytics]
     2. Impact scoring (1–10 each):
        - Reach: how many users would benefit?
        - Impact: how much improvement for those users?
        - Confidence: how certain are we about reach/impact?
        - Effort: how much development work? (1=trivial, 10=massive)
     3. Related_themes: list of 1–3 product themes
     4. Similar_to: any obvious overlap with existing features?
     
     Respond in JSON.

4. Duplicate Check:
   # Search existing GitHub issues for similar requests
   search: "is:issue label:feature-request {{title}} in:title"
   if_duplicate:
     - Add "+1" comment with requester context
     - Increment vote_count on original
     - Skip issue creation
   if_new:
     - Continue to step 5

5. GitHub - Create Structured Issue:
   repo: "fullstack-template"
   title: "[Feature] {{title}}"
   labels: ["feature-request", "{{category}}", "{{priority}}"]
   body: |
     ## Feature Request
     
     **Source:** {{source}} ({{source_ref}})
     **Requester:** {{requester}}
     **Category:** {{category}}
     
     ### Description
     {{description}}
     
     ### Impact Assessment
     | Dimension | Score |
     |-----------|-------|
     | Reach | {{reach}}/10 |
     | Impact | {{impact}}/10 |
     | Confidence | {{confidence}}/10 |
     | Effort | {{effort}}/10 |
     | **Priority Score** | **{{priority_score}}** |
     | **Priority** | **{{priority}}** |
     
     ### Related Themes
     {{related_themes}}
     
     ---
     _Auto-generated by feature-request-router. Vote with 👍 to increase priority._

6. Notify:
   if priority in ["P0", "P1"]:
     slack:
       channel: "#product"
       message: "🎯 New {{priority}} feature request: {{title}} (score: {{priority_score}}) — {{issue_url}}"

7. Weekly Digest (separate cron: Fridays at 5pm):
   # Aggregate the week's feature requests
   query: GitHub issues created this week with label "feature-request"
   group_by: category
   sort_by: priority_score DESC
   
   create_issue:
     title: "Feature Request Digest — Week of {{monday}}"
     labels: ["digest", "feature-request"]
     body: |
       ## This Week's Feature Requests
       | # | Title | Priority | Score | Votes | Category |
       |---|-------|----------|-------|-------|----------|
       {{for each request, sorted by score}}
       
       ## Top Categories
       {{category breakdown with counts}}
       
       ## Recommendations
       {{AI-generated summary of top 3 requests to prioritize}}
```

---

## Spec Generation for Approved Requests

When a P0/P1 feature request is approved for implementation:

1. **Trigger:** Human adds label `approved` to the feature request issue
2. **n8n generates a spec draft** using `spec-template.md`:
   - Fills in product summary, user stories, and acceptance criteria from the
     feature request issue body
   - Saves to `specs/<slug>-spec.md`
3. **Creates a PLAN issue** referencing the spec for the `new-production-app`
   workflow to pick up

This closes the loop: **user request → structured issue → approved spec → implementation.**

---

## Database Schema (optional — for analytics)

```sql
CREATE TABLE IF NOT EXISTS feature_requests (
  id              SERIAL PRIMARY KEY,
  external_id     TEXT UNIQUE,             -- GitHub issue number
  title           TEXT NOT NULL,
  source          TEXT NOT NULL,           -- github | slack | nps | support
  source_ref      TEXT,
  category        TEXT,
  reach_score     INTEGER CHECK (reach_score BETWEEN 1 AND 10),
  impact_score    INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  confidence      INTEGER CHECK (confidence BETWEEN 1 AND 10),
  effort_score    INTEGER CHECK (effort_score BETWEEN 1 AND 10),
  priority_score  NUMERIC(3,1),
  priority        TEXT,                    -- P0 | P1 | P2 | P3
  vote_count      INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'backlog',  -- backlog | approved | in-progress | shipped | rejected
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  shipped_at      TIMESTAMPTZ
);

CREATE INDEX idx_fr_priority ON feature_requests (priority, priority_score DESC);
CREATE INDEX idx_fr_category ON feature_requests (category);
```

---

## Metrics

Track the health of the feature pipeline:

- **Request volume:** total requests per week by source
- **Auto-dedup rate:** % of requests merged with existing ones
- **Time to ship:** days from request → `shipped` status
- **Top categories:** where user demand clusters
- **Priority accuracy:** do P0s actually get shipped first?

---

## Related Files

| File | Purpose |
|------|---------|
| `customer/nps-workflow.md` | NPS feedback feeds feature themes here |
| `customer/support-agent.md` | Support agent routes feature requests here |
| `spec-template.md` | Template used when generating specs from approved requests |
| `.agent/workflows/new-production-app.md` | Picks up approved specs for implementation |
| `docs/n8n.md` | n8n automation layer documentation |
