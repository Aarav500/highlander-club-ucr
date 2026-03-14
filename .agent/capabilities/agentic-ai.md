# Agentic AI

> Reference for building multi-agent systems with LangGraph, CrewAI, and AutoGen — covering orchestration, human-in-loop gates, and self-healing deployments.

---

## LangGraph — State Machine Orchestration

### Core Concepts

| Concept | Description |
|---------|-------------|
| **StateGraph** | DAG of nodes connected by typed edges; state flows through the graph |
| **Nodes** | Python functions or Runnables that transform state |
| **Conditional Edges** | Route to different nodes based on state values |
| **Checkpointing** | Persist state to resume workflows or retry from any point |
| **Human-in-Loop** | Breakpoints that pause execution for human approval |

### Typed State Graph

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, Annotated
from operator import add

class AgentState(TypedDict):
    messages: Annotated[list, add]
    task: str
    code: str
    review: str
    approved: bool
    deployed: bool

def researcher(state: AgentState) -> AgentState:
    """Gather context, search docs, and prepare task specification."""
    # LLM call to analyze task and gather requirements
    research = llm.invoke(f"Research requirements for: {state['task']}")
    return {"messages": [{"role": "researcher", "content": research.content}]}

def coder(state: AgentState) -> AgentState:
    """Generate code based on research findings."""
    context = state["messages"]
    code = llm.invoke(f"Write code based on: {context}")
    return {"code": code.content, "messages": [{"role": "coder", "content": "Code generated"}]}

def reviewer(state: AgentState) -> AgentState:
    """Review generated code for quality, security, and correctness."""
    review = llm.invoke(f"Review this code:\n{state['code']}")
    approved = "APPROVED" in review.content.upper()
    return {"review": review.content, "approved": approved}

def deployer(state: AgentState) -> AgentState:
    """Deploy approved code to target environment."""
    # Trigger CI/CD pipeline
    return {"deployed": True, "messages": [{"role": "deployer", "content": "Deployed successfully"}]}

# Build the graph
graph = StateGraph(AgentState)
graph.add_node("researcher", researcher)
graph.add_node("coder", coder)
graph.add_node("reviewer", reviewer)
graph.add_node("deployer", deployer)

graph.add_edge(START, "researcher")
graph.add_edge("researcher", "coder")
graph.add_edge("coder", "reviewer")
graph.add_conditional_edges("reviewer", lambda s: "deployer" if s["approved"] else "coder")
graph.add_edge("deployer", END)

# Compile with checkpointing
app = graph.compile(checkpointer=MemorySaver())
```

### Human-in-Loop Approval Gates

```python
from langgraph.graph import StateGraph
from langgraph.checkpoint.memory import MemorySaver

# Compile with interrupt_before to pause for human approval
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["deployer"],  # Pause before deployment
)

# Run until breakpoint
config = {"configurable": {"thread_id": "deploy-123"}}
result = app.invoke({"task": "build quant dashboard"}, config)

# Human reviews the state...
# Resume after approval
app.invoke(None, config)  # Continue from checkpoint
```

### Breakpoint Trust Levels

| Level | Gate | Use Case |
|-------|------|----------|
| **L0 — Full Auto** | No gates | Internal dev/test workflows |
| **L1 — Deploy Gate** | `interrupt_before=["deployer"]` | Production deploys |
| **L2 — Review Gate** | `interrupt_before=["reviewer", "deployer"]` | Sensitive code changes |
| **L3 — Full Approval** | `interrupt_before=["coder", "reviewer", "deployer"]` | Compliance-critical work |

---

## CrewAI — Role-Based Multi-Agent Teams

### Team Setup

```python
from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Senior Research Analyst",
    goal="Find cutting-edge approaches for {task}",
    backstory="Expert at surveying literature and identifying state-of-the-art methods.",
    tools=[search_tool, arxiv_tool],
    llm="gpt-4o",
    verbose=True,
)

coder = Agent(
    role="Senior Software Engineer",
    goal="Write production-quality code implementing the research findings",
    backstory="Full-stack engineer with expertise in Python, TypeScript, and system design.",
    tools=[code_tool, test_tool],
    llm="gpt-4o",
)

reviewer = Agent(
    role="Code Review Lead",
    goal="Ensure code quality, security, and adherence to best practices",
    backstory="Staff engineer with 10+ years reviewing production codebases.",
    llm="gpt-4o",
)

deployer = Agent(
    role="DevOps Engineer",
    goal="Deploy reviewed code with zero-downtime strategy",
    backstory="SRE expert handling large-scale Kubernetes deployments.",
    tools=[deploy_tool, monitor_tool],
    llm="gpt-4o",
)
```

### Task Pipeline

```python
research_task = Task(
    description="Research {task}: find top 5 approaches, compare benchmarks, recommend best fit.",
    agent=researcher,
    expected_output="Structured research report with recommendations",
)

code_task = Task(
    description="Implement the recommended approach with full test coverage.",
    agent=coder,
    expected_output="Production-ready code with tests",
    context=[research_task],
)

review_task = Task(
    description="Review code for correctness, security, performance. Flag any issues.",
    agent=reviewer,
    expected_output="Review report: APPROVED or CHANGES_NEEDED with details",
    context=[code_task],
)

deploy_task = Task(
    description="Deploy to staging, run smoke tests, promote to production if green.",
    agent=deployer,
    expected_output="Deployment report with health check results",
    context=[review_task],
    human_input=True,  # Require human approval before deploy
)

