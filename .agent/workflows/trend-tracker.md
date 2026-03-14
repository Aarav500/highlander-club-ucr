---
description: "AI Trend Tracker — Weekly AI news + technology radar + roadmap adaptation + framework monitoring"
---

# AI Trend Tracker (V10.0)

> Live AI news aggregation, technology radar, roadmap adaptation. Always cutting-edge.

---

## Components

### 1. Multi-Source Ingestion

```yaml
ingestion:
  sources:
    research: [arxiv-cs.AI, semantic-scholar-top, papers-with-code]
    industry: [github-trending, npm-rising, pypi-growing, hacker-news]
    official: [openai-blog, google-ai, anthropic, meta-ai]
  schedule:
    papers: daily
    industry: daily
    official: on-publish
```

### 2. Technology Radar

```yaml
tech_radar:
  rings: [adopt, trial, assess, hold]
  quadrants: [languages, tools, platforms, techniques]
  update: weekly
  auto_classify:
    signals: [github_stars, npm_downloads, job_postings, conference_talks]
```

### 3. Weekly Digest

```yaml
digest:
  sections:
    - "🔥 Breakthroughs"
    - "📦 New Releases"
    - "⚠️ Security Advisories"
    - "📈 Trending Tech"
    - "🗺️ Radar Changes"
    - "📋 Recommended Actions"
  delivery: [email, slack, dashboard]
  schedule: "Monday 9am"
  personalization: per-team, per-role
```

---

## Commands

```bash
# Weekly digest
/trend-tracker --digest --generate --period this-week

# Technology radar
/trend-tracker --radar --view --interactive

# Check specific tech
/trend-tracker --check --tech "bun" --assessment

# Roadmap adaptation
/trend-tracker --adapt --roadmap roadmap.md --suggest

# Dependency freshness
/trend-tracker --deps --check --outdated --security

# Compare technologies
/trend-tracker --compare --techs "vite,turbopack,rspack"

# Conference highlights
/trend-tracker --papers --highlights --venue neurips-2026
```
