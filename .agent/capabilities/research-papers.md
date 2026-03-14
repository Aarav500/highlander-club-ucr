# Research Papers

> Reference for producing ACM/IEEE-quality papers with LaTeX, automated citations, reproducible statistics, and arXiv submission.

---

## LaTeX Templates

### Supported Venues

| Venue | Template | Install |
|-------|----------|---------|
| **ACM** | `acmart` | `\documentclass[sigconf]{acmart}` |
| **IEEE** | `IEEEtran` | `\documentclass[conference]{IEEEtran}` |
| **NeurIPS** | `neurips_2024` | Download from NeurIPS style page |
| **ICML** | `icml2024` | Download from ICML style page |

### ACM Template (Quick Start)

```latex
\documentclass[sigconf,nonacm=false]{acmart}

\title{Your Paper Title: A Novel Approach to X}
\author{Author Name}
\affiliation{\institution{University/Company}}
\email{author@example.com}

\begin{abstract}
  Brief summary of the problem, approach, and key results.
\end{abstract}

\begin{document}
\maketitle

\section{Introduction}
% Problem statement, motivation, contributions

\section{Related Work}
% Literature review with \cite{key} references

\section{Methodology}
% Formal problem definition, algorithm design, theoretical analysis

\section{Experiments}
% Dataset description, baselines, metrics, results tables/figures

\section{Conclusion}
% Summary of contributions, limitations, future work

\bibliographystyle{ACM-Reference-Format}
\bibliography{references}
\end{document}
```

---

## Auto-Citation

### Zotero Integration

1. Maintain a Zotero library for each research area.
2. Export as BibTeX → `references.bib`.
3. Use Better BibTeX plugin for auto-sync.

### Google Scholar Scraping

```python
# scripts/fetch_citations.py
from scholarly import scholarly

def search_papers(query: str, num_results: int = 20):
    """Fetch papers from Google Scholar and generate BibTeX entries."""
    search = scholarly.search_pubs(query)
    entries = []
    for _ in range(num_results):
        paper = next(search)
        bib = scholarly.bibtex(paper)
        entries.append(bib)
    return entries
```

### Citation Best Practices

- Cite **minimum 20–30 papers** for a full conference paper.
- Include papers from the **last 3 years** to show awareness of recent work.
- Always cite the **venue you're submitting to** (shows community awareness).
- Use `\citet{}` for inline ("Author et al. (2024) showed...") and `\citep{}` for parenthetical ("...as shown (Author et al., 2024)").

---

## Statistics & Reproducible Figures

### RMarkdown for Reproducible Results

```r
# analysis/results.Rmd
---
title: "Experiment Results"
output:
  pdf_document:
    fig_width: 6
    fig_height: 4
---

library(ggplot2)
library(dplyr)

data <- read_csv("results/experiment_data.csv")

ggplot(data, aes(x = method, y = accuracy, fill = method)) +
  geom_boxplot() +
  theme_minimal() +
  labs(title = "Accuracy Comparison", y = "Accuracy (%)")
```

### Python Alternative (Matplotlib + Seaborn)

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(1, 2, figsize=(12, 5))
sns.boxplot(data=df, x="method", y="accuracy", ax=ax[0])
sns.lineplot(data=df, x="epoch", y="loss", hue="method", ax=ax[1])
plt.tight_layout()
plt.savefig("figures/results.pdf", dpi=300, bbox_inches="tight")
```

### Statistical Tests

| Test | When to Use |
|------|-------------|
| Paired t-test | Comparing two methods on same dataset |
| Wilcoxon signed-rank | Non-parametric alternative to paired t-test |
| ANOVA + Tukey HSD | Comparing 3+ methods |
| Bootstrap CI | Confidence intervals without normality assumption |

---

## arXiv Upload Automation

### Checklist

1. **Compile** the paper with all figures embedded (no external links).
2. **Flatten** the LaTeX project: `latexpand main.tex > arxiv_submission.tex`.
3. **Strip comments**: `arxiv-latex-cleaner /path/to/paper/`.
4. **Include**: `.tex`, `.bbl` (pre-compiled bibliography), figures, style files.
5. **Exclude**: `.aux`, `.log`, `.out`, `.bib` (use `.bbl` instead).
6. **Test build** on arXiv's TeXLive version before final submission.

```bash
# Package for arXiv
mkdir -p arxiv_pkg
cp main.tex main.bbl arxiv_pkg/
cp -r figures/ arxiv_pkg/figures/
cd arxiv_pkg && tar -czf ../submission.tar.gz .
```

---

## Peer Review Response Generator

### Template

```markdown
# Response to Reviewers

