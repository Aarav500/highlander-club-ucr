---
description: "Citation Engine v2 — Semantic Scholar + OpenAlex + Crossref + LiveBench eval + citation impact prediction"
---

# Citation Engine Workflow (V8.0)

> Literature discovery with 4 academic APIs, citation network analysis, 1000+ citation styles, LiveBench accuracy evaluation, and citation impact prediction.

---

## V8.0 Upgrades

| Feature | V7.0 | V8.0 |
|---------|------|------|
| APIs | Semantic Scholar | + **OpenAlex** + **Crossref** + **DBLP** |
| Graph | Connected Papers | + **Citation network analysis** + PageRank |
| Formats | Auto-BibTeX | + **CSL** (1000+ styles) + **CFF** |
| Quality | Manual check | **LiveBench eval** for citation accuracy |
| Analysis | Basic search | **Impact prediction** + h-index forecasting |
| Network | None | **Collaboration network** analysis |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Citation Engine V8.0                               │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  Multi-API     │  Network       │  Formatting    │  Intelligence    │
│  Search        │  Analysis      │  (1000+ CSL)   │                  │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ Semantic Schol │ Citation graph │ BibTeX         │ Impact predict   │
│ OpenAlex       │ PageRank       │ CSL/CFF        │ h-index forecast │
│ Crossref       │ Clustering     │ 1000+ styles   │ Trend analysis   │
│ DBLP           │ Collaboration  │ Auto-format    │ LiveBench eval   │
└────────────────┴────────────────┴────────────────┴──────────────────┘
```

---

## Step 1: Multi-API Literature Search (V8.0)

```python
class MultiAPISearch:
    """Search across 4 academic APIs for comprehensive coverage."""

    async def search(self, query: str, limit: int = 50) -> list[Paper]:
        results = await asyncio.gather(
            self.semantic_scholar.search(query, limit=limit),
            self.openalex.search(query, limit=limit),
            self.crossref.search(query, limit=limit),
            self.dblp.search(query, limit=limit),
        )

        # Deduplicate by DOI, merge metadata
        merged = self.deduplicate_and_merge(results)

        # Rank by relevance + impact
        ranked = self.rank_papers(merged, query)

        return ranked[:limit]
```

---

## Step 2: Citation Network Analysis (V8.0 NEW)

```python
class CitationNetworkAnalyzer:
    """Build and analyze citation graphs for research insights."""

    def build_network(self, seed_papers: list[str]) -> nx.DiGraph:
        G = nx.DiGraph()
        for paper_id in seed_papers:
            citations = self.api.get_citations(paper_id)
            references = self.api.get_references(paper_id)
            for cite in citations:
                G.add_edge(cite.id, paper_id)
            for ref in references:
                G.add_edge(paper_id, ref.id)
        return G

    def analyze(self, G: nx.DiGraph) -> dict:
        return {
            "pagerank": nx.pagerank(G),
            "communities": self.detect_communities(G),
            "key_papers": self.find_key_papers(G),
            "research_fronts": self.detect_fronts(G),
            "emerging_topics": self.detect_emerging(G),
        }
```

---

## Step 3: Impact Prediction (V8.0 NEW)

```python
class CitationImpactPredictor:
    """Predict future citation impact using ML models."""

    async def predict_impact(self, paper: Paper) -> ImpactPrediction:
        features = self.extract_features(paper)
        prediction = self.model.predict(features)
        return ImpactPrediction(
            predicted_citations_1yr=prediction.citations_1yr,
            predicted_citations_5yr=prediction.citations_5yr,
            impact_percentile=prediction.percentile,
            confidence=prediction.confidence,
        )
```

---

## Commands

```bash
# Search across all APIs
/citation-engine --search "transformer attention mechanisms" --limit 50

# Build citation network
/citation-engine --network --seed "paper1_doi,paper2_doi" --depth 2

# Impact prediction (V8.0)
/citation-engine --predict-impact --paper "10.1234/example"

# Generate bibliography in any style (1000+ CSL)
/citation-engine --format --style apa7 --papers results.json

# LiveBench evaluation (V8.0)
/citation-engine --eval --benchmark livebench

# Collaboration network (V8.0)
/citation-engine --collab-network --author "Author Name"

# Export to BibTeX/CFF
/citation-engine --export --format bibtex --output refs.bib
```
