# Database schema reference

## Status
Complete — all tables defined in backend/app/migrations.sql

## Core Tables

### incidents
Primary incident tracking. Created on webhook intake.
- `incident_id` TEXT PK (uuid)
- `title`, `description`, `service`, `severity` (P1/P2/P3)
- `category`, `causal_sig` — set by triage agent
- `status` — incoming → triage → investigating → awaiting_approval → approved/rejected → resolved
- `source`, `source_url`, `created_at`, `resolved_at`, `resolution_summary`

### sub_tickets
Agent tasks, one per agent per incident. Created by orchestrator.
- `sub_ticket_id` TEXT PK, `incident_id` FK
- `agent_type` — triage/root_cause/remediation/verification/reviewer_summary
- `status` — pending/running/completed/failed
- `result_summary`, `confidence_score` (0-1)

### agent_logs
Append-only audit trail of every agent step.
- `log_id` TEXT PK, `incident_id` FK, `sub_ticket_id` FK
- `agent_type`, `model_used`, `step_name`
- `input_summary`, `output_summary`, `tool_calls` (JSONB)
- `tokens_used`, `latency_ms`

### sandbox_runs
Mocked sandbox execution results.
- `run_id` TEXT PK, `incident_id` FK
- `action_type`, `before_state`, `after_state` (JSONB)
- `diff_output`, `health_check` (pass/fail)

### approval_records
Human reviewer decisions.
- `approval_id` TEXT PK, `incident_id` FK
- `reviewer_id`, `decision` (approved/rejected/revision_requested)
- `notes`, `evidence_snapshot` (JSONB)

## Memory Layer Tables

### incidents_raw
Raw incidents from all sources. Used by Hex for analytics.

### resolved_incidents
The memory bank. Fully resolved incidents with resolution paths.
- `causal_sig`, `outcome`, `resolved_in_min`, `confidence_score`
- `resolution_path` (JSONB), `playbook_summary`
- Indexed on: service, category, causal_sig, severity

### playbooks
Reusable fix recipes distilled from resolved_incidents.
- `causal_sig`, `category`, `title`, `steps` (JSONB)
- `success_rate`, `used_count`

### agent_traces
Optional tool call traces for debugging.

## Key Function

### get_stage1_matches(service, category, causal_sig, severity)
Returns top 4 similar resolved incidents with weighted match_score.
Weights: service=40, category=30, causal_sig=25, severity=5.

## In-Memory Stores (Demo Mode)
When Supabase credentials are not set, the backend uses in-memory Python dicts:
- `incidents_store` — dict[incident_id, incident_dict]
- `sub_tickets_store` — dict[sub_ticket_id, ticket_dict]
- `agent_logs_store` — list[log_dict]
- `sandbox_runs_store` — list[run_dict]
- `approval_store` — list[approval_dict]
- `pipeline_results` — dict[incident_id, agent_outputs]

These are populated by the pipeline when an incident is triggered via webhook.
