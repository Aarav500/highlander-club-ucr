---
description: "SWE-bench 85%+ code quality agent — Cursor v4 + Claude 4.6 + Gemini 3.1 + ESLint v9 + Biome v2 + Oxlint + 5-agent PR review"
---

# SWE-Bench Agent Workflow (V8.0)

> Achieve SWE-bench 85%+ scores through agent-tuned linting, test-first generation, fault-injection testing, fuzzing, and 5-agent PR review simulation. Every code change goes through a quality pipeline that exceeds Fortune 500 standards.

---

## V8.0 Upgrades

| Feature | V7.0 | V8.0 |
|---------|------|------|
| IDE Integration | Cursor v3 + Claude Code | Cursor v4 Composer AI + Claude 4.6 + Gemini 3.1 |
| SWE-bench Target | 80%+ | **85%+ (Leaderboard Target)** |
| Linting | ESLint v9 + Biome v2 | + Oxlint (100× faster) + AI-assisted lint rules |
| Test Quality | Stryker mutation testing | + Fault-injection + fuzzing (AFL++ / Jazzer.js) |
| PR Review | 3-agent review | 5-agent review (+security-auditor, +perf-analyst) |
| Code Repair | Manual fix loop | AI code repair loop with auto-regression detection |
| CI Gate | Quality gate check | Benchmark CI gate (SWE-bench score tracking) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   SWE-Bench Agent Pipeline V8.0                         │
├───────────┬──────────┬──────────┬──────────┬──────────┬────────────────┤
│  Analyze  │  Lint    │  Test    │  Fuzz    │  Review  │  Ship          │
│  Issue    │  + Fix   │  First   │  + Fault │  5-Agent │  Quality       │
│  Context  │  Auto    │  + Cover │  Inject  │  Deep    │  Gate          │
├───────────┼──────────┼──────────┼──────────┼──────────┼────────────────┤
│ Read spec │ ESLint9  │ 85% cov │ AFL++    │ Reviewer │ 0 lint errors  │
│ Parse err │ Biome v2 │ Mutation │ Jazzer   │ Author   │ 95% type safe  │
│ Map files │ Oxlint   │ Vitest   │ Fault-In │ Verifier │ 85%+ coverage  │
│ Plan fix  │ AI-Rules │ E2E     │ Chaos    │ SecAudit │ All tests pass │
│ AI Repair │ 0 errors │ Fuzzing │ Regress  │ PerfAnl  │ SWE-bench 85%+ │
└───────────┴──────────┴──────────┴──────────┴──────────┴────────────────┘
```

---

## Inputs

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `task` | Yes | — | Issue description, bug report, or feature request |
| `scope` | No | auto-detect | File paths or git range to focus on |
| `coverage_target` | No | `85` | Minimum test coverage percentage |
| `review_depth` | No | `standard` | `quick`, `standard`, `deep`, `exhaustive` |
| `fuzz_duration` | No | `60s` | Fuzzing time per target |
| `benchmark` | No | `false` | Run SWE-bench scoring after completion |

---

## Phase 1 — Issue Analysis (Context Gathering)

1. **Parse the task** — extract intent, affected components, constraints.
2. **Map the codebase:**
   ```bash
   # Identify relevant files
   git log --oneline -20  # Recent changes
   grep -rn "<search_term>" --include="*.ts" --include="*.tsx"
   ```
3. **Build context window:**
   - Read CLAUDE.md for project conventions
   - Read relevant specs/plans
   - Identify test files that cover the affected code
   - Check for related open issues or recent changes

4. **AI Code Repair Loop (V8.0 NEW):**
   ```python
   class AICodeRepairLoop:
       """Self-healing code repair with multi-model consensus."""

       async def repair(self, issue: str, codebase: CodeContext) -> RepairResult:
           # Step 1: Generate candidate fixes from multiple models
           candidates = await asyncio.gather(
               self.claude_4_6.generate_fix(issue, codebase),
               self.gemini_3_1.generate_fix(issue, codebase),
               self.cursor_v4.generate_fix(issue, codebase),
           )

           # Step 2: Score each fix
           scored = []
           for fix in candidates:
               score = await self.evaluate_fix(fix, codebase)
               scored.append((fix, score))

           # Step 3: Select best fix, apply, verify
           best_fix = max(scored, key=lambda x: x[1])
           result = await self.apply_and_verify(best_fix[0], codebase)

           # Step 4: Auto-regression detection
           if result.regression_detected:
               return await self.repair(issue, codebase)  # Recursive repair

           return result
   ```

5. **Produce analysis artifact:**
   ```markdown
   ## Issue Analysis
   **Task:** <description>
   **Affected files:** <list>
   **Root cause hypothesis:** <analysis>
   **Proposed approach:** <plan>
   **Risk areas:** <what could break>
   **Estimated SWE-bench impact:** <score delta>
   ```

---

## Phase 2 — Agent-Tuned Linting (Zero Errors)

### ESLint v9 Flat Config

```javascript
// eslint.config.js — V8.0 agent-tuned config
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: { react, "react-hooks": reactHooks, import: importPlugin },
    rules: {
      // Agent-tuned: zero tolerance
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "react-hooks/exhaustive-deps": "error",
      "import/no-cycle": "error",
      "import/order": ["error", { "newlines-between": "always" }],

      // SWE-bench: catch common bug patterns
      "no-constant-binary-expression": "error",
      "no-constructor-return": "error",
      "no-promise-executor-return": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "error",
      "require-atomic-updates": "error",
    },
  }
);
```

### Oxlint (V8.0 NEW — 100× Faster)

```jsonc
// oxlintrc.json — V8.0 config
{
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "eqeqeq": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-eval": "error",
    "no-implied-eval": "error"
  },
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "pedantic": "warn"
  }
}
```

### AI-Assisted Lint Rules (V8.0 NEW)

```python
class AILintRuleGenerator:
    """Generate custom lint rules based on codebase patterns."""

    async def analyze_codebase(self, codebase: str) -> list[LintRule]:
        # Analyze codebase for recurring bug patterns
        patterns = await self.model.analyze(
            f"Identify bug-prone patterns in this codebase "
            f"and generate ESLint rules to prevent them:\n{codebase}"
        )
        return [self.to_eslint_rule(p) for p in patterns]
