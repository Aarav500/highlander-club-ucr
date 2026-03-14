# Decision Docs

This directory holds **architectural, infrastructure, and product decision records** — short documents that capture the _why_ behind significant choices.

## When to Write One

- Choosing between competing technologies or architectural patterns.
- Making infrastructure changes (new services, DB migrations, provider switches).
- Significant product decisions that constrain future options (pricing model, data model shape, API versioning strategy).
- Any choice where the team might later ask "why did we do it this way?"

## Format

Use the template at [`template.md`](template.md). Filename convention:

```
docs/decisions/YYYY-MM-DD-<slug>.md
```

Example: `2026-03-11-switch-to-jwt-refresh-tokens.md`

## Sections

| Section | Purpose |
|---------|---------|
| **Context** | What situation or problem prompted this decision? |
| **Options** | What alternatives were considered? |
| **Decision** | What was chosen? |
| **Rationale** | Why this option over the others? |
| **Consequences** | What follow-ups, risks, or trade-offs result? |

## Weekly Digest

The `decision-digest` workflow (`.agent/workflows/decision-digest.md`) can generate a summary of recent decisions into `weekly-digest-YYYY-WW.md` files here. These digests can be shared via Slack or email.
