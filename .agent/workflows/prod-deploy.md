---
description: "Production deployment: Docker + GitHub Actions + Vercel preview + monitoring + rollback"
---

# Production Deploy Workflow

> End-to-end deployment from Dockerized build to live production with monitoring and rollback plan.

---

## Phase 1 — DOCKERIZE

1. **Create or verify Dockerfile** in the app root.
   - Use multi-stage build pattern from `.agent/capabilities/deployment-mastery.md`.
   - Stage 1: `deps` (install dependencies).
   - Stage 2: `builder` (compile/build).
   - Stage 3: `runner` (minimal production image).

2. **Add `.dockerignore`** — exclude `node_modules`, `.next`, `.git`, `*.md`, `tests/`.

3. **Add healthcheck endpoint** — `GET /api/health` returning `{ "status": "ok", "version": "<semver>" }`.

4. **Test locally:**
   ```bash
   docker build -t app:local .
   docker run -p 3000:3000 app:local
   curl http://localhost:3000/api/health
   ```

5. **⏸️ STOP — Confirm Docker image builds and healthcheck passes.**

---

## Phase 2 — CI/CD PIPELINE

1. **Create `.github/workflows/ci-cd.yml`** using the pipeline template from `deployment-mastery.md`.
   - Jobs: `lint` → `test` → `e2e` → `security` → `deploy`.
   - `deploy` runs only on `main` branch pushes after all checks pass.

2. **Configure secrets** in GitHub repo settings:
   - `DOCKER_REGISTRY` — container registry URL.
   - `DEPLOY_SSH_KEY` — SSH key for production server.
   - `SENTRY_DSN` — Sentry error tracking.
   - `SNYK_TOKEN` — Snyk security scanning.

3. **Tag strategy:**
   ```bash
   git tag -a v<semver> -m "Release <semver>"
   git push origin v<semver>
   ```

4. **⏸️ STOP — Confirm CI/CD pipeline runs green on a test push.**

---

## Phase 3 — PREVIEW DEPLOYS (Vercel / Netlify)

1. **Connect repo to Vercel** (or Netlify):
   - Import project → auto-detect framework (Next.js).
   - Set environment variables via dashboard.

2. **Verify preview deploy** — push a feature branch, confirm preview URL is live.

3. **Configure production branch** — set `main` as production deployment trigger.

---

## Phase 4 — MONITORING

1. **Set up Sentry** — follow patterns in `deployment-mastery.md`:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Set up OpenTelemetry** — instrument Node.js backend with auto-instrumentation.

3. **Configure alerts:**
   - Error rate > 1% → Slack/email alert.
   - P95 latency > 500ms → Slack/email alert.
   - Health endpoint down → PagerDuty.

4. **⏸️ STOP — Verify Sentry captures a test error, OTel traces visible in dashboard.**

---

## Phase 5 — ROLLBACK PLAN

1. **Document rollback procedure** for this specific app:
   - Previous known-good Docker image tag.
   - Previous known-good git tag.
   - Database migration rollback steps (if applicable).

2. **Test rollback** — deploy previous version, verify health endpoint, verify no data loss.

3. **Post-deploy checklist:**
   - [ ] Healthcheck returns `200 OK` with correct version.
   - [ ] Sentry shows no new errors.
   - [ ] Key user flows work (manual smoke test).
   - [ ] Database migrations applied successfully.

---

## Safety Rules

- **No deploys without passing CI** — all lint, test, e2e, and security jobs must be green.
- **No force pushes to main** — use feature branches + PRs.
- **All secrets from environment** — never commit `.env.production`.
- **Tag every release** — `v<major>.<minor>.<patch>`.
