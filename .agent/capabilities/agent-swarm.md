# Agent Swarm

> Reference for building 10-agent autonomous swarms with LangGraph v0.3, CrewAI v2, and hierarchical orchestration.

---

## Swarm Architecture

```
                         ┌─────────────────┐
                         │   Orchestrator   │
                         │   (LangGraph)    │
                         └────────┬─────────┘
              ┌──────────┬───────┼────────┬──────────┐
              ▼          ▼       ▼        ▼          ▼
         ┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐
         │ Coder  │ │ Tester │ │Review│ │Deploy  │ │ Monitor  │
         └────────┘ └────────┘ └──────┘ └────────┘ └──────────┘
              ┌──────────┬───────┼────────┬──────────┐
              ▼          ▼       ▼        ▼          ▼
         ┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐
         │Research│ │ Paper  │ │Mobile│ │ Quant  │ │  Cyber   │
         │        │ │ Writer │ │ Port │ │ Model  │ │  Audit   │
         └────────┘ └────────┘ └──────┘ └────────┘ └──────────┘
```

---

## 10-Agent Roster

| # | Agent | Role | Domain | Outputs |
|---|-------|------|--------|---------|
| 1 | **Coder** | `implementer` | Full-stack code generation | `app/`, `server/`, `lib/` |
| 2 | **Tester** | `verifier` | Unit/integration/e2e tests | `tests/`, `e2e/` |
| 3 | **Reviewer** | `reviewer` | Code review + quality gate | `reviews/`, PR comments |
| 4 | **Deployer** | `ops` | CI/CD + infra provisioning | `.github/`, `k8s/`, `infra/` |
| 5 | **Monitor** | `ops` | Observability + alerting | `monitoring/`, dashboards |
| 6 | **Researcher** | `researcher` | Literature survey + SOTA | `research/notes/` |
| 7 | **Paper Writer** | `researcher` | LaTeX paper generation | `research/papers/` |
| 8 | **Mobile Porter** | `implementer` | Cross-platform ports | `mobile/`, `desktop/` |
| 9 | **Quant Modeler** | `researcher` | Financial models + backtests | `algorithms/`, `data/` |
| 10 | **Cyber Auditor** | `reviewer` | Security audit + compliance | `security/`, `audit/` |

---

## LangGraph v0.3 Swarm Implementation

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, Annotated, Literal
from operator import add

class SwarmState(TypedDict):
    project: str
    spec: str
    code: dict           # Coder output
    tests: dict          # Tester output
    review: dict         # Reviewer output
    deployment: dict     # Deployer output
    monitoring: dict     # Monitor output
    research: dict       # Researcher output
    paper: dict          # Paper Writer output
    mobile: dict         # Mobile Porter output
    quant: dict          # Quant Modeler output
    security: dict       # Cyber Auditor output
    messages: Annotated[list, add]
    phase: str

# --- Agent Nodes ---
def coder(state: SwarmState) -> SwarmState:
    code = generate_code(state["spec"])
    return {"code": code, "phase": "code_complete"}

def tester(state: SwarmState) -> SwarmState:
    tests = generate_tests(state["code"])
    return {"tests": tests, "phase": "tests_complete"}

def reviewer(state: SwarmState) -> SwarmState:
    review = review_code(state["code"], state["tests"])
    return {"review": review}

def deployer(state: SwarmState) -> SwarmState:
    deployment = create_deployment(state["code"])
    return {"deployment": deployment}

def monitor(state: SwarmState) -> SwarmState:
    monitoring = setup_monitoring(state["deployment"])
    return {"monitoring": monitoring}

def researcher(state: SwarmState) -> SwarmState:
    research = survey_literature(state["project"])
    return {"research": research}

def paper_writer(state: SwarmState) -> SwarmState:
    paper = write_paper(state["research"], state["code"])
    return {"paper": paper}

def mobile_porter(state: SwarmState) -> SwarmState:
    mobile = port_to_mobile(state["code"])
    return {"mobile": mobile}

def quant_modeler(state: SwarmState) -> SwarmState:
    quant = build_quant_model(state["spec"])
    return {"quant": quant}

def cyber_auditor(state: SwarmState) -> SwarmState:
    security = security_audit(state["code"], state["deployment"])
    return {"security": security}

# --- Build Swarm Graph ---
swarm = StateGraph(SwarmState)

# Add all 10 agents
for name, fn in [
    ("coder", coder), ("tester", tester), ("reviewer", reviewer),
    ("deployer", deployer), ("monitor", monitor), ("researcher", researcher),
    ("paper_writer", paper_writer), ("mobile_porter", mobile_porter),
    ("quant_modeler", quant_modeler), ("cyber_auditor", cyber_auditor),
]:
    swarm.add_node(name, fn)

# Phase 1: Parallel kickoff (code + research + quant)
swarm.add_edge(START, "coder")
swarm.add_edge(START, "researcher")
swarm.add_edge(START, "quant_modeler")

