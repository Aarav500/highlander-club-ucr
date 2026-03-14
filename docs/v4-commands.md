# Lab V4.0 Master Command Reference

> All V4.0 workflows accessible via slash commands. Run from the repo root.

---

## Quick Start — Top 5

```bash
# 1. Launch 15-agent swarm build
/swarm-v2 --agents 15 --parallel --task "build quant trading platform"

# 2. Deploy to Kubernetes
/k8s-deploy --app my-app --env production

# 3. Upgrade to Next.js 16
/next16-upgrade --app web

# 4. Auto-publish to arXiv
/arxiv-bot --venue neurips2026 --topic "novel attention mechanism"

# 5. Set up local LLMs
/local-llm --setup
```

---

## Full Command Reference

| Command | What it Does | Example |
|---------|-------------|---------|
| `/swarm-v2` | 15-agent parallel build | `/swarm-v2 --task "quant app"` |
| `/k8s-deploy` | GitOps K8s deployment | `/k8s-deploy --app dashboard` |
| `/next16-upgrade` | Next.js 15 → 16 migration | `/next16-upgrade --app web` |
| `/arxiv-bot` | Paper → arXiv submission | `/arxiv-bot --venue neurips2026 --topic "RL trading"` |
| `/local-llm` | Local LLM inference setup | `/local-llm --setup` |
| `/multimodal` | Vision/Audio/Video → code/tickets | `/multimodal --vision --input diagram.png` |
| `/ide-agents` | Sync IDE configs | `/ide-agents --all` |
| `/compliance-engine` | SOC2/HIPAA/GDPR scanning | `/compliance-engine --scan --soc2` |
| `/algo-factory` | Novel algo + formal proof | `/algo-factory --problem "sorting" --prove` |
| `/citation-engine` | Literature search + BibTeX | `/citation-engine --search "transformers"` |
| `/cross-platform` | Flutter + Tauri scaffold | `/cross-platform --init --name my-app` |
| `/pwa-engine` | PWA + TWA for Google Play | `/pwa-engine --full` |
| `/ai-ops` | Auto root-cause + self-healing | `/ai-ops --enable` |
| `/sbom-security` | SBOM + vulnerability scan | `/sbom-security --scan` |
| `/agent-gitops` | ArgoCD + Flux v2 GitOps | `/agent-gitops --deploy --app my-app` |

---

## File Map

```
.agent/workflows/
  swarm-v2.md            ← 15-agent LangGraph swarm
  k8s-deploy.md          ← GitOps K8s deployment
  next16-upgrade.md      ← Next.js 16 migration
  arxiv-bot.md           ← ArXiv auto-publish
  local-llm.md           ← Ollama + vLLM + NIM
  multimodal-agents.md   ← Vision/Audio/Video pipelines
  ide-agents.md          ← Zed + Cursor + Replit sync
  compliance-engine.md   ← SOC2/HIPAA/GDPR scanner
  algo-factory.md        ← Novel algo + Lean 4 proofs
  citation-engine.md     ← Semantic Scholar + BibTeX
  cross-platform.md      ← Flutter 4.0 + Tauri v2
  pwa-engine.md          ← Workbox + TWA
  ai-ops.md              ← Auto root-cause + self-healing
  sbom-security.md       ← Trivy + Syft scanning
  agent-gitops.md        ← ArgoCD + Flux v2

infra/
  k8s/
    argocd-app.yaml        ← ArgoCD Application manifest
    keda-scaledobject.yaml ← KEDA autoscaler config
    base-deployment.yaml   ← K8s Deployment + Service + Ingress
    kustomization.yaml     ← Kustomize base config
  local-inference/
    docker-compose.yaml    ← Ollama + vLLM + NIM containers
    models.yaml            ← Model registry
    router-config.yaml     ← Task → model routing

research/templates/venues/
  neurips2026.yaml         ← NeurIPS 2026 venue config
  icml2026.yaml            ← ICML 2026 venue config
  isca2026.yaml            ← ISCA 2026 venue config
  venue-schema.yaml        ← Template for adding venues
  venue-templates.md       ← 50+ venue template index

governance/compliance/
  soc2-controls.yaml       ← SOC2 Type II controls
  hipaa-safeguards.yaml    ← HIPAA technical safeguards
  gdpr-checklist.yaml      ← GDPR Articles 25 & 32

security/sbom/
  trivy-config.yaml        ← Trivy scanner config
  sbom-policy.yaml         ← License + vulnerability policy
```

---

## Phase Roadmap

| Phase | Timeline | Items |
|-------|----------|-------|
| **1 — Immediate** | Now | Swarm v2, K8s, Next.js 16, ArXiv Bot, Local LLMs |
| **2 — Core** | Next month | Multi-Modal Agents, IDE Integration, Compliance |
| **3 — Research** | Q2 2026 | Algo Factory, Multi-Venue Publishing, Citations |
| **4 — Cross-Platform** | Q3 2026 | Flutter 4.0 + Tauri v2, PWA + TWA |
| **5 — Enterprise** | Q4 2026 | AI-Ops, SBOM Security, Agent GitOps |
