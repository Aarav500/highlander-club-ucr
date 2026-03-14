---
description: "Agentic Design — Figma API → Tailwind code generation + autonomous design governance + 92% consistency"
---

# Agentic Design Workflow

> Autonomous design system governance. The agent extracts tokens from Figma, generates code, detects drift, enforces consistency, and maintains a cross-project pattern library.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Agentic Design Pipeline                       │
├──────────┬──────────────┬───────────────┬───────────────────────┤
│  Extract │  Generate    │  Govern       │  Learn               │
│  Figma   │  Tailwind    │  Drift Detect │  Pattern Library     │
│  Tokens  │  Components  │  Auto-Fix     │  Cross-Project       │
├──────────┼──────────────┼───────────────┼───────────────────────┤
│ REST API │ Token → CSS  │ Visual Diff   │ Component Registry   │
│ Styles   │ Component    │ a11y Scan     │ Reuse Analytics      │
│ Vars     │ Page Layout  │ Consistency   │ Pattern Suggestions  │
│ Assets   │ Storybook    │ Auto-PR       │ 156% Reuse Boost     │
└──────────┴──────────────┴───────────────┴───────────────────────┘
```

---

## Inputs

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `figma_file` | No | — | Figma file URL or key for token extraction |
| `mode` | Yes | `full` | `extract`, `generate`, `govern`, `audit`, `full` |
| `project` | No | current | Target project directory |
| `fix` | No | `false` | Auto-fix drift violations |

---

## Phase 1 — Figma Token Extraction

### Figma REST API Integration

```typescript
// scripts/figma-extract.ts
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY;

interface DesignTokens {
  colors: Record<string, { value: string; description: string }>;
  typography: Record<string, { family: string; size: number; weight: number; lineHeight: number }>;
  spacing: Record<string, number>;
  radii: Record<string, number>;
  shadows: Record<string, string>;
  breakpoints: Record<string, number>;
}

async function extractTokens(): Promise<DesignTokens> {
  const response = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/styles`,
    { headers: { "X-Figma-Token": FIGMA_TOKEN } }
  );
  const data = await response.json();
  // Parse Figma styles → DesignTokens
  return parseStyles(data);
}
```

### Token Output → Tailwind Config

```typescript
// Generated: tailwind.design-tokens.ts
export const designTokens = {
  colors: {
    primary: { 50: "#eff6ff", 500: "#3b82f6", 900: "#1e3a8a" },
    secondary: { 50: "#f0fdf4", 500: "#22c55e", 900: "#14532d" },
    neutral: { 50: "#fafafa", 500: "#737373", 900: "#171717" },
  },
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"],
  },
  borderRadius: { sm: "4px", md: "8px", lg: "12px", xl: "16px", "2xl": "24px" },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px" },
} as const;
```

---

## Phase 2 — Component Generation

### From Figma Frame → React Component

1. **Analyze Figma frame** — identify component type (button, card, modal, etc.).
2. **Map to existing components** — check if a matching shadcn/ui or custom component exists.
3. **Generate code:**

```tsx
// Generated: components/ui/feature-card.tsx
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

export function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-6",
        "shadow-sm transition-shadow hover:shadow-md",
        "dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
    >
      <div className="mb-4 text-primary-500">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </motion.div>
  );
}
```

4. **Generate Storybook story** for each component:

```tsx
// Generated: components/ui/feature-card.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { FeatureCard } from "./feature-card";

const meta: Meta<typeof FeatureCard> = {
  title: "UI/FeatureCard",
  component: FeatureCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof FeatureCard>;
export const Default: Story = {
  args: { title: "Feature", description: "Description", icon: <span>🚀</span> },
};
```

---

## Phase 3 — Design Governance (Drift Detection)

### Visual Regression Scanning

```bash
# Chromatic or Percy visual diff
npx chromatic --project-token=$CHROMATIC_TOKEN
# Flags: components that deviate >2px from Figma source
```

### Token Consistency Audit

The agent scans all component files for drift:

```yaml
audit_rules:
  colors:
    - rule: "No hardcoded hex/rgb/hsl colors outside design tokens"
      pattern: '(#[0-9a-fA-F]{3,8}|rgb\(|hsl\()'
      exclude: ["tailwind.config.ts", "design-tokens.ts"]
      severity: error

  spacing:
    - rule: "Use token spacing (xs/sm/md/lg/xl), not arbitrary values"
      pattern: '(p|m|gap|space)-\[(?!var)'
      severity: warning

  typography:
    - rule: "Use font-sans or font-mono from tokens"
      pattern: 'font-family:\s*(?!var|inherit)'
      severity: error

  border_radius:
    - rule: "Use rounded-sm/md/lg/xl/2xl from tokens"
      pattern: 'rounded-\[(?!var)'
      severity: warning
```

### Consistency Score

```
Consistency = (compliant_usages / total_usages) × 100

Target: 92%+
```

| Metric | Calculation | Target |
|--------|------------|--------|
| Color compliance | Token colors / all colors | ≥ 95% |
| Spacing compliance | Token spacing / all spacing | ≥ 90% |
| Typography compliance | Token fonts / all fonts | ≥ 98% |
| Component reuse | Shared components / total components | ≥ 85% |
| **Overall consistency** | Weighted average | **≥ 92%** |

### Auto-Fix Drift

When `--fix` is enabled:

1. Replace hardcoded colors → nearest design token.
2. Replace arbitrary spacing → nearest token spacing.
3. Replace custom fonts → token font family.
4. Create auto-fix PR with Visual Diff screenshots.

---

## Phase 4 — Pattern Library (Cross-Project)

### Component Registry

```yaml
# .agent/design-registry.yaml
registry:
  - id: glass-card
    source: "components/glass/glass-card.tsx"
    used_in: [dashboard, settings, analytics]
    reuse_count: 12
    last_updated: "2026-03-14"

  - id: metric-card
    source: "components/dashboard/metric-card.tsx"
    used_in: [dashboard, analytics, admin]
    reuse_count: 8

  - id: data-table
    source: "components/ui/data-table.tsx"
    used_in: [admin, analytics, reporting]
    reuse_count: 15
```

### Reuse Analytics

```
Component Reuse Rate = (shared_component_instances / total_component_instances) × 100

V6.0: 38% reuse → V7.0 target: 60% (156% boost)
```

### Pattern Suggestions

When the agent creates a new component, it checks the registry:
- **Match found (>80% similarity):** Suggest reusing the existing component.
- **Partial match (50–80%):** Suggest extending the existing component.
- **No match:** Register as a new pattern after review.

---

## Commands

```bash
# Full pipeline: extract → generate → govern → learn
/design-agentic --mode full --figma_file "https://figma.com/file/..."

# Extract Figma tokens only
/design-agentic --mode extract --figma_file "..." --output design-tokens.ts

# Run governance audit
/design-agentic --mode audit --project ./apps/web

# Audit + auto-fix drift
/design-agentic --mode govern --fix

# Check consistency score
/design-agentic --mode audit --report-only

# Register component in pattern library
/design-agentic --register --component "components/ui/feature-card.tsx"
```

---

## Integration

| Workflow | How Agentic Design Connects |
|----------|------------------------------|
| `frontend-design-chooser.md` | Chooser picks style; agentic design enforces it |
| `ui-system.md` | Phase 0 chooser → agentic design governance |
| `options-engine.md` | Design system option feeds into governance rules |
| `code-audit-fix.md` | Design audit is part of the full code audit |
| `swe-bench-agent.md` | Quality gate includes design consistency check |