```

### Lint Pipeline

```bash
# Run all three linters — zero tolerance
npx oxlint .                    # Fast pass (100× faster)
npx eslint . --max-warnings 0   # Deep pass
npx @biomejs/biome check .      # Format + extra lint

# Auto-fix safe patterns
npx oxlint . --fix
npx eslint . --fix
npx @biomejs/biome check --write .
```

**Quality gate:** Zero errors. Zero warnings. If any remain, the agent must fix them before proceeding.

---

## Phase 3 — Test-First Generation (85%+ Coverage)

### Strategy: Write Tests Before Implementation

1. **Identify test requirements** from the issue analysis.
2. **Write failing tests first:**
   ```typescript
   // tests/feature.test.ts — written BEFORE implementation
   describe("Feature X", () => {
     it("should handle normal case", () => { /* ... */ });
     it("should handle edge case: empty input", () => { /* ... */ });
     it("should handle error case: invalid data", () => { /* ... */ });
     it("should handle edge case: concurrent access", () => { /* ... */ });
     it("should handle boundary: max payload size", () => { /* ... */ });
     it("should handle race condition: parallel mutations", () => { /* ... */ });
   });
   ```
3. **Implement the feature** to make all tests pass.
4. **Run coverage check:**
   ```bash
   npx vitest run --coverage --coverage.thresholds.branches=85 \
     --coverage.thresholds.functions=85 --coverage.thresholds.lines=85
   ```

### Mutation Testing (Stryker)

```bash
npx stryker run --mutate "src/features/**/*.ts"
```

| Metric | Target | Description |
|--------|--------|-------------|
| Mutation Score | ≥ 75% | Mutants killed / total mutants |
| Test Strength | ≥ 85% | Mutants killed / mutants covered |

### Fault-Injection Testing (V8.0 NEW)

```typescript
class FaultInjector {
  // Inject failures at runtime to verify error handling
  async injectNetworkFailure(target: string, duration: number): Promise<void>;
  async injectLatency(target: string, delayMs: number): Promise<void>;
  async injectMemoryPressure(limitMb: number): Promise<void>;
  async injectDiskFull(path: string): Promise<void>;
  async injectCPUStress(cores: number, duration: number): Promise<void>;
}

