---
description: "Multi-modal v2 — Gemini 2.5 Vision diagram→code + video→bugs + Sora v3 + world simulation"
---

# Multi-Modal v2 Workflow

> Advanced multi-modal AI pipelines: diagram-to-code, video-to-bugs, Sora v3 video generation, and world simulation for agent testing. Builds on V5.0 `multimodal-agents.md` with upgraded models and new capabilities.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Multi-Modal v2 Pipeline                       │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Vision      │  Video       │  Sora v3     │  World Sim        │
│  Diagram→    │  Recording→  │  Text→Video  │  Physics +        │
│  Code        │  Bug Report  │  Generation  │  Agent Test       │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Gemini 2.5   │ Frame extract│ 4K 60s       │ MuJoCo + Genie    │
│ Vision       │ State detect │ Action cond  │ Gymnasium RL      │
│ Claude 4.6   │ Repro steps  │ Style ctrl   │ Domain random     │
│ React/Schema │ Auto-file    │ Video DiT    │ Stress test       │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## Pipeline 1: Advanced Vision (Diagrams → Production Code)

### V7.0 Upgrades over V5.0

| Feature | V5.0 | V7.0 |
|---------|------|------|
| Model | Gemini 2.5 Pro | Gemini 2.5 Vision (specialized) |
| Code Gen | Claude 4.5 Sonnet | Claude Opus 4.6 |
| Output | Single file | Full module scaffold |
| Accuracy | ~70% | ~90% (trained on codebase patterns) |

### Supported Diagram Types

| Input | Output | Model Chain |
|-------|--------|-------------|
| Architecture diagram | Module scaffold + API contracts | Gemini Vision → Claude Opus |
| UI wireframe/mockup | React + Tailwind components | Gemini Vision → Claude Opus |
| ER diagram | Prisma schema + migrations | Gemini Vision → Claude Opus |
| Flow chart | TypeScript state machine | Gemini Vision → Claude Opus |
| API sequence diagram | Route handlers + middleware | Gemini Vision → Claude Opus |
| Hand-drawn sketch | Closest matching component | Gemini Vision → Options Engine |

### Process

1. **Ingest** — accept PNG, JPG, SVG, PDF, Excalidraw, Figma export.
2. **Gemini 2.5 Vision analysis:**
   - Classify diagram type
   - Extract entities, relationships, labels, data flows
   - Produce structured JSON intermediate representation (IR)
3. **Context enrichment:**
   - Cross-reference IR with existing codebase patterns
   - Check Options Engine for matching design system
   - Apply project conventions from CLAUDE.md
4. **Claude Opus 4.6 code generation:**
   - Convert IR to production code following project patterns
   - Generate tests alongside implementation
   - Include imports, types, and error handling

```bash
/multimodal-v2 --vision --input "architecture.png" --output module-scaffold
/multimodal-v2 --vision --input "wireframe.fig" --output react-components --design-system shadcn
```

---

## Pipeline 2: Video Analysis (Screen Recordings → Bug Reports)

### V7.0 Upgrades

- **Intelligent frame sampling** — detect state transitions, not fixed intervals
- **UI element recognition** — map to component tree, not just visual regions
- **Auto-severity classification** — P0-P3 based on user flow impact
- **Suggested fix** — pattern-match against known issues in the codebase

### Process

1. **Frame extraction** — key frames at state transitions (click, navigation, error).
2. **Gemini 2.5 Vision analysis** per frame:
   - Identify UI state, visible components, data displayed
   - Detect error messages, broken layouts, unexpected behavior
   - Map interaction sequence: action → result → deviation
