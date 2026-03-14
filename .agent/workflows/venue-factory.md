---
description: "Venue Factory — 100+ academic venue templates with auto-detection, multi-format output, and arxiv-bot integration"
---

# Venue Factory Workflow (V8.0)

> Generate LaTeX, Typst, Markdown, and DOCX templates for 100+ academic venues. Auto-detect venue requirements from CFPs. Integrated with `arxiv-bot` and `citation-engine`.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Venue Factory V8.0                                 │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  Template Gen  │  CFP Parser    │  Multi-Format  │  Integration     │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ 100+ venues    │ Auto-detect    │ LaTeX          │ arxiv-bot        │
│ Style files    │ Deadline track │ Typst          │ citation-engine  │
│ Bib styles     │ Requirements   │ Markdown       │ research-paper   │
│ Fig templates  │ Page limits    │ DOCX           │ algo-factory     │
└────────────────┴────────────────┴────────────────┴──────────────────┘
```

---

## Supported Venues (100+)

### Tier 1 — Top AI/ML (20)

| Venue | Type | Template | Deadline |
|-------|------|----------|----------|
| NeurIPS 2026 | Conference | `neurips2026.tex` | May 2026 |
| ICML 2026 | Conference | `icml2026.tex` | Jan 2026 |
| ICLR 2026 | Conference | `iclr2026.tex` | Sep 2025 |
| CVPR 2026 | Conference | `cvpr2026.tex` | Nov 2025 |
| ECCV 2026 | Conference | `eccv2026.tex` | Mar 2026 |
| ACL 2026 | Conference | `acl2026.tex` | Feb 2026 |
| EMNLP 2026 | Conference | `emnlp2026.tex` | Jun 2026 |
| AAAI 2026 | Conference | `aaai2026.tex` | Aug 2025 |
| IJCAI 2026 | Conference | `ijcai2026.tex` | Jan 2026 |
| NAACL 2026 | Conference | `naacl2026.tex` | Jan 2026 |
| AISTATS 2026 | Conference | `aistats2026.tex` | Oct 2025 |
| UAI 2026 | Conference | `uai2026.tex` | Feb 2026 |
| COLT 2026 | Conference | `colt2026.tex` | Feb 2026 |
| JMLR | Journal | `jmlr.tex` | Rolling |
| TMLR | Journal | `tmlr.tex` | Rolling |
| Nature Machine Intelligence | Journal | `nat-mi.tex` | Rolling |
| IEEE TPAMI | Journal | `tpami.tex` | Rolling |
| AI Journal | Journal | `aij.tex` | Rolling |
| MLSys 2026 | Conference | `mlsys2026.tex` | Nov 2025 |
| AutoML 2026 | Conference | `automl2026.tex` | Mar 2026 |

### Tier 2 — Systems & Architecture (20)

| Venue | Type | Template |
|-------|------|----------|
| OSDI 2026 | Conference | `osdi2026.tex` |
| SOSP 2026 | Conference | `sosp2026.tex` |
| ISCA 2026 | Conference | `isca2026.tex` |
| MICRO 2026 | Conference | `micro2026.tex` |
| HPCA 2026 | Conference | `hpca2026.tex` |
| ASPLOS 2026 | Conference | `asplos2026.tex` |
| EuroSys 2026 | Conference | `eurosys2026.tex` |
| NSDI 2026 | Conference | `nsdi2026.tex` |
| ATC 2026 | Conference | `atc2026.tex` |
| SC 2026 | Conference | `sc2026.tex` |
| SIGCOMM 2026 | Conference | `sigcomm2026.tex` |
| SIGMOD 2026 | Conference | `sigmod2026.tex` |
| VLDB 2026 | Conference | `vldb2026.tex` |
| KDD 2026 | Conference | `kdd2026.tex` |
| WWW 2026 | Conference | `www2026.tex` |
| DAC 2026 | Conference | `dac2026.tex` |
| ICCAD 2026 | Conference | `iccad2026.tex` |
| DATE 2026 | Conference | `date2026.tex` |
| FCCM 2026 | Conference | `fccm2026.tex` |
| FPL 2026 | Conference | `fpl2026.tex` |

### Tier 3 — Security, HCI, Robotics (20)

| Venue | Type | Template |
|-------|------|----------|
| IEEE S&P 2026 | Conference | `sp2026.tex` |
| USENIX Security 2026 | Conference | `sec2026.tex` |
| CCS 2026 | Conference | `ccs2026.tex` |
| NDSS 2026 | Conference | `ndss2026.tex` |
| CHI 2026 | Conference | `chi2026.tex` |
| UIST 2026 | Conference | `uist2026.tex` |
| CSCW 2026 | Conference | `cscw2026.tex` |
| ICRA 2026 | Conference | `icra2026.tex` |
| IROS 2026 | Conference | `iros2026.tex` |
| CoRL 2026 | Conference | `corl2026.tex` |
| RSS 2026 | Conference | `rss2026.tex` |
| CRYPTO 2026 | Conference | `crypto2026.tex` |
| EUROCRYPT 2026 | Conference | `eurocrypt2026.tex` |
| STOC 2026 | Conference | `stoc2026.tex` |
| FOCS 2026 | Conference | `focs2026.tex` |
| PLDI 2026 | Conference | `pldi2026.tex` |
| POPL 2026 | Conference | `popl2026.tex` |
| OOPSLA 2026 | Conference | `oopsla2026.tex` |
| ICSE 2026 | Conference | `icse2026.tex` |
| FSE 2026 | Conference | `fse2026.tex` |

### Tier 4 — Domain-Specific (20)

MICCAI, BIBM, RECOMB, ISMB, INTERSPEECH, ICASSP, ICCV workshops, NeurIPS workshops, EACL, COLING, WACV, SIGGRAPH, Eurographics, IEEE VR, ISMAR, MobiCom, MobiSys, SenSys, IoTDI, PerCom.

### Tier 5 — Workshops & Emerging (20+)

All major workshop tracks for Tier 1-3 conferences, plus emerging venues like COLM, DMLR, and regional conferences.

---

## CFP Auto-Detection

```python
class CFPParser:
    """Parse Call for Papers to auto-generate venue templates."""

    async def parse_cfp(self, cfp_url: str) -> VenueConfig:
        content = await self.fetch(cfp_url)
        return VenueConfig(
            venue_name=self.extract_name(content),
            deadline=self.extract_deadline(content),
            page_limit=self.extract_page_limit(content),
            format=self.extract_format(content),  # single-col, double-col, etc.
            style=self.extract_style(content),     # LaTeX class/style file
            abstract_limit=self.extract_abstract_limit(content),
            supplementary_policy=self.extract_supplementary(content),
            review_type=self.extract_review_type(content),  # double-blind, etc.
        )

    def generate_template(self, config: VenueConfig) -> dict:
        return {
            "latex": self._gen_latex(config),
            "typst": self._gen_typst(config),
            "markdown": self._gen_markdown(config),
            "docx": self._gen_docx(config),
        }
```

---

## Commands

```bash
# Generate template for a specific venue
/venue-factory --venue neurips2026 --format latex

# Auto-detect from CFP URL
/venue-factory --cfp "https://neurips.cc/Conferences/2026/CallForPapers"

# List all available venues
/venue-factory --list --tier all

# Generate multi-format output
/venue-factory --venue icml2026 --format latex,typst,markdown

# Check deadlines
/venue-factory --deadlines --upcoming 90d

# Create custom venue from template
/venue-factory --custom --name "MyWorkshop" --based-on neurips2026

# Batch generate for venue track
/venue-factory --batch --tier 1 --format latex
```
