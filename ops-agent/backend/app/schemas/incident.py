from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class Severity(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"

class IncidentStatus(str, Enum):
    INCOMING          = "incoming"
    TRIAGE            = "triage"
    INVESTIGATING     = "investigating"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED          = "approved"
    REJECTED          = "rejected"
    RESOLVED          = "resolved"

class AgentType(str, Enum):
    TRIAGE           = "triage"
    ROOT_CAUSE       = "root_cause"
    REMEDIATION      = "remediation"
    VERIFICATION     = "verification"
    REVIEWER_SUMMARY = "reviewer_summary"

class SubTicketStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"

class IncidentCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    service:     str
    severity:    Severity
    source:      str = "manual"
    source_url:  Optional[str] = None

class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    incident_id:        str
    title:              str
    description:        Optional[str]
    service:            str
    severity:           Severity
    category:           Optional[str]
    causal_sig:         Optional[str]
    status:             IncidentStatus
    source:             str
    source_url:         Optional[str]
    created_at:         datetime
    resolved_at:        Optional[datetime]
    resolution_summary: Optional[str]

class IncidentUpdate(BaseModel):
    status:             Optional[IncidentStatus] = None
    causal_sig:         Optional[str]            = None
    category:           Optional[str]            = None
    resolution_summary: Optional[str]            = None
    resolved_at:        Optional[datetime]       = None

class SubTicketCreate(BaseModel):
    incident_id: str
    agent_type:  AgentType
    title:       str

class SubTicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    sub_ticket_id:    str
    incident_id:      str
    agent_type:       AgentType
    title:            str
    status:           SubTicketStatus
    result_summary:   Optional[str]
    confidence_score: Optional[float]
    created_at:       datetime
    completed_at:     Optional[datetime]

class SubTicketUpdate(BaseModel):
    status:           SubTicketStatus
    result_summary:   Optional[str]   = None
    confidence_score: Optional[float] = None
    completed_at:     Optional[datetime] = None
