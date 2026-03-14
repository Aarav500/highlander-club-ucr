---
description: Generate and interpret baseline performance tests for critical API endpoints
model_tier: 2  # Tier 2 (Sonnet) — perf script generation and analysis
---

# Performance Baseline Workflow

Help humans prepare, run, and interpret a lightweight load test against critical API endpoints.

> **This workflow does NOT run load tests itself.** It generates the test script and interprets results that the human pastes back. The human runs k6 (or similar) locally or in CI.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `app_slug` | ✅ | App identifier, used to name the output script |
| `critical_endpoints` | ✅ | Comma-separated list of endpoints to test (e.g., `GET /health, POST /api/orders, GET /api/users/:id`) |
| `base_url` | Optional | Target URL, defaults to `http://localhost:4000` |

---

## Steps

### 1 — Read Context

1. Read the app spec (`specs/<app_slug>-spec.md`) to understand endpoint contracts and expected payloads.
2. Read `perf/k6-template.js` as the starting point for the generated script.
3. If the app has auth, note what token/session setup is needed.

### 2 — Generate the Perf Script

Create `perf/<app_slug>-perf.js` by customizing `k6-template.js`:

1. For each endpoint in `critical_endpoints`:
   - Add an `http.get()` or `http.post()` call with the correct path and payload.
   - Add `check()` assertions for status code and latency.
   - If the endpoint requires authentication, add a setup function that logs in and stores the token.

2. Set appropriate defaults:
   - **VUs (virtual users):** 10 for lightweight baseline, suggest 50–100 for stress testing.
   - **Duration:** 30s for quick check, 5m for sustained load.
   - **Thresholds:** p95 < 500ms for reads, p95 < 1000ms for writes, error rate < 1%.

3. Add comments explaining each section and how to customize further.

### 3 — Provide Run Instructions

Output clear instructions for the human:

```markdown
## How to Run

### Prerequisites
- Install k6: https://k6.io/docs/get-started/installation/

### Quick Run (baseline)
k6 run perf/<app_slug>-perf.js

### Custom Load
k6 run --vus 50 --duration 60s perf/<app_slug>-perf.js

### Against Staging
k6 run -e BASE_URL=https://staging.example.com perf/<app_slug>-perf.js
```

### 4 — Suggest Metrics to Track

Recommend the human track these metrics:

| Metric | Description | Suggested Target |
|--------|-------------|-----------------|
| `http_req_duration` (p50) | Median response time | < 200ms (reads), < 500ms (writes) |
| `http_req_duration` (p95) | 95th percentile response time | < 500ms (reads), < 1000ms (writes) |
| `http_req_duration` (p99) | 99th percentile — tail latency | < 2000ms |
| `http_req_failed` | Error rate (non-2xx) | < 1% |
| `http_reqs` | Throughput (requests/sec) | Depends on expected traffic |
| `iteration_duration` | Full scenario cycle time | Sanity check |

### 5 — Interpret Results

**⏸️ STOP — Ask the human to run the test and paste the k6 summary output.**

Once results are provided, analyze them:

1. **Identify regressions** — any metric that exceeds the suggested target.
2. **Spot error patterns** — are errors concentrated on specific endpoints?
3. **Check tail latency** — large gaps between p50 and p99 suggest contention or cold-start issues.
4. **Compare baselines** — if a previous run exists, compare before/after.

### 6 — Suggest Improvements

Based on the results, recommend specific optimizations:

- **High latency on reads** → add caching (Redis, HTTP cache headers), optimize DB queries (indexes, query plans).
- **High latency on writes** → check for locks, consider async processing (queues), batch operations.
- **High error rate** → check for connection pool exhaustion, rate limiting, or payload validation failures.
- **Tail latency spikes** → investigate garbage collection pauses, cold starts, or connection establishment overhead.

---

## Output

- `perf/<app_slug>-perf.js` — the generated k6 script
- Interpretation summary (as a message or artifact) with:
  - Metrics overview
  - Pass/fail against targets
  - Recommended improvements
  - Suggested follow-up tests
