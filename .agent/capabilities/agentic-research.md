# Agentic Research

> Reference for AI-powered research workflows using LangGraph state machines, AutoGen multi-agent paper writing, custom attention variants, ZK proofs, and DSPy optimization.

---

## LangGraph State Machines for Research Workflows

### Research Pipeline Graph

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from operator import add

class ResearchState(TypedDict):
    topic: str
    literature: list[dict]
    hypothesis: str
    experiment_plan: str
    results: dict
    paper_draft: str
    review_feedback: str
    messages: Annotated[list, add]
    iteration: int

def literature_review(state: ResearchState) -> ResearchState:
    """Survey existing work, identify gaps, build citation graph."""
    papers = arxiv_search(state["topic"], max_results=50)
    clustered = cluster_by_methodology(papers)
    gaps = identify_research_gaps(clustered)
    return {
        "literature": papers,
        "messages": [{"role": "lit_review", "content": f"Found {len(papers)} papers, {len(gaps)} gaps"}],
    }

def hypothesis_generation(state: ResearchState) -> ResearchState:
    """Generate testable hypotheses from identified gaps."""
    prompt = f"Given these gaps in {state['topic']}:\n{state['literature']}\nGenerate 3 testable hypotheses."
    hypotheses = llm.invoke(prompt)
    return {"hypothesis": hypotheses.content}

def experiment_design(state: ResearchState) -> ResearchState:
    """Design experiments with baselines, metrics, and ablations."""
    plan = llm.invoke(f"Design experiments to test: {state['hypothesis']}")
    return {"experiment_plan": plan.content}

def run_experiments(state: ResearchState) -> ResearchState:
    """Execute experiments and collect results."""
    results = execute_experiment_plan(state["experiment_plan"])
    return {"results": results}

def write_paper(state: ResearchState) -> ResearchState:
    """Draft paper in LaTeX with proper structure."""
    draft = llm.invoke(f"""
        Write an ACM-format paper:
        Topic: {state['topic']}
        Hypothesis: {state['hypothesis']}
        Results: {state['results']}
        Include: Abstract, Introduction, Related Work, Method, Experiments, Conclusion
    """)
    return {"paper_draft": draft.content}

def peer_review(state: ResearchState) -> ResearchState:
    """Simulate peer review with critical feedback."""
    review = llm.invoke(f"Act as a harsh NeurIPS reviewer. Review:\n{state['paper_draft']}")
    return {"review_feedback": review.content, "iteration": state.get("iteration", 0) + 1}

def should_revise(state: ResearchState) -> str:
    if state.get("iteration", 0) >= 3:
        return "finalize"
    if "ACCEPT" in state.get("review_feedback", "").upper():
        return "finalize"
    return "revise"

# Build graph
graph = StateGraph(ResearchState)
graph.add_node("literature_review", literature_review)
graph.add_node("hypothesis", hypothesis_generation)
graph.add_node("experiment_design", experiment_design)
graph.add_node("run_experiments", run_experiments)
graph.add_node("write_paper", write_paper)
graph.add_node("peer_review", peer_review)

graph.add_edge(START, "literature_review")
graph.add_edge("literature_review", "hypothesis")
graph.add_edge("hypothesis", "experiment_design")
graph.add_edge("experiment_design", "run_experiments")
graph.add_edge("run_experiments", "write_paper")
graph.add_edge("write_paper", "peer_review")
graph.add_conditional_edges("peer_review", should_revise, {
    "revise": "write_paper",
    "finalize": END,
})

research_app = graph.compile()
```

---

## AutoGen Multi-Agent Paper Writing

### Writing Team

```python
from autogen import ConversableAgent, GroupChat, GroupChatManager

writer = ConversableAgent(
    name="PaperWriter",
    system_message="""You write academic papers. Follow ACM double-column format.
    Include proper LaTeX commands, citations, and mathematical notation.
    Write in a formal, precise academic style.""",
    llm_config={"model": "gpt-4o", "temperature": 0.3},
)

statistician = ConversableAgent(
    name="Statistician",
    system_message="""You verify statistical claims, suggest proper tests,
    check p-values, and ensure reproducibility. Flag any statistical errors.""",
    llm_config={"model": "gpt-4o", "temperature": 0.1},
)

critic = ConversableAgent(
    name="Critic",
    system_message="""You are a senior reviewer at NeurIPS. You provide harsh,
    constructive criticism. Focus on: novelty, methodology, evaluation rigor,
    and clarity. Rate on a 1-10 scale.""",
    llm_config={"model": "gpt-4o", "temperature": 0.5},
)

