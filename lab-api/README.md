# Lab API

HTTP interface for triggering AI Lab workflows programmatically.

## Quick Start

```bash
cd lab-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8100
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/trigger/{workflow}` | Queue a workflow run |
| `GET` | `/runs` | List recent runs |
| `GET` | `/runs/{run_id}` | Get run status/result |
| `GET` | `/workflows` | List available workflows |
| `GET` | `/health` | Health check |

## Usage

### Trigger a workflow

```bash
# Trigger with an idea
curl -X POST http://localhost:8100/trigger/new-app-from-idea \
  -H "Content-Type: application/json" \
  -d '{"idea": "A task tracker for small teams", "app_slug": "task-tracker"}'

# Trigger with model tier override
curl -X POST http://localhost:8100/trigger/security-scan \
  -H "Content-Type: application/json" \
  -d '{"app_slug": "task-tracker", "model_tier": 1}'

# Minimal trigger
curl -X POST http://localhost:8100/trigger/self-review
```

### Poll for status

```bash
curl http://localhost:8100/runs/<run_id>
```

### List workflows

```bash
curl http://localhost:8100/workflows
```

## Architecture

```
POST /trigger/{workflow}
  → validates workflow exists in .agent/workflows/
  → creates a RunRecord (queued)
  → spawns background task
  → returns run_id + poll URL

Background task:
  → sets status to "running"
  → executes workflow (currently simulated)
  → builds handoff artifact per agents/protocol.md
  → sets status to "completed" or "failed"
```

## Integration Points

- **n8n**: Point an n8n HTTP Request node at `/trigger/{workflow}` to chain workflows
- **CI/CD**: Call from GitHub Actions to trigger security scans or perf baselines
- **Agents**: Agents can POST here to delegate work to other workflows
- **Handoffs**: Every completed run emits a handoff artifact per `agents/protocol.md`

## Production Notes

The current implementation uses:
- **In-memory store** for runs — replace with Redis or PostgreSQL for persistence
- **Background tasks** for execution — replace with Celery/SQS for durability
- **Simulated execution** — wire up actual CLI invocations or agent API calls
