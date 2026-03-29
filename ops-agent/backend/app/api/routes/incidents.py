"""Incident routes — webhook intake, listing, detail, sub-tickets, evidence, memory, logs, SSE stream."""
import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas import IncidentCreate, IncidentRead, IncidentUpdate
from app.api.pipeline import (
    incidents_store, sub_tickets_store, agent_logs_store,
    run_pipeline_mock, get_evidence_package, _next_id, _now,
)
from app.memory.memory_loader import memory_loader
from app.utils.logger import get_logger

logger = get_logger("routes.incidents")
router = APIRouter()


@router.post("/webhook", status_code=202)
async def receive_webhook(payload: IncidentCreate, background_tasks: BackgroundTasks):
    """Receive an incident webhook and kick off the agent pipeline in background."""
    incident_id = _next_id("INC")
    incident = {
        "incident_id": incident_id,
        "title": payload.title,
        "description": payload.description,
        "service": payload.service,
        "severity": payload.severity.value,
        "category": None,
        "causal_sig": None,
        "status": "incoming",
        "source": payload.source,
        "source_url": payload.source_url,
        "created_at": _now(),
        "resolved_at": None,
        "resolution_summary": None,
    }
    incidents_store[incident_id] = incident

    logger.info(f"webhook received: {incident_id} - {payload.title}")

    # Run the full agent pipeline in the background
    background_tasks.add_task(run_pipeline_mock, incident_id)

    return {"incident_id": incident_id, "status": "accepted"}


@router.get("/")
async def list_incidents():
    """List all incidents, most recent first."""
    sorted_incidents = sorted(
        incidents_store.values(),
        key=lambda x: x.get("created_at", ""),
        reverse=True,
    )
    return sorted_incidents


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    """Get full incident detail."""
    incident = incidents_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}")
async def update_incident(incident_id: str, update: IncidentUpdate):
    """Partial update of incident fields."""
    incident = incidents_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if val is not None:
            incident[key] = val.value if hasattr(val, 'value') else (val.isoformat() if isinstance(val, datetime) else val)

    return incident


@router.get("/{incident_id}/sub-tickets")
async def get_sub_tickets(incident_id: str):
    """Get all sub-tickets for an incident."""
    if incident_id not in incidents_store:
        raise HTTPException(status_code=404, detail="Incident not found")
    tickets = [t for t in sub_tickets_store.values() if t["incident_id"] == incident_id]
    return sorted(tickets, key=lambda x: x.get("created_at", ""))


@router.get("/{incident_id}/evidence")
async def get_evidence(incident_id: str):
    """Get the assembled evidence package for human review."""
    if incident_id not in incidents_store:
        raise HTTPException(status_code=404, detail="Incident not found")
    evidence = get_evidence_package(incident_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="No evidence available yet — pipeline may still be running")
    return evidence


@router.get("/{incident_id}/memory/{stage}")
async def get_memory_stage(incident_id: str, stage: int):
    """Get memory matches at a specific disclosure stage (0-3)."""
    incident = incidents_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident_data = {
        "service": incident.get("service", ""),
        "category": incident.get("category", ""),
        "causal_sig": incident.get("causal_sig", ""),
    }

    if stage == 0:
        return await memory_loader.load_stage_0(incident_data)
    elif stage == 1:
        return await memory_loader.load_stage_1(incident_data)
    elif stage == 2:
        top_match = (await memory_loader.load_stage_1(incident_data))
        match_id = top_match[0]["original_id"] if top_match else ""
        return await memory_loader.load_stage_2(match_id)
    elif stage == 3:
        top_match = (await memory_loader.load_stage_1(incident_data))
        match_id = top_match[0]["original_id"] if top_match else ""
        return await memory_loader.load_stage_3(match_id)
    else:
        raise HTTPException(status_code=400, detail="Stage must be 0-3")


@router.get("/{incident_id}/logs")
async def get_agent_logs(incident_id: str):
    """Get all agent logs for an incident."""
    if incident_id not in incidents_store:
        raise HTTPException(status_code=404, detail="Incident not found")
    logs = [l for l in agent_logs_store if l["incident_id"] == incident_id]
    return sorted(logs, key=lambda x: x.get("created_at", ""))


@router.get("/{incident_id}/stream/{agent_type}")
async def stream_agent_reasoning(incident_id: str, agent_type: str):
    """SSE stream for live agent reasoning — types out the output summary."""
    async def generate():
        # Find the most recent log for this agent
        logs = [l for l in agent_logs_store
                if l["incident_id"] == incident_id and l["agent_type"] == agent_type]
        if logs:
            text = logs[-1].get("output_summary", "") or ""
            for char in text:
                yield f"data: {json.dumps({'text': char})}\n\n"
                await asyncio.sleep(0.018)
        else:
            # Simulate thinking while agent is still running
            phrases = [
                f"Analyzing {agent_type.replace('_', ' ')} patterns...",
                "Querying memory bank for similar incidents...",
                "Cross-referencing service topology...",
                "Calculating confidence score...",
            ]
            for phrase in phrases:
                for char in phrase:
                    yield f"data: {json.dumps({'text': char})}\n\n"
                    await asyncio.sleep(0.02)
                yield f"data: {json.dumps({'text': chr(10)})}\n\n"
                await asyncio.sleep(0.3)

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
