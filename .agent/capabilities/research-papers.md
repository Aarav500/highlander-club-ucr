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