formatter = ConversableAgent(
    name="LaTeXFormatter",
    system_message="""You format papers in proper LaTeX. Ensure correct
    template usage, figure placement, table formatting, and bibliography.
    Output compilable LaTeX.""",
    llm_config={"model": "gpt-4o", "temperature": 0.1},
)

group_chat = GroupChat(
    agents=[writer, statistician, critic, formatter],
    messages=[],
    max_round=15,
)

manager = GroupChatManager(groupchat=group_chat, llm_config={"model": "gpt-4o"})
writer.initiate_chat(manager, message="Write a paper on: {topic}")
```

---

## Custom Attention Variants

### Linear Attention (O(n) complexity)

```python
import torch
import torch.nn as nn

class LinearAttention(nn.Module):
    """Linear attention via kernel feature maps — O(n) complexity."""

    def __init__(self, d_model: int, n_heads: int):
        super().__init__()
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        self.W_qkv = nn.Linear(d_model, 3 * d_model)
        self.W_o = nn.Linear(d_model, d_model)
        self.feature_map = lambda x: nn.functional.elu(x) + 1  # Positive features

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, _ = x.shape
        qkv = self.W_qkv(x).reshape(B, T, 3, self.n_heads, self.d_k)
        q, k, v = qkv.unbind(2)
        q, k = self.feature_map(q), self.feature_map(k)

        # Linear attention: O(n) via associativity
        # Instead of (Q @ K^T) @ V, compute Q @ (K^T @ V)
        kv = torch.einsum("bnhd,bnhe->bhde", k, v)
        qkv = torch.einsum("bnhd,bhde->bnhe", q, kv)
        normalizer = torch.einsum("bnhd,bhd->bnh", q, k.sum(dim=1))
        out = qkv / (normalizer.unsqueeze(-1) + 1e-6)
        return self.W_o(out.reshape(B, T, -1))
