# Antigravity Repository Rules

> These rules govern all AI agent behavior within this repository.

---

## 1. Respect the Folder Layout

- All frontend code lives in `apps/web/`.
- All backend code lives in `apps/api-node/`.
- Infra and deploy configs live in `infra/` and `.github/workflows/`.
- Specs go in `specs/`, plans in `plans/`, prompts in `prompts/`.
- **Do NOT create new top-level folders** without explicit instruction from the human. This is non-negotiable.
- **Do NOT create markdown files** outside `specs/`, `plans/`, `docs/`, or `prompts/`. If a document doesn't fit these directories, ask the human where it should go.
- **Do NOT create scratch files, temp files, or "backup" copies** in the repo. If a file is fully replaced by a new version, delete the old file — do not leave it unused.

## 2. Spec-Driven Development

- Every feature or app must have a spec document in `specs/`.
- Use `spec-template.md` as the starting point for all new specs.
- The spec must be reviewed and approved before implementation begins.

## 3. Plan-First Execution

- Before implementing any substantial change, create a plan in `plans/`.
- Plans should reference the corresponding spec and break work into 10–20 discrete tasks.
- The plan must be reviewed and approved before coding begins.

## 4. Review-Driven Execution

Stop and request user review at these checkpoints:

1. **Spec Draft** – After creating or updating a spec document.
2. **Implementation Plan** – After creating or updating a plan document.
3. **Backend Complete** – After finishing backend implementation for a milestone.
4. **Frontend Complete** – After finishing frontend implementation for a milestone.
5. **CI/CD Changes** – Before modifying any deployment or CI/CD configuration.

## 5. No Unauthorized Changes

- **Never** change deployment targets (EC2 host, SSH keys, PM2 config) without permission.
- **Never** add new environment variables to CI/CD without permission.
- **Never** modify `.antigravity/rules.md` or `CLAUDE.md` without permission.
- **Never** commit secrets, API keys, or credentials to the repository.
- **Never** rename or reorganize existing folder structures without explicit approval.
- **Never** add new npm dependencies without stating the reason and getting approval.

## 6. Code Quality

- Prefer TypeScript where reasonable.
- Follow the naming conventions in `CLAUDE.md`.
- All API endpoints must have error handling.
- Frontend must be responsive (mobile + desktop).
- Use environment variables for all configuration — no hardcoded values.

## 7. Codemap Discipline

- **Before large structural changes**, read the relevant codemap(s) in `docs/CODEMAPS/` to understand existing module responsibilities.
- **After completing a major feature or refactor**, run `/update-codemaps` to keep architecture documentation current.
- **Do NOT create new modules with similar names or responsibilities to existing ones.** Instead, refactor or extend the existing module and update the codemap accordingly. If you believe a new module is genuinely needed, justify it in the plan and get approval.
- **When introducing a new module**, update the relevant codemap to document the module's responsibility, boundaries, and integration points.
- **When deprecating or removing a module**, update the relevant codemap to remove stale entries.
- Codemaps must remain **token-lean** — prefer file paths and function signatures over full code blocks. Each codemap should stay under ~1000 tokens.

## 8. Memory & Continuous Learning

- **At the end of productive sessions**, run `/learn` to extract reusable patterns (error resolutions, debugging techniques, workarounds).
- **Do NOT extract trivial fixes** (typos, simple syntax errors) or one-time issues (API outages).
- **Before starting work**, check `~/.claude/skills/learned/` for previously extracted patterns relevant to the current task.
- **Keep learned skills focused** — one pattern per skill file.

## 9. Workflow Usage

- **Before major releases or merges to `main`**, run the `security-scan` workflow to audit `apps/api-node/` and `apps/web/` for vulnerabilities. Address critical findings before proceeding.
- **Once core user flows are stable**, run the `e2e-test-gen` workflow to generate Playwright tests covering the top 3–5 critical journeys.
- **When CI fails or builds break**, run the `build-error-resolver` workflow to diagnose and fix errors systematically — do not guess at fixes without reading the logs first.
- **Always follow the STOP points** in each workflow — do not skip review gates.

## 10. Session Reflection

- **After completing a major mission** (e.g., `new-app-from-idea`, large refactor, multi-phase feature), invoke the continuous-learning skill (`/learn`) and produce a structured reflection.
- **Save reflections** to `docs/reflections/YYYY-MM-DD-<slug>.md` with:
  - What changed in the repo (files added/modified/removed).
  - What worked well (patterns, tools, decisions that saved time).
  - What didn't work (pain points, dead-ends, wasted effort).
  - Suggested prompt or rule tweaks for future sessions.
- **Before starting large new changes**, read the 2–3 most recent reflections in `docs/reflections/` to learn from past sessions and avoid repeating mistakes.
- **Do NOT write reflections for trivial tasks** (single-file fixes, typo corrections). Reserve reflections for missions that span multiple phases or touch multiple modules.

## 11. Dead Code & Cleanup

- **When refactoring**, remove every function, variable, import, and file that is no longer referenced. Do not leave "just in case" dead code.
- **Consolidate near-identical utilities.** If two or more helper functions do essentially the same thing, merge them into one and update all call sites. Do not create a third variant.
- **When moving or renaming a module**, delete the original file and update all imports. Do not leave the old file in place.
- **After any cleanup**, update the relevant codemap in `docs/CODEMAPS/` to reflect removed or renamed modules.
- **Run `/refactor-clean`** (or the refactor-cleaner agent) after large refactors to catch dead code the agent may have missed.
- **Do NOT leave commented-out code blocks** in the codebase. If code is removed, delete it — git history preserves it if it's ever needed again.

