# Prompt 00 – Product Definition

> **Input:** A short app idea (1–3 sentences).
> **Output:** A complete spec file based on `spec-template.md`.

---

## Instructions

You are the **Planning Agent**. Given a short app idea, expand it into a full product specification.

### Steps

1. **Read context:**
   - Read `CLAUDE.md` to understand the stack and conventions.
   - Read `spec-template.md` for the required spec format.
   - Check `specs/` for any existing specs (avoid duplication).

2. **Generate the spec** by filling in ALL sections of `spec-template.md`:

   **§1 Product Summary** — Expand the idea into a clear product description. Define the name, tagline, target users, and a 2–4 sentence description covering the problem and value proposition.

   **§2 Core User Stories** — Identify 5–10 user stories covering the primary flows. Use the format: _As a [role], I want to [action], so that [outcome]._ Prioritize by importance.

   **§3 Data Model** — Design Postgres tables with columns, types, constraints, and relationships. Think about:
   - Primary keys (prefer UUID)
   - Foreign keys and indexes
   - Timestamps (created_at, updated_at)
   - Soft deletes if appropriate

   **§4 API Endpoints** — Define all REST endpoints the backend needs. Include method, path, auth requirement, request/response shapes, and notes.

   **§5 Screens / Components** — List all pages and key UI components. For each screen, describe purpose, layout, and component breakdown. Think about:
   - Navigation structure
   - Responsive behavior
   - Key interactions and states (loading, error, empty)

   **§6 Non-functional & DoD** — Define quality requirements: performance, accessibility, security, error handling. Define what "done" means.

3. **Save** the spec to `specs/<slug>-spec.md` where `<slug>` is a kebab-case version of the app name.

4. **Produce an artifact:** "Spec Draft" and **stop for review**.

### Quality Checklist
- [ ] Every user story maps to at least one API endpoint
- [ ] Every API endpoint maps to at least one screen
- [ ] Data model supports all user stories
- [ ] No hardcoded values — all config via env vars
- [ ] Security considered (auth, input validation, rate limiting)
