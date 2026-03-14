# Enterprise Security & Compliance

> Reference for SOC 2, HIPAA, PCI-DSS compliance, full SBOM supply chain scanning, policy-as-code with OPA, and secrets management with Vault.

---

## Supply Chain Security (SBOM)

### Scanning Stack

| Tool | Purpose | Integration |
|------|---------|-------------|
| **Snyk** | Dependency vulnerabilities + license compliance | GitHub App + CLI |
| **Trivy** | Container + filesystem + IaC scanning | CI + Admission controller |
| **Grype** | SBOM-based vulnerability matching | Pairs with Syft |
| **Syft** | SBOM generation (SPDX + CycloneDX) | CI artifact |

### CI Pipeline

```yaml
# .github/workflows/supply-chain.yml
name: Supply Chain Security
on: [push, pull_request]

jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anchore/sbom-action@v0
        with:
          format: spdx-json
          output-file: sbom.spdx.json
      - uses: anchore/scan-action@v4
        with:
          sbom: sbom.spdx.json
          fail-build: true
          severity-cutoff: high

  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high --all-projects
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          severity: CRITICAL,HIGH
          exit-code: 1
          format: sarif
          output: trivy.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy.sarif
```

---

## Policy-as-Code — OPA Gatekeeper

### Kubernetes Policies

```yaml
# k8s/policies/require-resource-limits.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredresources
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredResources
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredresources
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits
          msg := sprintf("Container %s must have resource limits", [container.name])
        }
```

### Application Policies

```rego
# policies/api-security.rego
package api.security

# Deny requests without authentication
deny[msg] {
    input.request.headers["Authorization"] == ""
    msg := "Missing Authorization header"
}

# Enforce rate limiting
deny[msg] {
    input.request.rate > 100
    msg := sprintf("Rate limit exceeded: %d > 100 req/min", [input.request.rate])
}

# Block sensitive data in responses
deny[msg] {
    response := input.response.body
    contains(response, "ssn")
    msg := "Response contains sensitive PII (SSN)"
}
```

---

## Secrets Management

### HashiCorp Vault

```typescript
import Vault from "node-vault";

const vault = Vault({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

async function getSecret(path: string): Promise<Record<string, string>> {
  const result = await vault.read(`secret/data/${path}`);
  return result.data.data;
}

// Usage
const dbCreds = await getSecret("production/database");
// { host: "db.example.com", password: "***", username: "app" }
```

### AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

async function getSecret(secretId: string): Promise<Record<string, string>> {
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);
  return JSON.parse(response.SecretString!);
}
```

### Secret Rotation Pattern

```yaml
# infra/secret-rotation.yaml
rotation:
  database_credentials:
    interval: 30d
    strategy: dual-secret  # Keep old + new valid during rotation
    steps:
      - generate_new_credentials
      - update_vault
      - deploy_with_new_creds
      - verify_connectivity
      - revoke_old_credentials
  api_keys:
    interval: 90d
    strategy: rolling
```

---

## Compliance Checklists

### SOC 2 Type II

| Control | Category | Implementation |
|---------|----------|---------------|
| Access control | Security | RBAC + MFA via Clerk/Auth0 |
| Encryption at rest | Security | AES-256 (RDS, S3) |
| Encryption in transit | Security | TLS 1.3 everywhere |
| Audit logging | Security | OpenTelemetry → S3 (immutable) |
| Change management | Security | PR reviews + CI gates |
| Incident response | Availability | PagerDuty + runbooks |
| Backup & recovery | Availability | Daily automated + tested quarterly |
| Monitoring | Availability | Sentry + Grafana + uptime checks |
| Vendor management | Security | SBOM + license audit |
| Data retention | Privacy | Auto-purge per retention policy |

### HIPAA (Healthcare)

| Safeguard | Type | Implementation |
|-----------|------|---------------|
| Access controls | Technical | Role-based, minimum necessary |
| Audit controls | Technical | Immutable audit log (CloudTrail) |
| Integrity controls | Technical | SHA-256 checksums on PHI |
| Transmission security | Technical | TLS 1.3 + mTLS for internal |
| Encryption | Technical | AES-256 at rest, TLS in transit |
| BAA agreements | Administrative | With all cloud providers |
| Risk assessment | Administrative | Annual, documented |
| Training | Administrative | Annual security awareness |
| Breach notification | Administrative | 60-day notification process |

### PCI-DSS v4.0

| Requirement | Implementation |
|-------------|---------------|
| Build secure network | WAF + firewall rules + VPC isolation |
| Protect cardholder data | Tokenization via Stripe/Adyen (never store raw PAN) |
| Vulnerability management | Trivy + Snyk + quarterly ASV scans |
| Access control | RBAC + MFA + audit logging |
| Monitor and test | IDS/IPS + penetration testing (annual) |
| Security policy | Documented + reviewed quarterly |

---

## Security Dashboard

```typescript
// infra/security-dashboard.ts
interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  compliance: {
    soc2_score: number;    // 0-100
    hipaa_score: number;
    pci_score: number;
  };
  secrets: {
    last_rotation: Date;
    expired_count: number;
  };
  sbom: {
    total_dependencies: number;
    vulnerable: number;
    outdated: number;
  };
}
```

---

## Commands

```bash
# Full security scan
/security-scan --soc2 --hipaa --pci

# SBOM generation + vulnerability scan
/security-scan --sbom --trivy --snyk

# OPA policy check
/security-scan --opa --policies "k8s,api"

# Compliance report
/security-report --format pdf --frameworks "soc2,hipaa"

# Secret rotation
/secrets --rotate --scope "database,api-keys"
```
