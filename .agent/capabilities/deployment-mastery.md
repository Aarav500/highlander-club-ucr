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

---

## Kubernetes (2026)

### Local Development — minikube

```bash
# Start local cluster
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# Build and load local image
docker build -t app:dev .
minikube image load app:dev
```

### EKS Production Templates

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels:
    app: app
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
        - name: app
          image: ${ECR_REGISTRY}/app:${TAG}
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
```

### Helm Chart Structure

```
charts/app/
├── Chart.yaml
├── values.yaml
├── values-staging.yaml
├── values-production.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── hpa.yaml
    └── configmap.yaml
```

### HPA (Horizontal Pod Autoscaler)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## AI-Ops (2026)

### GitHub Copilot for Actions

```yaml
# .github/workflows/ai-ops.yml
name: AI-Ops Pipeline
on:
  deployment_status:
    types: [completed]

jobs:
  ai-analysis:
    if: github.event.deployment_status.state == 'failure'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: AI Failure Analysis
        uses: github/copilot-actions@v1
        with:
          task: analyze-deployment-failure
          context: |
            Deployment ${{ github.event.deployment.id }} failed.
            Environment: ${{ github.event.deployment.environment }}
            Ref: ${{ github.event.deployment.ref }}
          output: failure-report.md

      - name: Auto-Rollback Decision
        id: rollback
        run: |
          SEVERITY=$(cat failure-report.md | grep "Severity:" | cut -d: -f2 | tr -d ' ')
          if [ "$SEVERITY" == "CRITICAL" ]; then
            echo "action=rollback" >> $GITHUB_OUTPUT
          else
            echo "action=notify" >> $GITHUB_OUTPUT
          fi

      - name: Execute Rollback
        if: steps.rollback.outputs.action == 'rollback'
        run: |
          kubectl rollout undo deployment/app
          kubectl rollout status deployment/app --timeout=120s
```

### Anomaly Detection

| Signal | Threshold | Action |
|--------|-----------|--------|
| Error rate spike | > 5% over 5 min | Auto-rollback |
| Latency P99 | > 2s sustained | Scale up + alert |
| Memory leak | +10% / hour linear trend | Restart pods |
| Traffic anomaly | > 3σ from baseline | Enable WAF rules |

---

## Edge Computing (2026)

### Cloudflare Workers

```typescript
// workers/api.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Edge-side caching with KV
    const cached = await env.CACHE_KV.get(url.pathname);
    if (cached) {
      return new Response(cached, {
        headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    // Forward to origin
    const response = await fetch(`${env.ORIGIN_URL}${url.pathname}`, request);
    const body = await response.text();

    // Cache at edge for 60s
    await env.CACHE_KV.put(url.pathname, body, { expirationTtl: 60 });

    return new Response(body, {
      headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  },
};
```

### Vercel Edge Functions

```typescript
// app/api/edge-data/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const geo = request.geo;
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 30 },  // ISR at edge
  });
  return Response.json({
    data: await data.json(),
    region: geo?.region,
    latency: "< 50ms",
  });
}
```

### Deno Deploy

```typescript
// main.ts — deploy with: deployctl deploy --project=my-app main.ts
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (url.pathname === "/api/health") {
    return Response.json({ status: "ok", region: Deno.env.get("DENO_REGION") });
  }
  return new Response("Not Found", { status: 404 });
});
```

### Edge Strategy Decision Matrix

| Factor | Cloudflare Workers | Vercel Edge | Deno Deploy |
|--------|-------------------|-------------|-------------|
| Cold start | ~0ms | ~5ms | ~5ms |
| Runtime | V8 isolates | V8 isolates | V8 + Deno APIs |
| KV storage | Workers KV | Vercel KV | Deno KV |
| Best for | CDN + API proxy | Next.js apps | Standalone APIs |

---

## Security Pipeline (2026)

### SAST — Semgrep

```yaml
# .github/workflows/security.yml
security-sast:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/owasp-top-ten
          p/typescript
          p/react
          p/nodejs
        generateSarif: true
    - uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: semgrep.sarif
```

### DAST — OWASP ZAP

```yaml
security-dast:
  runs-on: ubuntu-latest
  needs: deploy-staging
  steps:
    - uses: zaproxy/action-full-scan@v0.10
      with:
        target: ${{ env.STAGING_URL }}
        rules_file_name: ".zap/rules.tsv"
        fail_action: true
