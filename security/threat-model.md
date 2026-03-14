# Threat Model — fullstack-template

> Living document. Update when new features, integrations, or attack surfaces are introduced.

---

## System Overview

| Component | Technology | Exposure |
|-----------|-----------|----------|
| Frontend | Next.js 15 (App Router) + React 19 | Public internet |
| Backend API | Node.js + Express | Public internet (behind CORS) |
| Database | PostgreSQL | Private subnet / localhost |
| File Storage | Amazon S3 | Signed URLs; bucket not public |
| Deployment | EC2 + PM2 + GitHub Actions | SSH + CI/CD pipeline |

## Trust Boundaries

1. **Browser → Frontend server** — unauthenticated until login; all input untrusted.
2. **Frontend → Backend API** — authenticated via token; validate on every request.
3. **Backend → Database** — trusted connection; parameterized queries only.
4. **Backend → S3** — IAM-scoped credentials; least-privilege bucket policy.
5. **CI/CD → EC2** — deploy key; no interactive shell from pipeline.

## Threat Categories

### T1 — Injection (SQL, NoSQL, Command)

- **Vector:** User input passed to SQL queries or shell commands.
- **Mitigation:** Parameterized queries (`$1, $2`), no string concatenation, no `eval()` or `exec()` on user data.
- **Status:** ☐ Verified

### T2 — Cross-Site Scripting (XSS)

- **Vector:** User-supplied content rendered in React without escaping.
- **Mitigation:** React's default JSX escaping; avoid `dangerouslySetInnerHTML`; sanitize any rich-text input with a whitelist sanitizer.
- **Status:** ☐ Verified

### T3 — Broken Authentication

- **Vector:** Weak tokens, missing session expiry, credential stuffing.
- **Mitigation:** Strong JWT secret (≥256-bit), token expiry, rate-limiting on auth endpoints.
- **Status:** ☐ Verified

### T4 — Sensitive Data Exposure

- **Vector:** Secrets in code, PII in logs, unencrypted transport.
- **Mitigation:** Env vars for all secrets, structured logging with PII filter, HTTPS enforced.
- **Status:** ☐ Verified

### T5 — Broken Access Control

- **Vector:** Missing authorization checks on API routes; IDOR.
- **Mitigation:** Middleware-level auth; resource ownership checks; role-based access where needed.
- **Status:** ☐ Verified

### T6 — Security Misconfiguration

- **Vector:** Permissive CORS, debug mode in production, default credentials.
- **Mitigation:** Strict CORS origin list, `NODE_ENV=production`, no default passwords.
- **Status:** ☐ Verified

### T7 — Dependency Vulnerabilities

- **Vector:** Known CVEs in npm packages.
- **Mitigation:** `npm audit` in CI, Dependabot or Renovate, pin major versions.
- **Status:** ☐ Verified

## Assets to Protect

| Asset | Sensitivity | Location |
|-------|------------|----------|
| User credentials (hashed) | Critical | PostgreSQL |
| Auth tokens (JWT) | Critical | In-flight (HTTP headers) |
| User PII (email, name) | High | PostgreSQL, logs (must filter) |
| Uploaded files | Medium | S3 |
| Source code | Medium | GitHub (private repo) |
| Deploy keys / SSH keys | Critical | GitHub Secrets, EC2 |

## Review Cadence

- **Every major release:** Re-validate T1–T7 using `security-scan` workflow.
- **Every new integration:** Add a new threat entry and update trust boundaries.
- **Quarterly:** Review dependency audit and refresh threat status.
