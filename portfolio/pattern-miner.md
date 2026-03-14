# Pattern Miner — Reusable Pattern Extraction

> Automatically discovers repeating patterns across portfolio apps and
> extracts them into `platform/` shared modules.
>
> The more apps you build, the smarter the lab gets.

---

## How It Works

```text
┌─────────────────────────────────────────────────┐
│                  Pattern Miner                   │
│                                                  │
│  1. Scan — read source code across all apps      │
│  2. Fingerprint — hash structural patterns       │
│  3. Cluster — group similar implementations      │
│  4. Score — rank by reuse potential               │
│  5. Propose — draft platform/ extraction plan     │
└─────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────────┐
│ Pattern Report  │          │ Extraction Proposal  │
│ (what we found) │          │ (what to extract to  │
│                 │          │  platform/)           │
└─────────────────┘          └─────────────────────┘
```

---

## Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| App source code | `apps/*/src/**` across all repos in `labs-config.yaml` | Raw code to scan |
| Existing platform modules | `platform/auth/`, `platform/billing/`, `platform/ui/` | Avoid re-extracting what's already shared |
| Analytics data | `portfolio/cross-app-analytics.md` | Feature usage signals to prioritize extraction |

---

## Pattern Categories

### 1. Code Patterns

Structural similarities in implementation:

| Category | Examples | Detection Method |
|----------|----------|-----------------|
| **API routes** | CRUD endpoints with same shape (validate → query → respond) | AST comparison of route handlers |
| **Middleware** | Auth checks, rate limiting, error handling | Function signature + body hashing |
| **Data access** | Similar SQL queries, ORM patterns | Query structure fingerprinting |
| **React components** | Form patterns, list/detail views, modals | Component prop + render tree analysis |
| **Validation** | Input schemas, error formatting | Schema structure comparison |

### 2. Infrastructure Patterns

Repeated config and setup:

| Category | Examples |
|----------|----------|
| **CI/CD** | Same GitHub Actions steps across repos |
| **Docker** | Similar Dockerfiles with minor variations |
| **Environment** | Repeated env var patterns |
| **Dependencies** | Same npm packages installed in 3+ apps |

### 3. Business Logic Patterns

Higher-level functional patterns:

| Category | Examples |
|----------|----------|
| **Onboarding flows** | Signup → verify → first action → aha moment |
| **Notification systems** | Email/Slack/in-app notification dispatch |
| **Search** | Full-text search with filters and pagination |
| **Export** | CSV/PDF generation from query results |

---

## Scoring Algorithm

Each discovered pattern is scored for extraction priority:

```
extraction_score = (frequency × 0.3) + (complexity × 0.25) + (usage × 0.25) + (drift × 0.2)
```

| Factor | Weight | Description |
|--------|--------|-------------|
| **Frequency** | 0.30 | How many apps contain this pattern (from `labs-config.yaml` app count) |
| **Complexity** | 0.25 | Lines of code / cyclomatic complexity — higher = more value in sharing |
| **Usage** | 0.25 | How heavily the feature is used (from `cross-app-analytics.md` data) |
| **Drift** | 0.20 | How much implementations have diverged — high drift = urgent to unify |

### Priority Tiers

| Score | Tier | Action |
|-------|------|--------|
| ≥ 0.8 | **P0 — Extract now** | Create platform module, migrate all apps |
| 0.5–0.79 | **P1 — Extract soon** | Queue for next platform sprint |
| 0.3–0.49 | **P2 — Monitor** | Track drift; extract when a 3rd app needs it |
| < 0.3 | **Skip** | Not worth extracting yet |

---

## Extraction Proposal Format

When the miner finds a P0/P1 pattern, it generates a proposal:

```markdown
## Extraction Proposal: <pattern-name>

**Score:** 0.85 (P0)
**Found in:** inventory-lab-app, research-6g-prototype, <app-c>
**Category:** API route — CRUD with validation

### Current Implementations
| App | File | Lines | Last Modified |
|-----|------|-------|---------------|
| inventory-lab-app | src/routes/items.js | 45–120 | 2026-03-10 |
| research-6g-prototype | src/routes/experiments.js | 30–95 | 2026-03-08 |

### Proposed Platform Module
- **Location:** `platform/<pattern-name>/`
- **Exports:** `createCrudRouter(config)` middleware factory
- **Config:** table name, validation schema, auth requirements
- **Migration:** Replace inline implementations with import

### Drift Report
- 80% identical structure
- Differences: field names, validation rules (configurable)
- Breaking: none — wrapper preserves existing API contracts
```

---

## Automation

| Trigger | Frequency | Action |
|---------|-----------|--------|
| New app added to `labs-config.yaml` | On change | Scan new app, update pattern index |
| Weekly scan | Cron (Sunday 03:00 UTC) | Full portfolio scan, refresh scores |
| Pattern score crosses P1 → P0 | On threshold | Alert `#platform-team`, create GitHub issue |

### n8n Integration

The pattern miner can run as an n8n sub-workflow:

1. **Schedule Trigger** — weekly cron
2. **Loop** — iterate apps from `labs-config.yaml`
3. **AI Agent** — analyze code structure, compare patterns
4. **Function** — compute extraction scores
5. **Slack** — post weekly pattern digest to `#platform-patterns`

---

## Integration

- **Reads from** — app source code, `platform/` existing modules, `portfolio/cross-app-analytics.md`
- **Writes to** — `portfolio/reports/<date>-pattern-report.md`, extraction proposals as GitHub issues
- **Feeds into** — `platform/` (new shared modules), `governance/` (standardization rules)

---

## Status

> [!NOTE]
> Design document. Pattern detection initially runs via AI agent analysis.
> Future: AST-based static analysis tooling for automated fingerprinting.
