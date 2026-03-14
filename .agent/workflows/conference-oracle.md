---
description: Conference prep — Oracle AI World Tour + Google Cloud Next auto-generated talks, demos, and venue-specific templates
---

# Conference Prep: AI World Tour (V9.0)

> Auto-generate conference talks, live demos, and venue-specific slide decks for Oracle AI World Tour, Google Cloud Next, and other major tech conferences.

## Prerequisites

- Slide generation engine (reveal.js or Marp)
- Demo environment (Replit or local Docker)
- Screen recording tooling (for fallback demos)
- Speaker notes generation (Claude 4.6)

## When to Use

- Preparing talks for Oracle AI World Tour, Google Cloud Next, or similar
- Auto-generating slide decks with venue-specific branding
- Building live demo environments that won't fail on stage
- Creating rehearsal workflows with timing and Q&A prep

---

## Phase 1: Talk Generation

### 1.1 Talk Generator Configuration

```yaml
# conference/talk-generator.yaml
talk_generator:
  input:
    topic: required  # "Building AI-Native Apps with RAG v3"
    venue: required  # oracle-aiwt | google-next | aws-reinvent | custom
    duration: 30  # minutes
    audience: [developers, architects, executives]
    tech_level: intermediate  # beginner | intermediate | advanced
    demo_required: true
  
  output:
    slides:
      format: [reveal.js, marp, pptx, google-slides]
      sections:
        - title_slide (venue-branded)
        - problem_statement (2-3 slides)
        - solution_overview (3-5 slides)
        - architecture_deep_dive (3-5 slides)
        - live_demo (placeholder + fallback)
        - results_metrics (2-3 slides)
        - call_to_action (1 slide)
        - qa_slide
      design:
        theme: venue-specific
        code_highlighting: true
        animations: subtle
        diagrams: mermaid-rendered
    
    speaker_notes:
      style: conversational
      timing: per-slide
      transitions: scripted
      audience_engagement: questions + polls
    
    handout:
      format: [pdf, markdown]
      includes: [slides, notes, links, code-samples]
```

### 1.2 Venue Templates

| Venue | Brand Colors | Slide Ratio | Special Features |
|-------|-------------|-------------|-----------------|
| Oracle AI World Tour | Red (#C74634) + Dark | 16:9 | OCI integration demos, Java focus |
| Google Cloud Next | Blue (#4285F4) + White | 16:9 | GCP console live, Vertex AI |
| AWS re:Invent | Orange (#FF9900) + Dark | 16:9 | Lambda demos, SageMaker |
| Microsoft Build | Blue (#0078D4) + Light | 16:9 | Azure OpenAI, Copilot |
| NVIDIA GTC | Green (#76B900) + Dark | 16:9 | CUDA demos, TensorRT |
| Custom | Configurable | Configurable | User-defined branding |

---

## Phase 2: Live Demo Environments

### 2.1 Demo Environment Configuration

```yaml
# conference/demo-env.yaml
demo_environment:
  strategy: defense-in-depth
  
  layers:
    live_primary:
      runtime: docker-compose
      services:
        - frontend (Next.js, pre-built)
        - backend (Express, pre-seeded DB)
        - inference (vLLM, model pre-loaded)
      networking:
        fallback_dns: local-hosts-file
        offline_capable: true
      data:
        seed: deterministic (same demo every time)
        reset: one-command
    
    live_backup:
      runtime: replit
      url: "https://replit.com/@user/demo-backup"
      auto_sync: pre-conference
    
    recorded_fallback:
      videos:
        - demo-happy-path.mp4
        - demo-error-handling.mp4
        - demo-scaling.mp4
      auto_switch: if-live-fails
      timing: synced-to-talk
  
  reliability:
    pre_flight_check: 30min before
    health_endpoints: [/health, /api/status, /model/ready]
    auto_recovery: restart-on-crash
    max_recovery_time: 10s
    wifi_independence: true  # Works without conference WiFi
```

### 2.2 Demo Script Engine

```yaml
demo_scripts:
  format: step-by-step
  features:
    - auto_typing (configurable speed)
    - pre_loaded_responses (for flaky APIs)
    - audience_interaction_points
    - timing_markers (sync with slides)
    - error_injection (for "look how it recovers" moments)
  
  recording:
    auto_record: true
    format: [mp4, gif, webm]
    resolution: 1920x1080
    captions: auto-generated
```

---

## Phase 3: Rehearsal Mode

### 3.1 Rehearsal Configuration

```yaml
rehearsal:
  modes:
    full_run:
      timer: visible
      pace_alerts: true (too fast / too slow)
      slide_transitions: auto-advance (optional)
      demo_simulation: full-live
    
    section_practice:
      focus: single-section
      repeat: until-confident
      feedback: ai-generated
    
    qa_prep:
      model: claude-4.6
      persona: [skeptical-architect, curious-developer, budget-conscious-executive]
      questions_per_persona: 5
      difficulty: [easy, medium, hard, hostile]
      suggested_answers: true
  
  feedback:
    timing:
      target_per_slide: calculated
      alerts: [15% over, 25% over]
    content:
      clarity_score: ai-evaluated
      technical_accuracy: verified
      engagement_level: predicted
    delivery:
      filler_word_detection: ["um", "uh", "like", "basically"]
      pace_variation: measured
      pause_usage: scored
```

---

## Phase 4: Post-Conference

### 4.1 Content Repurposing

```yaml
repurposing:
  from_talk:
    - blog_post (long-form, SEO-optimized)
    - twitter_thread (10-15 tweets with visuals)
    - linkedin_article (professional tone)
    - youtube_video (recording + post-production)
    - github_repo (demo code, cleaned up)
    - documentation (tutorial format)
  
  auto_generate:
    model: claude-4.6
    input: [slides, speaker_notes, recording_transcript]
    review: human-required
    
  distribution:
    schedule: post-conference-week
    channels: [blog, social, youtube, dev.to, hackernews]
```

---

## Slash Commands

```bash
# Talk Generation
/conference-aiwt --generate --topic "RAG v3" --venue oracle-aiwt --duration 30
/conference-aiwt --generate --topic "Edge AI" --venue google-next --duration 45
/conference-aiwt --slides --format reveal.js --theme oracle

# Demo Environment
/conference-aiwt --demo --setup --spec specs/demo-app.md
/conference-aiwt --demo --preflight --check-all
/conference-aiwt --demo --record --scenario happy-path

# Rehearsal
/conference-aiwt --rehearse --mode full-run --timer
/conference-aiwt --rehearse --qa --personas skeptical-architect,curious-developer
/conference-aiwt --rehearse --feedback

# Post-Conference
/conference-aiwt --repurpose --from talk-recording.mp4
/conference-aiwt --repurpose --blog --seo-optimize
/conference-aiwt --repurpose --social --platform twitter,linkedin
```

## Agent Roles

| Role | Responsibility |
|------|---------------|
| `conference-producer` | Talk generation, demo setup, rehearsal orchestration (V9.0) |
| `slide-designer` | Venue-specific templates, visual design, diagram rendering |
| `demo-engineer` | Live demo environments, reliability, fallback recording |
| `content-repurposer` | Post-conference blog, social, video content |

## Model Tier

**Tier 1 — Deep**: Claude Opus for talk generation and Q&A prep. Tier 2 for slide design and content repurposing.
