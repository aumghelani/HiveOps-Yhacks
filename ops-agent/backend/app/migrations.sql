-- ────────────────────────────────────────────
-- Core incident tracking tables
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents (
    incident_id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title             TEXT NOT NULL,
    description       TEXT,
    service           TEXT NOT NULL,
    severity          TEXT NOT NULL CHECK (severity IN ('P1','P2','P3')),
    category          TEXT,
    causal_sig        TEXT,
    status            TEXT NOT NULL DEFAULT 'incoming'
                      CHECK (status IN (
                        'incoming','triage','investigating',
                        'awaiting_approval','approved','rejected','resolved'
                      )),
    source            TEXT DEFAULT 'manual',
    source_url        TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    resolved_at       TIMESTAMPTZ,
    resolution_summary TEXT
);

CREATE TABLE IF NOT EXISTS sub_tickets (
    sub_ticket_id     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    incident_id       TEXT NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
    agent_type        TEXT NOT NULL CHECK (agent_type IN (
                        'triage','root_cause','remediation','verification','reviewer_summary'
                      )),
    title             TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','running','completed','failed')),
    result_summary    TEXT,
    confidence_score  REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_logs (
    log_id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    incident_id       TEXT NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
    sub_ticket_id     TEXT REFERENCES sub_tickets(sub_ticket_id),
    agent_type        TEXT NOT NULL,
    model_used        TEXT,
    step_name         TEXT,
    input_summary     TEXT,
    output_summary    TEXT,
    tool_calls        JSONB,
    tokens_used       INTEGER,
    latency_ms        INTEGER,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sandbox_runs (
    run_id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    incident_id       TEXT NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
    action_type       TEXT NOT NULL,
    input_params      JSONB,
    before_state      JSONB,
    after_state       JSONB,
    diff_output       TEXT,
    health_check      TEXT CHECK (health_check IN ('pass','fail')),
    error_message     TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_records (
    approval_id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    incident_id       TEXT NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
    reviewer_id       TEXT DEFAULT 'demo-reviewer',
    decision          TEXT NOT NULL CHECK (decision IN (
                        'approved','rejected','revision_requested'
                      )),
    notes             TEXT,
    evidence_snapshot JSONB,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- Memory layer tables
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents_raw (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL,
    description       TEXT,
    service           TEXT,
    severity          TEXT,
    category          TEXT,
    causal_sig        TEXT,
    source_dataset    TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resolved_incidents (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    original_id       TEXT,
    service           TEXT NOT NULL,
    severity          TEXT,
    category          TEXT,
    causal_sig        TEXT,
    outcome           TEXT,
    resolved_in_min   INTEGER,
    confidence_score  REAL,
    resolution_path   JSONB,
    playbook_summary  TEXT,
    verification_steps JSONB,
    human_review_note TEXT,
    source_dataset    TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playbooks (
    playbook_id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    causal_sig        TEXT NOT NULL,
    category          TEXT,
    title             TEXT NOT NULL,
    steps             JSONB NOT NULL,
    success_rate      REAL DEFAULT 1.0,
    used_count        INTEGER DEFAULT 0,
    last_used_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_traces (
    trace_id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    incident_id       TEXT,
    agent_type        TEXT,
    tool_name         TEXT,
    tool_input        JSONB,
    tool_output       JSONB,
    duration_ms       INTEGER,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_resolved_service ON resolved_incidents(service);
CREATE INDEX IF NOT EXISTS idx_resolved_category ON resolved_incidents(category);
CREATE INDEX IF NOT EXISTS idx_resolved_causal_sig ON resolved_incidents(causal_sig);
CREATE INDEX IF NOT EXISTS idx_resolved_severity ON resolved_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_resolved_service_category ON resolved_incidents(service, category);
CREATE INDEX IF NOT EXISTS idx_incidents_raw_causal_sig ON incidents_raw(causal_sig);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_incident ON agent_logs(incident_id);

-- ────────────────────────────────────────────
-- Stage 1 similarity retrieval function
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_stage1_matches(
    p_service    TEXT,
    p_category   TEXT,
    p_causal_sig TEXT,
    p_severity   TEXT
)
RETURNS TABLE (
    original_id      TEXT,
    service          TEXT,
    category         TEXT,
    causal_sig       TEXT,
    severity         TEXT,
    outcome          TEXT,
    resolved_in_min  INTEGER,
    confidence_score REAL,
    playbook_summary TEXT,
    match_score      INTEGER
) LANGUAGE sql AS $$
    SELECT
        r.original_id,
        r.service,
        r.category,
        r.causal_sig,
        r.severity,
        r.outcome,
        r.resolved_in_min,
        r.confidence_score,
        r.playbook_summary,
        (CASE WHEN r.service    = p_service    THEN 40 ELSE 0 END +
         CASE WHEN r.category   = p_category   THEN 30 ELSE 0 END +
         CASE WHEN r.causal_sig = p_causal_sig THEN 25 ELSE 0 END +
         CASE WHEN r.severity   = p_severity   THEN 5  ELSE 0 END
        ) AS match_score
    FROM resolved_incidents r
    WHERE
        r.service    = p_service    OR
        r.category   = p_category   OR
        r.causal_sig = p_causal_sig
    ORDER BY match_score DESC, r.resolved_in_min ASC
    LIMIT 4;
$$;
