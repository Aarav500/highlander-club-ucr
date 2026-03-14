---
description: "Options Engine — multi-domain case-by-case stack selection with /options-choose and /options-adopt"
---

# Options Engine Workflow

> Generic multi-domain chooser. Pick the best frontend, backend, deploy, or mobile stack per project based on context, constraints, and brand. Agent scores options and presents ranked alternatives.

---

## Inputs

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `domain` | Yes | — | `frontend`, `backend`, `deploy`, `mobile` |
| `page_type` | Yes | — | Domain-specific page/project type |
| `brand` | No | `"modern"` | Brand keywords that influence visual/architectural choices |
| `constraints` | No | `[]` | Hard constraints: `accessible`, `low-motion`, `mobile-first`, `edge`, `self-hosted`, `cost-sensitive` |
| `scale` | No | `"standard"` | `low`, `standard`, `high`, `massive` — influences backend/deploy |
| `team` | No | `"fullstack-ts"` | Team expertise: `fullstack-ts`, `python-ml`, `mobile-native`, `devops` |

---

## Step 1: Load Catalog

Read `.agent/capabilities/options-catalog.yaml` for the specified domain. Filter to only options that match the domain.

---

## Step 2: Apply Decision Matrix

Score each option against the criteria in `.agent/capabilities/options-engine.md`:

```
Score = (page_type_fit × 0.30)
      + (brand_alignment × 0.20)
      + (bundle_efficiency × 0.15)
      + (accessibility × 0.15)
      + (constraint_match × 0.10)
      + (team_familiarity × 0.10)
```

### Frontend Scoring Rules

| Input | Top Recommendation | Why |
|-------|-------------------|-----|
| `dashboard + enterprise` | shadcn + corporate + dense | Data-first, professional |
| `dashboard + futuristic` | shadcn + sci-fi + dense | Custom control + neon |
| `marketing + playful` | magic-ui + gradient-mesh + rich | Visual wow-factor |
| `marketing + enterprise` | shadcn + flat-minimal + subtle | Clean, trustworthy |
| `form + accessible` | chakra + flat-minimal + none | Best a11y defaults |
| `mobile + finance` | shadcn + dark-luxury + subtle | Trust + thumb-zone UX |
| `data + admin` | ant-design + corporate + none | Table mastery |
| `docs + clean` | tailwind-only + light-clean + none | Fast, readable |

### Backend Scoring Rules

| Input | Top Recommendation | Why |
|-------|-------------------|-----|
| `api-heavy + nextjs` | tRPC + Zod + Postgres | E2E type safety |
| `api-heavy + scale:high` | Fastify + Neon | Top-tier perf |
| `edge + serverless` | Hono + Turso + Cloudflare | Edge-native |
| `ml-api + python` | FastAPI + Postgres | Best ML serving |
| `enterprise + modular` | NestJS + Postgres + Auth0 | DI + compliance |

### Deploy Scoring Rules

| Input | Top Recommendation | Why |
|-------|-------------------|-----|
| `nextjs + standard` | Vercel | Optimized for Next |
| `self-hosted + enterprise` | Kubernetes | Full control |
| `cost-sensitive + simple` | Railway | Cheapest managed |
| `edge + global` | Cloudflare Pages | 300+ edge nodes |
| `docker + managed` | Render or Fly.io | Easy container deploy |

---

## Step 3: Rank and Present Options

Output the top 3 options with rationale:

```markdown
## Options for: frontend / dashboard / "futuristic serious" / [low-motion, data-dense]

### 🥇 Option 1 — shadcn/ui + Sci-Fi + Dense Dashboard (Score: 92/100)
**Design:** Dark background (#0a0a1a), neon accents, glassmorphic cards
**Components:** Custom GlassCard, DataTable (@tanstack), AreaChart (recharts)
**Motion:** Subtle (hover glow, fade transitions)
**Bundle:** ~0 KB (copy-paste components)
**Why:** Maximum control for custom sci-fi aesthetic, zero bundle overhead

### 🥈 Option 2 — Tremor + Dark Luxury + Minimal Dashboard (Score: 78/100)
**Design:** Premium dark with gold accents, built-in chart primitives
**Components:** Tremor Card, BarChart, AreaChart, Badge, Table
**Motion:** Subtle (built-in Tremor transitions)
**Bundle:** ~40 KB
**Why:** Pre-built analytics components, faster to ship

### 🥉 Option 3 — Ant Design + Corporate + Admin Layout (Score: 65/100)
**Design:** Professional gray/blue, enterprise table system
**Components:** Ant Table (virtual scroll), Form, Statistic, Tabs
**Motion:** None (static, performance-focused)
**Bundle:** ~120 KB
**Why:** Best-in-class data tables, but doesn't match "futuristic" brand
```

---

## Step 4: Adopt Selected Option

On `/options-adopt option=<N>`:

### Frontend Adoption
1. Install dependencies for chosen design system
2. Set up Tailwind theme tokens matching visual style
3. Generate layout scaffolding matching layout pattern
4. Configure motion level (install Framer Motion or skip)
5. Create example page with mock data
6. Save decision to `docs/frontend-decisions.md`

### Backend Adoption
1. Install framework + database driver
2. Scaffold API routes / controller structure
3. Set up auth provider
4. Generate example endpoint with validation
5. Save decision to `docs/backend-decisions.md`

### Deploy Adoption
1. Generate deploy config (vercel.json / fly.toml / Dockerfile / etc.)
2. Set up GitHub Actions workflow for chosen platform
3. Configure environment variables template
4. Save decision to `docs/deploy-decisions.md`

---

## Step 5: Learn from History

After each adoption, save to `docs/design-history.json`:

```json
{
  "decisions": [
    {
      "date": "2026-03-14",
      "domain": "frontend",
      "page_type": "dashboard",
      "brand": "futuristic serious",
      "constraints": ["low-motion", "data-dense"],
      "chosen": {
        "design_system": "shadcn-ui",
        "visual_style": "sci-fi",
        "layout": "dashboard-dense",
        "motion": "subtle"
      },
      "score": 92,
      "outcome": "accepted"
    }
  ]
}
```

When similar inputs appear in the future, the agent boosts the previously-chosen option's score by +10 ("learned preference").

---

## Commands

```bash
# Frontend chooser
/options-choose domain=frontend page_type=dashboard brand="futuristic serious" constraints="low-motion, data-dense"
/options-choose domain=frontend page_type=marketing brand="playful colorful"
/options-choose domain=frontend page_type=form brand="clean minimal" constraints="accessible"

# Backend chooser
/options-choose domain=backend page_type=api-heavy scale=high team=fullstack-ts
/options-choose domain=backend page_type=ml-api team=python-ml

# Deploy chooser
/options-choose domain=deploy page_type=nextjs constraints="cost-sensitive"
/options-choose domain=deploy page_type=docker constraints="self-hosted"

# Mobile chooser
/options-choose domain=mobile page_type=fintech constraints="app-store"
/options-choose domain=mobile page_type=prototype team=fullstack-ts

# Adopt a ranked option
/options-adopt option=1
/options-adopt option=2

# View decision history
/options-history domain=frontend
```
