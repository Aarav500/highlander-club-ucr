# NPS Workflow — Weekly Surveys → Feature Prioritization

> Automated Net Promoter Score collection with sentiment analysis that feeds
> directly into feature prioritization. Runs weekly via n8n, stores results in
> Postgres, and surfaces insights as GitHub issues ranked by impact.

---

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  n8n Cron    │────▶│  Send NPS   │────▶│  Collect     │────▶│  Analyze &   │
│  (weekly)    │     │  Survey     │     │  Responses   │     │  Prioritize  │
└─────────────┘     └─────────────┘     └──────────────┘     └──────┬───────┘
                                                                    │
                                                    ┌───────────────▼───────────┐
                                                    │  GitHub Issues + Digest   │
                                                    └───────────────────────────┘
```

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS nps_surveys (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  score       INTEGER     NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback    TEXT,
  sentiment   TEXT,            -- 'positive' | 'neutral' | 'negative'
  themes      TEXT[],          -- extracted topics: ['performance', 'billing', 'ux']
  survey_week DATE        NOT NULL,  -- Monday of the survey week
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nps_week ON nps_surveys (survey_week);
CREATE INDEX idx_nps_sentiment ON nps_surveys (sentiment);
```

---

## Backend Routes (`apps/api-node/`)

```js
// src/routes/nps.js
const { Router } = require("express");
const { query } = require("../db");

const router = Router();

/* ── Submit NPS response ─────────────────────────────────────────── */
router.post("/", async (req, res, next) => {
  try {
    const { score, feedback } = req.body;

    if (score === undefined || score < 0 || score > 10) {
      return res.status(400).json({ error: "score must be 0–10" });
    }

    // Classify sentiment
    const sentiment = score >= 9 ? "positive" : score >= 7 ? "neutral" : "negative";

    // Extract themes via keyword matching (upgrade to AI extraction for production)
    const themes = extractThemes(feedback || "");

    const surveyWeek = getMondayOfWeek(new Date());

    const result = await query(
      `INSERT INTO nps_surveys (user_id, score, feedback, sentiment, themes, survey_week)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, score, sentiment, themes`,
      [req.user.id, score, feedback, sentiment, themes, surveyWeek]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/* ── Get NPS summary for a week ──────────────────────────────────── */
router.get("/summary", async (req, res, next) => {
  try {
    const week = req.query.week || getMondayOfWeek(new Date()).toISOString();

    const result = await query(
      `SELECT
         COUNT(*) AS total_responses,
         AVG(score)::numeric(3,1) AS avg_score,
         COUNT(*) FILTER (WHERE score >= 9) AS promoters,
         COUNT(*) FILTER (WHERE score >= 7 AND score < 9) AS passives,
         COUNT(*) FILTER (WHERE score < 7) AS detractors,
         ROUND(
           (COUNT(*) FILTER (WHERE score >= 9)::numeric / NULLIF(COUNT(*), 0) * 100) -
           (COUNT(*) FILTER (WHERE score < 7)::numeric / NULLIF(COUNT(*), 0) * 100),
           1
         ) AS nps_score
       FROM nps_surveys WHERE survey_week = $1`,
      [week]
    );

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/* ── Get top themes by frequency ─────────────────────────────────── */
router.get("/themes", async (req, res, next) => {
  try {
    const week = req.query.week || getMondayOfWeek(new Date()).toISOString();

    const result = await query(
      `SELECT unnest(themes) AS theme, COUNT(*) AS mentions,
              AVG(score)::numeric(3,1) AS avg_score
       FROM nps_surveys WHERE survey_week = $1
       GROUP BY theme ORDER BY mentions DESC LIMIT 10`,
      [week]
    );

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

/* ── Helpers ─────────────────────────────────────────────────────── */

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

const THEME_KEYWORDS = {
  performance: ["slow", "fast", "speed", "latency", "loading"],
  billing: ["price", "billing", "payment", "expensive", "cost", "charge"],
  ux: ["confusing", "intuitive", "design", "ui", "ux", "layout", "navigation"],
  bugs: ["bug", "crash", "error", "broken", "fix"],
  features: ["feature", "missing", "wish", "need", "want", "add"],
  onboarding: ["setup", "onboard", "getting started", "tutorial", "docs"],
};

function extractThemes(text) {
  const lower = text.toLowerCase();
  return Object.entries(THEME_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([theme]) => theme);
}

module.exports = router;
```

---

## n8n Workflow: Weekly NPS → Prioritization

### Trigger

- **Cron:** Every Monday at 9:00 AM
- **Alternative:** Webhook trigger for on-demand surveys

### Flow

```yaml
# n8n workflow nodes (pseudocode)

1. Cron Trigger:
   schedule: "0 9 * * 1"  # every Monday at 9am

2. HTTP Request - Get Active Users:
   method: GET
   url: "{{API_URL}}/api/users?active=true"

3. Loop - Send Survey Email:
   for_each: active_users
   email:
     subject: "Quick question — how are we doing?"
     body: |
       On a scale of 0–10, how likely are you to recommend us?
       Click your score: [0] [1] [2] ... [10]
       Tell us why (optional): [text field]
     link: "{{FRONTEND_URL}}/nps?user={{user.id}}&week={{monday}}"

4. Wait Node:
   duration: 3 days  # collect responses through Thursday

5. HTTP Request - Get Weekly Summary:
   method: GET
   url: "{{API_URL}}/api/nps/summary?week={{monday}}"

6. HTTP Request - Get Top Themes:
   method: GET
   url: "{{API_URL}}/api/nps/themes?week={{monday}}"

7. AI Node - Generate Insights:
   prompt: |
     Analyze this NPS data and produce prioritized recommendations:
     NPS Score: {{summary.nps_score}}
     Avg Score: {{summary.avg_score}}
     Promoters: {{summary.promoters}}, Passives: {{summary.passives}}, Detractors: {{summary.detractors}}
     Top themes: {{themes}}
     
     Output:
     1. Top 3 priorities (theme + recommended action)
     2. Sentiment trend vs last week
     3. Detractor rescue actions

8. GitHub - Create Issue:
   repo: "fullstack-template"
   title: "NPS Weekly Digest — Week of {{monday}}"
   labels: ["nps", "customer-feedback", "auto-generated"]
   body: |
     ## NPS Score: {{summary.nps_score}}
     | Metric | Value |
     |--------|-------|
     | Responses | {{summary.total_responses}} |
     | Avg Score | {{summary.avg_score}} |
     | Promoters | {{summary.promoters}} |
     | Detractors | {{summary.detractors}} |
     
     ## Top Themes
     {{themes_table}}
     
     ## AI Recommendations
     {{ai_insights}}

9. Slack Notification:
   channel: "#product"
   message: "📊 NPS Digest posted — Score: {{nps_score}} | {{issue_url}}"
```

---

## Feature Prioritization Integration

NPS themes feed directly into the feature prioritization pipeline:

1. **Themes with low avg scores** (< 6) → create P0/P1 feature request issues
2. **Themes with high frequency** → weight higher in backlog prioritization
3. **Detractor feedback** → route to `customer/support-agent.md` for follow-up
4. **Feature requests in feedback** → route to `customer/feature-request-router.md`

---

## Related Files

| File | Purpose |
|------|---------|
| `customer/support-agent.md` | Auto-respond to common issues flagged by detractors |
| `customer/feature-request-router.md` | Route feature requests to specs and prioritization |
| `docs/n8n.md` | n8n automation layer documentation |
| `governance/n8n-schedule.md` | Consolidated cron schedule for all automated workflows |
