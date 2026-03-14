---
description: Generate a new lab repo scaffold from a lab name and use case description
---

# Meta: New Lab Workflow

Create a new lab repo — a variant of `fullstack-template` tailored for a different domain, tech stack, or team.

> **Model tier:** Tier 2 (Standard)

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `lab_name` | ✅ | Kebab-case name (e.g., `ml-research-lab`, `mobile-app-lab`) |
| `use_case` | ✅ | One- or two-sentence description of who uses this lab and for what |
| `stack_hints` | Optional | Preferred technologies (e.g., "Python, FastAPI, PyTorch, GCP") |

## Steps

### 1 — Read the Template

1. Read `meta/lab-template.md` to understand all required sections.
2. Read `meta/new-lab-workflow.md` for the full generation process.

### 2 — Fill the Template

Based on the `use_case` and `stack_hints`, fill in every section of `meta/lab-template.md`:

- **Lab Name** — use `lab_name`.
- **Description** — expand `use_case` into a clear paragraph.
- **Stack** — choose technologies appropriate to the domain.
- **Folder Layout** — adapt the default layout (remove irrelevant dirs, add domain-specific ones).
- **Workflows** — decide which `fullstack-template` workflows to carry over and what new ones are needed.
- **Rules** — inherit core rules (spec-driven, plan-first, review gates) and add domain-specific rules.
- **Quality Bars** — define minimum gates for this lab type.
- **Inherited Components** — check off which parent-template components to include.

**⏸️ STOP — Present the filled template to the user for review and approval.**

### 3 — Generate the Scaffold

Once approved, follow the steps in `meta/new-lab-workflow.md`:

1. Create the root directory `<lab_name>/`.
2. Generate all directories from the approved folder layout.
3. Create starter files: `README.md`, `CLAUDE.md`, `.gitignore`, `spec-template.md`, workflows, rules, CI/CD.
4. For inherited components, copy and adapt from `fullstack-template`.
5. Tailor `CLAUDE.md` for the new lab's stack, conventions, agent roles, and quality bars.

### 4 — Output Scaffold Artifact

Produce a summary artifact:

```
## New Lab Scaffold: <lab_name>

**Description:** <description>

### Generated Structure
<tree output>

### Files Created
| File | Purpose |
|------|---------|
| README.md | Human-facing docs |
| CLAUDE.md | AI context |
| ... | ... |

### Next Steps
1. git init && push to GitHub
2. Review and customize CLAUDE.md
3. Start building!
```

**⏸️ STOP — Present the scaffold summary and ask the user to review the generated files.**
