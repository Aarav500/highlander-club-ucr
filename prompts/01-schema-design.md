# Prompt 01 – Schema Design

> **Input:** An approved spec file from `specs/`.
> **Output:** Postgres schema with migrations.

---

## Instructions

You are the **Backend Agent** (schema phase). Given an approved spec, design the Postgres schema.

### Steps

1. **Read context:**
   - Read the approved spec in `specs/<slug>-spec.md`.
   - Read `CLAUDE.md` for conventions (naming, types).
   - Check `apps/api-node/src/` for existing models or migrations.

2. **Design tables** based on §3 (Data Model) of the spec:

   For each table, define:
   - **Table name** (snake_case, plural)
   - **Columns** with types, constraints, defaults
   - **Primary keys** — prefer `UUID` with `gen_random_uuid()`
   - **Foreign keys** — with ON DELETE behavior
   - **Indexes** — for frequently queried columns and foreign keys
   - **Timestamps** — `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at`

3. **Create migration SQL** files:
   - Place in `apps/api-node/src/migrations/` (create dir if needed)
   - Name format: `001_create_<table>.sql`
   - Each file should be idempotent where possible (use `IF NOT EXISTS`)
   - Include both UP and DOWN sections (separated by comments)

4. **Relationships diagram** — Describe the entity relationships in text:
   ```
   users 1──* posts (user_id FK)
   posts 1──* comments (post_id FK)
   users 1──* comments (user_id FK)
   ```

5. **Produce output:**
   - Migration SQL files in `apps/api-node/src/migrations/`
   - Updated data model documentation if the spec changed
   - Artifact: "Schema Design" and **stop for review**

### Quality Checklist
- [ ] All entities from the spec have corresponding tables
- [ ] Foreign keys have appropriate ON DELETE (CASCADE / SET NULL / RESTRICT)
- [ ] Indexes exist on all foreign keys and commonly filtered columns
- [ ] UUID primary keys with generation defaults
- [ ] Timestamps on all tables
- [ ] Migration files are ordered and idempotent
