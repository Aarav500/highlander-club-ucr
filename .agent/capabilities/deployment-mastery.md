# Deployment Mastery

> Reference for production deployment capabilities across Docker, CI/CD, hosting, monitoring, and rollback strategies.

---

## Docker

### Multi-Stage Production Builds

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

EXPOSE 3000
CMD ["node", "server.js"]
```

### Key Patterns

- **Layer caching** — copy `package*.json` before source for faster rebuilds.
- **Healthchecks** — every container must expose `/api/health` returning `{ status: "ok" }`.
- **Non-root user** — add `USER node` before `CMD` in production images.
- **`.dockerignore`** — exclude `node_modules`, `.next`, `.git`, `*.md`.

### Zero-Downtime Deploy

1. Build new image with incremented tag: `app:v1.2.3`.
2. Run new container on alternate port.
3. Health-check new container → only then switch traffic (via Nginx upstream or Docker Compose rolling update).
4. Drain old container gracefully (`SIGTERM` → 30s grace period).

---

## GitHub Actions CI/CD

### Pipeline Stages

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test

  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright install --with-deps
      - run: npm run e2e

  security:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
        env: { SNYK_TOKEN: "${{ secrets.SNYK_TOKEN }}" }

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [test, e2e, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:${{ github.sha }} .
      - run: docker push $REGISTRY/app:${{ github.sha }}
      - run: ssh deploy@$SERVER "cd /app && ./deploy.sh ${{ github.sha }}"
```

### Branch Strategy

| Branch | Purpose | Auto-deploy |
|--------|---------|-------------|
| `main` | Production | Yes → EC2/Docker |
| `develop` | Staging | Yes → Preview |
| `feature/*` | Feature work | PR preview only |

---

## Vercel / Netlify

- **Vercel**: Connect repo → automatic preview deploys on every PR, production on `main`.
- **Netlify**: Same model; use `netlify.toml` for build config.
- **Environment variables**: Set via dashboard — never commit `.env.production`.
- **Edge functions**: Use for API routes requiring low latency.

---

## Monitoring

### Sentry (Error Tracking)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,        // 10% of transactions
  environment: process.env.NODE_ENV,
});
```

### OpenTelemetry (Traces + Metrics)

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  serviceName: "my-app",
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

### Dashboard Targets

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Error rate | Sentry | > 1% of requests |
| P95 latency | OpenTelemetry | > 500ms |
| CPU/Memory | Docker stats / Grafana | > 80% sustained |
| Uptime | UptimeRobot / Checkly | < 99.9% |

---

## Rollbacks

### Git Tag Strategy

```bash
# Tag every production release
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3

# Rollback: re-deploy previous tag
git checkout v1.2.2
./deploy.sh v1.2.2
```

### Docker Image Rollback

```bash
# Images tagged by git SHA and semver
docker pull $REGISTRY/app:v1.2.2
docker-compose up -d --no-deps app
```

### Rollback Checklist

1. Identify failing version from Sentry/monitoring.
2. `docker pull` previous good image.
3. Swap containers (zero-downtime).
4. Verify health endpoint.
5. Post-mortem: root-cause analysis within 24 hours.
