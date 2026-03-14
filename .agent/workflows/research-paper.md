---
description: "Write an ACM/IEEE-quality research paper with LaTeX, reproducible figures, and arXiv submission"
---

# Research Paper Workflow

> End-to-end workflow for writing, validating, and submitting a research paper.

---

## Phase 1 — TOPIC & TEMPLATE

1. **Define research question** — write a 1-paragraph problem statement.

2. **Choose venue and template:**
   | Venue | Template | Command |
   |-------|----------|---------|
   | ACM | acmart | `\documentclass[sigconf]{acmart}` |
   | IEEE | IEEEtran | `\documentclass[conference]{IEEEtran}` |
   | NeurIPS | neurips_2024 | Download from venue website |
   | ICML | icml2024 | Download from venue website |

3. **Create project structure:**
   ```
   research/<paper-slug>/
     main.tex
     references.bib
     figures/
     data/
     scripts/
   ```

4. **Draft abstract** — 150–250 words covering problem, approach, results, significance.

5. **⏸️ STOP — Review topic, venue choice, and abstract before proceeding.**

---

## Phase 2 — LITERATURE REVIEW

1. **Search** Google Scholar, Semantic Scholar, and arxiv.org for related work.
   - Use `.agent/capabilities/research-papers.md` citation tools.
   - Target 20–30 references minimum.

2. **Organize into themes:**
   - Prior approaches to the same problem.
   - Methods you build upon.
   - Datasets and benchmarks used.

3. **Write Related Work section** — group by theme, not chronologically.

4. **Generate BibTeX** — export from Zotero or Scholar → `references.bib`.

---

## Phase 3 — METHODOLOGY & EXPERIMENTS

1. **Write Methodology section:**
   - Formal problem definition (math notation).
   - Algorithm description (pseudocode + prose).
   - Theoretical analysis (if applicable: proofs, complexity bounds).

2. **Implement experiments** in `scripts/`:
   - Python with PyTorch/TensorFlow for ML experiments.
   - R/Python for statistical analysis.

3. **Generate figures** — matplotlib/seaborn/ggplot2.
   - Save as PDF (vector) at 300+ DPI.
   - Follow venue style guide for font sizes and aspect ratios.

4. **Run experiments and record results:**
   - Mean ± std over ≥ 3 runs.
   - Report compute budget (GPU hours, hardware spec).
   - Include ablation study.

5. **⏸️ STOP — Review methodology and preliminary results before writing up.**

---

## Phase 4 — WRITING

1. **Complete all sections** following the template in `research-papers.md` capability:
   - Introduction → Related Work → Methodology → Experiments → Conclusion.

2. **Writing quality checklist:**
   - [ ] Each section has a clear purpose and flow.
   - [ ] Figures/tables referenced in text before they appear.
   - [ ] All claims supported by evidence or citations.
   - [ ] Contributions explicitly listed in Introduction.
   - [ ] Limitations discussed honestly.

3. **Compile and proofread:**
   ```bash
   cd research/<paper-slug>
   pdflatex main.tex
   bibtex main
   pdflatex main.tex
   pdflatex main.tex
   ```

---

## Phase 5 — SUBMISSION

1. **Pre-submission checklist:**
   - [ ] Paper fits within page limit.
   - [ ] All figures render correctly in PDF.
   - [ ] No TODO/FIXME comments remain.
   - [ ] Author information matches venue requirements.
   - [ ] Supplementary materials prepared (if applicable).

2. **Package for arXiv** — follow steps in `research-papers.md` capability:
   ```bash
   mkdir -p arxiv_pkg
   cp main.tex main.bbl arxiv_pkg/
   cp -r figures/ arxiv_pkg/
   cd arxiv_pkg && tar -czf ../submission.tar.gz .
   ```

3. **Submit to arXiv** — upload `submission.tar.gz`, verify PDF compilation.

4. **Submit to venue** — follow venue-specific submission system (EasyChair, OpenReview, CMT).

5. **⏸️ STOP — Paper submitted. Prepare for reviews.**

---

## Phase 6 — REVISION (after reviews)

1. **Read all reviews carefully** — categorize comments as critical, major, minor.

2. **Generate response document** — use the peer review response template from `research-papers.md`.

3. **Highlight changes** in revised paper using `\textcolor{blue}{...}`.

4. **Re-run experiments** if reviewers request additional baselines or analysis.

5. **Submit revised paper + response letter.**
