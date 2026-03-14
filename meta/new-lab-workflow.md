---
description: Generate a new lab repo scaffold from a description of the lab type
---

# New Lab Workflow

Create a complete repo scaffold for a new lab — a variant of `fullstack-template` tailored for a different domain, tech stack, or team.

> **This workflow generates a directory structure and starter files.** It does not push to GitHub or deploy anything.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `lab_name` | ✅ | Kebab-case name for the new lab (e.g., `ml-research-lab`) |
| `description` | ✅ | One- or two-sentence description of the lab's purpose |
| `stack_hints` | Optional | Preferred technologies (e.g., "Python, FastAPI, PyTorch, GCP") |

---

## Steps

### 1 — Fill the Lab Template

1. Read `meta/lab-template.md`.
2. Based on `description` and `stack_hints`, fill in every section of the template:
   - **Stack** — choose technologies appropriate to the domain.
   - **Folder Layout** — adapt the default layout (remove irrelevant dirs, add domain-specific ones).
   - **Workflows** — decide which `fullstack-template` workflows to carry over and what new ones are needed.
   - **Rules** — inherit core rules (spec-driven, plan-first, review gates) and add domain-specific rules.
   - **Quality Bars** — define the minimum gates for this lab type.
   - **Inherited Components** — check off which parent-template components to include.
3. Save the filled template as an artifact for review.

**⏸️ STOP — Present the filled template to the user for review and approval.**

### 2 — Generate the Scaffold

Once approved, create the directory structure:

1. Create the root directory named `<lab_name>/`.
2. Generate all directories from the approved folder layout.
3. Create starter files:

   | File | Content |
   |------|---------|
   | `README.md` | Lab name, description, stack table, getting started, folder layout |
   | `CLAUDE.md` | Master AI context adapted from `fullstack-template/CLAUDE.md` — stack, conventions, work phases, quality bars, agent roles (all tailored to the new stack) |
   | `.gitignore` | Standard ignores for the lab's stack (node_modules, __pycache__, .env, etc.) |
   | `spec-template.md` | Copy from `fullstack-template` (universal format) |
   | `.agent/workflows/*.md` | Selected workflows from Step 1, adapted for the new stack |
   | `.antigravity/rules.md` | Rules from Step 1 |
   | `.github/workflows/*.yml` | CI/CD pipelines appropriate to the stack |

4. For inherited components (checked in Step 1):
   - Copy and adapt `docs/decisions/README.md` + `template.md`.
   - Copy and adapt `analytics/schema-notes.md` if analytics is included.
   - Copy and adapt `perf/README.md` + test template if perf is included.
   - Copy and adapt `platform/README.md` if platform modules are included.
   - Copy and adapt `labs-config.yaml` if multi-app registry is included.

### 3 — Adapt AI Context

Tailor the generated `CLAUDE.md` for the new lab:

1. Update the **Stack & Architecture** table.
2. Update the **Folder Layout** diagram.
3. Adjust **Conventions** for the new language/framework (naming, imports, error handling).
4. Adjust **Work Phases** if the domain has different stages (e.g., ML labs may add TRAIN → EVALUATE phases).
5. Define **Agent Roles** appropriate to the stack:
   - E.g., for an ML lab: Data Agent, Training Agent, Evaluation Agent, Serving Agent.
   - E.g., for a mobile lab: iOS Agent, Android Agent, API Agent, QA Agent.
6. Update **Quality Bars** with domain-specific checklist items.

### 4 — Output

The scaffold is a local directory at `<lab_name>/`. Present a summary:

```markdown
## New Lab Scaffold: <lab_name>

**Description:** <description>

### Generated Structure
<tree output of the directory>

### Files Created
| File | Purpose |
|------|---------|
| README.md | Human-facing docs |
| CLAUDE.md | AI context |
| ... | ... |

### Next Steps
1. Initialize git: `cd <lab_name> && git init`
2. Create GitHub repo and push
3. Review and customize CLAUDE.md and rules
4. Start building!
```

**⏸️ STOP — Present the scaffold summary and ask the user to review the generated files.**

---

## Example Lab Types

| Lab Type | Stack Hints | Key Differences from fullstack-template |
|----------|-------------|----------------------------------------|
| ML Research Lab | Python, FastAPI, PyTorch, Jupyter, GCP | Adds `notebooks/`, `models/`, `data/` dirs; TRAIN/EVALUATE phases; model evaluation quality bars |
| Mobile App Lab | React Native, Expo, Express, Firebase | Replaces `apps/web/` with `apps/mobile/`; adds app store deploy workflow; device testing gates |
| Data Pipeline Lab | Python, dbt, Airflow, BigQuery | Replaces frontend with `pipelines/`; adds data validation and lineage tracking |
| API-Only Lab | Go, gRPC, PostgreSQL, k8s | No frontend; adds proto/ for gRPC definitions; contract testing |
| Static Site Lab | Astro, MDX, Vercel | Minimal backend; content-focused quality bars; Lighthouse performance gates |
