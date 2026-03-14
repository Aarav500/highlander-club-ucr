---
description: Generate a weekly digest summarizing recent architectural and product decisions
model_tier: 3  # Tier 3 (Haiku) — documentation summarization
---

# Decision Digest Workflow

Produce a short, human-readable summary of decisions recorded in `docs/decisions/` over a recent time window.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `days` | Optional | Look-back window in days (default: 7) |

---

## Steps

### 1 — Gather Recent Decisions

1. List all files in `docs/decisions/` matching the pattern `YYYY-MM-DD-*.md` (exclude `README.md`, `template.md`, and existing `weekly-digest-*.md` files).
2. Filter to those whose filename date falls within the last `days` days.
   - Conceptually: parse the `YYYY-MM-DD` prefix from each filename and compare to today's date.
   - If no date-filtering tooling is available, read all decision files and note their dates for manual filtering.
3. Read the content of each qualifying decision doc.

### 2 — Summarize

For each decision, extract:

- **Title** — from the `# heading`.
- **Date** — from the filename or `Date` field.
- **Decision** — the one-line "We decided to…" statement.
- **Rationale** — a one-sentence summary of why.
- **Risks / Follow-ups** — any open items or accepted trade-offs.

### 3 — Compose the Digest

Create a file at:

```
docs/decisions/weekly-digest-YYYY-WW.md
```

Where `YYYY` is the current year and `WW` is the ISO week number.

Use this format:

```markdown
# Decision Digest — Week WW, YYYY

> Covering decisions from YYYY-MM-DD to YYYY-MM-DD.

## Summary

| # | Date | Decision | Key Rationale |
|---|------|----------|---------------|
| 1 | 2026-03-05 | Switch to JWT refresh tokens | Reduce DB session lookups |
| 2 | 2026-03-08 | Adopt k6 for perf testing | Scriptable, CI-friendly, free tier |

## Details

### 1. [Decision Title] (YYYY-MM-DD)

**Decision:** We decided to …
**Why:** …
**Risks:** …
**Follow-ups:** …

---

### 2. [Decision Title] (YYYY-MM-DD)

…

## Open Items

- [ ] Consolidated list of follow-up actions from all decisions this week.
```

### 4 — Distribution

The digest is ready for distribution:

- **Slack:** Copy the digest content into a Slack message or have n8n post it automatically.
- **Email:** Attach or inline the digest in a weekly team update.
- **GitHub:** The file is committed to the repo for permanent reference.

---

**⏸️ STOP — Present the digest to the user for review before committing.**
