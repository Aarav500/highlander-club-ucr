# Shared Auth Module — Design Notes

## Overview

A platform-level authentication module that any app built from `fullstack-template` can import instead of rolling its own auth layer.

## Planned Capabilities

### Authentication

- **JWT access + refresh tokens** — short-lived access tokens (~15 min), long-lived refresh tokens (httpOnly cookie).
- **Session management** — server-side session store (Redis or Postgres-backed) as an alternative to pure JWT.
- **OAuth 2.0 / OIDC** — pluggable providers (Google, GitHub, Microsoft) via a provider adapter interface.
- **Password hashing** — bcrypt/argon2, configurable work factors.

### Authorization

- **Role-based access control (RBAC)** — built-in roles: `admin`, `member`, `viewer`. Custom roles via config.
- **Permission guards** — Express middleware and Next.js server-action wrappers that check roles/permissions before handler execution.
- **Row-level policies** — optional Postgres RLS integration for data-level access control.

### Integration Surface

| Export | Type | Description |
|--------|------|-------------|
| `authMiddleware()` | Express middleware | Validates token, attaches `req.user` |
| `requireRole(role)` | Express middleware | Rejects if user lacks the given role |
| `createToken(user)` | Function | Issues a signed JWT pair |
| `verifyToken(token)` | Function | Validates and decodes a JWT |
| `AuthProvider` | React context | Client-side auth state (user, login, logout) |

### Configuration

```yaml
auth:
  strategy: jwt | session
  jwt:
    secret: ${AUTH_JWT_SECRET}
    accessTtl: 900        # seconds
    refreshTtl: 604800    # 7 days
  session:
    store: redis | postgres
    ttl: 86400
  oauth:
    providers:
      - google
      - github
  rbac:
    defaultRole: member
    roles:
      - admin
      - member
      - viewer
```

## Open Questions

- Should the auth module own the `users` table schema, or should each app define its own and the module only manages tokens/sessions?
- How to handle multi-tenant apps where roles are scoped per organization?
- Package distribution: local workspace dependency vs. private npm registry?

## Status

**Not implemented.** This file captures the target design for future extraction.
