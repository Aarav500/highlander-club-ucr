# Lab Dashboard

Live status dashboard for the AI Lab — shows registered apps, available workflows, recent runs, and service health.

## Quick Start

```bash
cd dashboard
npm install
npm run dev        # → http://localhost:3100
```

Requires **lab-api** running on port 8100 and **api-node** on port 4000 for live data.

## What It Shows

| Section | Data Source | Refresh |
|---------|-----------|---------|
| **Stats row** | Lab API `/health`, API Node `/health`, run counts | 10s poll |
| **Registered Apps** | `labs-config.yaml` (bundled at build) | Static |
| **Available Workflows** | Lab API `GET /workflows` | 10s poll |
| **Recent Runs** | Lab API `GET /runs` | 10s poll |

## Architecture

```
┌──────────────────────────────────────────────┐
│             Dashboard (Next.js :3100)         │
│  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ App Grid│ │ Workflow  │ │  Run List     │  │
│  │         │ │ Table     │ │  (live poll)  │  │
│  └─────────┘ └────┬─────┘ └───────┬───────┘  │
│                    │               │          │
└────────────────────┼───────────────┼──────────┘
                     ▼               ▼
              Lab API (:8100)   API Node (:4000)
              GET /workflows    GET /health
              GET /runs
              GET /health
```

## Configuration

| Env Var | Default | Purpose |
|---------|---------|---------|
| `LAB_API_URL` | `http://localhost:8100` | Lab API base URL |
| `API_NODE_URL` | `http://localhost:4000` | Backend API base URL |

## File Structure

```
dashboard/
  package.json
  next.config.js
  src/
    app/
      globals.css        # Dark glassmorphism theme
      layout.js          # Root layout with metadata
      page.js            # Main dashboard page
```

## Extending

- **Add more data sources**: Import from GitHub Actions API, Grafana, or n8n webhooks
- **Add pages**: Create `src/app/workflows/page.js` for per-workflow detail views
- **Add WebSocket**: Replace polling with Server-Sent Events or WebSocket for real-time updates
- **Add auth**: Wrap with NextAuth for team-only access
