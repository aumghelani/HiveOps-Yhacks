from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

class SimilarIncident(BaseModel):
    """Stage 1 — headline only, no full resolution paths."""
    incident_id:     str
    title:           Optional[str]   = None
    service:         Optional[str]   = None
    causal_sig:      Optional[str]   = None
    outcome:         Optional[str]   = None
    resolved_in_min: Optional[int]   = None
    match_score:     Optional[int]   = None

class MemoryIncidentCreate(BaseModel):
    original_id:       Optional[str]               = None
    service:           str
    category:          Optional[str]               = None
    causal_sig:        Optional[str]               = None
    resolution_path:   Optional[list[str]]         = None
    resolved_in_min:   Optional[int]               = None
    outcome:           Optional[str]               = None
    playbook_summary:  Optional[str]               = None
    confidence_score:  Optional[float]             = None
    verification_steps: Optional[list[str]]        = None

class PlaybookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    playbook_id:  str
    causal_sig:   str
    category:     Optional[str]
    title:        str
    steps:        list[dict[str, Any]]
    success_rate: float
    used_count:   int

class SandboxRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    run_id:        str
    incident_id:   str
    action_type:   str
    before_state:  Optional[dict[str, Any]]
    after_state:   Optional[dict[str, Any]]
    diff_output:   Optional[str]
    health_check:  Optional[str]
    error_message: Optional[str]
    created_at:    datetime

class EvidencePackage(BaseModel):
    incident_id:       str
    root_cause:        str
    proposed_fix:      str
    confidence_score:  float
    risk_level:        str
    similar_incidents: list[SimilarIncident]
    sandbox_run:       Optional[SandboxRunRead]
    agent_logs:        list[Any]
    playbook:          Optional[PlaybookRead]
