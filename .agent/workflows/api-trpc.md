---
description: "Set up tRPC + Zod type-safe API with auth middleware, OpenAPI docs, and streaming"
---

# API tRPC Workflow

> Bootstrap an end-to-end type-safe API layer using tRPC, Zod, and NextAuth.

---

## Phase 1 — INSTALL & CONFIGURE

1. **Install tRPC stack:**
   ```bash
   npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
   npm install @tanstack/react-query superjson zod
   ```

2. **Create tRPC initialization** — `server/trpc.ts`:
   - Use `superjson` transformer for Date/BigInt support.
   - Add Zod error formatter.
   - Export `router`, `publicProcedure`, `protectedProcedure`.
   - Reference `.agent/capabilities/api-enterprise.md` for the exact setup.

3. **Create context** — `server/context.ts`:
   - Accept `NextRequest`.
   - Resolve session from NextAuth.
   - Inject database client (Prisma, Drizzle, or raw pg).

4. **⏸️ STOP — Verify tRPC initializes without errors.**

---

## Phase 2 — ROUTERS

1. **Create domain routers** in `server/routers/`:
   - One file per domain (e.g., `user.ts`, `project.ts`, `billing.ts`).
   - Every procedure has a Zod `.input()` schema.
   - Mutations and queries are separate.

2. **Create app router** — `server/routers/_app.ts`:
   ```typescript
   export const appRouter = router({
     user: userRouter,
     project: projectRouter,
     // ...
   });
   export type AppRouter = typeof appRouter;
   ```

3. **Wire to Next.js API route** — `app/api/trpc/[trpc]/route.ts`:
   ```typescript
   import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
   import { appRouter } from "@/server/routers/_app";

   const handler = (req: Request) =>
     fetchRequestHandler({ endpoint: "/api/trpc", req, router: appRouter, createContext });

   export { handler as GET, handler as POST };
   ```

---

## Phase 3 — MIDDLEWARE

1. **Auth middleware** — require valid session, inject user into context.
2. **Rate limiting middleware** — use Upstash Redis (or in-memory for dev). Reference `api-enterprise.md`.
3. **Logging middleware** — log every procedure call with path, type, duration, result status.
4. **Role middleware** — `adminProcedure`, `viewerProcedure` etc.

Stack order: `logging → rateLimit → auth → role → procedure`.

---

## Phase 4 — OPENAPI DOCS

1. **Install trpc-openapi:**
   ```bash
   npm install trpc-openapi
   ```

2. **Add `.meta()` to public procedures** with OpenAPI method, path, and tags.

3. **Generate OpenAPI document** — serve at `/api/openapi.json`.

4. **Add Swagger UI** — serve at `/api/docs`:
   ```bash
   npm install swagger-ui-react
   ```

5. **⏸️ STOP — Verify `/api/docs` shows all endpoints with schemas.**

---

## Phase 5 — CLIENT SETUP

1. **Create tRPC client** — `lib/trpc.ts`:
   ```typescript
   import { createTRPCReact } from "@trpc/react-query";
   import type { AppRouter } from "@/server/routers/_app";

   export const api = createTRPCReact<AppRouter>();
   ```

2. **Wrap app in providers** — `app/providers.tsx`:
   ```typescript
   export function Providers({ children }: { children: React.ReactNode }) {
     const [queryClient] = useState(() => new QueryClient());
     const [trpcClient] = useState(() =>
       api.createClient({
         links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
       })
     );
     return (
       <api.Provider client={trpcClient} queryClient={queryClient}>
         <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
       </api.Provider>
     );
   }
   ```

3. **Use in components:**
   ```typescript
   const { data, isLoading } = api.user.getById.useQuery({ id: "abc" });
   const mutation = api.user.update.useMutation();
   ```

---

## Phase 6 — STREAMING (optional)

1. **Add subscription router** for real-time data — see `api-enterprise.md` streaming section.
2. **Or use SSE** via Next.js App Router API routes for simpler streaming.

---

## Verify

1. **Type safety** — change a Zod schema and confirm TypeScript errors appear on the client.
2. **Auth** — call a `protectedProcedure` without a session → expect `UNAUTHORIZED`.
3. **Rate limit** — exceed the limit → expect `TOO_MANY_REQUESTS`.
4. **OpenAPI** — visit `/api/docs` and test endpoints in the Swagger UI.
