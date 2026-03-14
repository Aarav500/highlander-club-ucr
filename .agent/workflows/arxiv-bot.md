---
description: "Auto-generate research papers and submit to arXiv for NeurIPS/ICML/ISCA 2026 venues"
---

# ArXiv Auto-Publish Bot

> End-to-end paper generation → venue formatting → arXiv submission. Targets NeurIPS 2026, ICML 2026, ISCA 2026.

---

## Architecture

```
  Research Idea       ArXiv Bot Pipeline              Output
  ──────────────────────────────────────────────────────────
  Topic + Data  →  Literature Review   →  Draft Paper
                   ↓                      ↓
                   Methodology Gen    →  Experiments
                   ↓                      ↓
                   Venue Formatting   →  LaTeX Compile
                   ↓                      ↓
                   Compliance Check   →  arXiv Package
                   ↓
                   Submit to arXiv
```

---

## Supported Venues

| Venue | Deadline (2026) | Template | Page Limit | Format |
|-------|----------------|----------|------------|--------|
| NeurIPS 2026 | May 2026 | `neurips_2026` | 9 + refs | LaTeX |
| ICML 2026 | Jan 2026 | `icml2026` | 8 + appendix | LaTeX |
| ISCA 2026 | Nov 2025 | `ieeetran` | 12 pages | IEEE LaTeX |

Venue configs are stored in `research/templates/venues/`.

---

## Phase 1: Topic & Scope

1. **Define research question** — 1-paragraph problem statement.

2. **Select venue** from `research/templates/venues/`:
   ```bash
   /arxiv-bot --venue neurips2026 --topic "Reinforcement Learning for HFT"
   ```

3. **Generate paper scaffold:**
   ```
   research/<paper-slug>/
     main.tex           ← Primary LaTeX source
     references.bib     ← BibTeX references
     figures/            ← Generated figures (PDF/PNG)
     data/               ← Experiment data
     scripts/            ← Experiment scripts (Python)
     venue-config.yaml   ← Venue-specific settings
   ```

4. **Auto-draft abstract** — 150–250 words covering problem, approach, results, significance.

5. **⏸️ STOP — Review topic, venue, and abstract.**

---

## Phase 2: Automated Literature Review

1. **Search sources:**
   - arXiv API (cs.*, stat.ML, eess.*)
   - Semantic Scholar API (top-cited, recent, connected)
   - Google Scholar (supplementary)

2. **Rank by relevance:**
   ```python
   # Scoring: citation_count × recency × topic_similarity
   score = (log(citations + 1) * 0.3) + (recency_score * 0.3) + (cosine_sim * 0.4)
   ```

3. **Auto-generate Related Work** section — grouped by theme, not chronologically.

4. **Export BibTeX** → `references.bib` with deduplication.

---

## Phase 3: Methodology & Experiments

1. **Auto-generate Methodology:**
   - Formal problem definition (LaTeX math notation)
   - Algorithm pseudocode
   - Theoretical analysis (complexity bounds, convergence proofs)

2. **Run experiments** using scripts in `scripts/`:
   ```bash
   python scripts/run_experiments.py --config experiments.yaml
   ```

3. **Generate figures:**
   - matplotlib/seaborn for results plots
   - Save as vector PDF at 300+ DPI
   - Follow venue style guide for fonts and aspect ratios

4. **Record results:**
   - Mean ± std over ≥ 3 runs
   - Ablation study
   - Compute budget (GPU hours, hardware spec)

---

## Phase 4: LaTeX Compilation & Formatting

1. **Apply venue template:**
   ```bash
   # Load venue config
   cat research/templates/venues/neurips2026.yaml
   # Apply format rules
   /arxiv-bot --format --venue neurips2026
   ```

2. **Compile:**
   ```bash
   cd research/<paper-slug>
   pdflatex main.tex
   bibtex main
   pdflatex main.tex
   pdflatex main.tex
   ```

3. **Compliance check:**
   - [ ] Within page limit
   - [ ] All figures render correctly
   - [ ] No TODO/FIXME comments
   - [ ] Author info matches venue requirements
   - [ ] Supplementary materials prepared
   - [ ] Anonymous for double-blind venues

---

## Phase 5: arXiv Packaging & Submission

1. **Package for arXiv:**
   ```bash
   mkdir -p arxiv_pkg
   cp main.tex main.bbl arxiv_pkg/
   cp -r figures/ arxiv_pkg/
   cd arxiv_pkg && tar -czf ../submission.tar.gz .
   ```

2. **Validate package:**
   ```bash
   # Test compile in clean environment
   docker run --rm -v $(pwd)/arxiv_pkg:/work texlive/texlive pdflatex /work/main.tex
   ```

3. **Submit to arXiv:**
   - Upload `submission.tar.gz`
   - Select primary category (cs.LG, cs.AI, cs.AR, etc.)
   - Add cross-list categories
   - Verify PDF compilation on arXiv

4. **Submit to venue** — EasyChair / OpenReview / CMT.

5. **⏸️ STOP — Paper submitted. Record submission ID.**

---

## Commands

```bash
# Full pipeline: topic → arXiv
/arxiv-bot --topic "novel attention mechanism" --venue neurips2026

# Literature review only
/arxiv-bot --lit-review --topic "transformer efficiency"

# Format existing paper for venue
/arxiv-bot --format --paper research/rl-trading/ --venue icml2026

# Package for arXiv (no submit)
/arxiv-bot --package --paper research/rl-trading/

# Submit to arXiv
/arxiv-bot --submit --paper research/rl-trading/

# Multi-venue (submit to multiple)
/arxiv-bot --venues neurips2026,icml2026 --topic "RL for HFT"
```
