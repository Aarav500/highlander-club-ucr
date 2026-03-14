---
description: "Enterprise compliance engine — SOC2, HIPAA, GDPR automated scanning and evidence collection"
---

# Enterprise Compliance Engine

> Automated compliance scanning for SOC2 Type II, HIPAA, and GDPR. Generates evidence, identifies gaps, and produces remediation plans.

---

## Supported Frameworks

| Framework | Scope | Controls | Config File |
|-----------|-------|----------|-------------|
| SOC2 Type II | Trust Services Criteria | 64 controls | `governance/compliance/soc2-controls.yaml` |
| HIPAA | Technical Safeguards | 42 safeguards | `governance/compliance/hipaa-safeguards.yaml` |
| GDPR | Articles 25 & 32 | 28 requirements | `governance/compliance/gdpr-checklist.yaml` |

---

## Phase 1: Scan

1. **Read app registry** from `labs-config.yaml`.
2. **For each app**, scan against selected framework(s):
   - Code analysis (secrets, PII handling, encryption)
   - Infrastructure review (network, access controls, logging)
   - Data flow mapping (where PII moves, storage, transmission)
   - Access control audit (RBAC, MFA, session management)

3. **Produce findings** as structured YAML:
   ```yaml
   finding:
     id: SOC2-CC6.1-001
     framework: soc2
     control: CC6.1
     title: "Logical Access Controls"
     status: partial          # pass | partial | fail | not_applicable
     evidence:
       - type: code_review
         path: apps/api-node/src/middleware/auth.js
         detail: "JWT validation present but no role-based access control"
     remediation: "Implement RBAC middleware using platform/auth module"
     priority: high
   ```

---

## Phase 2: Evidence Collection

For each control, collect and organize evidence:

| Evidence Type | Source | Example |
|---------------|--------|---------|
| Code artifacts | Git repo | Auth middleware, encryption functions |
| Config files | Infra | TLS settings, firewall rules, CORS config |
| Logs | Monitoring | Access logs, audit trails, error logs |
| Documentation | Docs | Security policies, incident response plans |
| Test results | CI/CD | Security scan outputs, penetration test reports |

Evidence is saved to:
```
governance/compliance/evidence/<framework>/<control-id>/
```

---

## Phase 3: Gap Analysis Report

Generate a compliance report per framework:

```markdown
# SOC2 Type II Compliance Report
Generated: 2026-03-14

## Summary
| Status | Count | Percentage |
|--------|-------|------------|
| Pass   | 48    | 75%        |
| Partial| 10    | 16%        |
| Fail   | 4     | 6%         |
| N/A    | 2     | 3%         |

## Critical Gaps
1. CC6.1 — No RBAC implementation
2. CC7.2 — No intrusion detection system
3. CC8.1 — No formal change management process
4. A1.2 — No documented disaster recovery plan

## Remediation Plan
[Prioritized list of fixes with estimated effort]
```

---

## Phase 4: Remediation

1. **Auto-fix** where possible:
   - Add missing security headers
   - Enable encryption at rest
   - Add audit logging middleware
   - Generate missing documentation templates

2. **Flag for human review:**
   - Policy documents requiring legal review
   - Infrastructure changes requiring ops approval
   - Third-party vendor assessments

3. **⏸️ STOP — Review remediation plan before applying fixes.**

---

## Commands

```bash
# Full compliance scan (all frameworks)
/compliance-engine --scan --all

# Scan specific framework
/compliance-engine --scan --soc2
/compliance-engine --scan --hipaa
/compliance-engine --scan --gdpr

# Generate evidence bundle
/compliance-engine --evidence --framework soc2

# Gap analysis report
/compliance-engine --report --framework hipaa

# Auto-remediate (with approval)
/compliance-engine --fix --framework gdpr

# Audit readiness check
/compliance-engine --audit-ready
```
