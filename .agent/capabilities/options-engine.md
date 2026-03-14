# Options Engine — Multi-Domain Stack Selection

> Case-by-case selection system: the agent chooses the best UI, backend, deploy, and mobile stack per project/page instead of hardcoding one design system.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Options Engine v1.0                           │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Frontend    │  Backend     │  Deploy      │  Mobile            │
│  Chooser     │  Chooser     │  Chooser     │  Chooser           │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ 25+ options  │ 12+ options  │ 8+ options   │ 6+ options         │
│ Design sys   │ Frameworks   │ Platforms    │ Cross-platform     │
│ Visual style │ Databases    │ Edge/Server  │ Native/Hybrid      │
│ Layout arch. │ Auth         │ Serverless   │ App Store ready    │
│ Motion level │ ORM          │ Container    │                    │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────────┘
       │              │              │                │
       └──────────────┼──────────────┘                │
                      ▼                               ▼
             ┌────────────────┐              ┌────────────────┐
             │ Decision Matrix│              │ Design History │
             │ Rules + Scores │              │ Learn from past│
             └────────────────┘              └────────────────┘
```

---

## Frontend Catalog (25+ Options)

### Design Systems

| ID | Library | Bundle (KB) | A11y | Best For | Avoid When |
|----|---------|-------------|------|----------|------------|
| `shadcn-ui` | shadcn/ui v2 | 0 (copy-paste) | ★★★★★ | Full control, Tailwind-first | Need prebuilt complex widgets |
| `mui-v7` | Material UI v7 | 85 | ★★★★☆ | Enterprise theming, data grids | Bundle-sensitive, custom design |
| `mantine-v8` | Mantine v8 | 45 | ★★★★★ | TypeScript-first, hooks | Non-React stacks |
| `chakra-v3` | Chakra UI v3 | 50 | ★★★★★ | Accessible, composable | Maximum bundle optimization |
| `ant-design-v6` | Ant Design v6 | 120 | ★★★★☆ | Data tables, forms-heavy, admin | Small marketing sites |
| `headless-ui` | Headless UI + Tailwind | 12 | ★★★★★ | Max control, minimal bundle | Rapid prototyping |
| `radix-ui` | Radix UI + Stitches | 15 | ★★★★★ | Unstyled primitives, composable | Quick-ship MVPs |
| `magic-ui` | Magic UI | 20 | ★★★☆☆ | Glassmorphism, landing pages | Data-heavy dashboards |
| `daisy-ui` | DaisyUI | 5 (plugin) | ★★★★☆ | Rapid prototyping, 500+ components | Deep customization |
| `flowbite` | Flowbite | 8 (plugin) | ★★★★☆ | Tailwind blocks, marketing | Complex interactive apps |
| `park-ui` | Park UI (Ark) | 18 | ★★★★★ | Multi-framework (React, Solid, Vue) | React-only projects |
| `next-ui` | NextUI v3 | 30 | ★★★★☆ | Beautiful defaults, Next.js-native | Non-Next.js projects |
| `tremor` | Tremor | 40 | ★★★★☆ | Analytics dashboards, charts | Non-dashboard pages |
| `aceternity-ui` | Aceternity UI | 10 | ★★★☆☆ | Animated landing pages, hero sections | Accessible-first projects |
| `tailwind-only` | Pure Tailwind | 0 | ★★★★★ | Full control, zero dependency | Need prebuilt components |

### Visual Styles

| ID | Style | Characteristics | Best For |
|----|-------|-----------------|----------|
| `glassmorphism` | Glassmorphism | Blur, transparency, depth, frosted glass | Dashboards, premium dark UI |
| `flat-minimal` | Flat Minimal | Clean lines, whitespace, monochromatic | SaaS, tools, docs |
| `brutalist` | Brutalist | Raw, bold typography, visible grid | Creative, experimental |
| `neumorphism` | Neumorphism | Soft shadows, pressed/raised effect | Calculator, simple controls |
| `sci-fi` | Sci-Fi / Cyberpunk | Neon accents, HUD-style, dark | Gaming, space, security |
| `corporate` | Corporate | Professional, subtle, blue/gray | Finance, enterprise |
| `gradient-mesh` | Gradient Mesh | Colorful gradients, flowing shapes | Creative, marketing |
| `dark-luxury` | Dark Luxury | Gold/dark, premium feel | Fintech, crypto, luxury |
| `light-clean` | Light Clean | Bright backgrounds, clear hierarchy | Consumer, e-commerce |
| `retro-pixel` | Retro / Pixel | 8-bit, pixel fonts, chunky | Games, nostalgia |

### Layout Archetypes

| ID | Pattern | Sections | Best For |
|----|---------|----------|----------|
| `marketing-hero` | Marketing Hero | Hero → features → testimonials → CTA → footer | Landing pages, product pages |
| `feature-grid` | Feature Grid | Bento grid of feature cards | Feature overviews, pricing |
| `pricing-page` | Pricing | Tier cards → comparison table → FAQ | SaaS pricing |
| `dashboard-dense` | Dense Dashboard | Sidebar + top nav + grid of metric cards + charts | Analytics, admin panels |
| `dashboard-minimal` | Minimal Dashboard | Tabs + cards, no sidebar | Simple dashboards, settings |
| `forms-wizard` | Forms Wizard | Multi-step form with progress bar | Onboarding, checkout |
| `forms-single` | Single-Page Form | Clean centered form | Login, signup, settings |
| `data-admin` | Data Admin | Table + filters + bulk actions + detail drawer | CRUD admin, CMS |
| `data-explorer` | Data Explorer | Search → faceted filters → results grid | Catalog, search, marketplace |
| `mobile-bottom-nav` | Mobile Bottom Nav | Bottom tabs + cards + pull-to-refresh | Mobile-first apps |
| `mobile-cards` | Mobile Cards | Scrolling card feed | Social, feed-based |
| `docs-layout` | Documentation | Sidebar nav + content + ToC | Docs, knowledge base |
| `blank-canvas` | Blank Canvas | Empty, custom layout | Fully custom pages |

### Motion Levels

| ID | Level | Techniques | When to Use |
|----|-------|-----------|-------------|
| `none` | No Motion | Static rendering, instant transitions | Accessible, low-motion required, data-dense |
| `subtle` | Subtle | Hover effects, fade transitions, focus rings | Professional, enterprise, mobile |
| `rich` | Rich | Scroll-triggered, parallax, 3D, stagger | Marketing, portfolios, landing pages |
| `cinematic` | Cinematic | Page transitions, 3D camera, particles | Hero sections, creative showcase |

---

## Backend Catalog (12+ Options)

### Frameworks

| ID | Framework | Language | Best For |
|----|-----------|----------|----------|
| `trpc-zod` | tRPC + Zod | TypeScript | Type-safe fullstack, Next.js |
| `fastify` | Fastify | Node.js | High-performance API |
| `express` | Express | Node.js | Simple REST, ecosystem |
| `hono` | Hono | TS (Edge) | Edge functions, Cloudflare |
| `remix-loader` | Remix Loaders | TypeScript | Full-stack web, SSR |
| `redwood` | RedwoodJS | TypeScript | JAMstack, GraphQL |
| `nestjs` | NestJS | TypeScript | Enterprise, DI, modular |
| `fastapi` | FastAPI | Python | ML APIs, data science |
| `django-ninja` | Django Ninja | Python | Rapid API, admin panel |
| `rails-api` | Ruby on Rails | Ruby | Convention-over-config |

### Databases

| ID | Database | Type | Best For |
|----|----------|------|----------|
| `postgres` | PostgreSQL | Relational | General purpose, ACID |
| `supabase` | Supabase | Postgres-as-service | Auth + DB + storage |
| `planetscale` | PlanetScale | MySQL-compatible | Horizontal scale |
| `turso` | Turso (libSQL) | SQLite edge | Edge-deployed, low latency |
| `fauna` | Fauna | Document | Serverless, global |
| `mongodb` | MongoDB Atlas | Document | Flexible schema, rapid dev |
| `redis` | Redis / Dragonfly | KV / Cache | Caching, sessions, queues |
| `neon` | Neon | Serverless Postgres | Branching, autoscale |

### Auth

| ID | Provider | Type | Best For |
|----|----------|------|----------|
| `nextauth` | NextAuth.js | Self-hosted | Full control, custom DB |
| `clerk` | Clerk | Managed | Enterprise SSO, prebuilt UI |
| `lucia` | Lucia | Library | Lightweight, any framework |
| `supabase-auth` | Supabase Auth | Managed | Supabase stack |
| `auth0` | Auth0 | Managed | Enterprise, compliance |

---

## Deploy Catalog (8+ Options)

| ID | Platform | Type | Best For |
|----|----------|------|----------|
| `vercel` | Vercel | Serverless | Next.js, preview deploys |
| `netlify` | Netlify | Serverless | JAMstack, forms, functions |
| `cloudflare` | Cloudflare Pages | Edge | Global edge, Workers |
| `render` | Render | Container | Docker, managed infra |
| `fly-io` | Fly.io | Edge Container | Low-latency, multi-region |
| `railway` | Railway | Container | Simple deploys, Postgres |
| `k8s` | Kubernetes | Container | Full control, enterprise |
| `lambda` | AWS Lambda | Serverless | Event-driven, cost-optimized |

---

## Mobile Catalog (6+ Options)

| ID | Framework | Language | Platforms | Best For |
|----|-----------|----------|-----------|----------|
| `expo` | React Native Expo | TypeScript | iOS, Android | JS teams, rapid dev |
| `flutter` | Flutter 4.2 | Dart | iOS, Android, Web | Cross-platform pixel-perfect |
| `tauri` | Tauri 2.0 | Rust + Web | Desktop | Desktop wrapper for web apps |
| `capacitor` | Capacitor | TypeScript | iOS, Android | Web-to-native wrapper |
| `ionic` | Ionic | TypeScript | iOS, Android, Web | Hybrid, web developers |
| `nativescript` | NativeScript | TypeScript | iOS, Android | True native, Angular/Vue |

---

## Decision Matrix

The agent uses these rules to score and recommend options:

```yaml
# Rule format: condition → recommendation + score modifier
rules:
  frontend:
    - when: { page_type: "marketing", brand: "playful" }
      recommend: { design_system: "magic-ui", style: "gradient-mesh", motion: "rich" }
      reason: "Playful marketing needs visual wow-factor"

    - when: { page_type: "dashboard", constraints: ["data-dense"] }
      recommend: { design_system: "shadcn-ui", style: "glassmorphism", motion: "subtle", layout: "dashboard-dense" }
      reason: "Data dashboards need density, not distraction"

    - when: { page_type: "dashboard", brand: "enterprise" }
      recommend: { design_system: "ant-design-v6", style: "corporate", motion: "subtle", layout: "data-admin" }
      reason: "Enterprise expects professional, table-heavy UI"

    - when: { constraints: ["accessible", "low-motion"] }
      recommend: { design_system: "chakra-v3", style: "flat-minimal", motion: "none" }
      reason: "Chakra has best a11y defaults, flat reduces cognitive load"

    - when: { constraints: ["mobile-first"] }
      recommend: { layout: "mobile-bottom-nav", motion: "subtle" }
      reason: "Bottom nav + subtle transitions for thumb-zone UX"

    - when: { brand: "futuristic" }
      recommend: { style: "sci-fi", motion: "rich" }
      boost_score: ["magic-ui", "aceternity-ui"]

    - when: { brand: "finance" }
      recommend: { style: "dark-luxury", design_system: "tremor" }
      reason: "Finance needs trust + data viz"

  backend:
    - when: { page_type: "api-heavy", scale: "high" }
      recommend: { framework: "fastify", db: "neon" }

    - when: { tech_stack: "next.js" }
      recommend: { framework: "trpc-zod", db: "postgres" }

    - when: { constraints: ["edge"] }
      recommend: { framework: "hono", deploy: "cloudflare" }

  deploy:
    - when: { tech_stack: "next.js" }
      recommend: { platform: "vercel" }

    - when: { constraints: ["self-hosted", "enterprise"] }
      recommend: { platform: "k8s" }

    - when: { constraints: ["cost-sensitive"] }
      recommend: { platform: "railway" }
```

---

## Scoring Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Page-type fit | 30% | How well the option matches the page archetype |
| Brand alignment | 20% | Visual style match to brand keywords |
| Bundle efficiency | 15% | Smaller = better (KB, load time) |
| Accessibility | 15% | Built-in a11y features and WCAG compliance |
| Constraint match | 10% | Meets all hard constraints (mobile-first, low-motion, etc.) |
| Learning curve | 10% | Team familiarity, docs quality |

---

## Usage

The agent references this catalog + decision matrix when:
1. `/design-page` or `/options-choose` is invoked
2. `/ui-system` is run (Phase 0 calls chooser first)
3. Any new page or project is scaffolded via `/new-production-app`

See workflows: `frontend-design-chooser.md`, `options-engine.md`.
