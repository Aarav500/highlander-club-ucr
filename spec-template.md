# App Spec: [App Name]

> Copy this file to `specs/<slug>-spec.md` and fill in all sections for your app.

---

## 1. Product Summary

<!-- What does this app do? Who is it for? What problem does it solve? -->
<!-- Keep to 2–4 sentences. -->

**Name:** [App Name]
**Tagline:** [One-line description]
**Target Users:** [Who uses this?]

**Description:**
[2–4 sentence description of the app's purpose and value proposition.]

---

## 2. Core User Stories

<!-- List the primary flows a user will go through. Use the format: -->
<!-- As a [role], I want to [action], so that [outcome]. -->

| # | Role | Action | Outcome |
|---|------|--------|---------|
| 1 | User | ... | ... |
| 2 | User | ... | ... |
| 3 | Admin | ... | ... |

---

## 3. Data Model (Postgres)

<!-- Define your tables, columns, types, and relationships. -->
<!-- Use this format for each table: -->

### Table: `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default gen_random_uuid() | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### Table: `[entity]`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| ... | ... | ... | ... |

### Relationships

<!-- Describe foreign keys, indexes, and any notable relationships. -->

---

## 4. API Endpoints

<!-- List all REST endpoints the backend should expose. -->

| Method | Path | Auth? | Request Body | Response | Notes |
|--------|------|-------|-------------|----------|-------|
| GET | /health | No | — | `{ ok: true }` | Health check |
| POST | /api/auth/register | No | `{ email, password }` | `{ user, token }` | |
| GET | /api/[entity] | Yes | — | `[entity][]` | |

---

## 5. Screens / Components

<!-- List the main screens/pages and key UI components. -->
<!-- For each, describe purpose, layout, and important interactions. -->

### Screen: Landing Page (`/`)
- **Purpose:** First impression, explain product, CTA to sign up.
- **Layout:** Hero → Features → CTA.
- **Components:** `Hero`, `FeatureCard`, `CTAButton`.

### Screen: Dashboard (`/dashboard`)
- **Purpose:** ...
- **Layout:** ...
- **Components:** ...

### Shared Components
- `Navbar` – top navigation with logo and auth buttons.
- `Footer` – site-wide footer.

---

## 6. Non-functional Requirements & Definition of Done

### Non-functional
- [ ] Responsive design (mobile + desktop)
- [ ] Page load < 3s on 3G
- [ ] All API responses < 500ms
- [ ] Proper error handling and user-friendly error messages
- [ ] Environment variables for all secrets (no hardcoded credentials)

### Definition of Done
- [ ] All user stories implemented and manually tested
- [ ] API endpoints return correct status codes and error formats
- [ ] Frontend wired to backend with loading/error states
- [ ] README updated with any app-specific setup instructions
- [ ] No console errors or warnings in production build
- [ ] Deployed to staging and smoke-tested
