---
description: "Full code audit: lint, type-check, test, security scan, and auto-fix PR generation"
---

# Code Audit & Fix Workflow

> Comprehensive code quality scan with automated fixes and PR generation.

---

## Phase 1 — LINT SCAN

1. **ESLint:**
   ```bash
   npx eslint . --format=json --output-file=audit/eslint-report.json
   npx eslint . --fix  # auto-fix safe issues
   ```

2. **Biome (if configured):**
   ```bash
   npx @biomejs/biome check --apply .
   ```

3. **Record findings:**
   - Total errors / warnings.
   - Top 5 most frequent rules violated.
   - Files with most issues.

---

## Phase 2 — TYPE CHECK

1. **TypeScript strict:**
   ```bash
   npx tsc --noEmit --strict 2>&1 | tee audit/tsc-report.txt
   ```

2. **If `tsconfig.json` is not strict**, temporarily enable strict mode to surface hidden issues:
   ```bash
   npx tsc --noEmit --strict --noUncheckedIndexedAccess
   ```

3. **Categorize errors:**
   - `any` types → replace with proper types.
   - Null/undefined access → add guards.
   - Missing return types → add explicit returns.

---

## Phase 3 — TEST SUITE

1. **Run unit/integration tests:**
   ```bash
   npx vitest run --reporter=json --outputFile=audit/test-report.json
   ```

2. **Run E2E tests (if Playwright configured):**
   ```bash
   npx playwright test --reporter=json
   ```

3. **Check coverage thresholds:**
   ```bash
   npx vitest run --coverage
   ```
   - Target: ≥ 80% branches, functions, lines, statements.

4. **Record:**
   - Total tests, pass/fail/skip counts.
   - Coverage percentages by area.
   - Flaky tests (failed then passed on retry).

---

## Phase 4 — SECURITY SCAN

1. **npm audit:**
   ```bash
   npm audit --json > audit/npm-audit.json
   npm audit fix  # auto-fix non-breaking
   ```

2. **Snyk (if configured):**
   ```bash
   snyk test --json > audit/snyk-report.json
   ```

3. **Secrets scan:**
   ```bash
   npx -y secretlint "**/*"
   ```

4. **OWASP ZAP (if app is running):**
   ```bash
   docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
     -t http://localhost:3000 -J audit/zap-report.json
   ```

5. **Categorize findings:** Critical → High → Medium → Low.

---

## Phase 5 — AUTO-FIX

1. **Apply safe auto-fixes:**
   - `eslint --fix` — formatting, unused imports, simple type fixes.
   - `biome check --apply` — formatting + lint.
   - `npm audit fix` — non-breaking dependency bumps.

2. **Manual fixes required (flag for human):**
   - Breaking dependency upgrades.
   - Architectural issues (missing error handling, auth bypasses).
   - Failing tests that need logic changes.

3. **Create fix branch:**
   ```bash
   git checkout -b fix/code-audit-$(date +%Y-%m-%d)
   git add -A
   git commit -m "chore: auto-fix code audit issues"
   ```

---

## Phase 6 — REPORT & PR

1. **Generate audit summary** — `audit/summary.md`:

   ```markdown
   ## Code Audit Summary — [Date]

   ### Metrics
   | Metric | Before | After |
   |--------|--------|-------|
   | Lint errors | X | Y |
   | Type errors | X | Y |
   | Test pass rate | X% | Y% |
   | Coverage | X% | Y% |
   | Vulnerabilities | X | Y |

   ### Auto-Fixed
   - [list of auto-fixed issues]

   ### Requires Manual Review
   - [list of issues needing human attention]
   ```

2. **Open PR** with the summary as description.

3. **⏸️ STOP — Wait for human review of the audit PR.**

---

## Scheduling

Run this workflow:
- **Weekly** on active projects.
- **Before every release** (Phase 5 of `prod-deploy.md`).
- **On demand** when code quality concerns arise.
