from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

class AgentLogCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    incident_id:    str
    sub_ticket_id:  Optional[str]               = None
    agent_type:     str
    model_used:     Optional[str]               = None
    step_name:      Optional[str]               = None
    input_summary:  Optional[str]               = None
    output_summary: Optional[str]               = None
    tool_calls:     Optional[list[dict[str, Any]]] = None
    tokens_used:    Optional[int]               = None
    latency_ms:     Optional[int]               = None

class AgentLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    log_id:         str
    incident_id:    str
    sub_ticket_id:  Optional[str]
    agent_type:     str
    model_used:     Optional[str]
    step_name:      Optional[str]
    input_summary:  Optional[str]
    output_summary: Optional[str]
    tool_calls:     Optional[list[dict[str, Any]]]
    tokens_used:    Optional[int]
    latency_ms:     Optional[int]
    created_at:     datetime
