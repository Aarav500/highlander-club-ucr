# Multi-LLM Harmony

> Reference for the Triple-LLM parallel execution architecture — Claude Code + Amazon Q + Grok working simultaneously with LLM judge merge and conflict resolution.

---

## Architecture Overview

```
Antigravity (Orchestrator)
├── Claude Code  →  UI / Frontend / tRPC APIs
├── Amazon Q     →  Docker / CI-CD / K8s / Monitoring
└── Grok         →  Algorithms / Math / Research Papers
```

### Execution Modes

| Mode | Command | Behavior |
|------|---------|----------|
| **Full Harmony** | `/triple-llm --task "..."` | All 3 agents, equal priority |
| **UI Priority** | `/harmony-ui --task "..."` | Claude lead, others support |
| **Deploy Priority** | `/deploy-trio --task "..."` | Amazon Q lead, others support |
| **Research Priority** | `/research-trio --task "..."` | Grok lead, others support |

---

## Agent Roster

| Agent | Model | Domain | Files Owned |
|-------|-------|--------|-------------|
| `claude-code` | Claude (Anthropic) | UI, React, shadcn, tRPC | `app/`, `components/`, `server/`, `lib/` |
| `amazon-q-devops` | Amazon Q (AWS) | Docker, K8s, CI/CD, monitoring | `infra/`, `.github/`, `k8s/`, `charts/` |
| `grok-research` | Grok (xAI) | ML, quant finance, proofs, papers | `research/`, `algorithms/`, `scripts/` |

### Agent Docs

- [claude-code-agent.md](file:///c:/Users/aarav/Downloads/FullStack-Template-main/.agent/agents/claude-code-agent.md) — Full Claude Code specification
- [amazon-q-devops.md](file:///c:/Users/aarav/Downloads/FullStack-Template-main/.agent/agents/amazon-q-devops.md) — Full Amazon Q specification
- [grok-research.md](file:///c:/Users/aarav/Downloads/FullStack-Template-main/.agent/agents/grok-research.md) — Full Grok specification

---

## Pipeline

```
1. DECOMPOSE  →  Split task into 3 agent briefs
2. EXECUTE    →  Parallel (no cross-wait)
3. MERGE      →  LLM judge reconciles outputs
4. REVIEW     →  Human gate (if conflicts or failures)
5. DELIVER    →  Unified project output
```

### Merge — Conflict Resolution

| Conflict Type | Winner | Reason |
|---------------|--------|--------|
| API shape / types | Claude Code | tRPC contract is source of truth |
| Ports / networking | Amazon Q | Infra owns the network |
| Algorithm interface | Grok | Math correctness > API convenience |
| Env vars / secrets | Amazon Q | Security authority |

### Voting — Quality Decisions

When agents produce competing solutions, score each on:
- **Correctness** (40%) + **Performance** (25%) + **Quality** (20%) + **Maintainability** (15%)
- Best-of-3 wins

---

## LangGraph Implementation

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from operator import add

class HarmonyState(TypedDict):
    task: str
    claude_output: dict
    amazonq_output: dict
    grok_output: dict
    merge_result: dict
    conflicts: list
    approved: bool
    messages: Annotated[list, add]

def decompose(state: HarmonyState) -> HarmonyState:
    """Split task into 3 agent-specific briefs."""
    briefs = task_decomposer(state["task"])
    return {"messages": [{"role": "orchestrator", "content": f"Decomposed into {len(briefs)} briefs"}]}

def claude_agent(state: HarmonyState) -> HarmonyState:
    """Execute Claude Code — UI + API generation."""
    result = run_claude(state["task"], domain="ui-api")
    return {"claude_output": result}

def amazonq_agent(state: HarmonyState) -> HarmonyState:
    """Execute Amazon Q — infra + deployment."""
    result = run_amazonq(state["task"], domain="devops")
    return {"amazonq_output": result}

def grok_agent(state: HarmonyState) -> HarmonyState:
    """Execute Grok — algorithms + research."""
    result = run_grok(state["task"], domain="research")
    return {"grok_output": result}

def merge_judge(state: HarmonyState) -> HarmonyState:
    """LLM judge merges outputs, resolves conflicts."""
    merged = llm_judge_merge(
        claude=state["claude_output"],
        amazonq=state["amazonq_output"],
        grok=state["grok_output"],
    )
    return {"merge_result": merged, "conflicts": merged.get("conflicts", [])}

def needs_review(state: HarmonyState) -> str:
    if len(state.get("conflicts", [])) > 3:
        return "human_review"
    return "deliver"

# Build parallel harmony graph
graph = StateGraph(HarmonyState)
graph.add_node("decompose", decompose)
graph.add_node("claude", claude_agent)
graph.add_node("amazonq", amazonq_agent)
graph.add_node("grok", grok_agent)
graph.add_node("merge", merge_judge)
graph.add_node("deliver", lambda s: {"approved": True})

graph.add_edge(START, "decompose")

# Fan-out: parallel execution after decomposition
graph.add_edge("decompose", "claude")
graph.add_edge("decompose", "amazonq")
graph.add_edge("decompose", "grok")

# Fan-in: all 3 must complete before merge
graph.add_edge("claude", "merge")
graph.add_edge("amazonq", "merge")
graph.add_edge("grok", "merge")

graph.add_conditional_edges("merge", needs_review, {
    "human_review": END,  # Pause for human
    "deliver": "deliver",
})
graph.add_edge("deliver", END)

harmony = graph.compile()
```

---

## Performance Targets

| Metric | V2.1 (Sequential) | V2.2 (Harmony) | Improvement |
|--------|-------------------|-----------------|-------------|
| Speed | ~90s per task | ~30s parallel | **3x faster** |
| Quality | Single-model | Best-of-3 vote | **95%+ accuracy** |
| Coverage | One domain/pass | 3 domains simultaneous | **3x breadth** |
| Resilience | Single failure = stop | 2/3 continue | **Fault tolerant** |

---

## Workflow Reference

Full orchestration details: [multi-llm-harmony.md](file:///c:/Users/aarav/Downloads/FullStack-Template-main/.agent/workflows/multi-llm-harmony.md)

Agent handoff protocol: [protocol.md](file:///c:/Users/aarav/Downloads/FullStack-Template-main/agents/protocol.md)
