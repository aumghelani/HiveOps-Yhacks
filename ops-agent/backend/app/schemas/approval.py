from enum import Enum
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

class ApprovalDecision(str, Enum):
    APPROVED           = "approved"
    REJECTED           = "rejected"
    REVISION_REQUESTED = "revision_requested"

class ApprovalCreate(BaseModel):
    incident_id:  str
    reviewer_id:  Optional[str] = "demo-reviewer"
    decision:     ApprovalDecision
    notes:        Optional[str] = None

class ApprovalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    approval_id:       str
    incident_id:       str
    reviewer_id:       Optional[str]
    decision:          ApprovalDecision
    notes:             Optional[str]
    evidence_snapshot: Optional[dict[str, Any]]
    created_at:        datetime
