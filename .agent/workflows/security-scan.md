---
description: "Security-oriented review of apps/api-node and apps/web against OWASP Top 10"
model_tier: 1  # Tier 1 (Opus) — security-critical analysis
---

# Security Scan Workflow

> Performs a structured security review of the backend and frontend code,
> producing a report against `security/checklist.md`.
>
> **Scope:** READ-only on application code. WRITE only to the report artifact.

---

## Inputs

| Input | Description |
|-------|-------------|
| `scope` | Optional. `backend`, `frontend`, or `all` (default: `all`). |

## Outputs

| Artifact | Location |
|----------|----------|
| Security Scan Report | `plans/<slug>-security-report.md` or inline artifact |

---

## Step 1 — Preparation

1. Read `security/checklist.md` to load the full checklist.
2. Read `security/threat-model.md` to understand trust boundaries and assets.
3. Read `CLAUDE.md § Quality Bars` to understand repo conventions for error
   handling, secrets, and logging.

---

## Step 2 — Backend Scan (`apps/api-node/`)

Scan all source files in `apps/api-node/` for the following:

### SQL Injection

- Search for string concatenation in SQL queries (e.g., `` `SELECT ... ${` ``).
- Verify all queries use parameterized placeholders (`$1`, `$2`).
- Flag any use of `eval()`, `Function()`, or `child_process.exec()` with user input.

### Hardcoded Secrets

- Grep for patterns: `password\s*=\s*['"]`, `apiKey`, `secret`, `token`,
  `AWS_ACCESS_KEY`, `DATABASE_URL` in source files (not `.env`).
- Verify `.env` is in `.gitignore`.

### Weak CORS Configuration

- Check Express CORS middleware for `origin: '*'` or overly permissive origins.
- Confirm production CORS uses a strict allowlist.

### PII in Logs

- Search for `console.log`, `logger.info`, `logger.error` calls that include
  variables named `email`, `password`, `token`, `ssn`, or similar.
- Verify structured logging does not serialize full request bodies containing auth headers.

### Authentication & Authorization

- Verify auth middleware is applied to all protected routes.
- Check for IDOR — resource endpoints must verify ownership, not just auth.

---

## Step 3 — Frontend Scan (`apps/web/`)

Scan all source files in `apps/web/` for the following:

### XSS

- Search for `dangerouslySetInnerHTML` — flag unless a sanitizer (e.g., DOMPurify) is used.
- Check that user-generated content is rendered via JSX (default escaping).

### Hardcoded Secrets

- Grep for API keys, tokens, or credentials in client-side code.
- Verify sensitive values use `NEXT_PUBLIC_` env vars only when truly needed.

### Content Security Policy

- Check for CSP headers in `next.config.js` or middleware.

---

## Step 4 — Dependency Audit

1. Run `npm audit` in both `apps/api-node/` and `apps/web/`:
   ```bash
   cd apps/api-node && npm audit --production
   cd apps/web && npm audit --production
   ```
2. Record critical and high findings.

---

## Step 5 — Report

Produce a **Security Scan Report** artifact with the following structure:

```markdown
# Security Scan Report — [Date]

## Summary
- Scope: backend / frontend / all
- Critical findings: [count]
- High findings: [count]
- Medium findings: [count]
- Info: [count]

## Findings

### [CRITICAL/HIGH/MEDIUM/INFO] — [Title]
- **File:** `path/to/file.ts:L42`
- **Checklist ref:** § [section number]
- **Description:** ...
- **Recommendation:** ...

## Dependency Audit
- api-node: [summary]
- web: [summary]

## Checklist Status
[Copy of security/checklist.md with boxes checked/unchecked based on scan]
```

### ⏸️ STOP — Present the report to the human. Critical and high findings must be resolved before release.

---

## Safety Rules

- **READ-only on application code.** Do not modify files in `apps/`, `infra/`, or `.github/`.
- The report may be saved to `plans/` or presented as an inline artifact.
- If critical findings are found, recommend blocking the release and link to the relevant checklist section.
