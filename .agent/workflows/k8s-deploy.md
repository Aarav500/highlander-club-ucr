---
description: "GitOps Kubernetes deployment with ArgoCD + KEDA autoscaling"
---

# Kubernetes Deploy Workflow

> Build → Push → ArgoCD sync → KEDA autoscale → Verify. Full GitOps K8s deployment pipeline.

---

## Architecture

```
  Developer Push            ArgoCD                    KEDA
  ─────────────────────────────────────────────────────────────
  git push main    →   ArgoCD detects drift   →   KEDA scales pods
       │                     │                          │
       ▼                     ▼                          ▼
  GitHub Actions       Sync Application          Scale 0→N based on
  builds image         (auto/manual)             HTTP traffic / metrics
       │                     │                          │
       ▼                     ▼                          ▼
  Push to GHCR/ECR     Deploy to cluster         Pods auto-adjust
```

---

## Prerequisites

1. Kubernetes cluster (EKS / GKE / AKS / k3s)
2. ArgoCD installed on the cluster
3. KEDA operator installed
4. Container registry (GHCR, ECR, or Docker Hub)
5. `kubectl` CLI configured

---

## Phase 1: Build & Push Container Image

1. **Build the Docker image:**
   ```bash
   docker build -t ghcr.io/<org>/<app>:$(git rev-parse --short HEAD) .
   docker push ghcr.io/<org>/<app>:$(git rev-parse --short HEAD)
   ```

2. **Update the image tag** in `infra/k8s/base-deployment.yaml`:
   ```yaml
   spec:
     containers:
       - name: app
         image: ghcr.io/<org>/<app>:<new-tag>
   ```

3. **Commit and push** the tag update (this triggers ArgoCD sync).

---

## Phase 2: ArgoCD Application Sync

1. **Verify ArgoCD application is registered:**
   ```bash
   argocd app get <app-name>
   ```

2. **Check sync status:**
   ```bash
   argocd app sync <app-name>
   argocd app wait <app-name> --health
   ```

3. **Monitor rollout:**
   ```bash
   kubectl rollout status deployment/<app-name> -n <namespace>
   ```

4. If sync fails:
   - Check `argocd app diff <app-name>` for manifest drift
   - Check pod logs: `kubectl logs -l app=<app-name> -n <namespace>`
   - Rollback: `argocd app rollback <app-name>`

---

## Phase 3: KEDA Autoscaling Verification

1. **Verify ScaledObject is active:**
   ```bash
   kubectl get scaledobject -n <namespace>
   kubectl describe scaledobject/<app-name>-scaler -n <namespace>
   ```

2. **Test scale-up** — send traffic burst:
   ```bash
   k6 run perf/load-test.js --vus 100 --duration 30s
   ```

3. **Observe pod scaling:**
   ```bash
   kubectl get pods -n <namespace> -w
   ```

4. **Verify scale-down** — wait for cooldown period, confirm pods scale to `minReplicaCount`.

---

## Phase 4: Health Verification

1. **Readiness probe:**
   ```bash
   kubectl exec -it deploy/<app-name> -n <namespace> -- curl localhost:3000/api/health
   ```

2. **External smoke test:**
   ```bash
   curl -s https://<app-domain>/api/health | jq .
   ```

3. **Check error rates** in monitoring (Datadog / Grafana / Dynatrace):
   - Error rate < 0.1% over 5 minutes
   - p99 latency < 500ms
   - No OOMKills or CrashLoopBackOff

4. **⏸️ STOP — Confirm deployment is healthy before marking complete.**

---

## Rollback Procedure

```bash
# Option 1: ArgoCD rollback
argocd app rollback <app-name>

# Option 2: kubectl rollback
kubectl rollout undo deployment/<app-name> -n <namespace>

# Option 3: Git revert (triggers new ArgoCD sync)
git revert HEAD
git push origin main
```

---

## Commands

```bash
# Deploy to K8s via GitOps
/k8s-deploy --app <app-name> --env production

# Dry-run (diff only, no sync)
/k8s-deploy --app <app-name> --dry-run

# Force sync (skip auto-sync wait)
/k8s-deploy --app <app-name> --force-sync

# Scale manually
/k8s-deploy --app <app-name> --scale 5

# Rollback to previous version
/k8s-deploy --app <app-name> --rollback
```
