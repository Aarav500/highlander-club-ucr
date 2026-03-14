---
description: "Upgrade Next.js 15 → 16 with React 19 Compiler and Turbopack"
---

# Next.js 16 + React 19 Compiler Upgrade

> Migration workflow for upgrading to Next.js 16 with the React Compiler, Turbopack default, and new async APIs.

---

## Pre-Upgrade Checklist

- [ ] Current app runs without errors on Next.js 15
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Git working tree is clean

---

## Phase 1: Dependency Upgrade

1. **Upgrade Next.js and React:**
   ```bash
   cd apps/web
   npm install next@16 react@19 react-dom@19 @types/react@19 @types/react-dom@19
   ```

2. **Run the codemod** (automatic migration of breaking changes):
   ```bash
   npx @next/codemod@latest upgrade
   ```

3. **Verify `package.json`** — confirm versions:
   ```json
   {
     "next": "^16.0.0",
     "react": "^19.0.0",
     "react-dom": "^19.0.0"
   }
   ```

---

## Phase 2: Enable React Compiler

1. **Update `next.config.ts`:**
   ```typescript
   import type { NextConfig } from 'next';

   const nextConfig: NextConfig = {
     experimental: {
       reactCompiler: true,    // ← Enable React Compiler
       // ppr: true,           // Partial Pre-Rendering (optional)
     },
   };

   export default nextConfig;
   ```

2. **Remove manual memoization** — the React Compiler handles this automatically:
   ```diff
   - import { useMemo, useCallback, memo } from 'react';
   + // React Compiler auto-optimizes — manual memo removed
   
   - const memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);
   + const memoizedValue = computeExpensive(a, b);
   
   - const memoizedCallback = useCallback(() => handleClick(id), [id]);
   + const memoizedCallback = () => handleClick(id);
   
   - export default memo(MyComponent);
   + export default MyComponent;
   ```

3. **⏸️ STOP — Verify the app builds and runs correctly after enabling the compiler.**

---

## Phase 3: Async API Migration

Next.js 16 changes several APIs to be async:

1. **Dynamic params / searchParams** — now `Promise`-based:
   ```typescript
   // Before (Next.js 15)
   export default function Page({ params }: { params: { id: string } }) {
     return <div>{params.id}</div>;
   }

   // After (Next.js 16)
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
     return <div>{id}</div>;
   }
   ```

2. **`cookies()` and `headers()`** — now async:
   ```typescript
   // Before
   const cookieStore = cookies();
   
   // After
   const cookieStore = await cookies();
   ```

3. **Run codemod for async APIs:**
   ```bash
   npx @next/codemod@latest next-async-request-api ./apps/web
   ```

---

## Phase 4: Turbopack (Default in Next.js 16)

1. Turbopack is now the **default bundler** for `next dev` — no config needed.

2. **Remove explicit Turbopack flags** if present:
   ```diff
   // package.json
   {
     "scripts": {
   -   "dev": "next dev --turbopack",
   +   "dev": "next dev",
     }
   }
   ```

3. **Verify dev server starts** with Turbopack:
   ```bash
   npm run dev
   # Should show "▲ Next.js 16.x.x" with "Turbopack" in output
   ```

---

## Phase 5: Breaking Change Audit

| Change | Impact | Fix |
|--------|--------|-----|
| `next/dynamic` SSR default | Components SSR by default | Add `ssr: false` explicitly if needed |
| Removed `next/amp` | AMP pages break | Migrate to static HTML |
| `instrumentation.ts` stable | No longer experimental | Remove `experimental.instrumentationHook` |
| `NextRequest` geo/ip | Removed | Use middleware platform APIs |
| `next.config.js` → `.ts` | Config format | Rename and add types |

---

## Phase 6: Verification

1. **Build:**
   ```bash
   cd apps/web && npm run build
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Lighthouse audit:**
   ```bash
   npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse.json
   ```

4. **Verify React Compiler is active:**
   - Open React DevTools in browser
   - Components should show "Memo ✓" badges automatically
   - No manual `memo()` wrappers needed

5. **⏸️ STOP — All tests pass, build succeeds, compiler active.**

---

## Commands

```bash
# Full upgrade (interactive)
/next16-upgrade --app web

# Dry-run (shows what would change)
/next16-upgrade --app web --dry-run

# Just enable React Compiler (skip version upgrade)
/next16-upgrade --compiler-only

# Verify upgrade was successful
/next16-upgrade --verify
```