```

### Secret Scanning — TruffleHog

```yaml
secret-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: trufflesecurity/trufflehog@main
      with:
        extra_args: --only-verified --results=verified
```

### SBOM Generation — Syft

```yaml
sbom:
  runs-on: ubuntu-latest
  steps:
    - uses: anchore/sbom-action@v0
      with:
        image: ${{ env.REGISTRY }}/app:${{ github.sha }}
        format: spdx-json
        output-file: sbom.spdx.json
    - uses: anchore/scan-action@v4
      with:
        sbom: sbom.spdx.json
        fail-build: true
        severity-cutoff: high
```

### Security Pipeline Summary

| Tool | Type | What It Catches |
|------|------|----------------|
| Semgrep | SAST | Code vulnerabilities, injection, XSS |
| OWASP ZAP | DAST | Runtime vulnerabilities, auth bypass |
| TruffleHog | Secrets | API keys, tokens, credentials in code |
| Syft + Grype | SBOM/SCA | Vulnerable dependencies, license issues |

---

## ArgoCD GitOps (V3.0)

### Setup

```yaml
# k8s/argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo
    targetRevision: main
    path: k8s/
    helm:
      valueFiles:
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 3
      backoff:
        duration: 5s
        factor: 2
```

### Progressive Delivery

```yaml
# k8s/argocd/rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 30
        - pause: { duration: 5m }
        - setWeight: 60
        - pause: { duration: 5m }
        - setWeight: 100
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
```

---

## Keda Autoscaling (V3.0)

### CPU + Custom Metrics

```yaml
# k8s/keda/scaledobject.yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: my-app-scaler
spec:
  scaleTargetRef:
    name: my-app
  minReplicaCount: 2
  maxReplicaCount: 50
  triggers:
    - type: cpu
      metadata:
        type: Utilization
        value: "70"
    - type: prometheus
      metadata:
        serverAddress: http://prometheus:9090
        metricName: http_requests_per_second
        query: sum(rate(http_requests_total{app="my-app"}[2m]))
        threshold: "100"
    - type: rabbitmq
      metadata:
        queueName: tasks
        queueLength: "50"
```

---

## OpenTelemetry + Grafana Dashboards (V3.0)

### Full-Stack Instrumentation

```typescript
// infra/observability/otel.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({ [ATTR_SERVICE_NAME]: "my-app" }),
  traceExporter: new OTLPTraceExporter({ url: "http://otel-collector:4318/v1/traces" }),
  metricReader: new OTLPMetricExporter({ url: "http://otel-collector:4318/v1/metrics" }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Grafana Dashboard JSON (Key Panels)

```json
{
  "panels": [
    { "title": "Request Rate", "type": "timeseries", "query": "rate(http_requests_total[5m])" },
    { "title": "Error Rate", "type": "stat", "query": "rate(http_errors_total[5m]) / rate(http_requests_total[5m]) * 100" },
    { "title": "P95 Latency", "type": "gauge", "query": "histogram_quantile(0.95, rate(http_duration_seconds_bucket[5m]))" },
    { "title": "Active Pods", "type": "stat", "query": "kube_deployment_status_replicas{deployment='my-app'}" }
  ]
}
```

---

## AI Anomaly Detection (V3.0)

### Sentry + Datadog Integration

```typescript
// infra/ai-ops/anomaly-detector.ts
interface AnomalyConfig {
  metrics: {
    error_rate: { baseline: number; threshold_sigma: number };
    latency_p95: { baseline_ms: number; threshold_sigma: number };
    memory_usage: { max_percent: number; trend_window: string };
  };
  actions: {
    alert: string[];      // ["slack", "pagerduty"]
    auto_scale: boolean;
    auto_rollback: boolean;
  };
}

const config: AnomalyConfig = {
  metrics: {
    error_rate: { baseline: 0.01, threshold_sigma: 3 },
    latency_p95: { baseline_ms: 200, threshold_sigma: 2.5 },
    memory_usage: { max_percent: 85, trend_window: "1h" },
  },
  actions: {
    alert: ["slack", "pagerduty"],
    auto_scale: true,
    auto_rollback: true,
  },
};
```