crew = Crew(
    agents=[researcher, coder, reviewer, deployer],
    tasks=[research_task, code_task, review_task, deploy_task],
    process=Process.sequential,
    verbose=True,
)

result = crew.kickoff(inputs={"task": "build quant dashboard"})
```

### Execution Modes

| Mode | Pattern | When to Use |
|------|---------|-------------|
| `Process.sequential` | A → B → C → D | Linear pipelines |
| `Process.hierarchical` | Manager delegates to workers | Complex decomposition |
| Custom `Process` | Parallel fan-out / fan-in | Independent subtasks |

---

## AutoGen — Conversable Multi-Agent

### Group Chat Pattern

```python
from autogen import ConversableAgent, GroupChat, GroupChatManager

researcher = ConversableAgent(
    name="Researcher",
    system_message="You research topics and provide structured findings.",
    llm_config={"model": "gpt-4o"},
)

coder = ConversableAgent(
    name="Coder",
    system_message="You write production Python/TypeScript code based on research.",
    llm_config={"model": "gpt-4o"},
    code_execution_config={"work_dir": "workspace", "use_docker": True},
)

reviewer = ConversableAgent(
    name="Reviewer",
    system_message="You review code and provide actionable feedback. Say APPROVED when satisfied.",
    llm_config={"model": "gpt-4o"},
)

human = ConversableAgent(
    name="Human",
    human_input_mode="ALWAYS",  # Always ask for human input
)

group_chat = GroupChat(
    agents=[researcher, coder, reviewer, human],
    messages=[],
    max_round=20,
    speaker_selection_method="auto",  # LLM picks next speaker
)

manager = GroupChatManager(groupchat=group_chat, llm_config={"model": "gpt-4o"})

# Kick off
human.initiate_chat(manager, message="Build a real-time quant dashboard with WebSocket feeds")
```

### Human Input Modes

| Mode | Behavior |
|------|----------|
| `NEVER` | Fully autonomous — no human intervention |
| `TERMINATE` | Ask human only when conversation ends |
| `ALWAYS` | Ask human before every response |

---

## Self-Healing Deployments

### Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Monitor     │───▶│  Diagnose    │───▶│  Heal        │
│  Agent       │    │  Agent       │    │  Agent       │
│              │    │              │    │              │
│  • Health    │    │  • Log       │    │  • Rollback  │
│    checks    │    │    analysis  │    │  • Scale     │
│  • Metrics   │    │  • Root      │    │  • Restart   │
│  • Alerts    │    │    cause     │    │  • Patch     │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Self-Healing Agent

```python
class SelfHealingAgent:
    """Detect failures and auto-remediate with configurable strategies."""

    STRATEGIES = {
        "high_error_rate": ["rollback_deployment", "notify_oncall"],
        "high_latency": ["scale_up_replicas", "enable_cache"],
        "oom_killed": ["increase_memory_limit", "restart_pod"],
        "cert_expiry": ["rotate_certificates", "notify_security"],
    }

    async def monitor(self):
        while True:
            health = await self.check_health()
            if not health.is_healthy:
                diagnosis = await self.diagnose(health)
                strategy = self.STRATEGIES.get(diagnosis.issue_type, ["notify_oncall"])
                for action in strategy:
                    success = await self.execute(action, diagnosis)
                    if success:
                        break
            await asyncio.sleep(30)

    async def check_health(self) -> HealthStatus:
        return HealthStatus(
            error_rate=await self.get_error_rate(),
            p95_latency=await self.get_p95_latency(),
            memory_usage=await self.get_memory_usage(),
            pod_status=await self.get_pod_status(),
        )

    async def rollback_deployment(self, diagnosis):
        """Roll back to last known good deployment."""
        previous_tag = await self.get_last_good_tag()
        await self.kubectl(f"rollout undo deployment/{diagnosis.service}")
        await self.verify_rollback(previous_tag)
        await self.notify(f"Auto-rollback: {diagnosis.service} → {previous_tag}")
```

---

## Multi-Agent Workflow Patterns

### Pattern 1: Sequential Pipeline

```
Researcher → Coder → Reviewer → Deployer
```

Best for: Linear tasks where each stage depends on the previous.

### Pattern 2: Hierarchical Delegation

```
        ┌── Manager ──┐
        │              │
   ┌────┴────┐    ┌────┴────┐
   │ Team A  │    │ Team B  │
   │ (API)   │    │ (UI)    │
   └─────────┘    └─────────┘
```

Best for: Complex projects decomposed into independent sub-teams.

### Pattern 3: Critic Loop

```
Coder ←──→ Reviewer (iterate until APPROVED)
```

Best for: Quality-critical code where iterative refinement is needed.

### Pattern 4: Parallel Fan-Out

```
           ┌── Agent A (Backend) ──┐
Task ──────┼── Agent B (Frontend) ─┼──── Merge
           └── Agent C (Tests) ────┘
```

Best for: Independent subtasks that can be worked in parallel.

---

## Testing Agentic Workflows

```bash
# End-to-end test: full pipeline
/agentic-ai --task "build quant dashboard + deploy + paper"

# Unit test: single agent
python -m pytest tests/agents/test_researcher.py

# Integration test: agent handoff
python -m pytest tests/agents/test_pipeline.py --timeout=120
```
