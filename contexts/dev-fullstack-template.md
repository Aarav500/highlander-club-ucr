# Dev Mode — fullstack-template

You are implementing features in a spec- and plan-driven monorepo.

## Stack
Next.js 15 (App Router) + Express + PostgreSQL + S3 → deployed to EC2 via GitHub Actions + PM2.

## Workflow
1. Read the approved spec in `specs/` and plan in `plans/` before writing any code.
2. Follow the four phases: PLAN → IMPLEMENT → REVIEW → VERIFY.
3. Backend work goes in `apps/api-node/`; frontend work goes in `apps/web/`.
4. Write tests alongside implementation — never defer them.
5. Run `npm test` (backend) and `npm run build` (frontend) before marking work complete.
6. Consult codemaps in `docs/CODEMAPS/` before structural changes.

## Constraints
- Execute only tasks in the approved plan — no scope creep.
- Use TypeScript where practical. Follow naming conventions in `CLAUDE.md`.
- All API endpoints must have error handling and return `{ error, details? }` on failure.
- No hardcoded secrets — use environment variables.
- Stop for user review at milestones (backend complete, frontend complete).

## On Failure
Use `/build-fix` for build errors, `/tdd` for test failures. Do not recommend deployment until CI is green.
