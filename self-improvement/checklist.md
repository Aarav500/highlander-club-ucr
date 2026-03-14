# Self-Improvement Checklist

> Agents use this checklist when scanning code for upgrade opportunities. Each section maps to a category in `self-improvement/strategy.md`.

---

## Code Quality

- [ ] **Dead code** — functions, variables, imports, or files that are never referenced.
- [ ] **Duplicated logic** — two or more blocks doing the same thing that should be consolidated.
- [ ] **Inconsistent patterns** — similar operations handled differently across the codebase (e.g., error handling, logging format, naming conventions).
- [ ] **Missing error handling** — API endpoints or async operations without try/catch or `.catch()`.
- [ ] **Unused dependencies** — packages listed in `package.json` but never imported.
- [ ] **TODO/FIXME debt** — `TODO` or `FIXME` comments without corresponding tracked issues.
- [ ] **Commented-out code** — code blocks left commented out instead of deleted.

## Performance

- [ ] **Unoptimized queries** — N+1 query patterns, missing indexes, unnecessary `SELECT *`.
- [ ] **Missing caching** — repeated expensive computations or API calls without caching.
- [ ] **Large bundle imports** — importing entire libraries when only a single function is needed (e.g., `import _ from 'lodash'` vs `import debounce from 'lodash/debounce'`).
- [ ] **Unnecessary re-renders** — React components re-rendering due to missing `useMemo`, `useCallback`, or key changes.
- [ ] **Blocking operations** — synchronous I/O or long-running operations on the main thread.
- [ ] **Uncompressed responses** — API responses that could benefit from gzip/brotli compression.

## Security

- [ ] **Hardcoded values** — config values, URLs, or pseudo-secrets embedded in source code.
- [ ] **Missing input validation** — user input accepted without sanitization or schema validation.
- [ ] **Outdated dependencies** — packages with known CVEs (run `npm audit`).
- [ ] **Overly permissive CORS** — `cors({ origin: '*' })` in production configuration.
- [ ] **Missing rate limiting** — public endpoints without request throttling.
- [ ] **SQL injection risk** — string concatenation in database queries instead of parameterized queries.
- [ ] **Missing authentication checks** — routes that should require auth but don't.

## Developer Experience

- [ ] **Missing TypeScript types** — `any` types that could be replaced with proper interfaces.
- [ ] **Unclear naming** — variables or functions with ambiguous names (e.g., `data`, `result`, `temp`).
- [ ] **Outdated documentation** — README, CLAUDE.md, or codemap sections that no longer match the code.
- [ ] **Missing tests for critical paths** — core business logic or auth flows without test coverage.
- [ ] **Inconsistent file structure** — files in wrong directories per the folder layout in CLAUDE.md.
- [ ] **Missing JSDoc/comments** — complex functions without documentation explaining the "why."

## Architecture

- [ ] **Misplaced abstractions** — business logic in route handlers instead of service modules.
- [ ] **Circular dependencies** — module A imports B which imports A.
- [ ] **Violated module boundaries** — frontend code importing from backend paths or vice versa.
- [ ] **God files** — single files doing too many unrelated things (>300 lines is a warning sign).
- [ ] **Missing separation of concerns** — database access mixed with HTTP response formatting.

---

## How to Use This Checklist

1. **Scan** — For each item, grep/search the target scope for violations.
2. **Triage** — Rate each finding by severity (critical, high, medium, low) and effort (quick-fix, moderate, significant).
3. **Report** — Add findings to the Self-Improvement Report artifact.
4. **Prioritize** — Recommend quick-fix + high-severity items first.
5. **Apply** — After human approval, implement fixes one at a time, re-testing after each.
