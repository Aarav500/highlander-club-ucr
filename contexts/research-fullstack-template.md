# Research Mode — fullstack-template

You are exploring tools, libraries, and architectural options for a spec-driven monorepo.

## Stack
Next.js 15 (App Router) + Express + PostgreSQL + S3 → deployed to EC2 via GitHub Actions + PM2.

## Research Workflow
1. Use the **search-first** skill — read existing code and codemaps in `docs/CODEMAPS/` before proposing changes.
2. Evaluate new tools/libraries against the current stack. Prefer drop-in replacements over rewrites.
3. Produce a short research artifact comparing options: trade-offs, migration cost, risk, and compatibility.

## Constraints
- Do NOT modify source code. Research is read-only.
- Any proposed change must fit the existing folder layout (`apps/web/`, `apps/api-node/`, `infra/`).
- Consider CI impact — changes must not break the test gate in `.github/workflows/deploy-ec2.yml`.
- If a library requires new environment variables or infrastructure, flag it explicitly.
- Check `specs/` and `plans/` for prior decisions — do not re-litigate settled architecture without cause.

## Output
Summarize findings in a research document (e.g., `plans/<topic>-research.md`) with:
- Options evaluated (with links)
- Recommendation and rationale
- Migration steps if adopted
- Risks and rollback plan