# Phase 2: After code → test + review + deploy + mobile + security (parallel)
swarm.add_edge("coder", "tester")
swarm.add_edge("coder", "reviewer")
swarm.add_edge("coder", "deployer")
swarm.add_edge("coder", "mobile_porter")
swarm.add_edge("coder", "cyber_auditor")

# Phase 3: After deploy → monitor
swarm.add_edge("deployer", "monitor")

# Phase 4: After research → paper
swarm.add_edge("researcher", "paper_writer")

# All terminal nodes → END
swarm.add_edge("tester", END)
swarm.add_edge("reviewer", END)
swarm.add_edge("monitor", END)
swarm.add_edge("paper_writer", END)
swarm.add_edge("mobile_porter", END)
swarm.add_edge("quant_modeler", END)
swarm.add_edge("cyber_auditor", END)

app = swarm.compile(checkpointer=MemorySaver())
```

---

## CrewAI v2 Swarm

```python
from crewai import Agent, Task, Crew, Process

# Define all 10 agents
agents = {
    "coder": Agent(
        role="Senior Full-Stack Engineer",
        goal="Write production-quality code from spec",
        tools=[code_tool, lint_tool], llm="gpt-4o",
    ),
    "tester": Agent(
        role="QA Engineer",
        goal="Achieve 90%+ test coverage with meaningful tests",
        tools=[test_tool, coverage_tool], llm="gpt-4o",
    ),
    "reviewer": Agent(
        role="Staff Engineer",
        goal="Catch bugs, security issues, and code smells",
        llm="gpt-4o",
    ),
    "deployer": Agent(
        role="DevOps Engineer",
        goal="Zero-downtime deployments with full observability",
        tools=[docker_tool, k8s_tool], llm="gpt-4o",
    ),
    "monitor": Agent(
        role="SRE",
        goal="Set up monitoring, alerting, and dashboards",
        tools=[grafana_tool, sentry_tool], llm="gpt-4o",
    ),
    "researcher": Agent(
        role="Research Scientist",
        goal="Survey SOTA and identify novel contributions",
        tools=[arxiv_tool, scholar_tool], llm="gpt-4o",
    ),
    "paper_writer": Agent(
        role="Academic Writer",
        goal="Write publication-ready papers in LaTeX",
        tools=[latex_tool], llm="gpt-4o",
    ),
    "mobile_porter": Agent(
        role="Mobile Engineer",
        goal="Port web apps to iOS/Android with native feel",
        tools=[expo_tool, flutter_tool], llm="gpt-4o",
    ),
    "quant_modeler": Agent(
        role="Quantitative Analyst",
        goal="Build and backtest trading strategies",
        tools=[backtest_tool, data_tool], llm="gpt-4o",
    ),
    "cyber_auditor": Agent(
        role="Security Engineer",
        goal="OWASP Top 10 audit + compliance checks",
        tools=[semgrep_tool, zap_tool], llm="gpt-4o",
    ),
}

# Hierarchical process: orchestrator delegates
crew = Crew(
    agents=list(agents.values()),
    tasks=generate_tasks(project_spec),
    process=Process.hierarchical,
    manager_llm="gpt-4o",
    verbose=True,
)

result = crew.kickoff(inputs={"project": "quant platform"})
```

---

## Execution Phases

```
Phase 1 (Parallel)    │ Phase 2 (Parallel)     │ Phase 3        │ Phase 4
─────────────────────│───────────────────────│──────────────│─────────
Coder ────────────────┤→ Tester              │              │
                      │→ Reviewer            │              │
                      │→ Deployer ───────────┤→ Monitor     │
                      │→ Mobile Porter       │              │
                      │→ Cyber Auditor       │              │
Researcher ───────────┤                      │→ Paper Writer│
Quant Modeler ────────┤                      │              │
```

**Total time**: ~30-45s (vs ~300s sequential = **7-10x speedup**)

---

## Swarm Commands

```bash
# Full 10-agent swarm
/swarm --project "quant platform"

# Subset: code + test + deploy only
/swarm --agents "coder,tester,deployer" --project "REST API"

# Research swarm: researcher + quant + paper
/swarm --agents "researcher,quant_modeler,paper_writer" --project "novel attention"

# Security-first: code + test + audit
/swarm --agents "coder,tester,cyber_auditor" --project "fintech app"
```

---

## Swarm vs Harmony

| Feature | V2.2 Harmony (3 agents) | V3.0 Swarm (10 agents) |
|---------|------------------------|------------------------|
| Agents | 3 (Claude, Q, Grok) | 10 specialized roles |
| Parallelism | Full parallel | Phased parallel (DAG) |
| Scope | UI + DevOps + Research | Full lifecycle |
| Speed | ~30s | ~30-45s (more work, same time) |
| Use case | Standard projects | Complex enterprise projects |
