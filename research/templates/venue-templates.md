# Multi-Venue Publishing — 50+ Academic Templates

> Master index of academic venue LaTeX templates for automated paper formatting.

---

## Machine Learning & AI

| Venue | Template | Columns | Pages | Submission |
|-------|----------|---------|-------|------------|
| NeurIPS | `neurips_2026` | 1 | 9+refs | OpenReview |
| ICML | `icml2026` | 2 | 8+appendix | OpenReview |
| ICLR | `iclr2026` | 1 | 10+refs | OpenReview |
| AAAI | `aaai26` | 2 | 7+1refs | AAAI portal |
| AISTATS | `aistats2026` | 2 | 8+refs | CMT |
| UAI | `uai2026` | 2 | 10+refs | OpenReview |
| COLT | `colt2026` | 1 | 30+refs | JMLR portal |
| JMLR | `jmlr` | 1 | unlimited | JMLR portal |

## Computer Vision

| Venue | Template | Columns | Pages | Submission |
|-------|----------|---------|-------|------------|
| CVPR | `cvpr2026` | 2 | 8+refs | CMT |
| ECCV | `eccv2026` | 2 | 14+refs | CMT |
| ICCV | `iccv2025` | 2 | 8+refs | CMT |
| WACV | `wacv2026` | 2 | 8+refs | CMT |

## Natural Language Processing

| Venue | Template | Columns | Pages | Submission |
|-------|----------|---------|-------|------------|
| ACL | `acl2026` | 2 | 8+refs | OpenReview |
| EMNLP | `emnlp2026` | 2 | 8+refs | OpenReview |
| NAACL | `naacl2026` | 2 | 8+refs | OpenReview |
| COLING | `coling2026` | 2 | 8+refs | START |
| EACL | `eacl2026` | 2 | 8+refs | OpenReview |

## Systems & Architecture

| Venue | Template | Columns | Pages | Submission |
|-------|----------|---------|-------|------------|
| ISCA | `ieeetran` | 2 | 12 | HotCRP |
| MICRO | `ieeetran` | 2 | 12 | HotCRP |
| ASPLOS | `acmart-sigplan` | 2 | 12 | HotCRP |
| OSDI | `usenix` | 2 | 14 | HotCRP |
| SOSP | `acmart-sigops` | 2 | 15 | HotCRP |
| NSDI | `usenix` | 2 | 14 | HotCRP |
| EuroSys | `acmart` | 2 | 14 | HotCRP |
| HPCA | `ieeetran` | 2 | 12 | EDAS |

## General CS / ACM / IEEE

| Venue | Template | Columns | Pages | Submission |
|-------|----------|---------|-------|------------|
| ACM SIGCONF | `acmart[sigconf]` | 2 | varies | HotCRP |
| ACM TOCS | `acmart[acmtog]` | 2 | varies | Manuscript Central |
| IEEE TPAMI | `ieeetran` | 2 | 14 | ScholarOne |
| IEEE TSE | `ieeetran` | 2 | 14 | ScholarOne |
| ACM Computing Surveys | `acmart` | 2 | varies | Manuscript Central |

## Robotics & Controls

| Venue | Template | Columns | Pages | Submission |
|-------|----------|---------|-------|------------|
| ICRA | `ieeetran` | 2 | 6+1refs | PaperPlaza |
| IROS | `ieeetran` | 2 | 6+1refs | PaperPlaza |
| RSS | `rss2026` | 1 | 10+refs | CMT |
| CoRL | `corl2026` | 1 | 8+refs | OpenReview |

## Security & Privacy

| Venue | Template | Columns | Pages | Submission |
|-------|----------|---------|-------|------------|
| IEEE S&P | `ieeetran` | 2 | 13+refs | HotCRP |
| USENIX Security | `usenix` | 2 | 13+refs | HotCRP |
| CCS | `acmart[sigconf]` | 2 | 14+refs | HotCRP |
| NDSS | `ndss2026` | 2 | 15+refs | HotCRP |

---

## Usage

```bash
# List all available templates
/arxiv-bot --list-venues

# Format paper for specific venue
/arxiv-bot --format --venue cvpr2026 --paper research/my-paper/

# Download venue template
/arxiv-bot --download-template --venue neurips2026
```
