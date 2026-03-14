---
description: Auto-generate OpenAPI spec and user guides from backend routes and app specs
model_tier: 3  # Tier 3 (Haiku) — documentation generation
---

# Auto Documentation Workflow

Scans backend routes to produce an OpenAPI spec, then generates user-facing guides from the app spec. Outputs are committed to `docs/`.

## Inputs

| Input | Required | Description |
| ----- | -------- | ----------- |
| `app_slug` | ✅ | App identifier, used to locate the spec and name output files |
| `spec_path` | Optional | Path to app spec, defaults to `specs/<app_slug>-spec.md` |
| `routes_dir` | Optional | Path to Express routes, defaults to `apps/api-node/src/routes/` |

---

## Steps

### 1 — Discover Routes

1. Read every `.js` file in `routes_dir`.
2. For each file, extract:
   - HTTP method (`router.get`, `router.post`, `router.put`, `router.patch`, `router.delete`)
   - Route path (first argument)
   - Any JSDoc or inline comments describing the route
   - Middleware references (e.g., `authMiddleware`, `validate(schema)`)
3. Read `apps/api-node/src/app.js` to resolve mount paths (`app.use("/api/examples", exampleRouter)`).
4. Build a route manifest:

```json
[
  {
    "method": "GET",
    "path": "/api/examples",
    "mount": "/api/examples",
    "file": "routes/example.js",
    "description": "List all examples",
    "auth": false,
    "middleware": []
  }
]
```

### 2 — Generate OpenAPI Spec

Using the route manifest and the app spec (`spec_path`):

1. Create `docs/<app_slug>-openapi.yaml` following OpenAPI 3.1 format.
2. For each route, generate:
   - `operationId` from method + path
   - `summary` from route description or spec
   - `parameters` — path params, query params (inferred from code or spec)
   - `requestBody` — for POST/PUT/PATCH, infer schema from spec data model or validation middleware
   - `responses` — at minimum `200`, `400`, `404`, `500` with descriptions
   - `security` — if auth middleware is present, reference a `bearerAuth` scheme
3. Add `info` block (title, version, description from spec).
4. Add `servers` block with `http://localhost:4000` as default.
5. Add `components/schemas` for each data model table from the spec.

Output target:

```
docs/<app_slug>-openapi.yaml
```

**⏸️ STOP — Present the OpenAPI spec for review.**

### 3 — Generate User Guide

From the app spec and OpenAPI spec, generate a user-facing guide:

1. Read the spec for:
   - Product summary → Guide introduction
   - User stories → Feature walkthroughs
   - Screens/components → UI guide sections
   - API endpoints → Developer reference
2. Write `docs/<app_slug>-user-guide.md` with these sections:

```markdown
# <App Name> User Guide

## Overview
Brief description of what the app does and who it's for.

## Getting Started
How to sign up, log in, and reach the main screen.

## Features
### <Feature from user story>
Step-by-step walkthrough with expected behavior.
(Repeat for each major user story.)

## API Reference
Summary table of endpoints (method, path, description, auth required).
Link to full OpenAPI spec: `docs/<app_slug>-openapi.yaml`

## Troubleshooting
Common error messages and how to resolve them.
```

3. Cross-reference with the OpenAPI spec to ensure all endpoints are documented.

Output target:

```
docs/<app_slug>-user-guide.md
```

**⏸️ STOP — Present the user guide for review.**

### 4 — Generate Changelog Stub

If `docs/decisions/` contains decision docs, scan them and append a summary to:

```
docs/<app_slug>-changelog.md
```

Format:

```markdown
# Changelog

## [Unreleased]
- <decision summary from docs/decisions/>
```

### 5 — Validate

1. If a YAML linter is available, validate the OpenAPI spec syntax.
2. Check that every route in the manifest has a corresponding entry in the OpenAPI spec.
3. Check that every API endpoint in the user guide matches the OpenAPI spec.
4. Report any gaps.

---

## Handoff Artifacts

Emit a handoff per `agents/protocol.md`:

- **from:** `documenter` / `auto-workflow` / Step 5
- **to:** `reviewer` / `self-review` (optional quality pass)
- **artifacts.inputs:** generated docs
- **Save to:** `plans/<app_slug>-handoff-NNN.json`

---

## Notes

- This workflow generates **documentation only** — it does not modify backend code.
- For apps without a spec, the workflow falls back to route-only analysis and produces a minimal OpenAPI spec.
- The generated OpenAPI spec can be served via Swagger UI by adding `swagger-ui-express` to the backend (not done by this workflow).
- Re-run this workflow after significant API changes to keep docs in sync.
