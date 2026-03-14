---
description: "GitOps v2 — ArgoCD + Flux v2 + Keptn progressive delivery with canary analysis"
---

# GitOps v2 Workflow

> Dual-controller GitOps with ArgoCD (app delivery) + Flux v2 (infra sync) + Keptn (progressive delivery, canary analysis, automated rollback).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitOps v2 Stack                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│  ArgoCD v2.13   │  Flux v2        │  Keptn v2               │
│  App Delivery   │  Infra Sync     │  Progressive Delivery   │
├─────────────────┼─────────────────┼─────────────────────────┤
│ App-of-Apps     │ Kustomize       │ Canary Analysis         │
│ ApplicationSet  │ HelmRelease     │ Blue-Green Deploy       │
│ Sync Waves      │ GitRepository   │ Feature Flags           │
│ Health Checks   │ ImagePolicy     │ SLO-based Rollback      │
└─────────────────┴─────────────────┴─────────────────────────┘
         │                 │                    │
         └────────────┬────┘                    │
                      ▼                         ▼
              ┌───────────────┐        ┌────────────────┐
              │  Git Source    │        │  Observability │
              │  of Truth     │        │  Prometheus    │
              │  (GitHub)     │        │  Grafana       │
              └───────────────┘        └────────────────┘
```

---

## What's New in v2 (vs agent-gitops)

| Feature | v1 (agent-gitops) | v2 |
|---------|-------------------|----|
| Controllers | ArgoCD + Flux | ArgoCD + Flux + **Keptn** |
| Delivery | Sync only | **Progressive delivery** (canary, blue-green) |
| Rollback | Manual | **SLO-based automated rollback** |
| Analysis | None | **Canary analysis with Prometheus metrics** |
| Image updates | Manual | **Flux ImagePolicy auto-update** |

---

## Step 1: ArgoCD Application Delivery

```yaml
# infra/k8s/argocd/app-of-apps.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: lab-apps
  namespace: argocd
spec:
  goTemplate: true
  generators:
    - git:
        repoURL: https://github.com/org/fullstack-template
        revision: main
        directories:
          - path: "infra/k8s/apps/*"
  template:
    metadata:
      name: "{{.path.basename}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/org/fullstack-template
        targetRevision: main
        path: "{{.path.path}}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{.path.basename}}"
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
            maxDuration: 3m
```

---

## Step 2: Flux v2 Infrastructure Sync

```yaml
# infra/k8s/flux/git-repository.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: fullstack-template
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/org/fullstack-template
  ref:
    branch: main
  secretRef:
    name: github-token

---
# Auto-update images when new versions are pushed
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: web-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: web-app
  policy:
    semver:
      range: ">=1.0.0"
  filterTags:
    pattern: '^v(?P<version>[0-9]+\.[0-9]+\.[0-9]+)$'
    extract: '$version'
```

---

## Step 3: Keptn Progressive Delivery

```yaml
# infra/k8s/keptn/canary-analysis.yaml
apiVersion: lifecycle.keptn.sh/v1
kind: KeptnAppContext
metadata:
  name: web-app
  namespace: production
spec:
  metadata:
    commitID: "${GIT_SHA}"

---
apiVersion: lifecycle.keptn.sh/v1
kind: KeptnEvaluationDefinition
metadata:
  name: canary-health
  namespace: production
spec:
  objectives:
    - keptnMetricRef:
        name: error-rate
        namespace: production
      evaluationTarget: "<0.01"    # <1% error rate
    - keptnMetricRef:
        name: p99-latency
        namespace: production
      evaluationTarget: "<500"     # <500ms p99
    - keptnMetricRef:
        name: success-rate
        namespace: production
      evaluationTarget: ">0.99"   # >99% success

---
apiVersion: lifecycle.keptn.sh/v1
kind: KeptnMetric
metadata:
  name: error-rate
  namespace: production
spec:
  provider:
    name: prometheus
  query: |
    sum(rate(http_requests_total{status=~"5..",app="web-app-canary"}[5m]))
    /
    sum(rate(http_requests_total{app="web-app-canary"}[5m]))
  fetchIntervalSeconds: 30
```

### Canary Rollout Strategy

```yaml
# infra/k8s/keptn/canary-rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: web-app
spec:
  strategy:
    canary:
      canaryService: web-app-canary
      stableService: web-app-stable
      trafficRouting:
        istio:
          virtualServices:
            - name: web-app-vsvc
              routes:
                - primary
      steps:
        - setWeight: 5        # 5% traffic
        - pause: { duration: 2m }
        - analysis:
            templates:
              - templateName: canary-health
        - setWeight: 25       # 25% traffic
        - pause: { duration: 5m }
        - analysis:
            templates:
              - templateName: canary-health
        - setWeight: 50       # 50% traffic
        - pause: { duration: 5m }
        - analysis:
            templates:
              - templateName: canary-health
        - setWeight: 100      # Full rollout
      rollbackWindow:
        revisions: 2
```

---

## Step 4: SLO-Based Automated Rollback

```yaml
# infra/k8s/keptn/slo.yaml
apiVersion: lifecycle.keptn.sh/v1
kind: KeptnEvaluationDefinition
metadata:
  name: deployment-slos
spec:
  retries: 3
  retryInterval: 30s
  objectives:
    - keptnMetricRef:
        name: availability
      evaluationTarget: ">0.999"   # 99.9% availability SLO
      weight: 3
    - keptnMetricRef:
        name: p99-latency
      evaluationTarget: "<300"     # 300ms p99 SLO
      weight: 2
    - keptnMetricRef:
        name: error-budget
      evaluationTarget: ">0"      # Error budget not exhausted
      weight: 3
  totalScore:
    pass: "90%"
    warning: "75%"
```

---

## Deployment SLOs

| SLO | Target | Measurement | Action on Breach |
|-----|--------|-------------|------------------|
| Availability | 99.9% | `up` metric over 5m window | Auto-rollback |
| p99 Latency | <300ms | Prometheus histogram | Pause canary |
| Error Rate | <1% | 5xx/total over 5m window | Auto-rollback |
| Error Budget | >0 remaining | Monthly budget tracking | Block deploys |

---

## Commands

```bash
# Deploy with canary analysis
/gitops-v2 --deploy --app web-app --strategy canary

# Blue-green deployment
/gitops-v2 --deploy --app api-node --strategy blue-green

# Check deployment status
/gitops-v2 --status --app web-app

# Force rollback
/gitops-v2 --rollback --app web-app --revision 2

# Sync all ArgoCD apps
/gitops-v2 --sync --all

# View Keptn evaluation results
/gitops-v2 --evaluation --app web-app --last 5

# Setup from scratch
/gitops-v2 --setup --argocd --flux --keptn --cluster production
```
