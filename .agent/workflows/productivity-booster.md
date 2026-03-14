---
description: "Developer Productivity Booster — Sprint optimizer + AI pair programming + velocity forecasting + bottleneck detection"
---

# Developer Productivity Booster (V10.0)

> Sprint planning with AI, pair programming orchestration, 3× velocity, bottleneck detection, standup summarization.

---

## Components

### 1. Sprint Optimizer

```yaml
sprint_optimizer:
  planning:
    model: claude-opus-4.6
    inputs: [backlog, velocity_history, team_capacity, dependencies]
    outputs:
      - optimal_sprint_scope
      - risk_assessment
      - dependency_graph
      - estimated_completion

  capacity_planning:
    factor_in: [pto, meetings, on-call, learning_days]
    buffer: 20%  # Always leave slack
    overcommit_alert: true

  story_sizing:
    method: ai-assisted-points
    calibration: team-historical
    confidence_interval: true
```

### 2. AI Pair Programming

```python
class AIPairProgrammer:
    """Intelligent pair programming orchestration."""

    async def suggest_pair(self, task: Task, team: Team) -> PairSuggestion:
        # Match by complementary skills
        candidates = self.rank_by_skill_complement(task.required_skills, team)

        # Consider learning goals
        candidates = self.boost_learning_opportunities(candidates, team.growth_plans)

        # Respect preferences and timezone
        candidates = self.filter_availability(candidates)

        return PairSuggestion(
            driver=candidates[0],
            navigator=candidates[1],
            estimated_speedup="1.5-2×",
            learning_opportunity=self.identify_learning(candidates),
        )
```

### 3. Velocity Forecasting

```yaml
velocity_forecast:
  model: monte-carlo-simulation
  runs: 10000
  factors:
    - historical_velocity: 12_sprints
    - team_changes: +/- members
    - technical_debt: complexity_score
    - context_switching: meeting_load
  output:
    optimistic: p85
    likely: p50
    pessimistic: p15
  visualization: cone-of-uncertainty
```

### 4. Bottleneck Detection

```yaml
bottleneck_detection:
  signals:
    code_review:
      alert: "PR wait time > 4h"
      action: auto-assign-reviewer
    ci_pipeline:
      alert: "build time > 10min"
      action: identify-slow-steps
    deployment:
      alert: "deploy queue > 3"
      action: parallelize-or-batch
    knowledge:
      alert: "bus factor = 1"
      action: suggest-pair-session
    decision:
      alert: "blocked-on-decision > 2d"
      action: escalate-to-lead
```

### 5. Standup Summarizer

```yaml
standup:
  auto_generate:
    from: [git_commits, pr_activity, jira_updates, slack_threads]
    format: "Yesterday / Today / Blockers"
  async_mode:
    channel: slack
    schedule: "9am daily"
    skip_if: no_activity
  insights:
    - stale_in_progress: "> 3 days"
    - blocked_items: auto-surface
    - celebrations: auto-detect-merges
```

---

## Targets

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Sprint velocity | baseline | 3× | AI planning + pair programming |
| PR cycle time | 24h | 4h | Auto-assign + bottleneck detection |
| Build time | 15min | 5min | CI optimization |
| Meeting overhead | 30% | 15% | Async standups + audit |
| Planning accuracy | 60% | 90% | Monte Carlo forecasting |

---

## Commands

```bash
# Sprint planning
/productivity-booster --sprint --plan --capacity team.yaml

# AI pair programming match
/productivity-booster --pair --task JIRA-1234 --team backend

# Velocity forecast
/productivity-booster --forecast --sprints 3 --confidence 85

# Bottleneck analysis
/productivity-booster --bottleneck --detect --team all

# Auto-generate standup
/productivity-booster --standup --generate --team backend

# CI pipeline optimization
/productivity-booster --ci --optimize --target 5min

# Sprint retrospective insights
/productivity-booster --retro --insights --sprint current

# Developer time audit
/productivity-booster --time-audit --coding-vs-meetings --period 2w
```
