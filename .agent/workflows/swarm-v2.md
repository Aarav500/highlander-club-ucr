---
description: "LangGraph + CrewAI + OpenAI Swarm — 15-agent parallel build system"
---

# Agent Swarm v2 Workflow

> 15 specialized agents execute in parallel via a LangGraph DAG. Fan-out by role, fan-in via LLM judge merge.

---

## Architecture

```
                    ┌──────────────────────────────┐
                    │       Orchestrator           │
                    │  (LangGraph StateGraph)      │
                    └──────────────┬───────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
        ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
        │  Wave 1      │    │  Wave 2      │    │  Wave 3      │
        │  (Foundation) │    │  (Build)     │    │  (Finish)    │
        └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
               │                  │                  │
    ┌──────┬──────┐    ┌────┬────┬────┐    ┌────┬────┬────┐
    │Arch  │DB    │    │FE1 │FE2 │BE1 │    │Rev │Doc │Dep │
    │Res   │Sec   │    │BE2 │ML  │Data│    │Test│    │    │
    └──────┴──────┘    └────┴────┴────┘    └────┴────┴────┘
               │                  │                  │
               └──────────────────┼──────────────────┘
                                  ▼
                         ┌────────────────┐
                         │   LLM Judge    │
                         │   Merge + Vote │
                         └────────┬───────┘
                                  ▼
                         ┌────────────────┐
                         │ Unified Output │
                         └────────────────┘
```

---

## Agent Roster (15 agents)

| # | Agent | Role | Wave | Specialty |
|---|-------|------|------|-----------|
| 1 | `architect` | System Design | 1 | Architecture docs, module boundaries, data flow diagrams |
| 2 | `researcher` | Research | 1 | Literature review, competitive analysis, prior art |
| 3 | `db-engineer` | Database | 1 | Schema design, migrations, query optimization |
| 4 | `security-lead` | Security | 1 | Threat modeling, auth design, OWASP validation |
| 5 | `frontend-1` | UI/UX Lead | 2 | Page layouts, design system, responsive design |
| 6 | `frontend-2` | UI Components | 2 | Interactive components, animations, charts |
| 7 | `backend-1` | API Lead | 2 | REST/tRPC endpoints, middleware, validation |
| 8 | `backend-2` | Services | 2 | Business logic, integrations, background jobs |
| 9 | `ml-engineer` | ML/AI | 2 | Model integration, inference pipelines, embeddings |
| 10 | `data-engineer` | Data | 2 | ETL pipelines, analytics, data transformations |
| 11 | `devops` | Infrastructure | 2 | Docker, CI/CD, K8s manifests, monitoring |
| 12 | `reviewer` | Quality | 3 | Code review, security scan, performance audit |
| 13 | `tester` | Testing | 3 | Unit tests, E2E tests, load tests |
| 14 | `docs-writer` | Documentation | 3 | API docs, README, architecture docs, codemaps |
| 15 | `deployer` | Release | 3 | Build, deploy, health checks, rollback |

---

## Phase 1: Task Decomposition

1. **Parse the user's task** into a structured brief.

2. **Generate a dependency DAG** using LangGraph `StateGraph`:
   ```python
   from langgraph.graph import StateGraph, END

   graph = StateGraph(SwarmState)

   # Wave 1 — Foundation (no dependencies)
   graph.add_node("architect", architect_agent)
   graph.add_node("researcher", researcher_agent)
   graph.add_node("db_engineer", db_agent)
   graph.add_node("security_lead", security_agent)

   # Wave 2 — Build (depends on Wave 1)
   graph.add_node("frontend_1", frontend_lead_agent)
   graph.add_node("frontend_2", frontend_components_agent)
   graph.add_node("backend_1", api_lead_agent)
   graph.add_node("backend_2", services_agent)
   graph.add_node("ml_engineer", ml_agent)
   graph.add_node("data_engineer", data_agent)
   graph.add_node("devops", devops_agent)

   # Wave 3 — Finish (depends on Wave 2)
   graph.add_node("reviewer", reviewer_agent)
   graph.add_node("tester", tester_agent)
   graph.add_node("docs_writer", docs_agent)
   graph.add_node("deployer", deployer_agent)

   # Edges
   graph.add_edge("architect", "frontend_1")
   graph.add_edge("architect", "backend_1")
   graph.add_edge("db_engineer", "backend_2")
   graph.add_edge("security_lead", "backend_1")
   # ... (full DAG edges)
   ```

3. **Assign task briefs** — each agent receives:
   - Agent-specific sub-task description
   - Relevant context files
   - Interface contracts (expected inputs/outputs)
   - Constraints from `CLAUDE.md`

4. **⏸️ STOP — Review DAG and task assignments before execution.**

---

## Phase 2: Wave Execution

### Wave 1 — Foundation (parallel, no deps)

All 4 agents execute simultaneously:

| Agent | Produces |
|-------|----------|
| `architect` | Architecture doc, module diagram, API surface spec |
| `researcher` | Literature review, competitive analysis, technology recommendations |
| `db-engineer` | Schema SQL, migration files, seed data |
| `security-lead` | Threat model, auth flow diagram, security requirements |

