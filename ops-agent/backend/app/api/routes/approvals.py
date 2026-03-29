"""Approval routes — list pending, submit decision, resolve incident."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException

from app.schemas import ApprovalCreate
from app.api.pipeline import (
    incidents_store, approval_store, get_evidence_package, _next_id, _now,
)
from app.memory.write_back import write_resolved_incident
from app.utils.logger import get_logger

logger = get_logger("routes.approvals")
router = APIRouter()


@router.get("/pending")
async def list_pending_approvals():
    """List all incidents awaiting human approval, with their evidence summaries."""
    pending = [
        inc for inc in incidents_store.values()
        if inc.get("status") == "awaiting_approval"
    ]
    # Enrich with evidence confidence
    results = []
    for inc in pending:
        evidence = get_evidence_package(inc["incident_id"])
        results.append({
            **inc,
            "confidence_score": evidence.get("confidence_score") if evidence else None,
            "risk_level": evidence.get("risk_level") if evidence else None,
            "proposed_fix": evidence.get("proposed_fix") if evidence else None,
        })
    return results


@router.post("/{incident_id}/decide", status_code=200)
async def submit_decision(incident_id: str, payload: ApprovalCreate):
    """Submit an approval, rejection, or revision request."""
    incident = incidents_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.get("status") != "awaiting_approval":
        raise HTTPException(status_code=400, detail=f"Incident is not awaiting approval (status: {incident['status']})")

    decision = payload.decision.value
    evidence = get_evidence_package(incident_id)

    # Record the approval decision
    record = {
        "approval_id": _next_id("APR"),
        "incident_id": incident_id,
        "reviewer_id": payload.reviewer_id or "demo-reviewer",
        "decision": decision,
        "notes": payload.notes,
        "evidence_snapshot": evidence,
        "created_at": _now(),
    }
    approval_store.append(record)

    logger.info(f"approval decision={decision} incident={incident_id}")

    if decision == "approved":
        incident["status"] = "resolved"
        incident["resolved_at"] = _now()
        incident["resolution_summary"] = (
            evidence.get("proposed_fix", "Approved and resolved") if evidence
            else "Approved and resolved"
        )
        # Write to memory bank for future matching
        await write_resolved_incident(incident_id, {
            "service": incident.get("service"),
            "causal_sig": incident.get("causal_sig"),
            "category": incident.get("category"),
            "outcome": evidence.get("sandbox_run", {}).get("action_type", "manual") if evidence else "manual",
            "resolved_in_min": 15,
        })

    elif decision == "rejected":
        incident["status"] = "rejected"

    elif decision == "revision_requested":
        # Send back to investigating for agents to re-run
        incident["status"] = "investigating"

    return {
        "approval_id": record["approval_id"],
        "incident_id": incident_id,
        "decision": decision,
        "new_status": incident["status"],
    }


@router.get("/history")
async def approval_history():
    """Get all approval records."""
    return sorted(approval_store, key=lambda x: x.get("created_at", ""), reverse=True)
