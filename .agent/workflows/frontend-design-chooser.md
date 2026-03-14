---
description: "Frontend design chooser — select design system, visual style, layout, and motion per page with /design-page"
---

# Frontend Design Chooser Workflow

> Analyze page requirements and select the optimal design system, visual style, layout pattern, and motion level. Generate alternatives, scaffold code on confirmation.

---

## Inputs

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `page_type` | Yes | — | `marketing`, `dashboard`, `form`, `mobile`, `data`, `docs`, `misc` |
| `brand_keywords` | No | `"modern minimal"` | `"futuristic serious"`, `"playful colorful"`, `"enterprise finance"` |
| `constraints` | No | `[]` | `accessible`, `low-motion`, `mobile-first`, `seo-heavy`, `dark-mode`, `light-mode` |
| `tech_stack` | No | `"nextjs-tailwind-shadcn"` | Override default stack |

---

## Step 1: Analyze Requirements

Read the inputs and map to the decision matrix in `.agent/capabilities/options-engine.md`:

```yaml
# Example analysis
input:
  page_type: "dashboard"
  brand_keywords: "futuristic serious"
  constraints: ["low-motion", "data-dense"]

analysis:
  primary_concern: "Data density with sci-fi aesthetic"
  a11y_requirement: "Standard (no specific a11y constraint)"
  motion_budget: "Subtle only (low-motion constraint)"
  layout_need: "Dense grid with sidebar navigation"
```

---

## Step 2: Recommend Stack

Cross-reference the catalog (`options-catalog.yaml`) against the analysis:

```yaml
recommendation:
  design_system: shadcn-ui          # Best for dashboards, zero bundle overhead
  visual_style: sci-fi              # Matches "futuristic serious"
  layout_pattern: dashboard-dense   # Data-dense requirement
  motion_level: subtle              # Respects low-motion constraint
  
  rationale: |
    shadcn/ui gives full Tailwind control for a custom sci-fi aesthetic 
    without bundle bloat. Dense dashboard layout with sidebar provides 
    maximum data visibility. Subtle motion (hover states, fade transitions) 
    keeps the interface responsive without distracting from data.
  
  wireframe:
    - Sticky top nav: logo, search, notifications, user avatar
    - Left sidebar: collapsible icon navigation (Home, Analytics, Settings)
    - Main grid: 4-column metric cards (top), 2-column charts (middle), full-width data table (bottom)
    - Color palette: dark bg (#0a0a1a), neon green accents (#00ff88), muted white text
  
  implementation:
    components: [GlassCard, MetricCard, DataTable, AreaChart, Sidebar, TopNav]
    libraries: ["shadcn/ui", "recharts", "tailwindcss", "@tanstack/react-table"]
    files_to_create:
      - "app/(dashboard)/layout.tsx"
      - "app/(dashboard)/page.tsx"
      - "components/dashboard/metric-card.tsx"
      - "components/dashboard/data-table.tsx"
      - "components/dashboard/sidebar.tsx"
```

---

## Step 3: Generate Alternatives (When Confidence < 80%)

When the brand/page combination is ambiguous, generate 2–3 alternatives:

```yaml
alternatives:
  option_1:
    design_system: shadcn-ui
    visual_style: sci-fi
    layout: dashboard-dense
    motion: subtle
    confidence: 85%
    rationale: "Best balance of data density and futuristic aesthetic"

  option_2:
    design_system: tremor
    visual_style: dark-luxury
    layout: dashboard-minimal
    motion: subtle
    confidence: 70%
    rationale: "Tremor has built-in chart components, less custom work"

  option_3:
    design_system: ant-design-v6
    visual_style: corporate
    layout: data-admin
    motion: none
    confidence: 55%
    rationale: "Maximum data density via Ant tables, but less 'futuristic'"
```

Present all options with code snippets showing the visual difference.

---

## Step 4: Scaffold on Confirmation

After the user selects an option (or confirms the primary recommendation):

1. **Create page layout** — Next.js App Router layout + page files
2. **Install dependencies** — Only what's needed for the chosen stack
3. **Generate components** — Using the chosen design system's patterns
4. **Apply visual style** — Tailwind theme tokens matching the style
5. **Add responsive behavior** — Mobile breakpoints, collapsible sidebar
6. **Wire example data** — Realistic mock data for immediate visual feedback

---

## Step 5: Record Decision

Save the choice to `docs/frontend-decisions.md` for future reference:

```markdown
## 2026-03-14 — Dashboard Page

| Attribute | Choice | Reason |
|-----------|--------|--------|
| Design System | shadcn/ui | Zero bundle, full Tailwind control |
| Visual Style | Sci-Fi | Brand: "futuristic serious" |
| Layout | Dense Dashboard | Constraint: data-dense |
| Motion | Subtle | Constraint: low-motion |

Future pages with similar requirements should reuse this combination.
```

---

## Commands

```bash
# Design a page — full flow
/design-page page_type="dashboard" brand="futuristic serious" constraints="low-motion, data-dense"

# Explore alternatives — generate 2-3 variants
/design-explore page_type="marketing" brand="playful colorful"

# Adopt a specific option from alternatives
/design-adopt option=2

# Quick design for common patterns
/design-page page_type="marketing" brand="enterprise"
/design-page page_type="form" brand="clean minimal" constraints="accessible"
/design-page page_type="mobile" brand="finance" constraints="mobile-first"
```

---

## Integration with `/ui-system`

The `/ui-system` workflow calls this chooser as **Phase 0** before bootstrapping:

1. Run `/design-page` with project-level defaults
2. Use the chosen `design_system` to determine which components to install
3. Use the chosen `visual_style` to set Tailwind theme tokens
4. Use the chosen `motion_level` to configure Framer Motion presets