// Usage in tests
describe("Resilience", () => {
  it("should retry on network failure", async () => {
    await faultInjector.injectNetworkFailure("db", 5000);
    const result = await service.getData();
    expect(result.retryCount).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
  });
});
```

### Fuzzing (V8.0 NEW)

```bash
# JavaScript fuzzing with Jazzer.js
npx jazzer --target src/parsers/input-parser.ts --duration 60s

# API endpoint fuzzing
npx restler-fuzzer --spec openapi.yaml --duration 120s --auth bearer:$TOKEN
```

---

## Phase 4 — 5-Agent PR Review Simulation (V8.0 EXPANDED)

Five agents review every change before merge:

### Agent 1: Reviewer (finds issues)

```markdown
## PR Review — Reviewer Agent
### Code Quality
- [ ] No `any` types introduced
- [ ] All functions < 40 lines
- [ ] Error handling is comprehensive
- [ ] No hardcoded secrets or config values

### Architecture
- [ ] Follows existing patterns in the codebase
- [ ] No circular dependencies introduced
- [ ] Separation of concerns maintained
- [ ] API contracts are stable (no breaking changes)
```

### Agent 2: Author (addresses findings)

- Responds to each finding with a fix or justification.
- Implements fixes inline.
- Re-runs tests to confirm no regressions.

### Agent 3: Verifier (confirms fixes)

- Confirms each critical/major finding was properly addressed.
- Runs full test suite.

### Agent 4: Security Auditor (V8.0 NEW)

```markdown
## PR Review — Security Auditor
- [ ] Input is validated and sanitized (OWASP A03)
- [ ] Auth checks on all protected routes (A01)
- [ ] No PII exposure in logs or responses (A04)
- [ ] SQL injection prevention — parameterized queries (A03)
- [ ] CSRF/XSS protections in place (A07)
- [ ] Dependencies scanned for known CVEs (A06)
- [ ] Secrets detection — no API keys, tokens in code (A02)
- [ ] Rate limiting on public endpoints (A04)
```

### Agent 5: Performance Analyst (V8.0 NEW)

```markdown
## PR Review — Performance Analyst
- [ ] No N+1 queries — batch loading implemented
- [ ] Large lists use virtualization or pagination
- [ ] Expensive operations are memoized or cached
- [ ] No synchronous file I/O on hot paths
- [ ] Bundle size impact assessed (< 5KB increase)
- [ ] Database queries use indexes (EXPLAIN analyzed)
- [ ] Memory allocation patterns reviewed (no leaks)
- [ ] API response time < 200ms at p95
```

**Final decision:** All 5 agents must APPROVE. Any REJECT triggers a fix loop.

---

## Phase 5 — Quality Gate (Ship Decision)

All gates must pass before the change is considered "ship-ready":

```yaml
quality_gates:
  lint_errors: 0
  type_errors: 0
  test_pass_rate: 100%
  test_coverage: ">= 85%"
  mutation_score: ">= 75%"
  fuzz_findings: 0 critical
  security_vulns: 0 critical, 0 high
  pr_review: all_5_approved
  build_success: true
  bundle_size_delta: "< 5KB"
  swe_bench_score: ">= 85%"
```

### Benchmark CI Gate (V8.0 NEW)

```yaml
# .github/workflows/swe-bench-gate.yml
name: SWE-Bench Quality Gate
on: [pull_request]
jobs:
  swe-bench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run SWE-bench evaluation
        run: |
          python -m swebench.evaluate \
            --model cursor-v4-claude-4.6 \
            --dataset swe-bench-lite \
            --threshold 85
      - name: Upload score
        uses: actions/upload-artifact@v4
        with:
          name: swe-bench-score
          path: results/score.json
```

If any gate fails, the agent loops back to the relevant phase.

---

## Commands

```bash
# Full SWE-bench pipeline on a task
/code-swebench --task "Fix authentication bypass in /api/users"

# Lint-only pass (now with Oxlint)
/code-swebench --lint-only

# Test-first generation for a feature
/code-swebench --test-first --feature "Add pagination to /api/items"

# 5-agent PR review (V8.0)
/code-swebench --review --scope HEAD~3..HEAD --depth exhaustive

# Quality gate check (no fixes, just report)
/code-swebench --gate-check

# Mutation testing
/code-swebench --mutation-test --scope "src/features/**/*.ts"

