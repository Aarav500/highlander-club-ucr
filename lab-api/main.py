"""
Lab API — HTTP interface for triggering AI Lab workflows.

Usage:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8100

Endpoints:
    POST /trigger/{workflow}   — queue a workflow run
    GET  /runs                 — list recent runs
    GET  /runs/{run_id}        — get status of a specific run
    GET  /workflows            — list available workflows
    GET  /health               — health check
"""

import os
import uuid
import glob
import asyncio
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

# ─────────────────────────── Config ───────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKFLOWS_DIR = REPO_ROOT / ".agent" / "workflows"

# ─────────────────────────── Models ───────────────────────────────────

class RunStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class TriggerRequest(BaseModel):
    """Body for POST /trigger/{workflow}."""
    idea: Optional[str] = Field(None, description="Short idea or description to pass to the workflow")
    app_slug: Optional[str] = Field(None, description="App identifier (kebab-case)")
    inputs: dict = Field(default_factory=dict, description="Additional key-value inputs for the workflow")
    model_tier: Optional[int] = Field(None, ge=1, le=3, description="Override model tier (1=Opus, 2=Sonnet, 3=Haiku)")


class RunRecord(BaseModel):
    """Tracks the state of a single workflow run."""
    run_id: str
    workflow: str
    status: RunStatus = RunStatus.queued
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    request: TriggerRequest
    result: Optional[dict] = None
    error: Optional[str] = None


class HandoffPayload(BaseModel):
    """Handoff artifact emitted per agents/protocol.md."""
    handoff_id: str
    from_agent: str = "lab-api"
    from_workflow: str = "trigger"
    to_agent: str = "implementer"
    to_workflow: str
    context: dict = Field(default_factory=dict)
    task: dict = Field(default_factory=dict)
    artifacts: dict = Field(default_factory=dict)
    status: str = "pending"


# ─────────────────────────── State (in-memory) ────────────────────────

runs: dict[str, RunRecord] = {}

# ─────────────────────────── App ──────────────────────────────────────

app = FastAPI(
    title="Lab API",
    description="HTTP interface for triggering AI Lab workflows",
    version="0.1.0",
)


# ─────────────────────────── Helpers ──────────────────────────────────

def discover_workflows() -> list[dict]:
    """Scan the workflows directory and return metadata for each workflow."""
    results = []
    if not WORKFLOWS_DIR.exists():
        return results

    for md_file in sorted(WORKFLOWS_DIR.glob("*.md")):
        meta = {"name": md_file.stem, "file": str(md_file.relative_to(REPO_ROOT))}

        # Parse frontmatter for description and model_tier
        try:
            content = md_file.read_text(encoding="utf-8")
            if content.startswith("---"):
                end = content.index("---", 3)
                frontmatter = content[3:end]
                for line in frontmatter.strip().splitlines():
                    if ":" in line:
                        key, _, value = line.partition(":")
                        key = key.strip()
                        value = value.strip().split("#")[0].strip()  # strip inline comments
                        if key == "description":
                            meta["description"] = value
                        elif key == "model_tier":
                            meta["model_tier"] = int(value)
        except Exception:
            pass

        results.append(meta)
    return results


def build_handoff(workflow: str, request: TriggerRequest, run_id: str) -> dict:
    """Build a handoff artifact per agents/protocol.md."""
    return HandoffPayload(
        handoff_id=f"handoff-{uuid.uuid4()}",
        to_workflow=workflow,
        context={
            "app_slug": request.app_slug or "unknown",
            "idea": request.idea,
            "triggered_by": "lab-api",
            "run_id": run_id,
            **request.inputs,
        },
        task={
            "description": request.idea or f"Execute workflow: {workflow}",
            "model_tier": request.model_tier or 2,
        },
        artifacts={
            "inputs": [],
            "expected_outputs": [],
        },
    ).model_dump()


async def simulate_workflow(run_id: str):
    """
    Placeholder: simulates async workflow execution.

    In a real deployment, this would:
    1. Shell out to `claude --workflow <name>`, or
    2. POST to an n8n webhook, or
    3. Enqueue work to a task queue (Celery, SQS, etc.)
    """
    run = runs.get(run_id)
    if not run:
        return

    run.status = RunStatus.running
    run.started_at = datetime.now(timezone.utc).isoformat()

    try:
        # Simulate processing time
        await asyncio.sleep(2)

        run.status = RunStatus.completed
        run.completed_at = datetime.now(timezone.utc).isoformat()
        run.result = {
            "message": f"Workflow '{run.workflow}' executed successfully",
            "handoff": build_handoff(run.workflow, run.request, run_id),
        }
    except Exception as e:
        run.status = RunStatus.failed
        run.completed_at = datetime.now(timezone.utc).isoformat()
        run.error = str(e)


# ─────────────────────────── Routes ───────────────────────────────────

@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": "lab-api",
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/workflows")
async def list_workflows():
    """List all available workflows with metadata."""
    return {"workflows": discover_workflows()}


@app.post("/trigger/{workflow}")
async def trigger_workflow(
    workflow: str,
    background_tasks: BackgroundTasks,
    body: TriggerRequest = TriggerRequest(),
):
    """
    Trigger a workflow by name.

    The workflow name corresponds to a file in `.agent/workflows/<name>.md`.
    Returns a run ID that can be polled for status.
    """
    # Validate workflow exists
    workflow_file = WORKFLOWS_DIR / f"{workflow}.md"
    if not workflow_file.exists():
        available = [w["name"] for w in discover_workflows()]
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"Workflow '{workflow}' not found",
                "available": available,
            },
        )

    # Create run record
    run_id = str(uuid.uuid4())
    run = RunRecord(
        run_id=run_id,
        workflow=workflow,
        created_at=datetime.now(timezone.utc).isoformat(),
        request=body,
    )
    runs[run_id] = run

    # Queue background execution
    background_tasks.add_task(simulate_workflow, run_id)

    return {
        "run_id": run_id,
        "workflow": workflow,
        "status": run.status,
        "message": f"Workflow '{workflow}' queued",
        "poll_url": f"/runs/{run_id}",
    }


@app.get("/runs")
async def list_runs(limit: int = 20):
    """List recent workflow runs."""
    sorted_runs = sorted(runs.values(), key=lambda r: r.created_at, reverse=True)
    return {"runs": [r.model_dump() for r in sorted_runs[:limit]]}


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    """Get the status and result of a specific run."""
    run = runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return run.model_dump()
