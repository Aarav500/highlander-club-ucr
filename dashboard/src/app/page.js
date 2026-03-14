"use client";

import { useState, useEffect } from "react";

const LAB_API = process.env.LAB_API_URL || "http://localhost:8100";
const API_NODE = process.env.API_NODE_URL || "http://localhost:4000";

// ─── Data Fetching ──────────────────────────────────────────────

async function fetchJSON(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Components ─────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${color || ""}`}>{value}</div>
    </div>
  );
}

function AppCard({ app }) {
  const slaClass = `sla-${app.sla}`;
  return (
    <div className="app-card">
      <div className="app-name">{app.name}</div>
      <div className="app-meta">
        {app.envs?.map((env) => (
          <span key={env} className="badge env">{env}</span>
        ))}
        <span className={`badge ${slaClass}`}>{app.sla}</span>
      </div>
      <div className="app-owner">👤 {app.owner}</div>
    </div>
  );
}

function WorkflowTable({ workflows }) {
  if (!workflows?.length) {
    return <div className="empty-state">No workflows discovered</div>;
  }
  return (
    <table className="workflow-table">
      <thead>
        <tr>
          <th>Workflow</th>
          <th>Description</th>
          <th>Tier</th>
        </tr>
      </thead>
      <tbody>
        {workflows.map((w) => (
          <tr key={w.name}>
            <td className="workflow-name">{w.name}</td>
            <td>{w.description || "—"}</td>
            <td>
              {w.model_tier ? (
                <span className={`tier-badge tier-${w.model_tier}`}>
                  {w.model_tier}
                </span>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RunList({ runs }) {
  if (!runs?.length) {
    return <div className="empty-state">No recent runs</div>;
  }
  return (
    <div className="run-list">
      {runs.map((r) => (
        <div key={r.run_id} className="run-item">
          <span className={`status-dot ${r.status}`} />
          <span className="run-workflow">{r.workflow}</span>
          <span style={{ color: "var(--text-secondary)" }}>{r.status}</span>
          <span className="run-time">
            {new Date(r.created_at).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Static labs-config (loaded server-side or bundled) ─────────

const STATIC_APPS = [
  {
    name: "inventory-lab-app",
    owner: "backend-team",
    envs: ["dev", "staging", "prod"],
    sla: "basic",
  },
  {
    name: "research-6g-prototype",
    owner: "research-team",
    envs: ["dev"],
    sla: "experimental",
  },
];

// ─── Main Dashboard ─────────────────────────────────────────────

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [health, setHealth] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);

  useEffect(() => {
    async function load() {
      const [wf, rn, h, ah] = await Promise.all([
        fetchJSON(`${LAB_API}/workflows`),
        fetchJSON(`${LAB_API}/runs?limit=10`),
        fetchJSON(`${LAB_API}/health`),
        fetchJSON(`${API_NODE}/health`),
      ]);
      setWorkflows(wf?.workflows || []);
      setRuns(rn?.runs || []);
      setHealth(h);
      setApiHealth(ah);
    }
    load();
    const interval = setInterval(load, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  const runningCount = runs.filter((r) => r.status === "running").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI Lab Dashboard</h1>
        <p>Live overview of apps, workflows, and runs</p>
      </header>

      {/* ── Stats ── */}
      <div className="stats-row">
        <StatCard
          label="Registered Apps"
          value={STATIC_APPS.length}
          color="blue"
        />
        <StatCard
          label="Workflows"
          value={workflows.length}
          color="blue"
        />
        <StatCard
          label="Running"
          value={runningCount}
          color={runningCount > 0 ? "amber" : "green"}
        />
        <StatCard
          label="Failed"
          value={failedCount}
          color={failedCount > 0 ? "red" : "green"}
        />
        <StatCard
          label="Lab API"
          value={health?.ok ? "✓ UP" : "✗ DOWN"}
          color={health?.ok ? "green" : "red"}
        />
        <StatCard
          label="Backend API"
          value={apiHealth?.ok ? "✓ UP" : "✗ DOWN"}
          color={apiHealth?.ok ? "green" : "red"}
        />
      </div>

      {/* ── Apps ── */}
      <section className="section">
        <h2 className="section-header">
          <span className="icon">📦</span> Registered Apps
        </h2>
        <div className="app-grid">
          {STATIC_APPS.map((app) => (
            <AppCard key={app.name} app={app} />
          ))}
        </div>
      </section>

      {/* ── Workflows ── */}
      <section className="section">
        <h2 className="section-header">
          <span className="icon">⚡</span> Available Workflows
        </h2>
        <WorkflowTable workflows={workflows} />
      </section>

      {/* ── Recent Runs ── */}
      <section className="section">
        <h2 className="section-header">
          <span className="icon">🔄</span> Recent Runs
        </h2>
        <RunList runs={runs} />
      </section>
    </div>
  );
}
