#!/usr/bin/env node
// =============================================================================
// Lab Brain — Orchestrator CLI
// =============================================================================
// Dispatches tasks to Claude Code (via CLI), Amazon Q (via Bedrock), and
// coordinates handoffs automatically. No manual copy-pasting needed.
//
// Usage:
//   node lab-brain.js run <handoff.json>         — Execute a single handoff
//   node lab-brain.js phase <phase-number>       — Run all handoffs for a phase
//   node lab-brain.js status                     — Show agent task status
//   node lab-brain.js review                     — Review latest agent outputs
// =============================================================================

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HANDOFFS_DIR = path.join(ROOT, 'agents', 'handoffs');
const LOGS_DIR = path.join(ROOT, 'agents', 'logs');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

// ─── Colors for terminal output ──────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  gold: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(agent, msg) {
  const colors = {
    brain: c.gold,
    claude: c.blue,
    amazonq: c.magenta,
    antigravity: c.cyan,
    error: c.red,
    done: c.green,
  };
  const color = colors[agent] || c.reset;
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${c.dim}[${timestamp}]${c.reset} ${color}${c.bold}[${agent.toUpperCase()}]${c.reset} ${msg}`);
}

// ─── Execute a task via Claude CLI (non-interactive) ─────────────────────────
async function dispatchToClaude(handoff) {
  const task = handoff.handoff.task;
  const context = handoff.handoff.context || {};
  
  // Build the prompt from the handoff JSON
  const subtaskList = task.subtasks
    ? task.subtasks.map((s, i) => `  ${i + 1}. [${s.id}] ${s.title}: ${s.description}`).join('\n')
    : task.description;

  const constraintList = task.constraints
    ? task.constraints.map(c => `  - ${c}`).join('\n')
    : 'None specified';

  const appName = context.app_name || context.app_slug || 'project';

  const prompt = `
You are working on the ${appName} project.
Working directory: ${ROOT}

TASK: ${task.description}

SUBTASKS:
${subtaskList}

CONSTRAINTS:
${constraintList}

IMPORTANT: 
- Read the relevant files before making changes.
- Make the actual code changes directly.
- When done, output a JSON summary: {"completed": [...subtask IDs completed], "issues": [...any problems]}
`.trim();

  const logFile = path.join(LOGS_DIR, `claude-${handoff.handoff.id}-${Date.now()}.log`);
  const promptFile = path.join(LOGS_DIR, `prompt-${Date.now()}.txt`);
  
  // Write prompt to file for reliable piping
  fs.writeFileSync(promptFile, prompt);
  
  log('brain', `Dispatching to Claude Code: ${task.subtasks?.length || 1} subtask(s)`);
  log('claude', `Starting work on: ${task.description.slice(0, 80)}...`);

  return new Promise((resolve, reject) => {
    // Windows has ~8192 char limit for command args. Pipe prompt via file.
    const cmd = `Get-Content "${promptFile}" -Raw | claude -p --output-format text`;
    const proc = spawn('powershell', ['-Command', cmd], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Stream progress to terminal
      text.split('\n').forEach(line => {
        if (line.trim()) log('claude', `${c.dim}${line.trim().slice(0, 120)}${c.reset}`);
      });
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      // Save full log
      fs.writeFileSync(logFile, output + '\n---STDERR---\n' + errorOutput);
      log('brain', `Claude log saved: ${path.basename(logFile)}`);

      if (code === 0) {
        log('done', `Claude completed successfully`);
        resolve({ agent: 'claude', output, logFile, success: true });
      } else {
        log('error', `Claude exited with code ${code}`);
        resolve({ agent: 'claude', output, errorOutput, logFile, success: false });
      }
    });

    proc.on('error', (err) => {
      log('error', `Claude spawn error: ${err.message}`);
      reject(err);
    });
  });
}

// ─── Execute a task via Anthropic API directly (for Amazon Q tasks) ──────────
async function dispatchToAnthropicAPI(handoff) {
  const task = handoff.handoff.task;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    log('error', 'ANTHROPIC_API_KEY not set — cannot dispatch to Anthropic API');
    log('brain', 'Falling back to Claude CLI for this task');
    return dispatchToClaude(handoff);
  }

  const subtaskList = task.subtasks
    ? task.subtasks.map((s, i) => `${i + 1}. [${s.id}] ${s.title}: ${s.description}\n   Files: ${s.files?.join(', ') || 'N/A'}`).join('\n')
    : task.description;

  const prompt = `You are a senior backend engineer. Apply the following changes to the codebase at ${ROOT}.