3. **Claude Opus 4.6 report generation:**
   ```markdown
   ## Bug Report — Auto-Generated from Screen Recording
   
   **Severity:** P1
   **Component:** UserProfile → EditForm
   **Environment:** Chrome 125, 1440×900, macOS
   
   ### Steps to Reproduce
   1. Navigate to /settings/profile
   2. Click "Edit Profile" button
   3. Clear the "Name" field
   4. Click "Save Changes"
   5. ❌ Error: Unhandled exception (see frame 4)
   
   ### Expected vs Actual
   - **Expected:** Validation error "Name is required"
   - **Actual:** Uncaught TypeError: Cannot read property 'trim' of null
   
   ### Suggested Fix
   Add null check in `ProfileForm.handleSubmit()` at line 47:
   `const name = formData.name?.trim() ?? '';`
   ```

```bash
/multimodal-v2 --video --input "bug.mp4" --output github-issue
/multimodal-v2 --video --input "qa-session.webm" --output bug-report --auto-file
```

---

## Pipeline 3: Sora v3 Video Generation

### Capabilities

| Feature | Sora v2 (V5.0) | Sora v3 (V7.0) |
|---------|----------------|----------------|
| Resolution | 1080p | 4K |
| Duration | 20s | 60s |
| Action conditioning | Basic | Multi-step sequences |
| Style control | Prompt only | Style transfer + ref image |
| Physics | Approximate | Realistic (MuJoCo-backed) |

### Use Cases in the Lab

```yaml
sora_v3_uses:
  - type: product_demo
    input: "App screenshots + feature description"
    output: "60s product demo video with transitions"

  - type: ui_prototype
    input: "Wireframe + interaction spec"
    output: "Interactive prototype video showing user flow"

  - type: training_data
    input: "Scene description + action sequence"
    output: "Synthetic training data for vision models"

  - type: marketing
    input: "Brand guidelines + product images"
    output: "Marketing video with brand-consistent style"
```

```bash
/multimodal-v2 --sora-v3 --prompt "Product demo of dashboard with real-time analytics" --style "dark, futuristic" --duration 30s
/multimodal-v2 --sora-v3 --prototype --wireframe "dashboard.png" --interactions "click sidebar, filter data, export CSV"
```

---

## Pipeline 4: World Simulation (Agent Testing)

### Physics-Engine-Backed Virtual Environments

Combine Sora v3 video generation with MuJoCo/Genie 2 physics for realistic agent testing environments:

```yaml
world_sim:
  environment:
    type: "web-app-simulator"  
    physics: mujoco
    rendering: sora-v3
    
  test_scenarios:
    - name: "Load test UI under degraded network"
      conditions: { latency: "500ms", packet_loss: "5%" }
      agents: ["user-bot-1", "user-bot-2", "user-bot-3"]
      assertions: ["ui-responsive", "no-crashes", "graceful-degradation"]

    - name: "Accessibility navigation test"
      conditions: { input: "keyboard-only", screen_reader: true }
      agents: ["a11y-bot"]
      assertions: ["all-interactive-focusable", "aria-labels-present"]

    - name: "Multi-device layout test"
      conditions: { devices: ["iphone-15", "ipad-pro", "desktop-4k"] }
      agents: ["layout-bot"]
      assertions: ["no-overflow", "touch-targets-48px", "responsive"]
```

```bash
/multimodal-v2 --world-sim --scenario "load-test" --agents 10 --duration 5min
/multimodal-v2 --world-sim --scenario "a11y-audit" --input "http://localhost:3000"
```

---

## Commands Summary

```bash
# Vision: diagram/wireframe to code
/multimodal-v2 --vision --input <image> --output <module|components|schema|state-machine>

# Video: screen recording to bug report
/multimodal-v2 --video --input <video> --output <github-issue|bug-report>

# Sora v3: generate videos
/multimodal-v2 --sora-v3 --prompt "..." --style "..." --duration <seconds>

# World simulation: agent testing
/multimodal-v2 --world-sim --scenario <name> --agents <count>

# Multi-modal chain: screenshot → component → test → deploy
/multimodal-v2 --chain --input "mockup.png" --pipeline vision,generate,test,deploy
```
