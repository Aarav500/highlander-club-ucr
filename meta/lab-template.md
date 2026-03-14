# Lab Template

Use this template when creating a **new lab repo** — a variant of `fullstack-template` tailored for a different domain or tech stack.

## Fields

Fill in each section to define the new lab's identity.

---

### Lab Name

> Short kebab-case identifier (e.g., `ml-research-lab`, `mobile-app-lab`, `data-pipeline-lab`).

### Description

> One paragraph explaining the lab's purpose and target use case.

### Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | _(e.g., Next.js, React Native, Streamlit, none)_ | |
| **Backend** | _(e.g., FastAPI, Express, Go, none)_ | |
| **Database** | _(e.g., PostgreSQL, MongoDB, DuckDB, none)_ | |
| **ML / Data** | _(e.g., PyTorch, TensorFlow, Spark, none)_ | |
| **Infra** | _(e.g., GitHub Actions → AWS, Vercel, GCP, k8s)_ | |
| **AI Workflow** | _(e.g., Claude Code + Antigravity, Cursor, Copilot)_ | |

### Folder Layout

```
<lab-name>/
  apps/                   # Application code
    <app-dirs>/
  infra/                  # Deploy scripts, IaC, CI/CD
  docs/
    CODEMAPS/             # Architecture maps
    decisions/            # Decision records
    reflections/          # Session reflections
  specs/                  # Spec documents
  plans/                  # Implementation plans
  prompts/                # AI prompts for each stage
  platform/               # Shared modules (if applicable)
  analytics/              # Analytics schema & queries (if applicable)
  perf/                   # Performance test scripts (if applicable)
  .agent/workflows/       # Antigravity agent workflows
  .github/workflows/      # CI/CD pipelines
  CLAUDE.md               # Master AI context
  README.md               # Human-facing docs
  labs-config.yaml        # App registry (if multi-app)
```

> Adjust this layout for the lab's domain. Not all directories are required — include only what makes sense.

### Workflows

List the workflows this lab should ship with:

| Workflow | Purpose | Based On |
|----------|---------|----------|
| `new-app-from-idea` | Spec → plan → implement → verify | `fullstack-template` original |
| `security-scan` | OWASP/dependency audit | `fullstack-template` original |
| _(add domain-specific)_ | _(description)_ | _(new or adapted)_ |

### Rules

List the key rules that govern agent behavior in this lab:

1. **Folder discipline** — agents respect the layout defined above.
2. **Spec-driven** — every feature traces to a spec.
3. **Plan-first** — implementation starts with an approved plan.
4. **Review gates** — stop for human review at spec, plan, backend, frontend, CI milestones.
5. _(add domain-specific rules, e.g., "all models must have evaluation metrics", "no raw SQL in application code")_

### Target Use Case

> Describe who will use this lab and for what:
> - **Team:** _(e.g., ML engineers, mobile devs, data analysts)_
> - **Primary workflow:** _(e.g., train models → evaluate → deploy, build iOS/Android apps, create ETL pipelines)_
> - **Delivery target:** _(e.g., API endpoint, mobile app store, data warehouse, research paper)_

### Quality Bars

List the minimum quality gates for this lab:

- [ ] _(e.g., all models pass accuracy threshold before deploy)_
- [ ] _(e.g., app builds on both iOS and Android)_
- [ ] _(e.g., pipeline passes data validation checks)_
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Security scan clean

### Inherited from fullstack-template

Check which components to carry over from the parent template:

- [ ] Decision docs (`docs/decisions/`)
- [ ] Session reflections (`docs/reflections/`)
- [ ] Codemaps (`docs/CODEMAPS/`)
- [ ] Analytics harness (`analytics/`)
- [ ] Performance testing (`perf/`)
- [ ] Platform modules (`platform/`)
- [ ] Secrets scanning (`.github/workflows/secrets-scan.yml`)
- [ ] Labs config (`labs-config.yaml`)
