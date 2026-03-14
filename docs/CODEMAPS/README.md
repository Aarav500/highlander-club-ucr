# Codemaps

> Token-lean architecture summaries for AI context consumption.
> Generated/updated by the `/update-codemaps` command from [everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Expected Files

| File | Contents |
|------|----------|
| `architecture.md` | High-level system diagram, module boundaries, data flow |
| `backend.md` | Express routes, services, middleware, DB access layer |
| `frontend.md` | Next.js pages, components, layouts, client/server split |
| `data.md` | Database schema, relationships, migration history |
| `dependencies.md` | External dependencies, versions, integration points |

## Usage

- **Generate:** Run `/update-codemaps` in Claude Code after completing a major feature or refactor.
- **Read before planning:** Consult the relevant codemap(s) before proposing structural changes.
- **Keep lean:** Each file should stay under ~1000 tokens. Prefer file paths and function signatures over full code blocks.

## Freshness

Each codemap includes a metadata header with generation date, files scanned, and token estimate:

```
<!-- Generated: YYYY-MM-DD | Files scanned: NNN | Token estimate: ~NNN -->
```
