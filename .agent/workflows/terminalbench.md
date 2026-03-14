---
description: "TerminalBench 2.0 — Multi-step engineering benchmark automation for agentic systems"
---

# TerminalBench 2.0 Workflow

> Automated multi-step engineering benchmark harness. Tests agent competency across coding, debugging, deployment, and orchestration.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 TerminalBench 2.0                        │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Challenge   │  Execution   │  Evaluation  │  Reporting │
│  Registry    │  Sandbox     │  Harness     │  Dashboard │
├──────────────┼──────────────┼──────────────┼────────────┤
│ YAML Specs   │ Docker/Nix   │ LLM Judge    │ Leaderboard│
│ Test Fixtures│ Time-boxed   │ Auto-grading │ Comparisons│
│ Rubrics      │ Isolated     │ Regression   │ Trends     │
└──────────────┴──────────────┴──────────────┴────────────┘
```

---

## Challenge Suites

### 1. Code Generation (`code_gen`)

| Challenge | Difficulty | Time Limit | Scoring |
|-----------|-----------|------------|---------|
| REST API from spec | Medium | 300s | Passes tests + schema compliance |
| React dashboard | Medium | 300s | Renders + responsive + accessible |
| CLI tool with args | Easy | 120s | Correct output for test cases |
| Data pipeline | Hard | 600s | Correctness + performance |
| Full-stack feature | Hard | 900s | E2E integration test pass |

### 2. Debugging (`debugging`)

| Challenge | Difficulty | Description |
|-----------|-----------|-------------|
| Null reference | Easy | Fix null pointer from stack trace |
| Race condition | Hard | Diagnose async timing bug |
| Memory leak | Medium | Find and fix leak in Node.js server |
| Type error | Easy | Fix TypeScript compilation errors |
| Integration failure | Hard | Fix broken API ↔ DB integration |

### 3. Refactoring (`refactoring`)

| Challenge | Difficulty | Constraint |
|-----------|-----------|------------|
| Extract component | Easy | Tests must pass before and after |
| Remove dead code | Easy | No behavioral changes |
| Optimize query | Medium | 50% latency reduction required |
| Module extraction | Hard | Maintain all interfaces |
| Architecture migration | Hard | Monolith → microservice split |

### 4. Deployment (`deployment`)

| Challenge | Difficulty | Description |
|-----------|-----------|-------------|
| Docker multi-stage | Medium | Build and run containerized app |
| CI/CD pipeline | Medium | GitHub Actions + test + deploy |
| K8s manifests | Hard | Deployment + Service + Ingress |
| Rollback | Hard | Detect failure and rollback |
| Blue-green | Hard | Zero-downtime deployment |

### 5. Multi-Step (`multi_step`)

| Challenge | Difficulty | Steps |
|-----------|-----------|-------|
| Spec → Code → Test | Medium | 3 steps, 600s total |
| Bug report → Fix → Deploy | Hard | 4 steps, 900s total |
| Research → Design → Build → Review | Hard | 5 steps, 1200s total |
| Incident → Diagnose → Fix → Verify | Hard | 4 steps, 900s total |

---

## Challenge Spec Format

```yaml
# challenges/code_gen/rest-api-from-spec.yaml
name: "REST API from Spec"
suite: code_gen
difficulty: medium
time_limit_seconds: 300

description: |
  Build a REST API that matches the provided OpenAPI spec.
  Must handle all CRUD operations, validation, and error responses.

setup:
  docker_image: "node:20-alpine"
  files:
    - src: "fixtures/openapi-spec.yaml"
      dst: "spec.yaml"
    - src: "fixtures/package.json"
      dst: "package.json"
  commands:
    - "npm install"

task: |
  Create Express routes that implement the API defined in spec.yaml.
  All endpoints must return proper status codes and error formats.

evaluation:
  type: "test_suite"
  test_command: "npm test"
  tests:
    - "GET /items returns 200 with array"
    - "POST /items creates item, returns 201"
    - "GET /items/:id returns 404 for missing"
    - "PUT /items/:id updates, returns 200"
    - "DELETE /items/:id removes, returns 204"
    - "POST /items with invalid body returns 400"

scoring:
  test_pass_rate: { weight: 0.50 }
  code_quality: { weight: 0.20, rubric: "eslint_score" }
  time_taken: { weight: 0.15, optimal: 120, max: 300 }
  completeness: { weight: 0.15, rubric: "spec_coverage" }
```

---

## Execution Sandbox

```python
class BenchmarkRunner:
    """Execute challenges in isolated sandbox environments."""

    def __init__(self, challenge_dir: str):
        self.challenges = self._load_challenges(challenge_dir)

    async def run_suite(self, suite: str, agent: AgentInterface) -> SuiteResult:
        results = []
        for challenge in self.challenges[suite]:
            result = await self._run_challenge(challenge, agent)
            results.append(result)
        return SuiteResult(suite=suite, results=results)

    async def _run_challenge(self, challenge: Challenge, agent: AgentInterface) -> ChallengeResult:
        # 1. Create isolated sandbox
        sandbox = await DockerSandbox.create(challenge.docker_image)

        # 2. Setup fixtures
        for file in challenge.setup.files:
            await sandbox.copy_file(file.src, file.dst)
        for cmd in challenge.setup.commands:
            await sandbox.exec(cmd)

        # 3. Execute agent with time limit
        start = time.monotonic()
        try:
            agent_output = await asyncio.wait_for(
                agent.solve(challenge.task, sandbox),
                timeout=challenge.time_limit_seconds,
            )
        except asyncio.TimeoutError:
            return ChallengeResult(status="timeout", score=0)

        elapsed = time.monotonic() - start

        # 4. Run evaluation
        score = await self._evaluate(challenge, sandbox, elapsed)

        # 5. Cleanup
        await sandbox.destroy()

        return ChallengeResult(status="complete", score=score, time=elapsed)
```

---

## Scoring & Leaderboard

```json
{
  "benchmark_id": "tb2-20260314-001",
  "agent": "swarm-v3",
  "overall_score": 87.3,
  "suites": {
    "code_gen": { "score": 92, "passed": 4, "total": 5, "avg_time": 185 },
    "debugging": { "score": 85, "passed": 4, "total": 5, "avg_time": 95 },
    "refactoring": { "score": 88, "passed": 4, "total": 5, "avg_time": 210 },
    "deployment": { "score": 79, "passed": 3, "total": 5, "avg_time": 320 },
    "multi_step": { "score": 90, "passed": 3, "total": 4, "avg_time": 750 }
  },
  "comparison": {
    "vs_swarm_v2": "+12.1 points",
    "vs_single_agent": "+28.5 points"
  }
}
```

---

## Commands

```bash
# Run full benchmark
/terminalbench --run --agent swarm-v3

# Run specific suite
/terminalbench --suite code_gen --agent swarm-v3

# Run single challenge
/terminalbench --challenge rest-api-from-spec --agent swarm-v3

# View leaderboard
/terminalbench --leaderboard

# Compare agents
/terminalbench --compare swarm-v2 swarm-v3

# Add custom challenge
/terminalbench --add-challenge --spec challenges/my-challenge.yaml

# Generate report
/terminalbench --report --format markdown --output benchmark-report.md
```
