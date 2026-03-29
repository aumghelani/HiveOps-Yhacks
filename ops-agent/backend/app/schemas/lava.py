from typing import Optional
from pydantic import BaseModel, Field

class OrchestratorPlan(BaseModel):
    incident_summary:    str
    priority_service:    str
    causal_sig_guess:    Optional[str]  = None
    severity_confirmed:  str
    agent_sequence:      list[str]
    initial_hypothesis:  str
    memory_query:        dict[str, str]

class TriageResult(BaseModel):
    category:     str
    causal_sig:   str
    confidence:   float = Field(ge=0.0, le=1.0)
    reasoning:    str
    severity:     str

class RootCauseResult(BaseModel):
    root_cause:         str
    evidence:           list[str]
    confidence:         float = Field(ge=0.0, le=1.0)
    needs_more_context: bool  = False
    context_request:    Optional[str] = None

class RemediationPlan(BaseModel):
    proposed_fix: str
    action_type:  str
    steps:        list[str]
    risk_level:   str
    playbook_id:  Optional[str] = None
    confidence:   float = Field(ge=0.0, le=1.0)

class VerificationResult(BaseModel):
    verdict:              str
    summary:              str
    risk_factors:         list[str]
    ready_for_human_review: bool

class ReviewerSummary(BaseModel):
    executive_summary:    str
    root_cause:           str
    proposed_fix:         str
    confidence_score:     float
    risk_level:           str
    key_evidence:         list[str]
    similar_incidents:    list[str]
    approval_recommendation: str
