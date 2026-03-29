export type Severity = 'P1' | 'P2' | 'P3'

export type IncidentStatus =
  | 'incoming' | 'triage' | 'investigating'
  | 'awaiting_approval' | 'approved' | 'rejected' | 'resolved'

export type ApprovalDecision = 'approved' | 'rejected' | 'revision_requested'

export type AgentType = 'triage' | 'root_cause' | 'remediation' | 'verification'

export type SubTicketStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface Incident {
  incident_id: string
  title: string
  description: string | null
  service: string
  severity: Severity
  category: string | null
  causal_sig: string | null
  status: IncidentStatus
  source: string
  source_url: string | null
  created_at: string
  resolved_at: string | null
  resolution_summary: string | null
}

export interface SubTicket {
  sub_ticket_id: string
  incident_id: string
  agent_type: AgentType
  title: string
  status: SubTicketStatus
  result_summary: string | null
  confidence_score: number | null
  created_at: string
  completed_at: string | null
}

export interface AgentLog {
  log_id: string
  incident_id: string
  sub_ticket_id: string | null
  agent_type: AgentType
  step_name: string | null
  input_summary: string | null
  output_summary: string | null
  tool_calls: Record<string, unknown>[] | null
  tokens_used: number | null
  created_at: string
}

export interface SandboxRun {
  run_id: string
  incident_id: string
  action_type: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  diff_output: string | null
  health_check: 'pass' | 'fail' | null
  error_message: string | null
  created_at: string
}

export interface SimilarIncident {
  incident_id: string
  title: string
  causal_sig: string | null
  outcome: string | null
  resolved_in_min: number | null
}

export interface PlaybookStep {
  step: number
  action: string
  command: string | null
}

export interface PlaybookFull {
  playbook_id: string
  category: string
  causal_sig: string
  title: string
  steps: PlaybookStep[]
  success_rate: number
  used_count: number
  last_used_at: string
}

export interface EvidencePackage {
  incident_id: string
  root_cause: string
  proposed_fix: string
  confidence_score: number
  risk_level: 'low' | 'medium' | 'high'
  similar_incidents: SimilarIncident[]
  sandbox_run: SandboxRun | null
  agent_logs: AgentLog[]
  playbook: PlaybookFull | null
}

export interface PatternFamily {
  id: string
  causal_sig: string
  label: string
  incident_count: number
  avg_resolution_min: number
  success_rate: number
  recent_resolution_times: number[]
  top_services: string[]
}

export interface AuditEntry {
  log_id: string
  incident_id: string
  incident_title: string
  agent_type: AgentType
  step_name: string | null
  output_summary: string | null
  tokens_used: number | null
  created_at: string
}
