#!/usr/bin/env node
/**
 * Lab Dashboard — Catalog, status, and activation for all lab workflows.
 *
 * Commands:
 *   node lab-dashboard.js catalog              — Full workflow catalog with readiness
 *   node lab-dashboard.js status               — Active services and agent status
 *   node lab-dashboard.js activate <workflow>   — Run activation steps for a workflow
 *   node lab-dashboard.js runnable             — List workflows you can run RIGHT NOW
 *   node lab-dashboard.js search <keyword>     — Search workflows by name or description
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const ROOT = __dirname;
const WORKFLOWS_DIR = path.join(ROOT, '.agent', 'workflows');

// ─── Readiness Tiers ─────────────────────────────────────────────────────────
// Each workflow is classified by what's needed to run it.
const TIERS = {
  1: { label: '🟢 RUN NOW',       desc: 'Works with existing tools — just run the command' },
  2: { label: '🟡 QUICK SETUP',   desc: 'Needs a package install or config tweak (< 5 min)' },
  3: { label: '🟠 INFRA NEEDED',  desc: 'Needs Docker, GPU, cloud service, or external API' },
  4: { label: '🔴 ASPIRATIONAL',  desc: 'Research/enterprise — needs specialized hardware or services' },
};

// ─── Workflow Tier Mapping ───────────────────────────────────────────────────
// Manually classified based on dependencies.
const WORKFLOW_TIERS = {
  // TIER 1 — Run now (CLI tools, no extra infra)
  'code-audit-fix':          { tier: 1, agent: 'any',        deps: ['eslint'], activate: 'npx eslint . --fix' },
  'security-scan':           { tier: 1, agent: 'claude',     deps: [], activate: 'Read-only scan, agent runs analysis' },
  'build-error-resolver':    { tier: 1, agent: 'any',        deps: [], activate: 'Paste build log, agent diagnoses' },
  'self-review':             { tier: 1, agent: 'any',        deps: ['git'], activate: 'Agent reviews recent git diff' },
  'self-upgrade':            { tier: 1, agent: 'any',        deps: [], activate: 'Agent scans and proposes fixes' },
  'decision-digest':         { tier: 1, agent: 'any',        deps: ['git'], activate: 'Agent reads git log and summarizes decisions' },
  'analytics-insights':      { tier: 1, agent: 'any',        deps: [], activate: 'Agent proposes queries from schema' },
  'e2e-test-gen':            { tier: 1, agent: 'any',        deps: [], activate: 'Agent generates test files from spec' },
  'critical-path-hardening': { tier: 1, agent: 'any',        deps: [], activate: 'Agent analyzes critical paths' },
  'perf-baseline':           { tier: 1, agent: 'any',        deps: [], activate: 'Agent generates perf test scripts' },
  'ai-literacy':             { tier: 1, agent: 'any',        deps: [], activate: 'Agent generates docs from source code' },
  'governance-audit':        { tier: 1, agent: 'any',        deps: [], activate: 'Agent runs quarterly audit' },
  'trend-tracker':           { tier: 1, agent: 'antigravity', deps: [], activate: 'Agent tracks AI news and updates' },
  'ops-playbook':            { tier: 1, agent: 'any',        deps: [], activate: 'Agent generates incident playbook' },
  'research-director':       { tier: 1, agent: 'any',        deps: [], activate: 'Agent researches topic → spec' },
  'new-app-from-idea':       { tier: 1, agent: 'any',        deps: [], activate: 'Agent generates full-stack app from idea' },
  'meta-new-lab':            { tier: 1, agent: 'any',        deps: [], activate: 'Agent scaffolds new lab repo' },
  'options-engine':          { tier: 1, agent: 'any',        deps: [], activate: 'Agent evaluates stack options' },
  'platform-new-app':        { tier: 1, agent: 'any',        deps: [], activate: 'Agent spins up new app from template' },

  // TIER 2 — Quick setup (install a package or configure a key)
  'mobile-app':              { tier: 2, agent: 'any',        deps: ['eas-cli', 'expo'], activate: 'npm i -g eas-cli && eas build:configure' },
  'ui-system':               { tier: 2, agent: 'antigravity', deps: ['tailwindcss', 'framer-motion'], activate: 'npm i tailwindcss framer-motion' },
  'api-trpc':                { tier: 2, agent: 'claude',     deps: ['trpc', 'zod'], activate: 'npm i @trpc/server @trpc/client zod' },
  'next16-upgrade':          { tier: 2, agent: 'claude',     deps: ['next@16'], activate: 'npm i next@latest react@latest' },
  'frontend-design-chooser': { tier: 2, agent: 'antigravity', deps: [], activate: 'Agent selects design system per page' },
  'swe-bench-agent':         { tier: 2, agent: 'claude',     deps: ['eslint', 'biome'], activate: 'npm i -D @biomejs/biome eslint' },
  'bug-hunter':              { tier: 2, agent: 'any',        deps: ['git hooks'], activate: 'npx husky install && configure pre-commit' },
  'agentic-design':          { tier: 2, agent: 'antigravity', deps: ['figma token'], activate: 'Set FIGMA_ACCESS_TOKEN in .env' },
  'prod-deploy':             { tier: 2, agent: 'any',        deps: ['docker', 'vercel'], activate: 'npm i -g vercel && vercel login' },
  'new-production-app':      { tier: 2, agent: 'any',        deps: [], activate: 'Agent runs full production pipeline' },
  'cost-optimizer':          { tier: 2, agent: 'any',        deps: ['aws-cli'], activate: 'Agent analyzes AWS costs' },
  'happiness-engine':        { tier: 2, agent: 'any',        deps: [], activate: 'Agent sets up dev health dashboards' },
  'productivity-booster':    { tier: 2, agent: 'any',        deps: [], activate: 'Agent optimizes sprint workflow' },

  // TIER 3 — Needs infrastructure (Docker, GPU, cloud APIs)
  'local-llm':               { tier: 3, agent: 'any',        deps: ['ollama', 'vllm', 'docker'], activate: 'winget install Ollama.Ollama && ollama pull llama3.1:70b' },
  'k8s-deploy':              { tier: 3, agent: 'any',        deps: ['kubectl', 'argocd'], activate: 'Install kubectl + ArgoCD on cluster' },
  'agent-gitops':            { tier: 3, agent: 'any',        deps: ['argocd', 'flux'], activate: 'Install ArgoCD + Flux on K8s cluster' },
  'gitops-v2':               { tier: 3, agent: 'any',        deps: ['argocd', 'flux', 'keptn'], activate: 'Install ArgoCD + Flux + Keptn' },
  'ai-ops':                  { tier: 3, agent: 'any',        deps: ['harness', 'dynatrace'], activate: 'Connect Harness + Dynatrace APIs' },
  'compliance-engine':       { tier: 3, agent: 'any',        deps: ['scanner tools'], activate: 'Install SOC2/HIPAA/GDPR scanners' },
  'fedramp':                 { tier: 3, agent: 'any',        deps: ['compliance tools'], activate: 'Set up FedRAMP monitoring pipeline' },
  'sbom-security':           { tier: 3, agent: 'any',        deps: ['syft', 'trivy', 'grype'], activate: 'Install Syft + Trivy + Grype' },
  'cross-platform':          { tier: 3, agent: 'any',        deps: ['flutter', 'tauri'], activate: 'Install Flutter + Tauri + RN' },
  'pwa-engine':              { tier: 3, agent: 'any',        deps: ['workbox'], activate: 'npm i workbox-webpack-plugin' },
  'swarm-v2':                { tier: 3, agent: 'multi',      deps: ['langgraph', 'crewai'], activate: 'pip install langgraph crewai' },
  'swarm-v3':                { tier: 3, agent: 'multi',      deps: ['langgraph'], activate: 'pip install langgraph' },
  'multi-llm-harmony':       { tier: 3, agent: 'multi',      deps: ['multiple LLM APIs'], activate: 'Set ANTHROPIC_API_KEY + OPENAI_API_KEY + GROK_API_KEY' },
  'modular-ai':              { tier: 3, agent: 'multi',      deps: ['plugin system'], activate: 'Build agent plugin marketplace' },
  'ide-agents':              { tier: 3, agent: 'multi',      deps: ['zed', 'cursor'], activate: 'Install Zed + Cursor IDEs' },
  'live-coding-agents':      { tier: 3, agent: 'multi',      deps: ['replit', 'cursor'], activate: 'Configure Replit + Cursor AI' },
  'agent-governance':        { tier: 3, agent: 'any',        deps: ['nemo-guardrails'], activate: 'pip install nemoguardrails' },
  'ai-responsibility':       { tier: 3, agent: 'any',        deps: ['google-ai-tools'], activate: 'Install Google AI Principles checker' },
  'benchmark-live':          { tier: 3, agent: 'any',        deps: ['benchmark tools'], activate: 'Set up LiveBench + ARC-AGI runner' },
  'terminalbench':           { tier: 3, agent: 'any',        deps: ['terminalbench'], activate: 'Install TerminalBench 2.0' },
  'dspy-v3':                 { tier: 3, agent: 'any',        deps: ['dspy'], activate: 'pip install dspy-ai' },
  'dspy-v4':                 { tier: 3, agent: 'any',        deps: ['dspy'], activate: 'pip install dspy-ai' },
  'edge-ai':                 { tier: 3, agent: 'any',        deps: ['webgpu', 'onnxruntime'], activate: 'npm i onnxruntime-web' },
  'small-language-models':   { tier: 3, agent: 'any',        deps: ['ollama'], activate: 'ollama pull phi-3:mini gemma2:2b' },
  'algo-factory':            { tier: 3, agent: 'claude',     deps: ['dspy', 'lean4'], activate: 'pip install dspy-ai && install lean4' },
  'citation-engine':         { tier: 3, agent: 'any',        deps: ['semantic-scholar API'], activate: 'Get Semantic Scholar API key' },
  'conference-oracle':       { tier: 3, agent: 'any',        deps: [], activate: 'Agent generates conference materials' },
  'venue-factory':           { tier: 3, agent: 'any',        deps: [], activate: 'Agent generates venue-specific templates' },
  'research-paper':          { tier: 3, agent: 'claude',     deps: ['latex'], activate: 'Install LaTeX (MiKTeX or TeX Live)' },
  'arxiv-bot':               { tier: 3, agent: 'claude',     deps: ['latex', 'arxiv account'], activate: 'Install LaTeX + configure arXiv' },
  'dl-dev2026':              { tier: 3, agent: 'any',        deps: ['pytorch', 'gpu'], activate: 'pip install torch && GPU required' },
  'distributed-training':    { tier: 3, agent: 'any',        deps: ['deepspeed', 'ray', 'gpu'], activate: 'pip install deepspeed ray' },
  'multimodal-agents':       { tier: 3, agent: 'any',        deps: ['gemini API'], activate: 'Set GEMINI_API_KEY in .env' },
  'multimodal-v2':           { tier: 3, agent: 'any',        deps: ['gemini API'], activate: 'Set GEMINI_API_KEY in .env' },
  'confidential-ai':         { tier: 3, agent: 'any',        deps: ['h100 gpu', 'concrete-ml'], activate: 'pip install concrete-ml' },
  'digital-twins':           { tier: 3, agent: 'any',        deps: ['sora API'], activate: 'Access Sora API for world simulation' },
  'hyper-personalization':   { tier: 3, agent: 'any',        deps: ['sentiment API'], activate: 'Set up real-time sentiment analysis' },

  // TIER 4 — Aspirational (specialized hardware, enterprise licenses)
  'quantum-ml':              { tier: 4, agent: 'any',        deps: ['pennylane', 'qiskit', 'quantum sim'], activate: 'pip install pennylane qiskit' },
  'robotics':                { tier: 4, agent: 'any',        deps: ['ros2', 'isaac-sim', 'nvidia'], activate: 'Install ROS2 Jazzy + Isaac Sim' },
  'physics-sim':             { tier: 4, agent: 'any',        deps: ['omniverse', 'mujoco'], activate: 'Install NVIDIA Omniverse + MuJoCo' },
  'webxr':                   { tier: 4, agent: 'any',        deps: ['webxr device', 'a-frame'], activate: 'npm i aframe && VR headset needed' },
  'world-models':            { tier: 4, agent: 'any',        deps: ['sora v2', 'genie 2'], activate: 'Access to Sora v2 + Genie 2 APIs' },
  'sector-enterprise':       { tier: 4, agent: 'any',        deps: ['air-gapped GPU cluster'], activate: 'Enterprise GPU cluster needed' },
  'sector-finance':          { tier: 4, agent: 'any',        deps: ['financial APIs', 'zk-proofs'], activate: 'Finance API + ZK infrastructure' },
  'sector-health':           { tier: 4, agent: 'any',        deps: ['hipaa infra', 'medical data'], activate: 'HIPAA-compliant infrastructure' },
};

// ─── Parse Workflow Files ────────────────────────────────────────────────────
function parseWorkflows() {
  if (!fs.existsSync(WORKFLOWS_DIR)) return [];
  return fs.readdirSync(WORKFLOWS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const name = f.replace('.md', '');
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, f), 'utf8');
      const descMatch = content.match(/description:\s*"?([^"\n]+)"?/);
      const desc = descMatch ? descMatch[1].trim() : 'No description';
      const tierInfo = WORKFLOW_TIERS[name] || { tier: 3, agent: 'any', deps: [], activate: 'Read workflow file for setup steps' };
      const phaseCount = (content.match(/^## Phase/gm) || []).length;
      const stepCount = (content.match(/^\d+\.\s/gm) || []).length;
      return { name, desc, file: f, ...tierInfo, phases: phaseCount, steps: stepCount };
    })
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
}

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdCatalog() {
  const workflows = parseWorkflows();
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 LAB WORKFLOW CATALOG                        ║');
  console.log(`║              ${workflows.length} workflows | ${new Date().toLocaleDateString()}                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  for (const [tierNum, tierInfo] of Object.entries(TIERS)) {
    const tierWorkflows = workflows.filter(w => w.tier === parseInt(tierNum));
    if (tierWorkflows.length === 0) continue;
    console.log(`\n${tierInfo.label} — ${tierInfo.desc} (${tierWorkflows.length})`);
    console.log('─'.repeat(60));
    for (const w of tierWorkflows) {
      const agentTag = w.agent === 'multi' ? '👥' : w.agent === 'claude' ? '🤖' : w.agent === 'antigravity' ? '🚀' : '🔧';
      console.log(`  ${agentTag} /${w.name}`);
      console.log(`     ${w.desc}`);
      console.log(`     Phases: ${w.phases} | Steps: ${w.steps} | Activate: ${w.activate}`);
    }
  }

  console.log('\n\nLegend: 🔧 Any agent  🤖 Claude  🚀 Antigravity  👥 Multi-agent');
  console.log(`\nTotal: ${workflows.length} workflows`);
  console.log(`  🟢 Run Now: ${workflows.filter(w => w.tier === 1).length}`);
  console.log(`  🟡 Quick Setup: ${workflows.filter(w => w.tier === 2).length}`);
  console.log(`  🟠 Infra Needed: ${workflows.filter(w => w.tier === 3).length}`);
  console.log(`  🔴 Aspirational: ${workflows.filter(w => w.tier === 4).length}`);
}

function cmdRunnable() {
  const workflows = parseWorkflows().filter(w => w.tier <= 1);
  console.log('\n🟢 WORKFLOWS YOU CAN RUN RIGHT NOW\n');
  console.log('These require no additional setup — just tell an agent to run them:\n');
  for (const w of workflows) {
    console.log(`  /${w.name} — ${w.desc}`);
    console.log(`    → ${w.activate}\n`);
  }
  console.log(`\nTotal runnable: ${workflows.length}`);
  console.log('\nTo run: Tell Claude Code or Antigravity to execute a workflow,');
  console.log('  or use Lab Brain: node lab-brain.js run <handoff.json>');
}

function cmdStatus() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║         🧪 LAB STATUS DASHBOARD          ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Check services
  const services = [
    { name: 'API Server', port: 3001, check: 'http://localhost:3001/health' },
    { name: 'Expo Dev Server', port: 8081, check: 'http://localhost:8081' },
    { name: 'Ollama', port: 11434, check: 'http://localhost:11434/api/tags' },
    { name: 'vLLM', port: 8000, check: 'http://localhost:8000/v1/models' },
  ];

  console.log('SERVICES:');
  for (const svc of services) {
    try {
      execSync(`powershell -Command "(Test-NetConnection -ComputerName localhost -Port ${svc.port}).TcpTestSucceeded"`, { timeout: 3000 });
      console.log(`  ✅ ${svc.name} (port ${svc.port})`);
    } catch {
      console.log(`  ❌ ${svc.name} (port ${svc.port}) — not running`);
    }
  }

  // Check agents
  console.log('\nAGENTS:');
  const agents = [
    { name: 'Claude Code', check: 'claude --version' },
    { name: 'Amazon Q', check: 'q --version' },
    { name: 'Antigravity', check: 'always' },
  ];
  for (const agent of agents) {
    if (agent.check === 'always') { console.log(`  ✅ ${agent.name} (active)`); continue; }
    try {
      execSync(agent.check, { timeout: 5000, stdio: 'pipe' });
      console.log(`  ✅ ${agent.name}`);
    } catch {
      console.log(`  ❌ ${agent.name} — CLI not found`);
    }
  }

  // Check env vars
  console.log('\nAPI KEYS:');
  const keys = ['ANTHROPIC_API_KEY', 'AWS_ACCESS_KEY_ID', 'DATABASE_URL', 'FIGMA_ACCESS_TOKEN', 'OPENAI_API_KEY'];
  try { require('dotenv').config({ path: path.join(ROOT, '.env') }); } catch {}
  for (const key of keys) {
    const val = process.env[key];
    console.log(`  ${val ? '✅' : '❌'} ${key} ${val ? '(set)' : '(missing)'}`);
  }

  // Workflow stats
  const workflows = parseWorkflows();
  console.log('\nWORKFLOW READINESS:');
  console.log(`  🟢 Run Now:      ${workflows.filter(w => w.tier === 1).length}`);
  console.log(`  🟡 Quick Setup:  ${workflows.filter(w => w.tier === 2).length}`);
  console.log(`  🟠 Infra Needed: ${workflows.filter(w => w.tier === 3).length}`);
  console.log(`  🔴 Aspirational: ${workflows.filter(w => w.tier === 4).length}`);

  // Recent logs
  const logsDir = path.join(ROOT, 'agents', 'logs');
  if (fs.existsSync(logsDir)) {
    const logs = fs.readdirSync(logsDir).filter(f => f.endsWith('.log')).sort().reverse().slice(0, 3);
    if (logs.length > 0) {
      console.log('\nRECENT AGENT LOGS:');
      logs.forEach(l => console.log(`  📄 ${l}`));
    }
  }
}

function cmdActivate(workflowName) {
  const workflows = parseWorkflows();
  const workflow = workflows.find(w => w.name === workflowName);
  if (!workflow) {
    console.log(`\n❌ Unknown workflow: ${workflowName}`);
    console.log(`\nAvailable (${workflows.length}):`);
    workflows.forEach(w => console.log(`  /${w.name}`));
    return;
  }

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  ACTIVATING: /${workflow.name}`);
  console.log(`╚══════════════════════════════════════════╝\n`);
  console.log(`Description: ${workflow.desc}`);
  console.log(`Readiness:   ${TIERS[workflow.tier].label}`);
  console.log(`Agent:       ${workflow.agent}`);
  console.log(`Deps:        ${workflow.deps.length > 0 ? workflow.deps.join(', ') : 'None'}`);
  console.log(`Steps:       ${workflow.steps} steps across ${workflow.phases} phases`);
  console.log(`\n── Activation Command ──────────────────────`);
  console.log(`  ${workflow.activate}`);
  console.log(`\n── Full Workflow ────────────────────────────`);
  console.log(`  File: .agent/workflows/${workflow.file}`);
  console.log(`  View: code .agent/workflows/${workflow.file}`);
  console.log(`\n── Run via Lab Brain ────────────────────────`);
  console.log(`  1. Create handoff: agents/handoffs/${workflow.name}-handoff.json`);
  console.log(`  2. Dispatch:       node lab-brain.js run agents/handoffs/${workflow.name}-handoff.json`);
}

function cmdSearch(keyword) {
  const workflows = parseWorkflows();
  const kw = keyword.toLowerCase();
  const matches = workflows.filter(w =>
    w.name.toLowerCase().includes(kw) || w.desc.toLowerCase().includes(kw)
  );
  if (matches.length === 0) {
    console.log(`\n❌ No workflows matching "${keyword}"`);
    return;
  }
  console.log(`\n🔍 ${matches.length} workflows matching "${keyword}":\n`);
  for (const w of matches) {
    console.log(`  ${TIERS[w.tier].label.split(' ')[0]} /${w.name} — ${w.desc}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'catalog':  cmdCatalog(); break;
  case 'status':   cmdStatus(); break;
  case 'activate': cmdActivate(args[0]); break;
  case 'runnable': cmdRunnable(); break;
  case 'search':   cmdSearch(args.join(' ')); break;
  default:
    console.log(`
🧪 Lab Dashboard — Workflow Catalog & Activation

Commands:
  node lab-dashboard.js catalog              Full catalog with readiness tiers
  node lab-dashboard.js runnable             Workflows you can run RIGHT NOW
  node lab-dashboard.js status               Active services & agent status
  node lab-dashboard.js activate <workflow>  Activation steps for a workflow
  node lab-dashboard.js search <keyword>     Search workflows

Examples:
  node lab-dashboard.js activate security-scan
  node lab-dashboard.js search mobile
  node lab-dashboard.js runnable
`);
}
