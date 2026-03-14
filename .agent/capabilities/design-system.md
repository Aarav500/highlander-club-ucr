# Design System (Enterprise Glassmorphism)

> Reference for building premium UI with shadcn/ui v2, Radix UI, Framer Motion v12, Three.js r170, Magic UI, and Tailwind v4.

---

## shadcn/ui v2 + Radix UI Primitives

### Setup

```bash
# Init in a Next.js 15+ / React 19 project
npx -y shadcn@latest init --defaults --css-variables

# Add core components
npx -y shadcn@latest add button card dialog drawer input label \
  select tabs toast tooltip popover command sheet separator \
  badge avatar dropdown-menu navigation-menu

# Radix primitives (auto-installed by shadcn)
# @radix-ui/react-dialog, @radix-ui/react-popover, @radix-ui/react-tooltip, etc.
```

### Component Architecture

```
components/
├── ui/               # shadcn/ui primitives (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── glass/            # Custom glassmorphism wrappers
│   ├── glass-card.tsx
│   ├── glass-panel.tsx
│   ├── glass-modal.tsx
│   └── glass-navbar.tsx
├── charts/           # Data visualization
│   ├── area-chart.tsx
│   ├── metric-card.tsx
│   └── orbital-view.tsx
└── layouts/          # Page layouts
    ├── dashboard-layout.tsx
    ├── sidebar-layout.tsx
    └── auth-layout.tsx
```

### Radix Patterns

```tsx
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

function GlassDialog({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <AnimatePresence>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-full max-w-lg rounded-2xl
                         bg-white/5 border border-white/10 backdrop-blur-xl
                         shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              {children}
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

---

## Framer Motion v12 + React 19 Compiler

### Setup

```bash
npm install framer-motion@^12
```

### Key v12 Features

| Feature | Description |
|---------|-------------|
| **React 19 Compiler** | Auto-memoization — no manual `useCallback`/`useMemo` needed |
| **Layout animations** | `layoutId` for shared element transitions between routes |
| **Scroll-linked** | `useScroll` + `useMotionValueEvent` for parallax effects |
| **View transitions** | Native View Transition API integration |
| **Mini runtime** | `motion/mini` — 50% smaller bundle for simple animations |

### Animation Presets

```tsx
// presets/motion.ts — reusable animation configs
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring", stiffness: 200, damping: 20 },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

// Scroll-triggered reveal
export const scrollReveal = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6 },
};
```

### Shared Layout Transitions

```tsx
import { motion, LayoutGroup } from "framer-motion";

function DashboardCards({ cards }: { cards: Card[] }) {
  return (
    <LayoutGroup>
      {cards.map((card) => (
        <motion.div key={card.id} layoutId={card.id} className="glass-card">
          <h3>{card.title}</h3>
          <motion.p layout="position">{card.value}</motion.p>
        </motion.div>
      ))}
    </LayoutGroup>
  );
}
```

---

## Three.js r170 — Orbital 3D

### Setup

```bash
npm install three@^0.170 @react-three/fiber@^9 @react-three/drei@^10
```

### 3D Globe / Orbital Dashboard

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Sphere, Html } from "@react-three/drei";

function OrbitalView({ dataPoints }: { dataPoints: DataPoint3D[] }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />

      {/* Earth / Globe */}
      <Sphere args={[1, 64, 64]}>
        <meshStandardMaterial
          color="#1a1a2e"
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>

      {/* Data Points on Globe */}
      {dataPoints.map((point) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color={point.color} emissive={point.color} emissiveIntensity={0.5} />
          <Html distanceFactor={8}>
            <div className="glass-tooltip text-xs px-2 py-1">{point.label}</div>
          </Html>
        </mesh>
      ))}

      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
```

### Performance Guidelines

- Use `<Suspense>` + `useLoader` for async asset loading.
- Cap polygon count: < 100K for dashboards, < 500K for dedicated 3D views.
- Use `instancedMesh` for repeated geometries (e.g., scatter plots).
- Enable `frameloop="demand"` on `<Canvas>` for static scenes (saves GPU).

---

## Magic UI — Prebuilt Glass Components

### Setup

