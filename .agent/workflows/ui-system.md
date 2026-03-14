---
description: "Set up shadcn/ui + Tailwind + glassmorphism design system with Framer Motion animations"
---

# UI System Workflow

> Bootstrap a premium design system. Phase 0 selects the best design system, visual style, and motion level for the project context. Defaults to glassmorphism dark-mode if no specific context is provided.

---

## Phase 0 — DESIGN CHOOSER (NEW)

Before bootstrapping, determine the optimal UI stack for this project:

1. **Run the frontend design chooser** from `.agent/workflows/frontend-design-chooser.md`:
   - If the project has a known `page_type` and `brand`, use those as inputs.
   - If not specified, default to: `page_type="dashboard"`, `brand="modern premium"`, `constraints=["dark-mode"]`.

2. **Outputs from the chooser** determine the rest of this workflow:
   - `design_system` → which component library to install (Phase 2).
   - `visual_style` → which Tailwind theme tokens to use (Phase 1).
   - `motion_level` → whether to install Framer Motion and which presets (Phase 4).
   - `layout_pattern` → page structure to scaffold (Phase 3).

3. **If the chooser recommends a non-shadcn system** (e.g., Mantine, Chakra, Ant Design):
   - Skip Phase 2 (shadcn init) and instead install the recommended library.
   - Adapt Phase 3 component names to match the chosen system.
   - The glassmorphism tokens in Phase 1 may be replaced by the style's tokens.

4. **If no chooser is run** (quick mode), proceed with defaults: shadcn/ui + glassmorphism + rich motion.

> 💡 Reference: `.agent/capabilities/options-engine.md` and `.agent/capabilities/options-catalog.yaml` for the full catalog of options.

---

## Phase 1 — TAILWIND + DARK MODE

1. **Verify Tailwind CSS is configured** in the Next.js project:
   ```bash
   # If not installed:
   npm install -D tailwindcss @tailwindcss/postcss postcss
   ```

2. **Extend `tailwind.config.ts`** with the glassmorphism tokens from `.agent/capabilities/frontend-production.md`:
   - `glass.bg`, `glass.border`, `glass.hover` colors.
   - `backdropBlur.glass` utility.
   - `boxShadow.glass` and `boxShadow.glass-inset`.

3. **Set `darkMode: "class"`** — all components default to dark.

4. **Add global CSS** in `app/globals.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   :root { color-scheme: dark; }
   body {
     @apply bg-[#0a0a0f] text-white antialiased;
     font-family: 'Inter', system-ui, sans-serif;
   }
   ```

5. **Add Inter font** via `next/font/google`:
   ```typescript
   import { Inter } from "next/font/google";
   const inter = Inter({ subsets: ["latin"] });
   ```

---

## Phase 2 — SHADCN/UI INIT

1. **Initialize shadcn/ui:**
   ```bash
   npx -y shadcn@latest init
   ```
   - Style: New York.
   - Base color: Slate (customized for dark glass).
   - CSS variables: Yes.

2. **Install core components:**
   ```bash
   npx -y shadcn@latest add button card dialog input label select tabs toast dropdown-menu avatar badge
   ```

3. **Customize component themes** — override shadcn defaults to use glassmorphism:
   - Cards → `bg-glass-bg backdrop-blur-glass border-glass-border`.
   - Dialogs → glassmorphic overlay with blur.
   - Inputs → dark glass background with subtle border glow on focus.

---

## Phase 3 — GLASSMORPHISM COMPONENTS

Build reusable wrapper components:

1. **`GlassCard`** — base card with backdrop blur, border, and shadow.
2. **`GlassPanel`** — full-width section panel.
3. **`GlassInput`** — dark-themed form input with focus glow.
4. **`GlassButton`** — gradient button with hover glow effect.
5. **`GlassNavbar`** — sticky top nav with backdrop blur.

Each component should:
- Accept `className` for composition.
- Use `cn()` utility from shadcn for class merging.
- Respect `prefers-reduced-motion`.

Reference `.agent/capabilities/frontend-production.md` for the implementation patterns.

---

## Phase 4 — FRAMER MOTION ANIMATIONS

1. **Install Framer Motion:**
   ```bash
   npm install framer-motion
   ```

2. **Create animation presets** in `lib/animations.ts`:
   - `fadeIn` — opacity 0 → 1.
   - `slideUp` — y: 20 → 0 with opacity.
   - `stagger` — container that staggers children.
   - `scaleIn` — scale 0.95 → 1 for modals/cards.

3. **Add motion-safe wrapper:**
   ```typescript
   function useReducedMotion() {
     return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   }
   ```

4. **Apply to all new components** — every `GlassCard`, page section, and modal should have entry/exit animations.

---

## Phase 5 — VERIFY

1. **Visual check** — open `http://localhost:3000`, confirm:
   - Dark background with glassmorphic cards.
   - Smooth entry animations on page load.
   - Hover effects on buttons and interactive elements.
   - No FOUC (flash of unstyled content).

2. **Responsive check** — test at 375px, 768px, 1280px.

3. **Accessibility** — confirm `prefers-reduced-motion` disables animations.

4. **⏸️ STOP — Wait for human review of the design system.**