## Reviewer 1

> **Comment R1.1**: [Quote reviewer comment]

**Response**: We thank Reviewer 1 for this insightful comment. We have addressed
this by [specific change]. See Section X, paragraph Y (highlighted in blue).

**Change**: [Describe the specific change made to the paper]

> **Comment R1.2**: [Quote reviewer comment]

**Response**: [...]
```

### Best Practices

- **Be respectful** — thank each reviewer explicitly.
- **Quote** every comment verbatim, then respond.
- **Highlight changes** in the revised paper (use `\textcolor{blue}{new text}`).
- **Provide evidence** — new experiments, additional analysis, or references.
- If you **disagree**, provide strong justification with citations.

---

## 2026 Venue Templates

### ISCA 2026 (11-Page Double-Column)

```latex
\documentclass[conference,compsoc]{IEEEtran}

% ISCA 2026 — 11 pages, double-column, 10pt
\usepackage[letterpaper, margin=0.75in]{geometry}
\usepackage{cite}
\usepackage{amsmath,amssymb}
\usepackage{graphicx}
\usepackage{xcolor}
\usepackage{booktabs}
\usepackage{algorithm2e}

\title{Your Title: Novel Microarchitecture for X}
\author{
  \IEEEauthorblockN{Author Name}
  \IEEEauthorblockA{Institution \\ email@example.com}
}

\begin{document}
\maketitle

\begin{abstract}
  Problem → Approach → Key result (3-4 sentences).
\end{abstract}

\section{Introduction}
% Motivation, gap in existing architectures, contributions list

\section{Background}
% ISA context, microarchitectural foundations

\section{Design}
% Proposed architecture with block diagrams

\section{Implementation}
% RTL details, synthesis targets, area/power estimates

\section{Evaluation}
% gem5/DRAMSim3 simulations, SPEC2017 benchmarks
% Compare vs. 3+ baselines, show speedup + energy efficiency

\section{Related Work}
% Computer architecture papers from ISCA/MICRO/HPCA

\section{Conclusion}
% Summary + future silicon targets

\bibliographystyle{IEEEtran}
\bibliography{references}
\end{document}
```

### CHASE 2026 (IEEE/ACM Health AI)

```latex
\documentclass[sigconf]{acmart}

