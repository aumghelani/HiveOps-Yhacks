"""Agent routes — task status and listing."""
from fastapi import APIRouter, HTTPException

from app.api.pipeline import sub_tickets_store, agent_logs_store, incidents_store

router = APIRouter()


@router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Get the status and output of a specific agent task."""
    task = sub_tickets_store.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/incident/{incident_id}/tasks")
async def list_tasks_for_incident(incident_id: str):
    """List all agent tasks for a given incident, ordered by creation time."""
    if incident_id not in incidents_store:
        raise HTTPException(status_code=404, detail="Incident not found")
    tasks = [t for t in sub_tickets_store.values() if t["incident_id"] == incident_id]
    return sorted(tasks, key=lambda x: x.get("created_at", ""))


@router.get("/incident/{incident_id}/logs")
async def list_logs_for_incident(incident_id: str):
    """List all agent logs for a given incident."""
    if incident_id not in incidents_store:
        raise HTTPException(status_code=404, detail="Incident not found")
    logs = [l for l in agent_logs_store if l["incident_id"] == incident_id]
    return sorted(logs, key=lambda x: x.get("created_at", ""))
