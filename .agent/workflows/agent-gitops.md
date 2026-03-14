---
description: "Agent-driven GitOps with ArgoCD + Flux v2 dual-controller setup"
---

# Agent-Driven GitOps Workflow

> AI agents propose infrastructure changes as PRs. ArgoCD + Flux v2 reconcile desired state automatically.

---

## Architecture

```
  Agent Proposes Change       Git Repository            Cluster
  ───────────────────────────────────────────────────────────────
  /swarm-v2 deploys    →   PR to infra/ branch   →   ArgoCD syncs
  /ai-ops heals        →   Commit fix to main    →   Flux reconciles
  /k8s-deploy scales   →   Update manifests      →   KEDA adjusts
```

---

## Dual Controller Setup

| Controller | Scope | Responsibility |
|------------|-------|---------------|
| ArgoCD | Application deployments | Syncs app manifests from `infra/k8s/` |
| Flux v2 | Infrastructure + policies | Manages cluster add-ons, policies, CRDs |

### Why Both?
- **ArgoCD:** Best UI, app-centric, great for developers
- **Flux v2:** Best for platform teams, GitOps toolkit, Kustomize-native

---

## Agent GitOps Rules

1. **All changes via PR** — agents never push directly to main for infra.
2. **Manifests in Git** — desired state lives in `infra/k8s/`.
3. **Drift detection** — ArgoCD alerts if cluster differs from Git.
4. **Auto-reconciliation** — Flux v2 auto-applies within 5 minutes.
5. **Rollback via revert** — `git revert` triggers automatic rollback.

---

## Flux v2 Configuration

```yaml
# flux-system/gotk-sync.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: lab-infra
  namespace: flux-system
spec:
  interval: 5m
  url: https://github.com/<org>/<repo>
  ref:
    branch: main

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: lab-infra
  namespace: flux-system
spec:
  interval: 5m
  sourceRef:
    kind: GitRepository
    name: lab-infra
  path: ./infra/k8s
  prune: true
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: lab-app
      namespace: lab-production
```

---

## Agent Deployment Flow

```
1. Agent identifies need (new deploy, scale change, config update)
2. Agent modifies manifests in infra/k8s/
3. Agent creates PR with changes
4. CI validates manifests (kubeval, kustomize build)
5. PR merged (auto or manual approval)
6. ArgoCD detects change → syncs to cluster
7. Flux reconciles add-ons and policies
8. Agent verifies deployment health
```

---

## Multi-Cluster Support

```yaml
clusters:
  - name: production
    context: arn:aws:eks:us-east-1:123456789:cluster/prod
    argocd: true
    flux: true

  - name: staging
    context: arn:aws:eks:us-east-1:123456789:cluster/staging
    argocd: true
    flux: true

  - name: dev
    context: minikube
    argocd: false
    flux: false
```

---

## Commands

```bash
/agent-gitops --setup                    # Install ArgoCD + Flux v2
/agent-gitops --deploy --app lab-app     # Agent-driven deployment
/agent-gitops --drift-check              # Check for cluster drift
/agent-gitops --reconcile                # Force reconciliation
/agent-gitops --rollback --app lab-app   # Rollback via git revert
```