% CHASE 2026 — ACM Connected Health, focus on AI for healthcare
\acmConference[CHASE '26]{ACM Conference on Connected Health}{2026}{City, Country}

\title{AI-Powered Health Monitoring: A Novel Approach}
\author{Author Name}
\affiliation{\institution{University/Hospital}}
\email{author@example.com}

\begin{abstract}
  Health problem → AI methodology → clinical validation results.
\end{abstract}

\begin{document}
\maketitle

\section{Introduction}
% Clinical motivation, patient impact, health disparity context

\section{Related Work}
% Digital health, wearable AI, clinical NLP

\section{Methodology}
% Dataset (IRB approval noted), model architecture, training pipeline

\section{Clinical Validation}
% Sensitivity, specificity, AUC-ROC
% Compare vs. clinician baseline + existing ML approaches
% Report fairness metrics across demographic groups

\section{Discussion}
% Clinical deployment considerations, limitations, FDA pathway

\section{Ethics \& Broader Impact}
% Patient privacy, bias mitigation, informed consent

\bibliographystyle{ACM-Reference-Format}
\bibliography{references}
\end{document}
```

### NeurIPS / ICML 2026 Checklists

#### NeurIPS 2026 Reproducibility Checklist

| Item | Required | Notes |
|------|----------|-------|
| Code submitted | Yes | Anonymous GitHub or supplementary |
| Hyperparameters listed | Yes | Full table in appendix |
| Random seeds reported | Yes | ≥ 3 seeds, report mean ± std |
| Compute budget | Yes | GPU hours, hardware spec |
| Dataset access | Yes | Public or data use agreement |
| Negative results | Encouraged | Include failed approaches |
| Broader impact | Required | 1-page statement |
| Limitation section | Required | Honest assessment |

#### ICML 2026 Ethics Checklist

| Item | Required |
|------|----------|
| Potential misuse discussed | Yes |
| Dual-use risks assessed | Yes |
| Fairness across groups tested | If applicable |
| Environmental impact (CO₂) | Encouraged |
| Data consent / licensing | Yes |

---

## Auto-arXiv v2 Submission

### Enhanced Upload Pipeline

```bash
#!/bin/bash
# scripts/arxiv-submit.sh — automate arXiv submission

set -euo pipefail

PAPER_DIR=${1:-.}
OUTPUT_DIR="$PAPER_DIR/arxiv_pkg"

echo "🔬 Preparing arXiv submission..."

# 1. Clean LaTeX
pip install arxiv-latex-cleaner
python -m arxiv_latex_cleaner "$PAPER_DIR" \
  --resize_images \
  --im_size 2048 \
  --compress_pdf

# 2. Flatten imports
cd "${PAPER_DIR}_arXiv"
latexpand main.tex > combined.tex
mv combined.tex main.tex

# 3. Pre-compile bibliography
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex

# 4. Package
mkdir -p "$OUTPUT_DIR"
cp main.tex main.bbl "$OUTPUT_DIR/"
cp -r figures/ "$OUTPUT_DIR/figures/" 2>/dev/null || true
cp *.sty *.cls "$OUTPUT_DIR/" 2>/dev/null || true

# 5. Create submission archive
cd "$OUTPUT_DIR"
tar -czf ../arxiv-submission.tar.gz .

echo "✅ Submission ready: arxiv-submission.tar.gz"
echo "📏 Size: $(du -h ../arxiv-submission.tar.gz | cut -f1)"
echo "📄 Upload at: https://arxiv.org/submit"
```

### Auto-Submit via API (arXiv Sword)

```python
import requests

def submit_to_arxiv(tarball_path: str, metadata: dict, api_key: str):
    """Submit paper to arXiv via SWORD API."""
    headers = {"Authorization": f"Bearer {api_key}"}
    files = {"file": open(tarball_path, "rb")}
    data = {
        "title": metadata["title"],
        "authors": metadata["authors"],
        "categories": metadata.get("categories", "cs.AI"),
        "abstract": metadata["abstract"],
        "comments": metadata.get("comments", ""),
    }
    response = requests.post(
        "https://arxiv.org/api/submit",
        headers=headers,
        files=files,
        data=data,
    )
    return response.json()
```

---

## Google Scholar Citation Tracking

### Automated Citation Monitor

```python
from scholarly import scholarly
from datetime import datetime
import json

class CitationTracker:
    """Track citations for published papers."""

    def __init__(self, author_name: str):
        self.author = scholarly.search_author(author_name)
        self.author = scholarly.fill(next(self.author))

    def get_metrics(self) -> dict:
        return {
            "name": self.author["name"],
            "h_index": self.author.get("hindex", 0),
            "i10_index": self.author.get("i10index", 0),
            "total_citations": self.author.get("citedby", 0),
            "checked_at": datetime.now().isoformat(),
        }

    def track_paper(self, title: str) -> dict:
        pub = scholarly.search_single_pub(title)
        pub = scholarly.fill(pub)
        return {
            "title": pub["bib"]["title"],
            "citations": pub.get("num_citations", 0),
            "year": pub["bib"].get("pub_year"),
            "venue": pub["bib"].get("venue"),
            "url": pub.get("pub_url"),
        }

    def citation_report(self) -> list[dict]:
        """Generate citation report for all publications."""
        pubs = []
        for pub in self.author.get("publications", []):
            filled = scholarly.fill(pub)
            pubs.append({
                "title": filled["bib"]["title"],
                "year": filled["bib"].get("pub_year"),
                "citations": filled.get("num_citations", 0),
            })
        return sorted(pubs, key=lambda p: p["citations"], reverse=True)
```

### Usage

```python
tracker = CitationTracker("Your Name")
print(tracker.get_metrics())
# {'name': 'Your Name', 'h_index': 5, 'total_citations': 120, ...}

report = tracker.citation_report()
for paper in report[:5]:
    print(f"  [{paper['citations']} cites] {paper['title']}")
```

---

## Auto-Paper Generation (V3.0)

### Code + Experiments → Paper Pipeline

```python
class AutoPaperGenerator:
    """Generate a research paper from code and experiment results."""

    def __init__(self, experiment_dir: str, venue: str = "neurips"):
        self.experiment_dir = experiment_dir
        self.venue = venue
        self.template = self.load_template(venue)

    def generate(self) -> str:
        # 1. Parse experiment results
        results = self.parse_results(f"{self.experiment_dir}/results.json")
        config = self.parse_config(f"{self.experiment_dir}/config.yaml")

        # 2. Generate each section
        sections = {
            "abstract": self.generate_abstract(results, config),
            "introduction": self.generate_introduction(config),
            "method": self.generate_method(config, code_dir=f"{self.experiment_dir}/src"),
            "experiments": self.generate_experiments(results, config),
            "tables": self.generate_tables(results),
            "figures": self.generate_figures(results),
            "conclusion": self.generate_conclusion(results),
        }

        # 3. Assemble LaTeX
        paper = self.template.render(**sections)
        return paper

    def generate_tables(self, results: dict) -> str:
        """Auto-generate comparison tables from benchmark results."""
        rows = []
        for method, metrics in results["comparison"].items():
            row = f"  {method} & {metrics['accuracy']:.1f} & {metrics['f1']:.3f} & {metrics['latency_ms']:.0f} \\\\"
            rows.append(row)
        return f"""
\\begin{{table}}[h]
\\centering
\\caption{{Comparison with baselines (mean ± std over 3 seeds)}}
\\begin{{tabular}}{{lccc}}
\\toprule
Method & Accuracy (\\%) & F1 & Latency (ms) \\\\
\\midrule
{chr(10).join(rows)}
\\bottomrule
\\end{{tabular}}
\\end{{table}}
"""
```

---

## Semantic Scholar Citation Networks (V3.0)

```python
import requests

class SemanticScholarClient:
    """Search and build citation graphs via Semantic Scholar API."""
    BASE = "https://api.semanticscholar.org/graph/v1"

    def __init__(self, api_key: str = None):
        self.headers = {"x-api-key": api_key} if api_key else {}

    def search(self, query: str, limit: int = 20) -> list[dict]:
        resp = requests.get(f"{self.BASE}/paper/search", params={
            "query": query, "limit": limit,
            "fields": "title,year,citationCount,authors,url,abstract",
        }, headers=self.headers)
        return resp.json().get("data", [])

    def citation_graph(self, paper_id: str, depth: int = 1) -> dict:
        """Build citation network: references + citations."""
        paper = requests.get(
            f"{self.BASE}/paper/{paper_id}",
            params={"fields": "title,references,citations,citationCount"},
            headers=self.headers,
        ).json()
        return {
            "paper": paper["title"],
            "citation_count": paper["citationCount"],
            "references": [r["title"] for r in paper.get("references", [])[:20]],
            "cited_by": [c["title"] for c in paper.get("citations", [])[:20]],
        }

    def find_related(self, paper_id: str) -> list[dict]:
        resp = requests.get(
            f"{self.BASE}/paper/{paper_id}/recommendations",
            params={"fields": "title,year,citationCount", "limit": 10},
            headers=self.headers,
        )
        return resp.json().get("recommendedPapers", [])
```

---

## Venue-Specific Submission Checklists (V3.0)

### NeurIPS 2026

- [ ] Paper ≤ 9 pages (+ unlimited references/appendix)
- [ ] Reproducibility checklist completed (Section 6)
- [ ] Broader impact statement (Section 7)
- [ ] Code in supplementary `.zip` (anonymous)
- [ ] Ethics review flag if applicable
- [ ] No author names in paper or metadata
- [ ] PDF ≤ 50 MB

### ICML 2026

- [ ] Paper ≤ 9 pages (+ unlimited appendix)
- [ ] Reproducibility statement in main text
- [ ] Code repo link (anonymized)
- [ ] All experiments: mean ± std over ≥ 3 seeds
- [ ] Hyperparameter sensitivity analysis
- [ ] Compute budget reported (GPU hours, CO₂)

### ISCA 2026

- [ ] Paper ≤ 11 pages double-column (IEEE format)
- [ ] Simulation methodology section (gem5/DRAMSim3)
- [ ] ≥ 3 baselines from last 3 years
- [ ] Area/power/energy analysis
- [ ] Artifact evaluation appendix

