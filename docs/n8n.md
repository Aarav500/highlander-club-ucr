# n8n Automation — Lab Integration

> How n8n workflows connect GitHub issues to the AI Production & Research Lab.

---

## Core Workflow: New GitHub Issue → Lab Workflow → Notify

### Trigger

A new issue is created in this repo (any source — manual, Slack bot, API).

### Routing

The workflow reads the issue's labels to decide which lab pipeline to invoke:

| Label contains | Lab workflow | Purpose |
|----------------|-------------|---------|
| `feature` | `new-production-app` | Build a new feature or app from the idea. |
| `research` | `research-director` | Deep research on a frontier topic. |

### Flow: Feature Issues

1. **Parse** the issue title and body into a short `idea` string.
2. **Summarize** — pass the raw text through an AI Agent node to produce a clean one-paragraph spec summary with acceptance criteria.
3. **Comment** on the GitHub issue confirming the chosen workflow and next steps:
   > "🚀 Routing to **new-production-app** workflow. Spec summary: _{summary}_. A human will review and launch the pipeline."
4. **Notify** — post to a Slack channel (e.g., `#lab-builds`) with a link to the issue.
5. **Hand off** — signal the human operator to run `new-production-app` in Antigravity with the parsed idea. If a webhook/HTTP endpoint is available, trigger it directly.

### Flow: Research Issues

1. **Extract** the topic and goal from the issue body.
2. **Comment** on the GitHub issue:
   > "🔬 Routing to **research-director** workflow. Topic: _{topic}_. Research will begin after human review."
3. **Notify** — post to Slack (e.g., `#lab-research`) with the topic and issue link.
4. **Hand off** — human launches `research-director` with the extracted topic.

---

## n8n Node Map

```
┌─────────────────┐
│  GitHub Trigger  │  ← Issue created event
└────────┬────────┘
         │
┌────────▼────────┐
│  Switch / If    │  ← Route by label: "feature" or "research"
└──┬──────────┬───┘
   │          │
   ▼          ▼
┌──────┐  ┌──────┐
│ feat │  │ res  │
└──┬───┘  └──┬───┘
   │         │
┌──▼───────┐ │
│ AI Agent │ │  ← Summarize idea (feature path only)
└──┬───────┘ │
   │         │
┌──▼─────────▼───┐
│  GitHub Node   │  ← Comment on the issue
└────────┬───────┘
         │
┌────────▼────────┐
│  Slack Node     │  ← Notify channel
└─────────────────┘
```

### Nodes Used

| # | Node | Purpose |
|---|------|---------|
| 1 | **GitHub Trigger** | Fires on `issues.opened` event for this repo. |
| 2 | **Switch** (or **If**) | Routes based on whether labels include `feature` or `research`. |
| 3 | **AI Agent** | Summarizes the issue body into a clean spec/topic (uses OpenAI, Claude, or local model). |
| 4 | **GitHub** (action) | Adds a comment to the issue with the workflow decision and summary. |
| 5 | **Slack** (optional) | Posts a notification to the relevant lab channel. |
| 6 | **HTTP Request** (optional) | Hits an Antigravity webhook to trigger the workflow directly, if available. |

---

## Parallel Fan-Out Workflow

> **Goal:** Process a single trigger through 5 agent streams simultaneously, achieving **10× faster** lab throughput.
> See `parallel/multi-workflow-orchestrator.md` for stream definitions and failure handling.

### Trigger

Issues labeled `parallel` (or a direct POST to `/parallel/dispatch`) activate the fan-out workflow instead of the sequential routing above.

### Node Map

```
┌──────────────────┐
│  GitHub Trigger   │  ← Issue with label "parallel"
│  (or Webhook)     │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Function Node    │  ← Parse issue → build 5 payloads
│  (Payload Builder)│     (one per stream)
└────────┬─────────┘
         │
         ├─────────────┬──────────────┬──────────────┬──────────────┐
         ▼             ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ HTTP Request │ │ HTTP Request │ │ HTTP Request │ │ HTTP Request │ │ HTTP Request │
│  (Research)  │ │ (Production) │ │  (Security)  │ │    (Perf)    │ │(Observability│
│              │ │              │ │              │ │              │ │              │
│ POST /agent/ │ │ POST /agent/ │ │ POST /agent/ │ │ POST /agent/ │ │ POST /agent/ │
│  research    │ │  production  │ │  security    │ │  perf        │ │  observe     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │                │
       └────────┬───────┴────────┬───────┴────────┬───────┘                │
                │                │                │                        │
                └────────────────┴────────────────┴────────────────────────┘
                                         │
                                ┌────────▼─────────┐
                                │   Merge / Wait   │  ← Collect all 5 responses
                                └────────┬─────────┘
                                         │
                                ┌────────▼─────────┐
                                │   AI Agent Node  │  ← Build unified summary
                                └────────┬─────────┘
                                         │
                                ┌────────▼─────────┐
                                │   Slack Node     │  ← Post to #lab-parallel
                                └──────────────────┘
```

### Nodes Used

| # | Node | Purpose |
|---|------|---------|
| 1 | **GitHub Trigger** / **Webhook** | Fires on `issues.opened` with `parallel` label, or on POST to `/parallel/dispatch`. |
| 2 | **Function** (Payload Builder) | Parses issue body, extracts `topic`, `app_slug`, and `spec_path`. Produces 5 payloads. |
| 3a–e | **HTTP Request** ×5 | Sends POST to each agent stream's endpoint simultaneously. n8n executes all 5 branches in parallel. |
| 4 | **Merge / Wait** | Waits for all 5 HTTP responses. Timeout: 10 minutes per stream. |
| 5 | **AI Agent** | Aggregates results into a structured markdown summary. |
| 6 | **Slack** | Posts the unified report to `#lab-parallel` and comments on the GitHub issue. |

### Parallel Streams Reference

| Stream | Agent Workflow | Model Tier |
|--------|----------------|-----------|
| Research | `research-director` | 1 (Opus) |
| Production | `new-production-app` | 2 (Sonnet) |
| Security | `security-scan` | 2 (Sonnet) |
| Performance | `perf-baseline` | 3 (Haiku) |
| Observability | `n8n-workflow` (observability) | 3 (Haiku) |

### Error Handling

- Each HTTP Request node has **Continue on Fail** enabled.
- If a stream times out or returns an error, the Merge node records it as `failed` and proceeds.
- The summary clearly marks which streams succeeded and which need attention.
- See `parallel/multi-workflow-orchestrator.md` for full failure isolation rules.

---

## Future Automations

- **Nightly security-scan summary** — run `security-scan` on a cron schedule, post findings to Slack and create GitHub issues for critical/high items.
- **Weekly research digest** — aggregate all `research/reports/` updates from the past week and post a summary to Slack or email.
- **PR quality gate** — on pull request opened, trigger a code-review workflow and post the review artifact as a PR comment.
- **Deploy notification** — after a successful `deploy-ec2` GitHub Actions run, post a Slack message with the deploy summary and health-check status.
- **Stale issue cleanup** — weekly scan for issues without activity for 14+ days; comment a reminder and apply a `stale` label.
- **Parallel orchestration expansion** — extend the fan-out workflow to support custom stream subsets and priority ordering per `parallel/multi-workflow-orchestrator.md`.
