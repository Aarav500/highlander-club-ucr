---
description: Health sector AI — HIPAA-compliant RAG + medical imaging + clinical NLP + de-identification
---

# Sector AI: Health (V9.0)

> Healthcare AI pipelines with HIPAA compliance baked in: medical knowledge RAG, DICOM imaging analysis, clinical NLP, and automated PHI de-identification.

## Prerequisites

- Python 3.12+ with PyTorch, Transformers, pydicom
- HIPAA-compliant infrastructure (encrypted at rest + in transit)
- Vector DB with access controls (Weaviate or Qdrant)
- UMLS license for medical terminology (optional but recommended)

## When to Use

- Building HIPAA-compliant RAG for medical knowledge retrieval
- Medical imaging analysis (radiology, pathology, dermatology)
- Clinical NLP pipelines (ICD-10 coding, discharge summaries, clinical trial matching)
- PHI de-identification for research datasets

---

## Phase 1: HIPAA-Compliant RAG

### 1.1 Medical Knowledge Retrieval

```yaml
# health/rag/hipaa-rag-config.yaml
hipaa_rag:
  data_sources:
    - pubmed_abstracts (30M+ articles)
    - clinical_guidelines (AHA, ACS, NCCN)
    - drug_databases (FDA labels, interactions)
    - icd10_codebook
    - snomed_ct_ontology
  
  embedding:
    model: medcpt-v2  # Medical-domain embedding
    dimension: 768
    chunk_size: 512
    overlap: 64
    metadata: [source, date, evidence_level, specialty]
  
  vector_store:
    provider: weaviate
    encryption: aes-256-gcm
    access_control:
      rbac: true
      audit_log: true
      data_residency: us-only
    backup: encrypted-s3
  
  retrieval:
    top_k: 10
    reranker: medcpt-reranker
    citation: always  # Always cite sources
    evidence_grading: [A, B, C, D] (GRADE framework)
  
  generation:
    model: claude-4.6
    system_prompt: "You are a clinical decision support system. Always cite sources. Never provide diagnosis — only support clinician decision-making."
    guardrails:
      - no_diagnosis_without_disclaimer
      - cite_evidence_level
      - flag_contraindications
      - patient_safety_first
  
  hipaa_controls:
    phi_detection: presidio + custom-rules
    phi_action: redact-before-embedding
    audit_trail: immutable
    data_retention: policy-driven
    breach_notification: automated
```

### 1.2 RAG Pipeline Architecture

```
Clinical Query
     │
     ▼
PHI Detection ──→ Redact if PHI present
     │
     ▼
Query Embedding (MedCPT)
     │
     ▼
Vector Search (Weaviate, encrypted)
     │
     ▼
Reranking (domain-specific)
     │
     ▼
LLM Generation (with citations + guardrails)
     │
     ▼
Safety Check (no diagnosis, evidence graded)
     │
     ▼
Audit Log (HIPAA-compliant)
```

---

## Phase 2: Medical Imaging

### 2.1 DICOM Processing Pipeline

```yaml
imaging:
  ingestion:
    format: DICOM
    anonymization: automatic (pydicom + CTP)
    storage: encrypted-s3
    metadata_extraction: true
  
  modalities:
    chest_xray:
      model: torchxrayvision-v3
      findings: [pneumonia, cardiomegaly, effusion, nodule, fracture]
      output: structured_report + heatmap
    
    ct_scan:
      model: monai-v2
      tasks: [segmentation, detection, classification]
      organs: [lung, liver, kidney, brain]
      output: 3d_segmentation + measurements
    
    pathology:
      model: virchow-v2 (foundation model)
      tasks: [tissue_classification, cell_detection, biomarker_scoring]
      magnification: [5x, 10x, 20x, 40x]
      output: roi_annotations + classification
    
    dermatology:
      model: derm-foundation-v2
      conditions: 200+ (ISIC taxonomy)
      output: differential_diagnosis + confidence
  
  quality_control:
    image_quality_check: automatic
    artifact_detection: true
    orientation_verification: true
    dicom_compliance: true
  
  reporting:
    format: HL7-FHIR
    integration: epic, cerner, meditech
    structured: true
    natural_language: true
```

