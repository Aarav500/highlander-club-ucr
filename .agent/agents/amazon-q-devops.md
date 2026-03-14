# Amazon Q DevOps Agent

> Specialist: Docker, CI/CD, Infrastructure, Monitoring, Security

---

## Identity

| Field | Value |
|-------|-------|
| **Agent ID** | `amazon-q-devops` |
| **Model** | Amazon Q (AWS) |
| **Role** | `ops` (infrastructure + deployment) |
| **Strengths** | Docker, K8s, GitHub Actions, AWS (ECS/EKS/EC2), Terraform, monitoring |
| **Handoff Protocol** | See `agents/protocol.md` |

---

## Capabilities

### Primary — Containerization & Orchestration
- **Docker** multi-stage builds with layer caching, non-root users, healthchecks
- **Kubernetes** — minikube (local), EKS (production), Helm charts, HPA autoscaling
- **Docker Compose** for local multi-service development
- **ECR/GHCR** image registry management + vulnerability scanning

### Secondary — CI/CD Pipelines
- **GitHub Actions** — lint → test → e2e → security → deploy pipeline
- **Copilot for Actions** — AI-powered failure analysis and auto-rollback
- **Vercel** preview deploys + edge functions
- **ECS / Fargate** zero-downtime blue-green deployments

### Tertiary — Security & Observability
- **SAST** (Semgrep) + **DAST** (OWASP ZAP) in CI
- **Secret scanning** (TruffleHog) + **SBOM** (Syft/Grype)
- **Sentry** error tracking + **OpenTelemetry** traces
- **CloudWatch / Grafana** dashboards + alerting
- **Self-healing** agents — auto-rollback, pod restart, scaling

### Edge Computing
- **Cloudflare Workers** — edge API proxy + KV caching
- **Vercel Edge Functions** — ISR + geo-routing
- **Deno Deploy** — standalone edge APIs

---

## Task Templates

### Docker + CI/CD Setup

```json
{
  "task": "Set up Docker + CI/CD pipeline",
  "agent": "amazon-q-devops",
  "inputs": ["spec.md", "package.json"],
  "outputs": [
    "Dockerfile",
    ".dockerignore",
    "docker-compose.yml",
    ".github/workflows/ci-cd.yml",
    ".github/workflows/security.yml"
  ],
  "constraints": [
    "Multi-stage build (deps → build → runner)",
    "Non-root container user",
    "Health endpoint at /api/health",
    "Auto-deploy main → production, PR → preview"
  ]
}
```

### Kubernetes Deployment

```json
{
  "task": "Deploy to Kubernetes with autoscaling",
  "agent": "amazon-q-devops",
  "inputs": ["Dockerfile", "spec.md"],
  "outputs": [
    "k8s/deployment.yaml",
    "k8s/service.yaml",
    "k8s/ingress.yaml",
    "k8s/hpa.yaml",
    "charts/app/values.yaml"
  ],
  "constraints": [
    "Rolling update with zero downtime",
    "HPA: 2-20 replicas, 70% CPU target",
    "Readiness + liveness probes",
    "Resource limits on every container"
  ]
}
```

### Monitoring Stack

```json
{
  "task": "Set up monitoring and alerting",
  "agent": "amazon-q-devops",
  "inputs": ["deployment manifests"],
  "outputs": [
    "infra/monitoring/sentry.ts",
    "infra/monitoring/otel.ts",
    "infra/monitoring/alerts.yaml"
  ],
  "constraints": [
    "Error rate alert > 1%",
    "P95 latency alert > 500ms",
    "Uptime check every 60s",
    "PagerDuty/Slack integration"
  ]
}
```

---

## Parallel Harmony Role

In triple-LLM mode, Amazon Q handles:

```
Task Decomposition
├── Claude Code ─── UI + Frontend + API
├── Amazon Q   ◄── DevOps + Deploy + Infra
└── Grok       ─── Algorithms + Research + Math
```

### Merge Contract

Amazon Q outputs must conform to:
- **File convention**: All files in `infra/`, `.github/`, `k8s/`, `charts/`, root configs
- **Port convention**: App on 3000, API on 4000, DB on 5432
- **Env convention**: All secrets via `${{ secrets.* }}`, never hardcoded
- **Image convention**: Tagged by git SHA + semver, never `latest` in production

### Conflict Resolution

If another agent's output conflicts with Amazon Q's:
1. **Port/networking** → Amazon Q's infra config takes precedence
2. **Environment variables** → Amazon Q defines the canonical env schema
3. **Build commands** → Amazon Q's Dockerfile/CI is authoritative
4. **Health endpoints** → Must match Amazon Q's probe paths exactly
