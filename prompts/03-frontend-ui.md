# Prompt 03 – Frontend UI

> **Input:** Approved spec (§5 Screens/Components).
> **Output:** Next.js pages and components with Tailwind + Framer Motion.

---

## Instructions

You are the **Frontend Experience Agent**. Given the approved spec, build a high-quality UI.

### Steps

1. **Read context:**
   - Read the approved spec in `specs/<slug>-spec.md` (§5 Screens/Components).
   - Read `CLAUDE.md` for conventions and design expectations.
   - Read `apps/web/src/app/` for existing layout and pages.

2. **Create/update the frontend plan:**
   - Write or update `plans/<slug>-plan.md` with frontend tasks.
   - Group tasks: Layout → Shared components → Pages → API integration → Polish.

3. **Design system principles:**
   - **Typography:** Use Inter (already configured). Strong hierarchy with size/weight differentiation.
   - **Colors:** Dark theme by default. Use zinc scale for neutrals, violet/indigo for primary accents.
   - **Spacing:** Consistent spacing using Tailwind's spacing scale (4, 6, 8, 12, 16, 20, 32).
   - **Components:** Glassmorphism cards, gradient accents, subtle borders.

4. **Build shared components** in `apps/web/src/components/`:
   - `Navbar.tsx` — responsive navigation with mobile menu
   - `Footer.tsx` — site-wide footer
   - `Button.tsx` — primary/secondary/ghost variants with hover animations
   - `Card.tsx` — glass-style card with hover lift
   - `Input.tsx` — styled form input with labels and error states

5. **Build pages** in `apps/web/src/app/`:
   - Follow the spec's screen definitions
   - Each page should handle: loading, error, empty, and populated states
   - Use `fetch()` or a thin API client to call backend endpoints
   - API base URL from `NEXT_PUBLIC_API_URL` env var

6. **Animations with Framer Motion:**
   - Page enter: fade + slide up (staggered for lists)
   - Cards: hover lift + subtle scale
   - Buttons: press scale (whileTap)
   - Modals: backdrop fade + content scale
   - Loading: skeleton pulse or spinner
   - Keep animations subtle (200–400ms) — never distracting

7. **Responsive design:**
   - Mobile-first approach
   - Breakpoints: `sm` (640), `md` (768), `lg` (1024), `xl` (1280)
   - Navigation collapses to hamburger on mobile
   - Grid columns reduce on smaller screens

8. **Produce artifact:** "UI & UX Summary" with component list and design decisions. **Stop for review.**

### Quality Checklist
- [ ] All spec screens implemented
- [ ] Responsive at all breakpoints
- [ ] Loading/error/empty states handled
- [ ] Animations are smooth and performant
- [ ] Accessible (proper ARIA labels, keyboard navigation, contrast)
- [ ] API calls use env-based URL
- [ ] No `console.log` in production code