---

## Phase 3: Clinical NLP

### 3.1 NLP Pipeline Configuration

```yaml
clinical_nlp:
  tasks:
    icd10_coding:
      model: plm-icd-v3
      input: discharge_summary
      output: primary_codes + secondary_codes + confidence
      accuracy_target: ">95% (top-3)"
      human_review: required_for_billing
    
    discharge_summary:
      model: claude-4.6
      input: clinical_notes + lab_results + medications
      output: structured_summary
      sections: [hospital_course, diagnoses, procedures, medications, follow_up]
      guardrails: [no_speculation, cite_evidence, flag_critical]
    
    clinical_trial_matching:
      model: trial-matcher-v2
      input: patient_record (de-identified)
      criteria_source: clinicaltrials.gov
      output: ranked_trials + eligibility_assessment
      update_frequency: daily
    
    adverse_event_detection:
      model: ade-detector-v3
      input: clinical_notes (streaming)
      output: detected_events + severity + causality_assessment
      alert: immediate_for_severe
  
  entity_extraction:
    types:
      - medications (drug, dose, route, frequency)
      - conditions (diagnosis, symptom, finding)
      - procedures (surgical, diagnostic, therapeutic)
      - anatomy (body site, laterality)
      - lab_values (test, value, unit, reference_range)
    model: medspacy + custom-ner
    linking: UMLS-CUI, RxNorm, SNOMED-CT
```

---

## Phase 4: De-Identification

### 4.1 PHI De-Identification Pipeline

```yaml
deidentification:
  engine: presidio + custom-clinical-rules
  
  phi_categories:
    safe_harbor_18:
      - names
      - geographic_data (below state)
      - dates (except year)
      - phone_numbers
      - fax_numbers
      - email_addresses
      - ssn
      - medical_record_numbers
      - health_plan_numbers
      - account_numbers
      - certificate_numbers
      - vehicle_identifiers
      - device_identifiers
      - urls
      - ip_addresses
      - biometric_identifiers
      - full_face_photos
      - unique_identifying_codes
  
  methods:
    structured_data: rule-based-replacement
    free_text: ner + rule-based + llm-verification
    images: pixel-level-redaction
    dicom: tag-level-scrubbing
  
  replacement_strategy:
    names: synthetic (faker)
    dates: date-shift (consistent per patient)
    locations: generalize (city → state)
    ids: random-regenerate
  
  validation:
    re_identification_risk: "<0.04% (expert determination)"
    automated_audit: post-processing-scan
    human_review: sample-based (5%)
  
  output:
    format: [json, csv, fhir]
    metadata: linkage_key (encrypted, separate storage)
```

---

## Slash Commands

```bash
# HIPAA RAG
/sector-health --rag --query "treatment guidelines for..." --specialty cardiology
/sector-health --rag --ingest --source pubmed --topic "immunotherapy"
/sector-health --rag --audit --period 2026-Q1

# Medical Imaging
/sector-health --imaging --modality chest-xray --input scan.dcm
/sector-health --imaging --modality ct --task segmentation --organ lung
/sector-health --imaging --pathology --input slide.svs --task classification

# Clinical NLP
/sector-health --nlp --icd10 --input discharge.txt
/sector-health --nlp --summary --input notes/*.txt
/sector-health --nlp --trial-match --patient patient.json

# De-Identification
/sector-health --deidentify --input records/ --method safe-harbor
/sector-health --deidentify --validate --risk-threshold 0.04
/sector-health --deidentify --images --input dicoms/ --output anonymized/
```

## Agent Roles

| Role | Responsibility |
|------|---------------|
| `health-ai-engineer` | HIPAA RAG, imaging pipelines, clinical NLP (V9.0) |
| `clinical-nlp-specialist` | ICD-10 coding, entity extraction, trial matching |
| `medical-imaging-engineer` | DICOM processing, model deployment, reporting |
| `hipaa-compliance-officer` | PHI detection, de-identification, audit trails |

## Model Tier

**Tier 1 — Deep**: Claude Opus for clinical NLP and RAG generation. Tier 2 for imaging pipeline configuration.
