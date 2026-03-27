#!/usr/bin/env node
/**
 * Lab Dashboard — Visual Web UI
 * Run: node lab-dashboard-ui.js
 * Open: http://localhost:4000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const WORKFLOWS_DIR = path.join(ROOT, '.agent', 'workflows');
const PORT = 4000;

// ─── Parse workflows ─────────────────────────────────────────────────────────
function parseWorkflows() {
  if (!fs.existsSync(WORKFLOWS_DIR)) return [];
  return fs.readdirSync(WORKFLOWS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const name = f.replace('.md', '');
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, f), 'utf8');
      const descMatch = content.match(/description:\s*"?([^"\n]+)"?/);
      const desc = descMatch ? descMatch[1].trim().replace(/"/g, '') : 'No description';
      const phases = (content.match(/^## Phase/gm) || []).length;
      const steps = (content.match(/^\d+\.\s/gm) || []).length;
      return { name, desc, file: f, phases, steps };
    });
}

// ─── Tier classification ─────────────────────────────────────────────────────
const TIER1 = new Set(['code-audit-fix','security-scan','build-error-resolver','self-review','self-upgrade','decision-digest','analytics-insights','e2e-test-gen','critical-path-hardening','perf-baseline','ai-literacy','governance-audit','trend-tracker','ops-playbook','research-director','new-app-from-idea','meta-new-lab','options-engine','platform-new-app']);
const TIER2 = new Set(['mobile-app','ui-system','api-trpc','next16-upgrade','swe-bench-agent','bug-hunter','agentic-design','prod-deploy','frontend-design-chooser','new-production-app','cost-optimizer','happiness-engine','productivity-booster']);
const TIER4 = new Set(['quantum-ml','robotics','physics-sim','webxr','world-models','sector-enterprise','sector-finance','sector-health']);

function getTier(name) {
  if (TIER1.has(name)) return 1;
  if (TIER2.has(name)) return 2;
  if (TIER4.has(name)) return 4;
  return 3;
}

// ─── Check services ──────────────────────────────────────────────────────────
function checkPort(port) {
  try {
    execSync(`powershell -Command "(Test-NetConnection -ComputerName localhost -Port ${port} -WarningAction SilentlyContinue).TcpTestSucceeded"`, { timeout: 3000, stdio: 'pipe' });
    return true;
  } catch { return false; }
}

function checkCLI(cmd) {
  try { execSync(cmd, { timeout: 3000, stdio: 'pipe' }); return true; } catch { return false; }
}

// ─── Recent logs ─────────────────────────────────────────────────────────────
function getRecentLogs() {
  const logsDir = path.join(ROOT, 'agents', 'logs');
  if (!fs.existsSync(logsDir)) return [];
  return fs.readdirSync(logsDir).filter(f => f.endsWith('.log')).sort().reverse().slice(0, 5);
}

// ─── Build HTML ──────────────────────────────────────────────────────────────
function buildPage() {
  const workflows = parseWorkflows();
  const tierNames = { 1: 'Run Now', 2: 'Quick Setup', 3: 'Infra Needed', 4: 'Aspirational' };
  const tierColors = { 1: '#4ADE80', 2: '#FBBF24', 3: '#FB923C', 4: '#EF4444' };
  const tierIcons = { 1: '🟢', 2: '🟡', 3: '🟠', 4: '🔴' };
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };

  const enriched = workflows.map(w => {
    const tier = getTier(w.name);
    counts[tier]++;
    return { ...w, tier };
  }).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

  const services = [
    { name: 'API Server', port: 3001, up: checkPort(3001) },
    { name: 'Expo Dev', port: 8081, up: checkPort(8081) },
    { name: 'Ollama', port: 11434, up: checkPort(11434) },
  ];

  const agents = [
    { name: 'Claude Code', up: checkCLI('claude --version') },
    { name: 'Amazon Q', up: checkCLI('q --version') },
    { name: 'Antigravity', up: true },
  ];

  const logs = getRecentLogs();
  const totalWorkflows = workflows.length;

  // Build workflow cards HTML
  let workflowCards = '';
  for (const [tierNum, tierLabel] of Object.entries(tierNames)) {
    const tierWfs = enriched.filter(w => w.tier === parseInt(tierNum));
    if (tierWfs.length === 0) continue;
    workflowCards += `<div class="tier-section"><h3 style="color:${tierColors[tierNum]}">${tierIcons[tierNum]} ${tierLabel} <span class="count">(${tierWfs.length})</span></h3><div class="wf-grid">`;
    for (const w of tierWfs) {
      workflowCards += `
        <div class="wf-card" data-tier="${w.tier}" data-name="${w.name}" data-desc="${w.desc.toLowerCase()}">
          <div class="wf-tier-dot" style="background:${tierColors[w.tier]}"></div>
          <div class="wf-name">/${w.name}</div>
          <div class="wf-desc">${w.desc}</div>
          <div class="wf-meta">${w.phases} phases · ${w.steps} steps</div>
        </div>`;
    }
    workflowCards += '</div></div>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lab Dashboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #0A0E1A; color: #FFF; min-height: 100vh; }

  .header { padding: 32px 40px 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
  .header h1 { font-size: 28px; font-weight: 800; }
  .header h1 span { color: #F1AB00; }
  .header-right { display: flex; gap: 12px; align-items: center; }
  .badge { background: #141828; border: 1px solid #262C42; padding: 6px 14px; border-radius: 999px; font-size: 13px; color: #8B92A8; }
  .badge b { color: #FFF; }

  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; padding: 24px 40px; }
  .stat-card { background: #141828; border: 1px solid #262C42; border-radius: 12px; padding: 20px; text-align: center; transition: transform 0.2s, border-color 0.2s; }
  .stat-card:hover { transform: translateY(-2px); border-color: #F1AB00; }
  .stat-num { font-size: 36px; font-weight: 800; }
  .stat-label { font-size: 13px; color: #8B92A8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }

  .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 40px 24px; }
  @media (max-width: 900px) { .panels { grid-template-columns: 1fr; } }
  .panel { background: #141828; border: 1px solid #262C42; border-radius: 12px; padding: 20px; }
  .panel h3 { font-size: 14px; color: #8B92A8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .panel-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1C2236; }
  .panel-item:last-child { border-bottom: none; }
  .dot-up { width: 8px; height: 8px; border-radius: 4px; background: #4ADE80; }
  .dot-down { width: 8px; height: 8px; border-radius: 4px; background: #EF4444; }
  .panel-name { flex: 1; font-size: 14px; font-weight: 500; }
  .panel-port { font-size: 12px; color: #5A6178; }

  .search-bar { padding: 0 40px 16px; }
  .search-bar input { width: 100%; background: #141828; border: 1px solid #262C42; border-radius: 12px; padding: 14px 20px; color: #FFF; font-size: 15px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
  .search-bar input:focus { border-color: #F1AB00; }
  .search-bar input::placeholder { color: #5A6178; }

  .filter-row { padding: 0 40px 16px; display: flex; gap: 8px; flex-wrap: wrap; }
  .filter-btn { padding: 6px 16px; border-radius: 999px; border: 1px solid #262C42; background: transparent; color: #8B92A8; font-size: 13px; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s; }
  .filter-btn:hover, .filter-btn.active { background: #F1AB00; color: #0A0E1A; border-color: #F1AB00; font-weight: 600; }

  .tier-section { padding: 0 40px 24px; }
  .tier-section h3 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
  .tier-section h3 .count { font-weight: 400; font-size: 14px; opacity: 0.6; }
  .wf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
  .wf-card { background: #141828; border: 1px solid #262C42; border-radius: 10px; padding: 16px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s; cursor: default; }
  .wf-card:hover { transform: translateY(-2px); border-color: #F1AB00; }
  .wf-tier-dot { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .wf-name { font-size: 15px; font-weight: 600; color: #F1AB00; margin-bottom: 6px; }
  .wf-desc { font-size: 13px; color: #8B92A8; line-height: 1.4; margin-bottom: 8px; }
  .wf-meta { font-size: 11px; color: #5A6178; }
  .wf-card.hidden { display: none; }

  .log-item { font-size: 13px; color: #8B92A8; padding: 6px 0; border-bottom: 1px solid #1C2236; font-family: monospace; word-break: break-all; }
  .log-item:last-child { border-bottom: none; }

  .footer { text-align: center; padding: 32px; color: #5A6178; font-size: 12px; }
</style>
</head>
<body>

<div class="header">
  <h1>🧪 <span>Lab</span> Dashboard</h1>
  <div class="header-right">
    <div class="badge"><b>${totalWorkflows}</b> workflows</div>
    <div class="badge">Built: ${new Date().toLocaleDateString()}</div>
  </div>
</div>

<!-- Stats Row -->
<div class="stats-row">
  <div class="stat-card"><div class="stat-num" style="color:#4ADE80">${counts[1]}</div><div class="stat-label">Run Now</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#FBBF24">${counts[2]}</div><div class="stat-label">Quick Setup</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#FB923C">${counts[3]}</div><div class="stat-label">Infra Needed</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#EF4444">${counts[4]}</div><div class="stat-label">Aspirational</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#F1AB00">${totalWorkflows}</div><div class="stat-label">Total</div></div>
</div>

<!-- Services & Agents -->
<div class="panels">
  <div class="panel">
    <h3>Services</h3>
    ${services.map(s => `<div class="panel-item"><div class="${s.up ? 'dot-up' : 'dot-down'}"></div><div class="panel-name">${s.name}</div><div class="panel-port">:${s.port}</div></div>`).join('')}
  </div>
  <div class="panel">
    <h3>Agents</h3>
    ${agents.map(a => `<div class="panel-item"><div class="${a.up ? 'dot-up' : 'dot-down'}"></div><div class="panel-name">${a.name}</div></div>`).join('')}
  </div>
</div>

<!-- Recent Logs -->
${logs.length > 0 ? `
<div class="panels">
  <div class="panel" style="grid-column: 1 / -1;">
    <h3>Recent Agent Logs</h3>
    ${logs.map(l => `<div class="log-item">📄 ${l}</div>`).join('')}
  </div>
</div>` : ''}

<!-- Search -->
<div class="search-bar">
  <input type="text" id="search" placeholder="🔍 Search workflows..." oninput="filterWorkflows()">
</div>

<!-- Filters -->
<div class="filter-row">
  <button class="filter-btn active" onclick="setFilter('all', this)">All (${totalWorkflows})</button>
  <button class="filter-btn" onclick="setFilter(1, this)">🟢 Run Now (${counts[1]})</button>
  <button class="filter-btn" onclick="setFilter(2, this)">🟡 Quick Setup (${counts[2]})</button>
  <button class="filter-btn" onclick="setFilter(3, this)">🟠 Infra Needed (${counts[3]})</button>
  <button class="filter-btn" onclick="setFilter(4, this)">🔴 Aspirational (${counts[4]})</button>
</div>

<!-- Workflows -->
${workflowCards}

<div class="footer">Lab Dashboard · ${totalWorkflows} workflows · Highlander Events Lab</div>

<script>
let activeTier = 'all';

function setFilter(tier, btn) {
  activeTier = tier;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterWorkflows();
}

function filterWorkflows() {
  const q = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.wf-card').forEach(card => {
    const name = card.dataset.name;
    const desc = card.dataset.desc;
    const tier = parseInt(card.dataset.tier);
    const matchSearch = !q || name.includes(q) || desc.includes(q);
    const matchTier = activeTier === 'all' || tier === activeTier;
    card.classList.toggle('hidden', !(matchSearch && matchTier));
  });
  // Show/hide tier sections based on visible cards
  document.querySelectorAll('.tier-section').forEach(section => {
    const visible = section.querySelectorAll('.wf-card:not(.hidden)').length;
    section.style.display = visible > 0 ? 'block' : 'none';
  });
}
</script>

</body>
</html>`;
}

// ─── Server ──────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(buildPage());
});

server.listen(PORT, () => {
  console.log(`\n🧪 Lab Dashboard running at http://localhost:${PORT}\n`);
});
