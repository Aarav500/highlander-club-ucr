---
description: "Research Director – deep research on a frontier topic, translated into an actionable product spec"
model_tier: 1  # Tier 1 (Opus) — deep research and architecture
---

# Research Director Workflow

> Takes a frontier idea, runs structured deep research, and produces a
> production-ready spec that the AI Production Lab can implement.
>
> **Scope:** READ + WRITE to `research/` and `specs/` only.
> Does NOT touch application code (`apps/`), infrastructure, or CI/CD.

---

## Inputs

| Input | Description |
|-------|-------------|
| `topic` | Short idea, e.g. *"NVIDIA 6G space compute fabric"* |

## Outputs

| Artifact | Location |
|----------|----------|
| Full research report | `research/reports/<slug>-research.md` |
| Implementation-ready spec | `specs/<slug>-spec.md` |

---

## Phase A — Clarify

**Goal:** Turn the raw `topic` into structured research questions.

### Steps

1. Break the topic into four question categories, using
   `research/templates/00-research-question.md` as a guide:
   - **Technical** — What technologies, standards, or protocols are involved?
     What is proven vs. speculative?
   - **Economic** — Market size, business models, unit economics?
   - **Regulatory / Policy** — Spectrum, export controls, licensing, compliance?
   - **Product** — What user problems does this solve? Who is the first
     customer? What is the minimum viable product?

2. Write the questions into the report draft:
   `research/reports/<slug>-research.md` → **§ Research Questions**.

3. Optionally save a standalone copy to
   `research/notes/<slug>-questions.md` for quick reference.

> No STOP here — questions are refined during the next phase.

---

## Phase B — Landscape

**Goal:** Map the competitive and technical terrain.

### Steps

1. Research the topic using available tools (web search, documentation,
   papers, announcements).

2. Populate the report's **§ Landscape** section using
   `research/templates/01-landscape.md` as a guide:
   - **Key Players** — companies, agencies, consortia, open-source projects.
   - **Key Technologies** — standards, chips, protocols, satellites, SDKs.
   - **Open Problems & Constraints** — unsolved challenges, physical limits,
     cost barriers, regulatory gaps.
   - **Sources** — links and references.

3. Update the report: `research/reports/<slug>-research.md`.

### ⏸️ STOP — Present the Landscape section to the human for feedback and direction before continuing.

---

## Phase C — Feasibility

**Goal:** Determine what can realistically be built with the current stack.

### Steps

1. Map the topic's needs against the repo's stack, using
   `research/templates/02-feasibility.md` as a guide:

   | Capability | Stack Component |
   |------------|----------------|
   | Web UI / Dashboard | Next.js + Tailwind + Framer Motion |
   | REST API | Express + Node.js |
   | Data Storage | PostgreSQL |
   | File / Blob Storage | Amazon S3 |
   | Deployment | EC2 + GitHub Actions |

2. Identify **1–3 concrete v1 product ideas** that are buildable now.
   For each idea, document:
   - What it does (one sentence).
   - Target user.
   - Technical feasibility (High / Medium / Low).
   - Biggest unknowns.

3. Recommend which idea should proceed to spec.

4. Append **§ Feasibility** to the report.

### ⏸️ STOP — Present Feasibility and v1 ideas to the human. Get direction on which idea to spec.

---

## Phase D — Spec Translation

**Goal:** Turn the chosen v1 idea into a full product spec.

### Steps

1. Copy `spec-template.md` to `specs/<slug>-spec.md`.

2. Fill in every section of the spec template:
   - **Product Summary** — name, tagline, target users, description.
   - **Core User Stories** — as a [role], I want to [action], so that [outcome].
   - **Data Model** — Postgres tables, columns, types, relationships.
   - **API Endpoints** — method, path, auth, request/response.
   - **Screens / Components** — pages, layouts, key UI components.
   - **Non-functional Requirements & Definition of Done**.

3. Cross-reference the spec against the Feasibility section — ensure no
   features exceed what was deemed buildable.

4. Append a **§ Spec Summary** to the research report linking to the spec.

### ⏸️ STOP — Present the draft spec to the human for refinement before finalizing.

---

## Phase E — Roadmap

**Goal:** Propose a 3–6 month plan from research → v1 launch.

### Steps

1. Using `research/templates/03-roadmap.md` as a guide, create a roadmap with:
   - **Month 1–2: Foundation** — setup, data model, core API, auth.
   - **Month 3–4: Core Product** — main features, frontend, integrations.
   - **Month 5–6: Launch & Iterate** — polish, testing, deploy, feedback loop.

2. For each phase, define:
   - Milestones (concrete deliverables).
   - Experiments (hypotheses to validate).
   - Metrics (how to measure success).

3. Add a **Risks** table — risk, likelihood, mitigation.

4. Append **§ Roadmap** to the research report.

5. Finalize `research/reports/<slug>-research.md` with all sections:
   - Research Questions
   - Landscape
   - Feasibility
   - Spec Summary (link to `specs/<slug>-spec.md`)
   - Roadmap

---

## Final Outputs

After all phases, the following files exist:

```
research/reports/<slug>-research.md   ← Full research report
specs/<slug>-spec.md                  ← Implementation-ready product spec
```

The spec is ready to be fed into the **new-production-app** workflow
(`.agent/workflows/new-production-app.md`) to begin implementation.

### Handoff Artifact

Emit a handoff per `agents/protocol.md`:

- **from:** `researcher` / `research-director` / current phase
- **to:** `implementer` / `new-production-app` / Phase 2
- **artifacts.inputs:** `[research/reports/<slug>-research.md, specs/<slug>-spec.md]`
- **Save to:** `plans/<slug>-handoff-001.json`

---

## Safety Rules

- **READ + WRITE only to `research/` and `specs/`.** Do not modify files in
  `apps/`, `infra/`, `.github/`, or any other application code directory.
- **No git remote changes** — do not push, change remotes, or create branches.
- **No deployments** — this workflow is research and planning only.
- **No new top-level folders** — use only `research/` and `specs/`.
- **Cite sources** — every factual claim in the Landscape section must have a
  reference link or attribution.
