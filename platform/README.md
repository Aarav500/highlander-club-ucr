# Platform Modules

This directory contains **candidate shared modules** intended to be reused across all apps built from the `fullstack-template`.

## Status

> [!IMPORTANT]
> **Not yet implemented.** Everything here is a stub describing _future_ shared capabilities. No production code exists yet — only design notes and interface sketches.

## Purpose

As you spin up multiple apps from this template, common concerns emerge:

- **Authentication** — every app needs sign-in, sessions, and role-based access.
- **UI Primitives** — every app needs buttons, cards, layouts, and form controls that look and behave consistently.

Rather than re-implementing these in each clone, the plan is to **extract them into platform modules** that any app can import.

## Modules

| Module | Path | Description |
|--------|------|-------------|
| Auth | `platform/auth/` | Shared authentication: JWT/session management, roles, middleware |
| UI Kit | `platform/ui/` | Shared UI primitives: buttons, cards, layout components |
| Billing | `platform/billing/` | Stripe integration, subscriptions, usage metering, webhook handling |

## How It Will Work (Future)

1. Platform modules live in this directory with their own `package.json` (or are published to a private registry).
2. Apps import them as local packages or npm dependencies.
3. The `platform-new-app` workflow (`.agent/workflows/platform-new-app.md`) guides the creation of new apps that integrate these modules.

## Contributing a New Module

1. Create a subdirectory under `platform/` (e.g., `platform/billing/`).
2. Add a `*-notes.md` file describing the module's scope, API surface, and integration points.
3. Once the design is approved, implement the module and update this README.
