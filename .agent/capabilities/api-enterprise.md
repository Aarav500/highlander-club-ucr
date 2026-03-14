# API Enterprise

> Reference for building end-to-end type-safe APIs with tRPC, Zod validation, middleware, OpenAPI docs, and streaming.

---

## tRPC + Zod End-to-End Type Safety

### Server Setup

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
```

### Router Pattern

```typescript
// server/routers/user.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.user.findUniqueOrThrow({ where: { id: input.id } });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.user.update({ where: { id: input.id }, data: input });
    }),
});
```

### Client Usage (Next.js)

```typescript
// In a React Server Component or client component
const user = api.user.getById.useQuery({ id: "abc-123" });
const updateUser = api.user.update.useMutation();
```

---

## Rate Limiting

### Token Bucket (per-user)

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),  // 100 requests per minute
  analytics: true,
});

// tRPC middleware
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const { success, limit, remaining } = await ratelimit.limit(ctx.userId);
  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil(remaining)}s.`,
    });
  }
  return next();
});
```

### Tier-Based Limits

| Tier | Requests/min | Burst | Concurrent |
|------|-------------|-------|------------|
| Free | 60 | 10 | 5 |
| Pro | 600 | 50 | 20 |
| Enterprise | 6000 | 200 | 100 |

---

## Auth Middleware

```typescript
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const session = await getServerAuthSession(ctx);
  if (!session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: session.user } });
});

// Role-based
const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next();
});
```

---

## Logging Middleware

```typescript
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = performance.now();
  const result = await next();
  const duration = Math.round(performance.now() - start);
  console.log(JSON.stringify({
    trpc: true, path, type, duration,
    ok: result.ok,
    timestamp: new Date().toISOString(),
  }));
  return result;
});
```

---

## OpenAPI / Swagger Auto-Docs

```typescript
import { generateOpenApiDocument } from "trpc-openapi";

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "My App API",
  version: "2.0.0",
  baseUrl: process.env.API_URL ?? "http://localhost:3000/api",
  docsUrl: "https://docs.myapp.com",
});

// Serve at /api/openapi.json
// Use Swagger UI at /api/docs
```

### Adding OpenAPI Metadata to Procedures

```typescript
getById: protectedProcedure
  .meta({ openapi: { method: "GET", path: "/users/{id}", tags: ["Users"] } })
  .input(z.object({ id: z.string().uuid() }))
  .output(userSchema)
  .query(/* ... */),
```

---

## Streaming Responses

```typescript
// For large datasets — use tRPC subscriptions or SSE
import { observable } from "@trpc/server/observable";

streamData: publicProcedure
  .input(z.object({ query: z.string() }))
  .subscription(({ input }) => {
    return observable<DataChunk>((emit) => {
      const stream = db.streamQuery(input.query);
      stream.on("data", (chunk) => emit.next(chunk));
      stream.on("end", () => emit.complete());
      stream.on("error", (err) => emit.error(err));
      return () => stream.destroy();
    });
  }),
```

### Server-Sent Events (Alternative)

```typescript
// app/api/stream/route.ts (Next.js App Router)
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of dataGenerator()) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
```
