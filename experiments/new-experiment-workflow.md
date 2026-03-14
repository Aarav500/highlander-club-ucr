---
description: Define, launch, and conclude an A/B experiment
model_tier: 2  # Tier 2 (Sonnet) — experiment design and analysis
---

# New Experiment Workflow

A structured process for designing, launching, measuring, and concluding an A/B experiment.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `experiment_key` | ✅ | Unique kebab-case key (e.g., `checkout-v2-test`) |
| `hypothesis` | ✅ | "We believe [change] will [impact] because [reason]" |
| `metric_key` | ✅ | Primary success metric event name from analytics schema |
| `variants` | Optional | JSON array of `{name, weight}` (default: 50/50 control/treatment) |
| `duration_days` | Optional | How long to run (default: 14) |

---

## Steps

### 1 — Design the Experiment

1. Document the hypothesis and expected impact.
2. Identify the **primary metric** (one number that determines success) and **guardrail metrics** (metrics that must not regress).
3. Define variants:
   - `control` — current behavior (no change)
   - `treatment` — the new behavior
   - Additional variants if testing multiple approaches (keep total ≤ 4)
4. Estimate required sample size for statistical significance (use a power calculator if available).

Produce an **Experiment Design Doc**:

```markdown
# Experiment: <experiment_key>

**Hypothesis:** <hypothesis>
**Primary metric:** <metric_key>
**Guardrail metrics:** <list>
**Variants:** control (50%), treatment (50%)
**Duration:** <duration_days> days
**Minimum sample:** <estimated_n> users per variant
```

**⏸️ STOP — Present the design doc for human approval before proceeding.**

### 2 — Implement the Flag

1. Insert a row into `feature_flags`:
   ```sql
   INSERT INTO feature_flags (key, description, enabled, rollout_pct)
   VALUES ('<experiment_key>', '<hypothesis>', false, 0);
   ```

2. Insert a row into `experiments`:
   ```sql
   INSERT INTO experiments (key, description, status, variants, metric_key)
   VALUES (
     '<experiment_key>',
     '<hypothesis>',
     'draft',
     '[{"name":"control","weight":50},{"name":"treatment","weight":50}]',
     '<metric_key>'
   );
   ```

3. Add the flag check in code:
   ```javascript
   // In the relevant route or component
   const variant = req.experiment('<experiment_key>');
   if (variant === 'treatment') {
     // new behavior
   } else {
     // existing behavior (control)
   }
   ```

4. Add an `experiment_exposure` analytics event at the point of assignment:
   ```javascript
   trackEvent('experiment_exposure', {
     experiment_key: '<experiment_key>',
     variant: variant,
     user_id: req.user.id
   });
   ```

5. Run tests to ensure both paths work.

### 3 — Launch

1. Set experiment status to `running`:
   ```sql
   UPDATE experiments SET status = 'running', start_date = NOW()
   WHERE key = '<experiment_key>';
   ```

2. Enable the flag and set rollout:
   ```sql
   UPDATE feature_flags SET enabled = true, rollout_pct = 100
   WHERE key = '<experiment_key>';
   ```

3. Monitor for the first 24 hours:
   - Check error rates aren't elevated in treatment group
   - Verify exposure events are being logged
   - Confirm variant assignment is roughly balanced

### 4 — Analyze Results

After `duration_days` have passed:

1. Query exposure and conversion data:
   ```sql
   SELECT
     ea.variant,
     COUNT(DISTINCT ea.user_id) AS users,
     COUNT(DISTINCT e.user_id) AS conversions,
     ROUND(COUNT(DISTINCT e.user_id)::NUMERIC / COUNT(DISTINCT ea.user_id) * 100, 2) AS rate_pct
   FROM experiment_assignments ea
   LEFT JOIN events e
     ON e.user_id = ea.user_id
     AND e.event_name = '<metric_key>'
     AND e.created_at >= '<start_date>'
   WHERE ea.experiment_key = '<experiment_key>'
   GROUP BY ea.variant;
   ```

2. Check statistical significance (p < 0.05).
3. Check guardrail metrics haven't regressed.
4. Produce an **Experiment Results** summary.

**⏸️ STOP — Present results for human decision.**

### 5 — Conclude

Based on the results:

- **Treatment wins:** Roll out treatment to 100%, remove the flag check, clean up control code path.
- **Control wins:** Remove the flag check, keep existing behavior, remove treatment code.
- **Inconclusive:** Extend duration, increase sample, or redesign the experiment.

Update the experiment record:
```sql
UPDATE experiments
SET status = 'concluded', end_date = NOW(), concluded_variant = '<winner>'
WHERE key = '<experiment_key>';
```

Create a decision doc in `docs/decisions/` recording the outcome and rationale.

---

## Constraints

- **One primary metric per experiment.** Multiple metrics make it hard to declare a winner.
- **No peeking.** Don't conclude early based on partial data — wait for the full duration.
- **Max 3 concurrent experiments** on the same user flow to avoid interaction effects.
- **Always have a control.** Never test without a baseline.
