---
description: "SBOM v2 + Supply Chain Security — Syft + Trivy + Grype + Sigstore cosign + in-toto + SLSA Level 4"
---

# SBOM Security Workflow (V8.0)

> Full supply chain security: SBOM generation, vulnerability scanning, artifact signing, SLSA Level 4 hermetic builds, ML model provenance, automated CVE remediation, dependency graph visualization.

---

## V8.0 Upgrades

| Feature | V7.0 | V8.0 |
|---------|------|------|
| Scanners | Syft + Trivy | + **Grype** + **OSV-Scanner** |
| Signing | Sigstore cosign | + **in-toto attestation** + **Witness** |
| SLSA | Level 3 | **Level 4** (hermetic builds) |
| Model scan | AI model supply chain | + **ML model provenance chain** |
| Remediation | Manual | **Automated CVE remediation** |
| License | Basic | **License compliance automation** |
| Visualization | None | **Dependency graph visualization** |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SBOM Security Stack V8.0                          │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  SBOM Gen      │  Scanning      │  Signing       │  Compliance      │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ Syft (CycloneDX│ Trivy          │ Sigstore cosign│ SLSA Level 4     │
│ + SPDX)        │ Grype          │ in-toto        │ License check    │
│ ML model SBOM  │ OSV-Scanner    │ Witness        │ Auto-remediate   │
│ Dependency map │ CVE database   │ Rekor log      │ Dep graph viz    │
└────────────────┴────────────────┴────────────────┴──────────────────┘
```

---

## Step 1: Multi-Scanner Pipeline (V8.0)

```bash
# Generate SBOM
syft packages . -o cyclonedx-json > sbom.json

# Scan with multiple scanners
trivy sbom sbom.json --severity HIGH,CRITICAL
grype sbom:sbom.json --fail-on high
osv-scanner --sbom=sbom.json
```

---

## Step 2: SLSA Level 4 (V8.0)

```yaml
# .github/workflows/slsa-build.yml
name: SLSA Level 4 Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
    steps:
      - uses: actions/checkout@v4
      - name: Hermetic build
        uses: slsa-framework/slsa-github-generator/.github/workflows/builder_nodejs_slsa4@v2.0.0
        with:
          hermetic: true  # V8.0: no network access during build
      - name: Sign with cosign
        run: cosign sign --yes ${{ steps.build.outputs.image }}
      - name: Generate in-toto attestation
        run: |
          witness run --step build \
            --attestations type=material,uri=git+https://github.com/${{ github.repository }} \
            --attestations type=product,uri=${{ steps.build.outputs.image }}
```

---

## Step 3: Automated CVE Remediation (V8.0 NEW)

```python
class CVERemediator:
    """Automatically fix known vulnerabilities."""

    async def remediate(self, scan_results: list) -> list:
        fixes = []
        for vuln in scan_results:
            if vuln.fix_available:
                fix = await self.apply_fix(vuln)
                fixes.append(fix)
        return fixes

    async def apply_fix(self, vuln):
        if vuln.type == "npm":
            return await self.run(f"npm audit fix --package {vuln.package}")
        elif vuln.type == "pip":
            return await self.run(f"pip install {vuln.package}>={vuln.fixed_version}")
```

---

## Commands

```bash
# Full SBOM + scan + sign pipeline (V8.0)
/sbom-security --scan --sign --slsa4

# Multi-scanner scan (V8.0)
/sbom-security --scan --scanners trivy,grype,osv

# Auto-remediate CVEs (V8.0)
/sbom-security --remediate --auto

# ML model provenance (V8.0)
/sbom-security --model-provenance --model model.onnx

# Dependency graph visualization (V8.0)
/sbom-security --dep-graph --output dep-graph.svg

# License compliance check (V8.0)
/sbom-security --license-check --policy governance/license-policy.yaml

# SLSA Level 4 verification
/sbom-security --verify-slsa --artifact image:latest --level 4
```
