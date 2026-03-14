---
description: "Capital Expenditure Optimizer — 75% cloud cost reduction via AI auto-scaling, spot orchestration, right-sizing, budget forecasting"
---

# Capital Expenditure Optimizer (V10.0)

> 75% cloud cost reduction through intelligent auto-scaling, spot instance orchestration, reserved capacity planning, unused resource detection, and AI budget forecasting.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                  Cost Optimizer Stack V10.0                           │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  Discovery   │  Optimization│  Forecasting │  Governance            │
│              │              │              │                        │
├──────────────┼──────────────┼──────────────┼────────────────────────┤
│ Resource map │ Right-sizing │ Spend pred   │ Budget alerts          │
│ Idle detect  │ Spot migrate │ Capacity plan│ Approval workflows     │
│ Usage audit  │ Reserved buy │ Trend model  │ Chargeback report      │
│ Tag enforce  │ Schedule opt │ Anomaly det  │ Policy enforcement     │
│ Waste ID     │ Multi-cloud  │ What-if sim  │ FinOps dashboard       │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```

---

## Components

### 1. Resource Discovery & Waste Detection

```yaml
resource_discovery:
  providers: [aws, gcp, azure]
  
  waste_detection:
    idle_instances:
      cpu_threshold: "<5% for 72h"
      action: terminate-or-downsize
      savings_estimate: true
      
    oversized_resources:
      cpu_utilization: "<20% avg"
      memory_utilization: "<30% avg"
      action: right-size-recommendation
      
    unused_storage:
      unattached_ebs: detect
      old_snapshots: ">90 days"
      empty_buckets: detect
      
    orphaned_resources:
      unattached_ips: detect
      unused_load_balancers: detect
      stale_dns_records: detect
      
    dev_environment_waste:
      non_prod_running_24x7: detect
      action: schedule-stop (nights + weekends)
      savings: "~65% on dev/staging"
```

### 2. Optimization Engine

```python
class CostOptimizer:
    """AI-driven cloud cost optimization."""

    async def optimize(self, infrastructure: Infrastructure) -> OptimizationPlan:
        plan = OptimizationPlan()

        # Right-sizing recommendations
        for instance in infrastructure.compute:
            optimal = await self.recommend_size(instance)
            if optimal.cost < instance.cost:
                plan.add(RightSize(instance, optimal, savings=instance.cost - optimal.cost))

        # Spot instance migration candidates
        for workload in infrastructure.stateless_workloads:
            spot_savings = self.calculate_spot_savings(workload)
            if spot_savings > 0.5:  # >50% savings
                plan.add(SpotMigration(workload, savings=spot_savings))

        # Reserved instance purchasing
        steady_state = self.identify_steady_state(infrastructure)
        ri_plan = self.optimize_reserved(steady_state, term="1yr")
        plan.add(ri_plan)

        # Schedule-based optimization
        for env in infrastructure.non_production:
            plan.add(Schedule(env, hours="8am-6pm M-F", savings="65%"))

        return plan
```

### 3. AI Budget Forecasting

```yaml
budget_forecasting:
  model: prophet + lstm-ensemble
  
  predictions:
    horizon: 12_months
    confidence: 95%
    granularity: daily
    
  features:
    - historical_spend
    - resource_growth_rate
    - seasonal_patterns
    - team_size_changes
    - product_launches
    - traffic_projections
    
  alerts:
    budget_overrun_prediction: 30_days_ahead
    anomaly_detection: real_time
    cost_spike: ">20% daily increase"
    
  what_if:
    scenarios:
      - "Add 10 GPU instances for ML training"
      - "Migrate 50% to spot instances"
      - "Purchase 1-year reserved capacity"
      - "Multi-cloud arbitrage"
```

### 4. Savings Targets

```yaml
savings_targets:
  overall: "75% cost reduction"
  
  by_strategy:
    right_sizing: "-25%"
    spot_instances: "-20%"
    scheduling: "-15%"
    reserved_capacity: "-10%"
    waste_elimination: "-5%"
    
  monitoring:
    savings_realized: monthly_report
    roi_of_optimizer: quarterly
    team_chargeback: per_team_per_month
```

---

## Commands

```bash
# Full cost audit
/cost-optimizer --audit --providers aws,gcp --report

# Waste detection scan
/cost-optimizer --waste --detect --all-resources

# Right-sizing recommendations
/cost-optimizer --right-size --recommend --confidence 95

# Spot instance migration plan
/cost-optimizer --spot --plan --risk-tolerance medium

# Budget forecast
/cost-optimizer --forecast --horizon 6m --scenario baseline

# What-if analysis
/cost-optimizer --what-if --scenario "migrate-to-spot-50pct"

# Schedule non-prod environments
/cost-optimizer --schedule --env staging,dev --hours "8am-6pm"

# FinOps dashboard
/cost-optimizer --dashboard --start --port 3003

# Set budget alerts
/cost-optimizer --budget --alert --threshold 80 --team backend

# Multi-cloud price comparison
/cost-optimizer --compare --workload api-server --providers aws,gcp,azure
```