**Timeout:** 120s per agent. Partial output accepted.

### Wave 2 — Build (parallel, depends on Wave 1)

All 7 agents execute simultaneously after Wave 1 completes:

| Agent | Produces |
|-------|----------|
| `frontend-1` | Page layouts, routing, design system tokens |
| `frontend-2` | Interactive components, charts, animations |
| `backend-1` | API routes, middleware, request/response types |
| `backend-2` | Service layer, integrations, background workers |
| `ml-engineer` | Model configs, inference endpoints, embedding pipelines |
| `data-engineer` | ETL scripts, analytics queries, data transformers |
| `devops` | Dockerfile, CI/CD pipeline, K8s manifests, monitoring config |

**Timeout:** 180s per agent. Partial output accepted.

### Wave 3 — Finish (parallel, depends on Wave 2)

All 4 agents execute simultaneously after Wave 2 completes:

| Agent | Produces |
|-------|----------|
| `reviewer` | Code review report, security findings, performance notes |
| `tester` | Unit tests, E2E tests, load test scripts |
| `docs-writer` | README, API reference, architecture codemap |
| `deployer` | Build artifacts, deploy scripts, health check verification |

**Timeout:** 120s per agent.

---

## Phase 3: LLM Judge Merge

After all waves complete, the orchestrator merges outputs:

1. **Non-overlapping files** → include directly
2. **Conflicting files** → LLM judge resolves using priority:

| Conflict Type | Winner | Reason |
|---------------|--------|--------|
| Architecture decisions | `architect` | System design authority |
| API contracts / types | `backend-1` | API is the contract |
| UI components | `frontend-1` | Design lead authority |
| Database schema | `db-engineer` | Schema is canonical |
| Security concerns | `security-lead` | Security trumps convenience |
| ML model interfaces | `ml-engineer` | Algorithm output is canonical |
| Infra / networking | `devops` | Infrastructure defines network |

3. **Generate integration glue** — adapters connecting frontend → backend → ML → data

4. **Produce `SWARM_REPORT.md`** — summary of agent contributions, conflicts resolved, and quality scores

---

## Phase 4: Quality Gate

Pause for human review if:

- [ ] Any agent reported `failed` status
- [ ] Conflict resolution touched > 5 files
- [ ] Security-sensitive changes detected
- [ ] Generated code exceeds 800 lines in a single file
- [ ] Deployment to production environment

---

## Interface Contract

Each agent produces a manifest:

```json
{
  "agent": "frontend-1",
  "swarm_id": "swarm-<uuid>",
  "wave": 2,
  "status": "success",
  "artifacts": [
    {"path": "app/page.tsx", "type": "page"},
    {"path": "components/ui/card.tsx", "type": "component"}
  ],
  "exports": {
    "components": ["DashboardPage", "Card", "Chart"],
    "data_shapes": {"DashboardProps": {"title": "string", "data": "ChartData[]"}}
  },
  "dependencies": {
    "from_architect": ["architecture.md — module boundaries"],
    "from_backend_1": ["/api/trpc/dashboard.getData endpoint"]
  }
}
```

---

## CrewAI Integration

For complex multi-step agent tasks, use CrewAI's `Crew` + `Task` abstraction:

```python
from crewai import Agent, Task, Crew, Process

architect = Agent(
    role="System Architect",
    goal="Design scalable system architecture",
    backstory="Senior architect with 15 years experience",
    tools=[file_write, diagram_gen, search_web],
)

design_task = Task(
    description="Design the system architecture for {app_description}",
    agent=architect,
    expected_output="Architecture doc with module diagram",
)

crew = Crew(
    agents=[architect, frontend_1, backend_1, ...],
    tasks=[design_task, ui_task, api_task, ...],
    process=Process.hierarchical,
    manager_llm="gpt-4o",
)
```

---

## OpenAI Swarm Handoff

For lightweight agent-to-agent transfers within a wave:

```python
from swarm import Swarm, Agent

client = Swarm()

def transfer_to_backend():
    """Transfer context to backend agent when API work is needed."""
    return backend_agent

frontend_agent = Agent(
    name="Frontend Lead",
    instructions="Build React UI. Transfer to backend if API needed.",
    functions=[transfer_to_backend],
)
```

---

## Commands

```bash
# Full 15-agent parallel build
/swarm-v2 --task "build quant trading platform"

# Specify agent count
/swarm-v2 --agents 15 --parallel --task "portfolio dashboard"

# Limit to specific waves
/swarm-v2 --waves 1,2 --task "design and build only"

# Dry run (no file writes)
/swarm-v2 --dry-run --task "smoke test swarm"

# View last swarm report
/swarm-report --last
```

---

## Performance Targets

| Metric | Old (Sequential) | Swarm v2 (15 parallel) |
|--------|------------------|------------------------|
| Task completion | ~5 min | ~90s (3.3× faster) |
| Quality | Single model | Best-of-15 + LLM judge |
| Coverage | One domain at a time | All domains simultaneous |
| Resilience | Single point of failure | 12/15 continue if 3 fail |
| Specialization | Generalist agents | Domain-expert agents |
