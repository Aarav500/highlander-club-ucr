---
description: "AI Literacy Tools — Auto-generate docs, tutorials, explainer dashboards, architecture diagrams from source code"
---

# AI Literacy Tools (V10.0)

> Auto-generate documentation, tutorials, and interactive dashboards from your codebase. Instant onboarding, always-current docs, architecture visualization.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                   AI Literacy Stack V10.0                             │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  Code        │  Doc         │  Tutorial    │  Dashboard             │
│  Analyzer    │  Generator   │  Builder     │  Engine                │
├──────────────┼──────────────┼──────────────┼────────────────────────┤
│ AST parse    │ API docs     │ Step-by-step │ Architecture viz       │
│ Dependency   │ README gen   │ Interactive  │ Dependency graph       │
│ Pattern ID   │ Changelog    │ Code sandbox │ Coverage map           │
│ Type extract │ Docstrings   │ Video gen    │ Complexity heatmap     │
│ Flow trace   │ Migration    │ Quiz/assess  │ Onboarding progress    │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```

---

## Components

### 1. Code Analysis Engine

```yaml
code_analyzer:
  parsers:
    typescript: tree-sitter-typescript
    python: tree-sitter-python
    rust: tree-sitter-rust
    
  extraction:
    - function_signatures
    - class_hierarchies
    - module_dependencies
    - api_endpoints
    - database_schemas
    - environment_variables
    - error_patterns
    - type_definitions
    
  intelligence:
    model: claude-opus-4.6
    tasks:
      - infer_intent_from_code
      - explain_complex_logic
      - identify_design_patterns
      - detect_undocumented_features
```

### 2. Documentation Generator

```python
class DocGenerator:
    """Auto-generate comprehensive docs from source code."""

    async def generate(self, codebase: Codebase) -> Documentation:
        docs = Documentation()

        # README with project overview
        docs.readme = await self.model.generate(
            prompt=f"Generate a comprehensive README.md for this project:\n"
                   f"Structure: {codebase.tree}\n"
                   f"Package.json: {codebase.package_json}\n"
                   f"Key files: {codebase.entry_points}",
            style="developer-friendly",
        )

        # API documentation from endpoints
        for endpoint in codebase.api_endpoints:
            docs.api.add(await self.document_endpoint(endpoint))

        # Architecture decision records
        for pattern in codebase.design_patterns:
            docs.adrs.add(await self.generate_adr(pattern))

        # Auto-generated docstrings for undocumented functions
        for func in codebase.undocumented_functions:
            docs.docstrings.add(await self.generate_docstring(func))

        return docs
```

### 3. Tutorial Builder

```yaml
tutorial_builder:
  formats:
    - interactive_walkthrough     # Step-by-step with code
    - video_script                # For Loom/screen recordings
    - jupyter_notebook            # Executable tutorials
    - quiz_assessment             # Knowledge verification
    
  auto_generation:
    trigger: new_feature_merged
    topics:
      - "Getting started with {{feature}}"
      - "How {{feature}} works under the hood"
      - "Common patterns with {{feature}}"
      - "Troubleshooting {{feature}}"
      
  personalization:
    skill_levels: [beginner, intermediate, advanced]
    role_based: [frontend, backend, devops, data-science]
    
  sandbox:
    environment: stackblitz
    pre_loaded: true
    tests_included: true
```

### 4. Dashboard Engine

```yaml
dashboard_views:
  architecture:
    type: interactive-graph
    nodes: [modules, classes, functions]
    edges: [imports, calls, data-flow]
    filters: [by-team, by-feature, by-complexity]
    
  dependency_health:
    type: treemap
    metrics: [outdated, vulnerabilities, size, usage]
    actions: [update, remove, replace]
    
  complexity_heatmap:
    type: heatmap
    metric: cyclomatic-complexity
    overlay: [test-coverage, bug-density, change-frequency]
    
  onboarding_tracker:
    type: progress-board
    stages: [setup, architecture, first-feature, review, ship]
    estimated_time: per-stage
```

---

## Commands

```bash
# Generate full documentation
/ai-literacy --generate --docs all --output docs/

# Auto-generate README
/ai-literacy --readme --generate --style comprehensive

# Create interactive tutorial
/ai-literacy --tutorial --feature "auth-module" --level beginner

# Generate architecture diagram
/ai-literacy --diagram --type architecture --format mermaid

# Docstring generation for undocumented code
/ai-literacy --docstrings --generate --undocumented-only

# Launch explainer dashboard
/ai-literacy --dashboard --start --port 3001

# Generate onboarding flow
/ai-literacy --onboarding --role frontend --generate

# Export to Notion/Confluence
/ai-literacy --export --format notion --target workspace-id
```
