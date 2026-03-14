# Code Audit & Fix

> Reference for comprehensive code quality scanning, testing, security analysis, and automated fix generation.

---

## Linting: ESLint + Biome + TypeScript Strict

### ESLint Config (Flat Config)

```javascript
// eslint.config.mjs
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
    },
  }
);
```

### Biome (Fast Alternative)

```bash
npx @biomejs/biome init
npx @biomejs/biome check --apply .
```

```json
// biome.json
{
  "formatter": { "enabled": true, "indentWidth": 2 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "error" },
      "suspicious": { "noExplicitAny": "error" }
    }
  }
}
```

### TypeScript Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

---

## Testing: Vitest + Playwright + MSW

### Vitest (Unit + Integration)

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
  },
});
```

```typescript
// tests/example.test.ts
import { describe, it, expect } from "vitest";

describe("calculatePrice", () => {
  it("applies discount correctly", () => {
    expect(calculatePrice(100, 0.2)).toBe(80);
  });

  it("clamps to zero", () => {
    expect(calculatePrice(10, 2.0)).toBe(0);
  });
});
```

### Playwright (E2E)

```typescript
// e2e/checkout.spec.ts
import { test, expect } from "@playwright/test";

test("complete checkout flow", async ({ page }) => {
  await page.goto("/products");
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout-button"]');
  await page.fill('[name="email"]', "test@example.com");
  await page.click('[data-testid="pay-button"]');
  await expect(page.locator(".confirmation")).toContainText("Order confirmed");
});
```

### MSW (API Mocking)

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users/:id", ({ params }) => {
    return HttpResponse.json({ id: params.id, name: "Test User" });
  }),
  http.post("/api/orders", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ orderId: "ord_123", ...body }, { status: 201 });
  }),
];
```

---

## Security: Snyk + npm audit + OWASP ZAP

### npm audit

```bash
# Check for vulnerabilities
npm audit

# Auto-fix non-breaking updates
npm audit fix

# Force fix (may include breaking changes — review carefully)
npm audit fix --force
```

### Snyk

```bash
# Install and authenticate
npm install -g snyk
snyk auth

# Test for vulnerabilities
snyk test

# Monitor continuously
snyk monitor

# Fix vulnerabilities
snyk fix
```

### OWASP ZAP (Dynamic Analysis)

```bash
# Docker run — baseline scan against running app
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://localhost:3000 \
  -r report.html

# Full scan (takes longer, finds more)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t http://localhost:3000 \
  -r full-report.html
```

### Security Checklist

| Category | Check | Tool |
|----------|-------|------|
| Dependencies | No known CVEs | npm audit, Snyk |
| Secrets | No hardcoded secrets | git-secrets, trufflehog |
| Headers | CSP, HSTS, X-Frame-Options | helmet.js |
| Auth | Session management, CSRF | OWASP ZAP |
| Input | SQL injection, XSS | OWASP ZAP, ESLint |
| API | Rate limiting, auth on all routes | Manual review |

---

## Auto-Fix PR Generation

### Workflow

1. **Scan** — run all tools: `eslint`, `biome`, `tsc`, `vitest`, `npm audit`, `snyk`.
2. **Categorize** — group findings into: lint, type errors, test failures, security vulns.
3. **Prioritize** — critical security > type errors > failing tests > lint warnings.
4. **Fix** — apply automated fixes where safe:
   - `eslint --fix` for lint issues.
   - `biome check --apply` for formatting/lint.
   - `npm audit fix` for non-breaking dependency updates.
5. **Branch** — create `fix/code-audit-YYYY-MM-DD` branch.
6. **PR** — open PR with:
   - Summary of all fixes applied.
   - Remaining issues that require manual review.
   - Before/after metrics (lint errors, type errors, test pass rate, vuln count).

### PR Template

```markdown
## Code Audit Fix — [Date]

### Automated Fixes Applied
- [ ] 12 ESLint errors fixed (unused vars, missing types)
- [ ] 3 npm audit vulnerabilities resolved (minor bumps)
- [ ] TypeScript strict mode violations corrected

### Remaining (Manual Review Required)
- ⚠️ 2 Snyk high-severity vulns (breaking upgrade needed for `package-x`)
- ⚠️ 1 failing E2E test (`checkout.spec.ts` — likely flaky)

### Metrics
| Metric | Before | After |
|--------|--------|-------|
| Lint errors | 47 | 0 |
| Type errors | 12 | 0 |
| Test pass rate | 89% | 97% |
| Vulnerabilities | 5 | 2 |
```
