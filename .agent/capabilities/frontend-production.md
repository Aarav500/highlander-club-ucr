# Frontend Production

> Reference for building production-grade frontends with modern UI, charting, forms, auth, and responsive/mobile patterns.

---

## UI System: shadcn/ui + Tailwind + Framer Motion

### Setup

```bash
# Init shadcn/ui in a Next.js project
npx -y shadcn@latest init
npx -y shadcn@latest add button card dialog input label select tabs toast
```

### Tailwind Config (Dark + Glassmorphism)

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.1)",
          hover: "rgba(255, 255, 255, 0.08)",
        },
      },
      backdropBlur: {
        glass: "16px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.37)",
        "glass-inset": "inset 0 0 0 1px rgba(255, 255, 255, 0.06)",
      },
    },
  },
};
export default config;
```

### Glassmorphism Component Pattern

```tsx
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-glass-border bg-glass-bg",
        "backdrop-blur-glass shadow-glass shadow-glass-inset",
        "p-6 transition-colors hover:bg-glass-hover",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
```

### Framer Motion Patterns

```tsx
// Stagger children animation
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

---

## Charts: Recharts + D3 + Three.js

### Recharts (Standard Charts)

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function MetricsChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="time" stroke="#666" />
        <YAxis stroke="#666" />
        <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none" }} />
        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### D3 (Custom Visualizations)

Use D3 for force-directed graphs, Sankey diagrams, and custom data visualizations that Recharts cannot handle. Integrate via `useRef` + `useEffect` in React.

### Three.js (3D Orbital / 3D Data)

```bash
npm install three @react-three/fiber @react-three/drei
```

Use `@react-three/fiber` for declarative Three.js in React. Ideal for 3D dashboards, globe visualizations, and orbital mechanics displays.

---

## Forms: React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "user", "viewer"]),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register("email")} error={errors.email?.message} />
      <Input {...register("password")} type="password" error={errors.password?.message} />
      <Select {...register("role")} options={["admin", "user", "viewer"]} />
      <Button type="submit">Sign In</Button>
    </form>
  );
}
```

---

## Auth: NextAuth + Clerk

### NextAuth (Self-Hosted)

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub, Google],
  callbacks: {
    session: ({ session, user }) => ({ ...session, user: { ...session.user, id: user.id } }),
  },
});
```

### Clerk (Managed Auth — Enterprise)

```bash
npm install @clerk/nextjs
```

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html><body>{children}</body></html>
    </ClerkProvider>
  );
}
```

**When to choose:**
- **NextAuth** → full control, self-hosted, custom DB.
- **Clerk** → fast setup, enterprise SSO (SAML/SCIM), prebuilt UI components.

---

## Mobile / Responsive

### Tailwind Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### React Native Web

For shared components between Next.js and React Native, use `react-native-web`:

```bash
npm install react-native-web
```

Configure Next.js to alias `react-native` → `react-native-web` via `next.config.js`.

---

## Next.js 16 + React 19 (V3.0)

### React Compiler — Zero Manual Memoization

```tsx
// ❌ Before (React 18)
const MemoizedChart = React.memo(({ data }: Props) => {
  const processed = useMemo(() => transform(data), [data]);
  const handleClick = useCallback(() => onSelect(data.id), [data.id]);
  return <Chart data={processed} onClick={handleClick} />;
});

// ✅ After (React 19 Compiler — auto-memoized)
function Chart({ data }: Props) {
  const processed = transform(data);
  const handleClick = () => onSelect(data.id);
  return <ChartView data={processed} onClick={handleClick} />;
}
// Compiler inserts optimal memoization at build time
```

### Enable React Compiler

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    reactCompiler: true,    // React 19 Compiler
    turbopack: true,        // Turbopack for dev + production
    ppr: "incremental",     // Partial Prerendering
  },
};
export default nextConfig;
```

### Server Actions + Mutations (No API Routes Needed)

```tsx
// app/actions/portfolio.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const TradeSchema = z.object({
  symbol: z.string().min(1).max(10),
  quantity: z.number().positive(),
  side: z.enum(["buy", "sell"]),
});

export async function executeTrade(formData: FormData) {
  const parsed = TradeSchema.parse({
    symbol: formData.get("symbol"),
    quantity: Number(formData.get("quantity")),
    side: formData.get("side"),
  });

  const result = await db.trades.create({ data: parsed });
  revalidatePath("/portfolio");
  return { success: true, tradeId: result.id };
}

// Used directly in forms — no API route, no fetch()
// app/portfolio/page.tsx
import { executeTrade } from "@/app/actions/portfolio";

export default function TradePage() {
  return (
    <form action={executeTrade}>
      <input name="symbol" placeholder="AAPL" />
      <input name="quantity" type="number" />
      <select name="side">
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>
      <button type="submit">Execute Trade</button>
    </form>
  );
}
```

### Turbopack — 10x Faster Builds

```bash
# Dev mode (default in Next.js 16)
next dev --turbopack

# Production build (new in v16)
next build --turbopack
```

| Metric | Webpack (v15) | Turbopack (v16) | Speedup |
|--------|--------------|----------------|---------|
| Dev cold start | 8.2s | 1.1s | **7.5x** |
| HMR (file update) | 320ms | 12ms | **27x** |
| Production build | 45s | 4.5s | **10x** |
| Incremental build | 12s | 0.8s | **15x** |

### App Router v2 — Parallel Routes + Intercepting Routes

```
app/
├── @modal/             # Parallel route slot
│   ├── (.)photo/[id]/  # Intercept /photo/[id] as modal
│   │   └── page.tsx
│   └── default.tsx
├── @sidebar/           # Another parallel slot
│   ├── default.tsx
│   └── feed/page.tsx
├── layout.tsx          # Renders both slots simultaneously
└── page.tsx
```

```tsx
// app/layout.tsx — renders parallel routes
export default function Layout({
  children,
  modal,
  sidebar,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="flex">
      <aside className="w-64">{sidebar}</aside>
      <main className="flex-1">{children}</main>
      {modal}
    </div>
  );
}
```

### Partial Prerendering (PPR)

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";

// Static shell is pre-rendered at build time
// Dynamic parts stream in at request time
export default function Dashboard() {
  return (
    <div>
      <h1>Portfolio Dashboard</h1>  {/* Static — pre-rendered */}
      <Suspense fallback={<Skeleton />}>
        <PortfolioValue />  {/* Dynamic — streams in */}
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <LiveChart />  {/* Dynamic — streams in */}
      </Suspense>
    </div>
  );
}
```
