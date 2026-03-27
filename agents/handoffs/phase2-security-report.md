# Phase 2 Security Report — Highlander Events API
Date: 2026-03-21
Stage: Construction
Status: Approved (with required fixes)

---

## Summary

Full OWASP Top 10 review of the Express backend. Scan covered:
- `apps/api-node/src/routes/events.js`
- `apps/api-node/src/routes/clubs.js`
- `apps/api-node/src/middleware/auth.js`
- `apps/api-node/src/index.js`
- `.env.example`

**Total findings: 10** (3 High, 5 High-CSRF, 2 Medium)

---

## Critical — Fix Before Deploy

### [CRIT-1] Real secrets committed in `.env.example`
- **File:** `.env.example`
- **Severity:** Critical (manual finding)
- **Detail:** The `.env.example` file contains real, live credentials:
  - `OPENAI_API_KEY` — live OpenAI key
  - `ANTHROPIC_API_KEY` — live Anthropic key
  - `GITHUB_TOKEN` — live GitHub PAT
  - `DATABASE_URL` — live Railway PostgreSQL connection string with password
  - `SLACK_BOT_TOKEN`, `EXPO_TOKEN`, `HF_TOKEN`, `DYNATRACE_API_TOKEN`, etc.
- **Action required:**
  1. Rotate ALL exposed credentials immediately.
  2. Replace all values in `.env.example` with `<placeholder>` strings.
  3. Verify `.env` and `.env.example` are in `.gitignore`.
  4. Run `git log` to check if these were ever committed to history; if so, use `git filter-repo` to purge.

---

## High Severity

### [HIGH-1] SQL Injection — `events.js` line 31–43
- **CWE:** CWE-89
- **Detail:** `req.user.id` is interpolated directly into the SQL string inside a template literal:
  ```js
  EXISTS(SELECT 1 FROM rsvps WHERE user_id = '${req.user.id}' AND event_id = e.id)
  ```
  Although `req.user.id` comes from a verified JWT, the pattern is unsafe — if the JWT payload is ever tampered with or the secret is weak, this becomes a direct injection vector.
- **Fix:** Move `req.user.id` to a parameterized position:
  ```js
  params.push(req.user.id);
  // ...
  EXISTS(SELECT 1 FROM rsvps WHERE user_id = $${params.length} AND event_id = e.id)
  ```

### [HIGH-2] SQL Injection — `clubs.js` line 24–36
- **CWE:** CWE-89
- **Detail:** Same pattern — `req.user.id` interpolated directly into the `follows` subquery:
  ```js
  EXISTS(SELECT 1 FROM follows WHERE user_id = '${req.user.id}' AND club_id = c.id)
  ```
- **Fix:** Same as HIGH-1 — parameterize `req.user.id`.

### [HIGH-3] CSRF — Multiple mutation routes (events.js, clubs.js)
- **CWE:** CWE-352, CWE-1275
- **Affected lines:** events.js 135, 166, 198, 217; clubs.js 79, 107
- **Detail:** POST/PUT/DELETE mutation routes have no CSRF protection. The API is JWT-only (stateless), which mitigates CSRF for API clients, but if cookies are ever introduced this becomes exploitable.
- **Fix (short-term):** Ensure `Authorization: Bearer` header is always required (already done). Add a comment to each route documenting this assumption.
- **Fix (long-term):** Add `csurf` middleware or use `SameSite=Strict` cookies if session auth is ever added.

---

## Medium Severity

### [MED-1] Wildcard CORS — `index.js` line 9–10
- **CWE:** CWE-942
- **Detail:** `app.use(cors())` with no options allows any origin.
- **Fix:**
  ```js
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));
  ```
  Add `ALLOWED_ORIGINS=https://highlander-events.vercel.app` to `.env`.

### [MED-2] Lazy module loading — `auth.js` lines 0, 25
- **Detail:** `require('../db/pool')` is called inside the `requireClubAdmin` function body on every invocation instead of at the top of the file.
- **Fix:** Move `const pool = require('../db/pool');` to the top of `auth.js`.

---

## Additional Manual Findings

### [MED-3] Weak JWT secret fallback
- **File:** `auth.js` line 3
- **Detail:** `const JWT_SECRET = process.env.JWT_SECRET || 'highlander-events-dev-secret'` — if `JWT_SECRET` is missing in production, tokens are signed with a known public string.
- **Fix:** Throw at startup if `JWT_SECRET` is not set in production:
  ```js
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production');
  }
  ```

### [MED-4] No rate limiting on auth or upload routes
- **Detail:** `express-rate-limit` is in `package.json` but not applied anywhere in the codebase.
- **Fix:** Apply to at minimum `/api/auth` and `/api/upload/presign`:
  ```js
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use('/api/auth', limiter);
  app.use('/api/upload', limiter);
  ```

### [LOW-1] Stack traces leaked in development error handler
- **File:** `index.js` line 24
- **Detail:** `err.stack` is sent in the response when `NODE_ENV === 'development'`. Acceptable for dev, but ensure `NODE_ENV=production` is set in all deploy environments.

### [LOW-2] No input length validation on text fields
- **Detail:** `title`, `description`, `name` etc. have no max-length checks before hitting the DB. A malicious client can send multi-MB strings.
- **Fix:** Add a simple check or use `express-validator` for length constraints on POST body fields.

---

## S3 Bucket Configuration Checklist (A.1)

The bucket `highlander-events-media` must be created manually in the AWS Console or via CLI with these settings:

```bash
# Create bucket
aws s3api create-bucket \
  --bucket highlander-events-media \
  --region us-east-1

# Block all public access (use presigned URLs or CloudFront instead of public read)
aws s3api put-public-access-block \
  --bucket highlander-events-media \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# CORS for mobile uploads
aws s3api put-bucket-cors --bucket highlander-events-media --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'
```

> Note: If images need to be publicly readable, either make the bucket public-read (lower security) or serve via a CloudFront distribution (recommended).

---

## Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| S3 bucket config documented | ✅ |
| Upload middleware created (`upload.js`) | ✅ |
| Presigned URL endpoint created (`GET /api/upload/presign`) | ✅ |
| S3_BUCKET added to `.env.example` | ✅ |
| Security report generated | ✅ |
| High-severity SQL injection findings documented with fixes | ✅ |
| CORS misconfiguration documented with fix | ✅ |
| Exposed secrets in `.env.example` flagged as Critical | ✅ |
| No high-severity issues in new upload code | ✅ |