## 12. Coordination with Amazon Q

- When this repo is opened in **Amazon Q Developer**, Q acts as the top-level orchestrator following `.amazonq/rules/core-workflow.md`.
- Q is expected to:
  - Use Antigravity workflows (`new-production-app`, `research-director`, `security-scan`, etc.) instead of ad-hoc edits where possible.
  - Maintain clear stage separation: **Inception → Construction → Operations**.
  - Save decision summaries to `docs/decisions/` at each stage transition.
- Antigravity agents should treat Amazon Q's stage instructions as **authoritative** when present — do not skip stages or bypass review gates that Q has set.
- If no Q session is active, Antigravity agents operate independently using these rules and the workflows in `.agent/workflows/`.

## 13. Security Scan Before Release

- **Before any major release or merge to `main`**, run the `security-scan` workflow (`.agent/workflows/security-scan.md`).
- The scan must cover both `apps/api-node/` and `apps/web/` against `security/checklist.md`.
- **Critical and high findings block the release** — they must be resolved or explicitly accepted by the human before deploy.
- After resolving findings, re-run the scan to confirm the fix and update the report.

## 14. Operations Playbook for Production Issues

- **For significant production incidents or risky operational changes**, use the `ops-playbook` workflow (`.agent/workflows/ops-playbook.md`).
- Every incident must produce an **Ops Incident Summary** in `docs/decisions/` with root cause, fix, and rollback plan.
- **Do not apply fixes without a defined rollback plan.**
- After applying a fix, re-run backend tests and frontend build to verify. For critical/high severity, also re-run `security-scan`.

## 15. Secrets & PII

- **Never commit `.env` files, API keys, tokens, or credentials** to the repository. All secrets must be read from environment variables at runtime and managed via CI/CD secrets or a vault.
- **Never write secrets into code, docs, or examples.** Use clearly fake placeholders (e.g., `sk-EXAMPLE-KEY-DO-NOT-USE`, `your-secret-here`) when illustrating config.
- **Never log full PII values** (emails, phone numbers, addresses, SSNs). When logging is necessary, prefer user IDs, hashed/truncated values, or anonymized identifiers.
- **When adding structured logs**, include only the minimum fields needed for debugging. Replace raw PII with opaque references: `userId: "abc123"` instead of `email: "user@example.com"`.
- **The CI pipeline includes a secrets scan** (`.github/workflows/secrets-scan.yml`) that runs on every push and PR to `main`. If the scan detects potential secrets, the build fails and deploy is blocked. Do not bypass or disable this gate.
- **If a secret is accidentally committed**, immediately rotate the credential, force-push a clean history (with human approval), and run the scan again to confirm removal.

## 16. Self-Review for Polish

- **After a feature is functionally complete**, agents may run the `self-review` workflow (`.agent/workflows/self-review.md`) to propose and apply improvements.
- The self-review loop follows three phases: **Analyze → Implement → Verify**, with a mandatory human approval gate between analysis and implementation.
- **Max 5 improvements per run** and **max 2 retry loops** per improvement to prevent unbounded iteration.
- Agents must **not expand scope** during self-review — only the files in the specified scope may be changed.
- **Tests must remain green** throughout the loop. If a polish change breaks tests, it must be reverted or fixed before proceeding.
- Self-review is optional and should not delay delivery. Use it for polish, not as a substitute for proper implementation.

## 17. Self-Upgrade Discipline

- **Before applying any self-improvement changes**, present the full improvement report to the human and wait for explicit approval on which items to apply.
- **Tests must stay green** throughout the upgrade cycle. After each applied change, re-run tests immediately. If tests break, revert the change (max 2 retry attempts per item).
- **Max 10 improvements per run** — do not propose unbounded lists of changes.
- **Stay within declared scope** — only modify files in the target directory specified at the start of the run. Do not expand scope during execution.
- **Do not add new dependencies** during self-upgrade without explicit human approval.
- **Architecture-category findings** (circular dependencies, misplaced abstractions, boundary violations) require a Tier 1 model for evaluation. Do not apply these with a lower-tier model.
- **Self-upgrade complements, not replaces**, other workflows. Use `security-scan` for deep security audits, `perf-baseline` for performance benchmarking, and `self-review` for polishing recently-completed features.

## 18. Multi-App Awareness

- **Read `labs-config.yaml`** before any cross-app operation — it is the authoritative registry of all apps, their owners, SLA tiers, environments, and critical paths.
- **Respect SLA tiers** from `governance/policy.yaml`. Apply quality gates appropriate to each app's tier:
  - `critical` + `standard` → full CI, security scan, perf baseline, critical-path hardening.
  - `basic` → standard CI, security scan before release.
  - `experimental` → minimal gates, manual scans acceptable.
- **Prefer `platform/` modules** over duplicating shared logic. When an app needs auth, UI, or billing, reference the relevant platform module design in `platform/<module>/`.
- **Notify owners** — route audit findings, change notifications, and incident alerts to the `owner` field from `labs-config.yaml`.
- **Do not auto-edit `labs-config.yaml`** — it is read-only metadata. Only update with explicit human instruction.
- **Tag-based operations** — when performing batch operations (e.g., "scan all customer-facing apps"), filter by the `tags` field rather than listing apps individually.
