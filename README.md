# Fullstack Template — V2.0

An **enterprise-grade AI Production & Research Lab** — spec-driven, plan-first, with integrated workflows for deployment, frontend, APIs, research, mobile, and code quality.

## Stack

| Layer | Technology |
|-------|-----------:|
| **Frontend** | Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion |
| **API** | tRPC + Zod (end-to-end type-safe) · NextAuth / Clerk |
| **Database** | PostgreSQL · Prisma / Drizzle · Amazon S3 |
| **Mobile** | React Native · Expo · EAS Build · PWA (Workbox) |
| **Infra** | Docker · GitHub Actions CI/CD · Vercel preview · EC2 production |
| **Monitoring** | Sentry · OpenTelemetry · Structured JSON logs |
| **AI Workflow** | Antigravity agents · Claude Code · Spec → Plan → Code → Verify loop |

---

## Quick Start

```bash
# Install root dependencies
npm install

# Create a new app from an idea:
# Run the /new-app-from-idea workflow in Antigravity
```

---

## Folder Layout

```
fullstack-template/
  apps/                       # Per-app code (Next.js, React Native, etc.)
  .agent/
    capabilities/             # What the lab can do (7 reference docs)
      deployment-mastery.md   #   Docker, CI/CD, Vercel, monitoring, rollbacks
      frontend-production.md  #   shadcn/ui, Tailwind, Framer, charts, forms, auth
      api-enterprise.md       #   tRPC, Zod, rate limiting, OpenAPI, streaming
      research-papers.md      #   LaTeX, auto-cite, stats, arXiv
      algorithms-research.md  #   ML, quant finance, crypto, novel algos
      mobile-apps.md          #   React Native, Expo, push, offline, PWA
      code-audit.md           #   ESLint, Biome, Vitest, Playwright, Snyk
    workflows/                # Step-by-step agent workflows (22 total)
      prod-deploy.md          #   Docker → CI/CD → Vercel → monitoring → rollback
      ui-system.md            #   shadcn + Tailwind + glassmorphism + Framer
      api-trpc.md             #   tRPC + auth + OpenAPI + streaming
      research-paper.md       #   LaTeX → literature → experiments → arXiv
      mobile-app.md           #   Expo → screens → push → EAS → App Store
      code-audit-fix.md       #   Lint → type-check → test → security → fix PR
      new-production-app.md   #   End-to-end app from spec to deploy-ready
      new-app-from-idea.md    #   Idea → spec → plan → code
      ...                     #   + 14 more specialized workflows
  infra/                      # EC2 provisioning, deploy scripts
  platform/                   # Shared modules (auth, UI kit stubs)
  billing/                    # Stripe checkout, usage metering
  distribution/               # SEO, viral loops, landing page gen
  specs/                      # Per-app specification files
  plans/                      # Per-app implementation plans
  research/                   # Research outputs and papers
  observability/              # Logging schema, metrics
  governance/                 # Enterprise rules and audit config
  labs-config.yaml            # App registry
```

---

## Capabilities

The lab has **7 capability areas**, each documented in `.agent/capabilities/`:

| Capability | Covers |
|-----------|--------|
| **Deployment Mastery** | Docker multi-stage builds, zero-downtime, CI/CD, Vercel, Sentry, rollbacks |
| **Frontend Production** | shadcn/ui, Tailwind glassmorphism, Framer Motion, Recharts/D3/Three.js, RHF+Zod forms, NextAuth/Clerk |
| **API Enterprise** | tRPC+Zod type-safe APIs, rate limiting, auth middleware, OpenAPI auto-docs, streaming |
| **Research Papers** | ACM/IEEE/NeurIPS/ICML LaTeX templates, auto-citations, reproducible figures, arXiv submission |
| **Algorithms & Research** | PyTorch/TensorFlow (attention, diffusion, RL), Black-Scholes/Monte Carlo/Greeks, ZK proofs |
| **Mobile Apps** | React Native + Expo + EAS Build, push notifications, offline sync, PWA |
| **Code Audit** | ESLint/Biome/TS strict, Vitest/Playwright/MSW, Snyk/OWASP ZAP, auto-fix PRs |

---

## Workflows

Run any workflow via Antigravity's `/` commands:

| Workflow | Purpose |
|----------|---------|
| `/prod-deploy` | Docker + CI/CD + Vercel + monitoring + rollback |
| `/ui-system` | shadcn + glassmorphism design system |
| `/api-trpc` | tRPC + Zod + auth + OpenAPI |
| `/research-paper` | ACM/IEEE paper → arXiv |
| `/mobile-app` | React Native + Expo → App Store |
| `/code-audit-fix` | Full scan + auto-fix PR |
| `/new-production-app` | Spec → code → deploy-ready |
| `/new-app-from-idea` | Idea → spec → plan → code |
| `/security-scan` | OWASP Top 10 review |
| `/self-review` | Multi-agent code review |

See `.agent/workflows/` for the full list.

---

## Personas

| Persona | Expertise | Key Workflows |
|---------|-----------|---------------|
| **Deploy Master** | Docker, GitHub Actions, Vercel, zero-downtime | `/prod-deploy` |
| **UI Architect** | shadcn/ui, Framer Motion, Three.js, glassmorphism | `/ui-system` |
| **Research Fellow** | ACM/IEEE papers, novel algorithms, math proofs | `/research-paper` |
| **Mobile Dev** | React Native, Expo, EAS, App Store | `/mobile-app` |
| **Quant Engineer** | Finance algorithms, cryptography, ML research | `/new-app-from-idea` |

---

## AI Orchestration

Three AI systems work together:

- **Antigravity** — multi-agent workflows: production lab, research lab, security, ops.
- **Claude Code** — focused coding, refactors, TDD, code reviews.
- **Amazon Q** — top-level orchestrator managing the AI-DLC lifecycle.

---

## Scaling

This template supports two patterns:

**Clone-per-app** — fork for each product. Each clone gets its own spec, CI/CD, and deploy target.

**Portfolio repo** — maintain `labs-config.yaml` as a registry tracking all apps, their status, and deploy targets.

---

## Deployment

Push to `main` → GitHub Actions runs lint, test, e2e, security → Docker build → deploy to EC2/Vercel.

See `.agent/workflows/prod-deploy.md` for the full pipeline.

---

## License

Private — not for redistribution.
