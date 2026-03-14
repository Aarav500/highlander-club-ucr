---
description: "Multi-modal agent pipelines — Vision, Audio, Video to code/tickets/bugs via Gemini 2.5 Pro + Claude 4.5"
---

# Multi-Modal Agents Workflow (V7.0)

> Transform visual, audio, and video inputs into actionable code, tickets, and bug reports. V7.0 adds Gemini 2.5 Vision, Claude Opus 4.6, and Sora v3 integration (see `multimodal-v2.md` for advanced pipelines).

---

## Pipelines

```
  Input               Pipeline                    Output
  ────────────────────────────────────────────────────────
  Diagram/Screenshot → Vision Agent  → Generated Code
  Meeting Recording  → Audio Agent   → Action Items / Tickets
  Screen Recording   → Video Agent   → Bug Report / Repro Steps
```

---

## Model Routing

| Pipeline | Primary Model | Secondary Model | Reason |
|----------|---------------|-----------------|--------|
| Vision → Code | Gemini 2.5 Pro | Claude 4.5 Sonnet | Gemini excels at visual understanding; Claude refines code |
| Audio → Tickets | Gemini 2.5 Pro | Claude 4.5 Sonnet | Gemini handles audio transcription; Claude structures tickets |
| Video → Bugs | Gemini 2.5 Pro | Claude 4.5 Sonnet | Gemini processes video frames; Claude generates bug reports |

---

## Pipeline 1: Vision (Diagrams → Code)

### Supported Inputs
- Architecture diagrams (Excalidraw, Mermaid, hand-drawn)
- UI mockups (Figma screenshots, wireframes, napkin sketches)
- ER diagrams → database schemas
- Flow charts → state machines / business logic

### Process
1. **Ingest image** — accept PNG, JPG, SVG, PDF.
2. **Gemini 2.5 Pro analysis:**
   - Identify diagram type (architecture, UI, ER, flow)
   - Extract entities, relationships, labels, and data flows
   - Produce structured JSON intermediate representation
3. **Claude 4.5 code generation:**
   - Convert JSON IR to production code
   - Architecture → module scaffolds + API contracts
   - UI mockup → React components + Tailwind CSS
   - ER diagram → Prisma/Drizzle schema + migrations
   - Flow chart → TypeScript state machine

### Example
```bash
/multimodal --vision --input "diagram.png" --output-type react-component
```

---

## Pipeline 2: Audio (Meetings → Tickets)

### Supported Inputs
- Meeting recordings (MP3, WAV, M4A, WebM)
- Voice memos
- Standup recordings

### Process
1. **Transcribe** via Gemini 2.5 Pro (native audio understanding).
2. **Extract structured data:**
   - Action items with assignees and deadlines
   - Decisions made (with context)
   - Open questions / blockers
   - Feature requests mentioned
3. **Generate outputs:**
   - GitHub Issues (one per action item)
   - Decision docs (saved to `docs/decisions/`)
   - Meeting summary (Markdown)

### Example
```bash
/multimodal --audio --input "standup-2026-03-14.m4a" --output github-issues
```

---

## Pipeline 3: Video (Screen Recordings → Bugs)

### Supported Inputs
- Screen recordings (MP4, WebM, MOV)
- Loom/screen capture videos
- User-submitted bug recordings

### Process
1. **Frame extraction** — sample key frames at state transitions.
2. **Gemini 2.5 Pro analysis:**
   - Identify UI state at each frame
   - Detect error messages, broken layouts, unexpected behavior
   - Map interaction sequence (click → type → error)
3. **Claude 4.5 bug report generation:**
   - Steps to reproduce (numbered)
   - Expected vs actual behavior
   - Environment details (browser, viewport, OS)
   - Severity classification (P0–P3)
   - Suggested fix (if pattern matches known issues)

### Example
```bash
/multimodal --video --input "bug-report.mp4" --output github-issue
```

---

## Integration with Agent Workflows

Multi-modal inputs can feed directly into other V7.0 workflows:

| Input | Pipeline | Feeds Into |
|-------|----------|-----------|
| Architecture diagram | Vision → Code | `/swarm-v3` (task decomposition) |
| Meeting recording | Audio → Tickets | `/new-app-from-idea` (spec creation) |
| Bug screen recording | Video → Bug | `/build-error-resolver` (auto-fix) |
| Research paper PDF | Vision → Summary | `/arxiv-bot` (literature review) |
| UI mockup | Vision → Components | `/design-agentic` (design governance) |
| Product demo | Video → Marketing | `/multimodal-v2 --sora-v3` (video gen) |

---

## Commands

```bash
# Vision: diagram to code
/multimodal --vision --input <image> --output-type <react|schema|api|state-machine>

# Audio: meeting to tickets
/multimodal --audio --input <recording> --output <github-issues|decisions|summary>

# Video: recording to bug report
/multimodal --video --input <video> --output <github-issue|repro-steps>

# Batch process multiple inputs
/multimodal --batch --dir ./inputs/ --output-dir ./outputs/
```
