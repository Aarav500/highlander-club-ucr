---
description: "AI-Native IDE v2 — Zed v0.18 Context Server + Cursor v4 Composer AI + Windsurf Cascade + multi-IDE federation"
---

# AI-Native IDE Workflow (V8.0)

> Live coding agents, cross-IDE context sharing, AI pair programming sessions. Zed v0.18 Context Server + Cursor v4 Composer AI + Windsurf Cascade + GitHub Copilot X federation.

---

## V8.0 Upgrades

| Feature | V7.0 | V8.0 |
|---------|------|------|
| Zed | Basic context | **v0.18 Context Server** Protocol |
| Cursor | v3 Rules | **v4 Composer AI** + multi-file orchestration |
| Replit | Ghostwriter sync | + **Windsurf Cascade** + GitHub Copilot X |
| Context | Single-IDE | **Multi-IDE federation** with live sync |
| Agents | Config sync | **Live coding agents** in IDE |
| Pairing | Manual | **AI pair programming** sessions |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                   AI-Native IDE Federation V8.0                       │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  Zed v0.18     │  Cursor v4     │  Windsurf      │  Copilot X       │
│  Context Server│  Composer AI   │  Cascade       │  Workspace       │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ LSP Protocol   │ Multi-file     │ Flow agents    │ Chat + edit      │
│ Context API    │ Codebase-aware │ Auto-complete  │ PR review        │
│ Extensions     │ .cursor/rules  │ Agentic flows  │ Suggestions      │
│ Collaboration  │ Agent mode     │ Cascade chains │ Copilot chat     │
├────────────────┴────────────────┴────────────────┴──────────────────┤
│              Live Context Sync Layer (MCP + CLAUDE.md)               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Zed v0.18 Context Server

```toml
# .zed/settings.toml — V8.0
[context_server]
enabled = true
protocol = "mcp"  # Model Context Protocol
sources = [
    "CLAUDE.md",
    "agents/protocol.md",
    "docs/CODEMAPS/*.md",
]

[context_server.providers]
claude = { model = "claude-4.6-sonnet", provider = "anthropic" }
gemini = { model = "gemini-3.1-pro", provider = "google" }

[assistant]
enabled = true
model = "claude-4.6-sonnet"
context_server = true  # Feed from context server

[extensions]
lab-agent = { version = "1.0", source = "local", path = ".zed/extensions/lab-agent" }
```

---

## Step 2: Cursor v4 Composer AI

```json
// .cursor/rules/v8-lab-rules.json
{
  "version": "8.0",
  "composer": {
    "model": "claude-4.6-sonnet",
    "context_sources": [
      "CLAUDE.md",
      "agents/protocol.md",
      "specs/**/*.md",
      "plans/**/*.md"
    ],
    "multi_file_editing": true,
    "codebase_search": true,
    "agent_mode": true,
    "auto_apply": false
  },
  "rules": [
    "Always read CLAUDE.md before making changes",
    "Follow spec-driven, plan-first methodology",
    "Never modify files outside approved scope",
    "Run tests after every change",
    "Use TypeScript for all new code",
    "Follow the 4-phase work cycle: PLAN → IMPLEMENT → REVIEW → VERIFY"
  ],
  "quality_gates": {
    "lint_errors": 0,
    "test_coverage": ">= 85%",
    "type_safety": ">= 95%"
  }
}
```

---

## Step 3: Multi-IDE Federation

```yaml
# .agent/capabilities/ide-federation.yaml
federation:
  sync_protocol: "mcp"
  shared_context:
    - CLAUDE.md
    - agents/protocol.md
    - docs/CODEMAPS/*.md
    - governance/agent-constitution.yaml

  ide_configs:
    zed:
      config_path: ".zed/settings.toml"
      context_server: true
      extensions: ["lab-agent"]

    cursor:
      config_path: ".cursor/rules/"
      composer_ai: true
      agent_mode: true

    windsurf:
      config_path: ".windsurf/config.json"
      cascade: true
      flow_agents: true

    copilot:
      config_path: ".github/copilot-instructions.md"
      workspace_agent: true
      chat: true

  live_sync:
    enabled: true
    interval: "5s"
    conflict_resolution: "last-write-wins"
    broadcast_changes: true
```

---

## Step 4: AI Pair Programming Sessions (V8.0 NEW)

```python
class AIPairProgrammer:
    """Real-time AI pair programming across IDEs."""

    async def start_session(self, task: str, lead_ide: str = "cursor") -> Session:
        session = Session(
            task=task,
            lead_ide=lead_ide,
            models=["claude-4.6-sonnet", "gemini-3.1-pro"],
            context=await self.load_context(),
        )

        # AI takes navigator role, human takes driver role
        session.roles = {
            "driver": "human",
            "navigator": "ai",
        }

        # Start real-time suggestions
        session.start_navigator(
            suggest_interval="on_pause",   # Suggest when human pauses
            review_interval="on_save",      # Review on file save
            refactor_interval="on_request", # Refactor on request
        )

        return session
```

---

## Commands

```bash
# Sync all IDE configurations
/ide-agents --sync --all

# Set up Zed v0.18 context server
/ide-agents --setup --ide zed --context-server

# Configure Cursor v4 Composer AI
/ide-agents --setup --ide cursor --composer-ai

# Enable Windsurf Cascade
/ide-agents --setup --ide windsurf --cascade

# Start multi-IDE federation
/ide-agents --federation --start

# Start AI pair programming session (V8.0)
/ide-agents --pair --task "Implement auth module" --lead cursor

# Generate IDE-specific config from CLAUDE.md
/ide-agents --generate --from CLAUDE.md --to all
```
