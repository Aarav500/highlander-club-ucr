---
description: Create a plan for spinning up a new app repo from the fullstack-template platform
model_tier: 2  # Tier 2 (Sonnet) — app scaffolding and planning
---

# Platform → New App Workflow

Generate a human-followable plan for creating a new application repo based on the `fullstack-template` and its platform modules.

> **This workflow does NOT clone repos, push code, or modify any files.** It produces a markdown plan artifact that a human (or future automation) can execute.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `app_name` | ✅ | Short kebab-case name for the new app (e.g., `invoice-tracker`) |
| `description` | ✅ | One- or two-sentence description of what the app does |

---

## Steps

### 1 — PLAN: Assess Platform Needs

1. Read `platform/README.md` and each module's notes (`platform/auth/auth-notes.md`, `platform/ui/ui-notes.md`, etc.) to understand available platform capabilities.
2. Based on the `description`, decide which platform modules the new app will need:
   - Auth (JWT/session, roles)?
   - UI Kit (shared primitives)?
   - Any future modules listed in `platform/`?
3. Propose a **high-level repo layout** for the new app, following the `fullstack-template` folder conventions:
   ```
   <app_name>/
     apps/
       web/          # Next.js frontend
       api-node/     # Express backend
     infra/          # Deploy scripts, CI/CD
     specs/          # App spec
     plans/          # Implementation plan
     platform/       # Symlink or copy of shared modules used
   ```
4. Identify any app-specific modules or config that will differ from the template defaults.

### 2 — IMPLEMENT (Conceptual): Document the Build Steps

Create a **markdown plan artifact** (not actual code) with these sections:

#### a) Repository Setup
- Clone `fullstack-template` into a new directory named `<app_name>`.
- Remove template-specific content (example specs, placeholder apps, research artifacts).
- Update `package.json` name, description, and repository URL.
- Initialize a fresh Git history (`git init`) or fork.

#### b) Platform Module Integration
- For each selected platform module:
  - Document how to wire it into the new app (imports, middleware registration, provider wrapping).
  - Note any configuration values that must be set (env vars, secrets).
  - Flag modules that are **not yet implemented** — mark them as "stub: will integrate when module is built."

#### c) App-Specific Scaffolding
- Outline the app's domain models, routes, and pages based on the `description`.
- Reference relevant `prompts/` files from the template for AI-assisted generation.

#### d) CI/CD & Environments
- Copy and adapt `.github/workflows/` for the new repo.
- Document required environment variables and secrets.
- Specify deploy targets (e.g., new EC2 instance, Vercel, etc.).

#### e) Quality Gates
- List the quality bars inherited from the template (lint, type-check, test, security scan).
- Note any app-specific additions.

### 3 — REVIEW: Output the Final Plan

1. Compile all of the above into a single **"New App from Platform"** plan document.
2. Format it as a clear, numbered checklist that a human can follow step by step.
3. Present the plan to the user for review via `notify_user` with `BlockedOnUser: true`.

---

## Output

A markdown artifact titled **`<app_name>-platform-plan.md`** containing:

- App name and description
- Selected platform modules (with rationale)
- Proposed repo layout
- Step-by-step build checklist
- Environment and CI/CD setup instructions
- Open questions or decisions for the human to resolve