```

### Sliding Window Attention

```python
class SlidingWindowAttention(nn.Module):
    """Local attention with fixed window size — O(n * w) complexity."""

    def __init__(self, d_model: int, n_heads: int, window_size: int = 256):
        super().__init__()
        self.window_size = window_size
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        self.W_qkv = nn.Linear(d_model, 3 * d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, _ = x.shape
        qkv = self.W_qkv(x).reshape(B, T, 3, self.n_heads, self.d_k).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)

        # Create sliding window mask
        mask = torch.ones(T, T, device=x.device, dtype=torch.bool)
        for i in range(T):
            start = max(0, i - self.window_size // 2)
            end = min(T, i + self.window_size // 2 + 1)
            mask[i, :start] = False
            mask[i, end:] = False

        scores = (q @ k.transpose(-2, -1)) / (self.d_k ** 0.5)
        scores = scores.masked_fill(~mask, float("-inf"))
        attn = torch.softmax(scores, dim=-1)
        out = (attn @ v).transpose(1, 2).reshape(B, T, -1)
        return self.W_o(out)
```

### Multi-Query Attention (MQA)

```python
class MultiQueryAttention(nn.Module):
    """Multi-Query Attention — shared K,V across heads for faster inference."""

    def __init__(self, d_model: int, n_heads: int):
        super().__init__()
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, self.d_k)   # Single head
        self.W_v = nn.Linear(d_model, self.d_k)   # Single head
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, _ = x.shape
        q = self.W_q(x).reshape(B, T, self.n_heads, self.d_k).transpose(1, 2)
        k = self.W_k(x).unsqueeze(1).expand(-1, self.n_heads, -1, -1)
        v = self.W_v(x).unsqueeze(1).expand(-1, self.n_heads, -1, -1)

        scores = (q @ k.transpose(-2, -1)) / (self.d_k ** 0.5)
        attn = torch.softmax(scores, dim=-1)
        out = (attn @ v).transpose(1, 2).reshape(B, T, -1)
        return self.W_o(out)
```

### Comparison

| Variant | Complexity | KV Cache | Best For |
|---------|-----------|----------|----------|
| Standard MHA | O(n²) | n × h | Training, short sequences |
| Linear | O(n) | O(d²) | Very long sequences |
| Sliding Window | O(n × w) | w × h | Local context tasks |
| Multi-Query (MQA) | O(n²) | n × 1 | Fast inference |
| Grouped-Query (GQA) | O(n²) | n × g | Balance of quality + speed |

---

## ZK Proofs for Verifiable Computation

### Model Integrity Proof

```python
import hashlib
from dataclasses import dataclass

@dataclass
class ModelIntegrityProof:
    """Prove model weights haven't been tampered with."""
    model_hash: str
    merkle_root: str
    proof_path: list[str]

    @staticmethod
    def compute(model_weights: dict) -> "ModelIntegrityProof":
        # Hash each layer
        layer_hashes = []
        for name, param in sorted(model_weights.items()):
            h = hashlib.sha256(param.cpu().numpy().tobytes()).hexdigest()
            layer_hashes.append(h)

        # Build Merkle tree
        tree = layer_hashes[:]
        while len(tree) > 1:
            next_level = []
            for i in range(0, len(tree), 2):
                left = tree[i]
                right = tree[i + 1] if i + 1 < len(tree) else left
                combined = hashlib.sha256(f"{left}{right}".encode()).hexdigest()
                next_level.append(combined)
            tree = next_level

        return ModelIntegrityProof(
            model_hash=hashlib.sha256(str(layer_hashes).encode()).hexdigest(),
            merkle_root=tree[0],
            proof_path=layer_hashes[:4],  # First 4 for verification
        )

    def verify(self, claimed_root: str) -> bool:
        return self.merkle_root == claimed_root
```

### Verifiable Inference

```python
class VerifiableInference:
    """Prove that inference was computed correctly without revealing model weights."""

    def __init__(self, model):
        self.model = model
        self.trace = []

    def forward_with_proof(self, x):
        self.trace = []
        # Record intermediate activations
        hooks = []
        for name, layer in self.model.named_modules():
            hook = layer.register_forward_hook(
                lambda mod, inp, out, n=name: self.trace.append({
                    "layer": n,
                    "input_hash": hashlib.sha256(inp[0].detach().numpy().tobytes()).hexdigest(),
                    "output_hash": hashlib.sha256(out.detach().numpy().tobytes()).hexdigest(),
                })
            )
            hooks.append(hook)

        output = self.model(x)
        for hook in hooks:
            hook.remove()

        return output, self.trace
```

---

## DSPy — Agent Prompt Optimization

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Signature** | Typed input/output spec for an LM call |
| **Module** | Composable unit that uses one or more signatures |
| **Teleprompter** | Optimizer that tunes prompts automatically |
| **Metric** | Evaluation function for measuring quality |

### Signatures & Modules

```python
import dspy

# Define signatures
class ResearchQuery(dspy.Signature):
    """Generate a research query from a topic."""
    topic: str = dspy.InputField(desc="Research area to investigate")
    query: str = dspy.OutputField(desc="Precise search query for academic databases")
    keywords: list[str] = dspy.OutputField(desc="5-10 relevant keywords")

class PaperSummary(dspy.Signature):
    """Summarize a research paper."""
    paper_text: str = dspy.InputField(desc="Full text of the paper")
    summary: str = dspy.OutputField(desc="3-sentence summary of key contributions")
    methodology: str = dspy.OutputField(desc="Core methodology used")
    limitations: str = dspy.OutputField(desc="Main limitations identified")

# Compose into module
class ResearchAgent(dspy.Module):
    def __init__(self):
        self.query_gen = dspy.ChainOfThought(ResearchQuery)
        self.summarizer = dspy.ChainOfThought(PaperSummary)
        self.synthesizer = dspy.ChainOfThought("summaries -> synthesis, gaps, hypothesis")

    def forward(self, topic: str):
        query = self.query_gen(topic=topic)
        papers = fetch_papers(query.query)
        summaries = [self.summarizer(paper_text=p) for p in papers[:10]]
        synthesis = self.synthesizer(summaries=str(summaries))
        return synthesis
```

### Optimization with Teleprompters

```python
from dspy.teleprompt import BootstrapFewShot, MIPROv2

# Define metric
def research_quality(example, prediction, trace=None):
    has_hypothesis = bool(prediction.hypothesis)
    has_gaps = bool(prediction.gaps)
    is_novel = "novel" in prediction.hypothesis.lower() or "new" in prediction.hypothesis.lower()
    return (has_hypothesis + has_gaps + is_novel) / 3

# Optimize with examples
optimizer = MIPROv2(metric=research_quality, num_candidates=10)
optimized_agent = optimizer.compile(
    ResearchAgent(),
    trainset=training_examples,
    max_bootstrapped_demos=4,
    max_labeled_demos=8,
)

# Save optimized prompts
optimized_agent.save("optimized_research_agent.json")
```

### DSPy Teleprompter Comparison

| Teleprompter | Strategy | Best For |
|-------------|----------|----------|
| `BootstrapFewShot` | Auto-generate few-shot examples | Quick optimization |
| `MIPROv2` | Multi-prompt instruction tuning | Production agents |
| `COPRO` | Coordinate prompt optimization | Complex multi-step |
| `BootstrapFinetune` | Generate data + fine-tune LM | Maximum quality |
