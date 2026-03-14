# Security Checklist

> Based on OWASP Top 10 (2021) and basic AWS cloud security. Use during
> `security-scan` workflow runs and before major releases.

---

## 1. Injection (A03:2021)

- [ ] All SQL queries use parameterized placeholders (`$1, $2`) — no string concatenation.
- [ ] No use of `eval()`, `Function()`, or `child_process.exec()` on user input.
- [ ] ORM/query-builder inputs are validated before reaching the database layer.

## 2. Cross-Site Scripting — XSS (A03:2021)

- [ ] No use of `dangerouslySetInnerHTML` without a whitelist HTML sanitizer.
- [ ] User-generated content rendered via JSX default escaping.
- [ ] `Content-Security-Policy` header configured (at least `default-src 'self'`).

## 3. Authentication & Session (A07:2021)

- [ ] JWT secret is ≥256 bits, read from env var, not hardcoded.
- [ ] Tokens have an expiration claim (`exp`).
- [ ] Auth endpoints are rate-limited.
- [ ] Passwords hashed with bcrypt (cost ≥10) or argon2.

## 4. Access Control (A01:2021)

- [ ] Every protected API route checks authentication middleware.
- [ ] Resource endpoints verify ownership (no IDOR).
- [ ] Admin routes require role elevation.
- [ ] CORS `origin` is a strict allowlist — not `*` in production.

## 5. Sensitive Data (A02:2021)

- [ ] No secrets, API keys, or credentials in source code (grep for common patterns).
- [ ] `.env` files are in `.gitignore`.
- [ ] HTTPS enforced in production (redirect HTTP → HTTPS or HSTS header).
- [ ] S3 buckets are not publicly readable; use signed URLs.

## 6. Logging & Monitoring (A09:2021)

- [ ] Errors are logged with structured format (JSON preferred).
- [ ] No PII (emails, passwords, tokens) in log output.
- [ ] Failed auth attempts are logged with IP/timestamp.
- [ ] Logs are not written to stdout in production without a collector.

## 7. Dependency Security (A06:2021)

- [ ] `npm audit` returns zero critical/high findings.
- [ ] No deprecated or unmaintained packages in production dependencies.
- [ ] Lock files (`package-lock.json`) are committed and reviewed on changes.

## 8. Configuration & Deployment (A05:2021)

- [ ] `NODE_ENV` is set to `production` in deployed environments.
- [ ] Debug endpoints and stack traces are disabled in production.
- [ ] PM2 process runs as a non-root user.
- [ ] SSH keys for deploy are scoped and rotated periodically.
- [ ] GitHub Actions secrets are not echoed in CI logs.

## 9. Server-Side Request Forgery — SSRF (A10:2021)

- [ ] User-supplied URLs are validated against an allowlist before server-side fetch.
- [ ] Internal metadata endpoints (e.g., `169.254.169.254`) are blocked.

## 10. Cloud-Specific (AWS)

- [ ] IAM roles follow least-privilege principle.
- [ ] S3 bucket policies deny public access.
- [ ] Security groups restrict inbound to necessary ports only (80, 443, 22 from admin IP).
- [ ] EC2 instances use the latest Amazon Linux AMI or patched Ubuntu.