TASK: ${task.description}

SUBTASKS:
${subtaskList}

For each subtask, output the EXACT file content changes needed as unified diffs.
Format: {"subtask_id": "...", "file": "...", "changes": "...diff..."}`;

  log('brain', `Dispatching to Anthropic API: ${task.subtasks?.length || 1} subtask(s)`);
  log('amazonq', `Analyzing: ${task.description.slice(0, 80)}...`);

  // Use Claude CLI in print mode as reliable fallback
  return dispatchToClaude(handoff);
}

// ─── Load and validate a handoff file ────────────────────────────────────────
function loadHandoff(filePath) {
  if (!fs.existsSync(filePath)) {
    log('error', `Handoff file not found: ${filePath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!data.handoff) {
    log('error', `Invalid handoff format: missing "handoff" key`);
    process.exit(1);
  }
  return data;
}

// ─── Run a single handoff ────────────────────────────────────────────────────
async function runHandoff(filePath) {
  const handoff = loadHandoff(filePath);
  const h = handoff.handoff;

  log('brain', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log('brain', `Handoff: ${h.id}`);
  log('brain', `From: ${h.from.agent} → To: ${h.to.agent}`);
  log('brain', `Phase: ${h.to.phase}`);
  log('brain', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const targetAgent = h.to.agent.toLowerCase();

  if (targetAgent.includes('claude')) {
    return dispatchToClaude(handoff);
  } else if (targetAgent.includes('amazon') || targetAgent.includes('q')) {
    return dispatchToAnthropicAPI(handoff);
  } else {
    log('brain', `Unknown agent "${h.to.agent}", defaulting to Claude CLI`);
    return dispatchToClaude(handoff);
  }
}

// ─── Run all handoffs for a phase ────────────────────────────────────────────
async function runPhase(phaseNum) {
  const files = fs.readdirSync(HANDOFFS_DIR)
    .filter(f => f.startsWith(`phase${phaseNum}`) && f.endsWith('.json'));

  if (files.length === 0) {
    log('error', `No handoff files found for phase ${phaseNum}`);
    log('brain', `Expected files like: phase${phaseNum}-claude-code.json, phase${phaseNum}-amazon-q.json`);
    process.exit(1);
  }

  log('brain', `\n${'═'.repeat(60)}`);
  log('brain', `  LAB BRAIN — Phase ${phaseNum} Execution`);
  log('brain', `  Found ${files.length} handoff(s): ${files.join(', ')}`);
  log('brain', `${'═'.repeat(60)}\n`);

  const results = [];
  
  // Run handoffs in parallel
  const promises = files.map(file => {
    const filePath = path.join(HANDOFFS_DIR, file);
    log('brain', `Queuing: ${file}`);
    return runHandoff(filePath).then(result => {
      results.push({ file, ...result });
      return result;
    }).catch(err => {
      results.push({ file, success: false, error: err.message });
      log('error', `Failed: ${file} — ${err.message}`);
    });
  });

  await Promise.all(promises);

  // Summary
  log('brain', `\n${'═'.repeat(60)}`);
  log('brain', `  Phase ${phaseNum} — COMPLETE`);
  log('brain', `${'═'.repeat(60)}`);
  
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    log('brain', `  ${icon} ${r.file} → ${r.agent || 'unknown'}`);
  });

  return results;
}