```bash
npx -y magicui@latest init
npx -y magicui@latest add animated-beam bento-grid blur-fade globe \
  magic-card marquee meteors number-ticker particles shimmer-button
```

### Key Components

| Component | Use Case |
|-----------|----------|
| `AnimatedBeam` | Connect nodes with animated lines (architecture diagrams) |
| `BentoGrid` | Multi-size card grid (dashboard layouts) |
| `BlurFade` | Staggered blur-to-focus reveal on scroll |
| `Globe` | Interactive 3D globe (geographic data) |
| `MagicCard` | Hover-glow glassmorphism card |
| `Marquee` | Infinite scroll for logos, metrics, testimonials |
| `Meteors` | Background particle effects |
| `NumberTicker` | Animated number counting |
| `ShimmerButton` | Premium CTA button with shimmer effect |

### Usage Pattern

```tsx
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";

function MetricDashboard({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((m) => (
        <MagicCard key={m.id} className="p-6" gradientColor="#8b5cf620">
          <p className="text-sm text-white/50">{m.label}</p>
          <NumberTicker value={m.value} className="text-3xl font-bold text-white" />
        </MagicCard>
      ))}
    </div>
  );
}
```

---

## Tailwind v4 — CSS-First Config

### Setup

```bash
npm install tailwindcss@^4
```

### CSS-First Configuration

```css
/* app/globals.css — Tailwind v4 uses CSS-native config */
@import "tailwindcss";

@theme {
  /* Color Palette */
  --color-glass-bg: oklch(0.2 0.01 260 / 0.6);
  --color-glass-border: oklch(1 0 0 / 0.1);
  --color-glass-hover: oklch(1 0 0 / 0.08);

  --color-accent: oklch(0.7 0.15 280);       /* Purple */
  --color-accent-hover: oklch(0.75 0.17 280);
  --color-success: oklch(0.75 0.18 155);      /* Green */
  --color-warning: oklch(0.8 0.15 80);        /* Amber */
  --color-danger: oklch(0.65 0.2 25);         /* Red */

  /* Typography */
  --font-sans: "Inter", "system-ui", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Shadows */
  --shadow-glass: 0 8px 32px oklch(0 0 0 / 0.37);
  --shadow-glass-inset: inset 0 0 0 1px oklch(1 0 0 / 0.06);

  /* Animations */
  --animate-fade-up: fade-up 0.5s ease-out;
  --animate-glow: glow 2s ease-in-out infinite alternate;
}

/* Custom glassmorphism utilities */
@utility glass {
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(16px) saturate(180%);
  box-shadow: var(--shadow-glass), var(--shadow-glass-inset);
}

@utility glass-hover {
  &:hover {
    background: var(--color-glass-hover);
    border-color: oklch(1 0 0 / 0.15);
  }
}

@utility glass-card {
  @apply glass glass-hover rounded-2xl p-6 transition-all duration-300;
}

/* Keyframes */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes glow {
  from { box-shadow: 0 0 20px oklch(0.7 0.15 280 / 0.3); }
  to { box-shadow: 0 0 40px oklch(0.7 0.15 280 / 0.6); }
}
```

### Design Tokens Quick Reference

| Token | Value | Usage |
|-------|-------|-------|
| `glass` | Blur + border + shadow | Any glass container |
| `glass-card` | Full glass card preset | Dashboard cards, panels |
| `text-accent` | `oklch(0.7 0.15 280)` | Primary actions, links |
| `font-sans` | Inter | Body text |
| `font-mono` | JetBrains Mono | Code, metrics |
| `animate-fade-up` | 0.5s ease-out slide | Page section reveals |
| `animate-glow` | 2s pulsing glow | Highlighted elements |

### Typography Scale

```css
@utility heading-xl { @apply text-5xl font-bold tracking-tight leading-tight; }
@utility heading-lg { @apply text-3xl font-semibold tracking-tight; }
@utility heading-md { @apply text-xl font-semibold; }
@utility body-lg    { @apply text-lg leading-relaxed text-white/70; }
@utility body-md    { @apply text-base leading-relaxed text-white/60; }
@utility body-sm    { @apply text-sm text-white/50; }
@utility mono-sm    { @apply font-mono text-sm text-accent; }
```