# Fuzzing (V8.0)
/code-swebench --fuzz --target "src/parsers/**/*.ts" --duration 120s

# Fault-injection testing (V8.0)
/code-swebench --fault-inject --scenario network-failure

# AI code repair loop (V8.0)
/code-swebench --auto-repair --task "Fix flaky test in auth module"

# Benchmark CI gate (V8.0)
/code-swebench --benchmark --threshold 85
```

---

## Integration

| Workflow | How SWE-Bench Agent Connects |
|----------|------------------------------|
| `self-review.md` | SWE-bench provides the reviewer agent standards |
| `code-audit-fix.md` | ESLint v9 + Biome v2 + Oxlint configs are shared |
| `e2e-test-gen.md` | SWE-bench test-first approach feeds E2E strategy |
| `swarm-v3.md` | 5-agent review is used by the swarm's quality pass |
| `prod-deploy.md` | Quality gates are checked before deployment |
| `benchmark-live.md` | SWE-bench scores feed the LLM leaderboard (V8.0) |
| `dspy-v4.md` | AI repair loop uses DSPy-optimized prompts (V8.0) |
| `live-coding-agents.md` | SWE-bench 90% feeds live execution quality gate (V9.0) |
| `sector-finance.md` | Code quality for ZK circuits and fraud ML (V9.0) |
| `dl-dev2026.md` | Quality gates for fine-tuned model code (V9.0) |

---

## V9.0 Upgrades — SWE-bench 90% + Live Execution

| Feature | V8.0 | V9.0 |
|---------|------|------|
| SWE-bench Target | 85%+ | **90%+ (Leader)** |
| IDE Integration | Cursor v4 + Claude 4.6 | + **Replit AI agents** + **Zed v0.19** |
| Execution Mode | Batch | **Live execution** (real-time streaming) |
| Multi-IDE | Single IDE | **Parallel multi-IDE** (fan-out/fan-in) |
| Code Repair | 5-iteration loop | **Cross-model consensus** (3 models, best-of-N) |
| PR Review | 5-agent | **7-agent** (+live-exec-reviewer, +sector-specialist) |

### Live Execution Integration (V9.0)

```yaml
live_execution:
  replit_ai:
    mode: agent-pairing
    sandbox: true
    auto_deploy: staging
    strengths: [rapid-iteration, live-preview, deployment]
  cursor_v4:
    mode: swe-bench-leader
    composer_ai: true
    multi_file_edit: true
    strengths: [quality, codebase-awareness, refactoring]
  zed_v019:
    mode: context-server
    tree_sitter: true
    multi_buffer: true
    strengths: [speed, real-time-editing, collaboration]
  parallel:
    strategy: fan-out-fan-in
    merge: llm-judge-best-quality
    quality_gate: swe-bench-90
```

### V9.0 Commands

```bash
# SWE-bench 90% pipeline (V9.0)
/code-swebench --task "..." --target 90 --live
/code-swebench --parallel --ides replit,cursor,zed --merge best-quality
/code-swebench --review --agents 7 --depth exhaustive

# V10.0: SWE-bench 92% with bug-hunter integration
/code-swebench --task "..." --target 92 --bug-hunter
/code-swebench --pre-commit --bug-hunter-50 --scan-staged
/code-swebench --metrics --bug-reduction --period 30d
```

---

## V10.0 Upgrades — SWE-bench 92% + Bug Hunter 50%

| Feature | V9.0 | V10.0 |
|---------|------|-------|
| SWE-bench Target | 90%+ | **92%+ (Absolute)** |
| Bug Detection | Post-commit | **Pre-commit AI** (50% fewer bugs) |
| Pattern Learning | N/A | **Bug history → custom rules** |
| Auto-Fix | Consensus | **Multi-model + auto-test-gen** |
| PR Review | 7-agent | **9-agent** (+bug-hunter, +ethics) |

### Pre-Commit Bug Hunter Gate (V10.0)

```yaml
v10_pre_commit:
  bug_hunter:
    enabled: true
    blocking: true
    target: "50% bug reduction"
    scan: staged-files-only
    timeout: 30s
  pattern_learning:
    source: git-bug-history-2y
    model: fine-tuned-codellama
    update: weekly
  integration:
    swe_bench_gate: 92
    quality_agents: 9
    ethics_check: ai-responsibility
```