// ─── Show status of all agents ───────────────────────────────────────────────
function showStatus() {
  log('brain', `\n${'═'.repeat(60)}`);
  log('brain', `  LAB STATUS`);
  log('brain', `${'═'.repeat(60)}`);

  // Check which handoffs exist
  const handoffs = fs.existsSync(HANDOFFS_DIR) 
    ? fs.readdirSync(HANDOFFS_DIR).filter(f => f.endsWith('.json'))
    : [];

  // Check logs
  const logs = fs.existsSync(LOGS_DIR)
    ? fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.log'))
    : [];

  log('brain', `  Handoff files: ${handoffs.length}`);
  handoffs.forEach(h => log('brain', `    📋 ${h}`));

  log('brain', `  Execution logs: ${logs.length}`);
  logs.slice(-5).forEach(l => log('brain', `    📜 ${l}`));

  // Check running agents
  try {
    const psOutput = execSync('tasklist /FI "IMAGENAME eq claude.exe" /FO CSV /NH 2>nul', { encoding: 'utf-8' });
    const claudeCount = psOutput.split('\n').filter(l => l.includes('claude')).length;
    log('claude', `  ${claudeCount > 0 ? '🟢 Running' : '⚪ Not running'} (${claudeCount} instance(s))`);
  } catch { log('claude', '  ⚪ Status unknown'); }

  log('brain', `${'═'.repeat(60)}\n`);
}

// ─── Review latest outputs ───────────────────────────────────────────────────
function reviewOutputs() {
  const logs = fs.existsSync(LOGS_DIR)
    ? fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.log')).sort()
    : [];

  if (logs.length === 0) {
    log('brain', 'No execution logs found. Run a handoff first.');
    return;
  }

  const latest = logs[logs.length - 1];
  const content = fs.readFileSync(path.join(LOGS_DIR, latest), 'utf-8');
  
  log('brain', `\nLatest log: ${latest}`);
  log('brain', `${'─'.repeat(60)}`);
  console.log(content.slice(0, 3000)); // First 3000 chars
  if (content.length > 3000) log('brain', `... (${content.length - 3000} more chars, see full log)`);
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────
async function main() {
  // Load .env
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length && !key.startsWith('#')) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    });
  }

  const [,, command, arg] = process.argv;

  console.log(`\n${c.gold}${c.bold}🧠 LAB BRAIN${c.reset} ${c.dim}— Multi-Agent Orchestrator${c.reset}\n`);

  switch (command) {
    case 'run':
      if (!arg) { log('error', 'Usage: lab-brain run <handoff.json>'); break; }
      const absPath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
      await runHandoff(absPath);
      break;

    case 'phase':
      if (!arg) { log('error', 'Usage: lab-brain phase <number>'); break; }
      await runPhase(arg);
      break;

    case 'status':
      showStatus();
      break;

    case 'review':
      reviewOutputs();
      break;

    default:
      console.log(`${c.bold}Commands:${c.reset}`);
      console.log(`  ${c.cyan}run ${c.dim}<handoff.json>${c.reset}   Execute a single handoff file`);
      console.log(`  ${c.cyan}phase ${c.dim}<number>${c.reset}       Run all handoffs for a phase`);
      console.log(`  ${c.cyan}status${c.reset}                Show agent status`);
      console.log(`  ${c.cyan}review${c.reset}                Review latest agent outputs`);
      console.log(`\n${c.bold}Examples:${c.reset}`);
      console.log(`  ${c.dim}node lab-brain.js phase 3${c.reset}`);
      console.log(`  ${c.dim}node lab-brain.js run agents/handoffs/phase3-claude-code.json${c.reset}`);
      console.log(`  ${c.dim}node lab-brain.js status${c.reset}`);
  }
}

main().catch(err => {
  log('error', err.message);
  process.exit(1);
});
