# Performance Testing

## Purpose

Establish a **quick latency and error-rate baseline** for critical API endpoints before and after significant changes. This is not a full load-testing suite — it's a lightweight harness that gives you enough data to catch regressions and set rough SLA targets.

## When to Use

- Before marking a performance-sensitive feature as "done."
- After optimizing a database query, adding caching, or refactoring a hot code path.
- Before and after a deploy, to compare baselines.

## What's Here

| File | Description |
|------|-------------|
| `k6-template.js` | Template [k6](https://k6.io/) load test script with placeholder endpoints |
| (future) | Additional scripts can be added for specific apps |

## Quick Start

### Install k6

```bash
# macOS
brew install k6

# Ubuntu / Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows (via winget)
winget install k6 --source winget
```

### Run

```bash
# Default: 10 virtual users, 30s duration
k6 run perf/k6-template.js

# Custom load
k6 run --vus 50 --duration 60s perf/k6-template.js

# Target a specific base URL
k6 run -e BASE_URL=http://localhost:4000 perf/k6-template.js
```

## Interpreting Results

k6 outputs metrics including:

| Metric | What It Means | Target |
|--------|---------------|--------|
| `http_req_duration (p95)` | 95th percentile response time | < 500 ms for APIs |
| `http_req_failed` | Percentage of non-2xx responses | < 1 % |
| `http_reqs` | Total requests completed | Depends on load level |
| `iterations` | Number of complete test iterations | Depends on duration |

## Extending

- Copy `k6-template.js` to `<app_slug>-perf.js` and customize endpoints.
- Use the `perf-baseline` workflow (`.agent/workflows/perf-baseline.md`) to generate tailored scripts from your spec.
- For more advanced scenarios, add [k6 scenarios](https://k6.io/docs/using-k6/scenarios/) with ramping VUs or arrival-rate models.
