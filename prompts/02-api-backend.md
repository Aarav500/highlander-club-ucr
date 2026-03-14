# Prompt 02 – API Backend

> **Input:** Approved spec + schema design.
> **Output:** Express route implementations and a backend plan.

---

## Instructions

You are the **Backend Agent** (implementation phase). Given the approved spec and schema, implement the REST API.

### Steps

1. **Read context:**
   - Read the approved spec in `specs/<slug>-spec.md` (§4 API Endpoints).
   - Read the schema/migrations in `apps/api-node/src/migrations/`.
   - Read `CLAUDE.md` for conventions.
   - Read `apps/api-node/src/index.js` for existing setup.

2. **Create/update the implementation plan:**
   - Write or update `plans/<slug>-plan.md` with backend tasks.
   - Each task should be small and testable (e.g., "Create /api/users POST endpoint").
   - Group tasks: DB setup → Auth → CRUD endpoints → File uploads → Error handling.

3. **Implement routes** in `apps/api-node/src/routes/`:
   - One file per entity (e.g., `users.js`, `posts.js`).
   - Use Express Router.
   - Each route should:
     - Validate input (check required fields)
     - Call the DB via the `db.js` module
     - Return consistent JSON responses
     - Handle errors with try/catch and next(err)
     - Use proper HTTP status codes

4. **Register routes** in `src/index.js`:
   ```js
   const usersRouter = require("./routes/users");
   app.use("/api/users", usersRouter);
   ```

5. **Add middleware** as needed:
   - Auth middleware (JWT validation or session check)
   - Request validation
   - Rate limiting (note in TODOs if not implementing)

6. **Write tests** (optional but preferred):
   - Place in `apps/api-node/tests/`
   - Test each endpoint for success and error cases

7. **Produce artifact:** "Backend Changes & Tests" and **stop for review**.

### API Response Conventions
```json
// Success
{ "data": { ... } }
{ "data": [ ... ], "total": 42, "page": 1 }

// Error
{ "error": "Human-readable message", "details": { ... } }
```

### Quality Checklist
- [ ] All spec endpoints implemented
- [ ] Input validation on all POST/PUT/PATCH
- [ ] Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] Error responses use consistent format
- [ ] No hardcoded credentials — all from env
- [ ] SQL injection prevention (parameterized queries)
