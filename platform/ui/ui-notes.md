# Shared UI Kit — Design Notes

## Overview

A platform-level UI component library providing consistent, accessible primitives to every app built from `fullstack-template`. Eliminates per-app re-implementation of common UI patterns.

## Planned Primitives

### Core Components

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost, destructive variants. Loading state, icon slots. |
| `Card` | Content container with header, body, footer slots. Elevation variants. |
| `Input` | Text, email, password, number. Validation states, helper text, icon adornments. |
| `Select` | Single and multi-select with search/filter. Async option loading. |
| `Modal` | Dialog overlay with focus trap, backdrop click, ESC-to-close. |
| `Toast` | Notification toasts with auto-dismiss. Success, error, warning, info variants. |

### Layout Components

| Component | Description |
|-----------|-------------|
| `AppShell` | Top nav + sidebar + content area scaffold. Responsive collapse. |
| `Stack` | Vertical/horizontal flex layout with gap control. |
| `Grid` | Responsive CSS grid wrapper with breakpoint-aware column counts. |
| `Container` | Max-width centered container with consistent padding. |
| `Sidebar` | Collapsible sidebar nav with nested menu items. |

### Design Tokens

```css
/* Color palette */
--color-primary-50 … --color-primary-900
--color-neutral-50 … --color-neutral-900
--color-success, --color-warning, --color-error

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--text-xs … --text-4xl

/* Spacing */
--space-1 … --space-16  /* 4px scale */

/* Radii */
--radius-sm, --radius-md, --radius-lg, --radius-full

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg
```

### Accessibility

- All interactive components meet **WCAG 2.1 AA**.
- Keyboard navigation and focus management built in.
- ARIA attributes auto-applied where appropriate.
- Reduced-motion media query support on all animations.

## Tech Stack (Planned)

- **React 19** with server component compatibility.
- **Tailwind CSS** for styling internals, exposed via design tokens.
- **Radix UI** as the headless primitive layer (accessibility, focus management).
- **Storybook** for documentation and visual testing.

## Open Questions

- Ship as a local workspace package, or publish to a private npm registry?
- Include Tailwind config preset, or keep the kit framework-agnostic via CSS custom properties?
- Should the kit include higher-level patterns (DataTable, Form builder), or stay strictly primitive?

## Status

**Not implemented.** This file captures the target design for future extraction.
