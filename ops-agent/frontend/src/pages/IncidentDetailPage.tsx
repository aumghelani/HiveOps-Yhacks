// Incident detail page — pipeline, sub-tasks, evidence dossier, agent activity
import { useParams, Link } from 'react-router-dom'
import { SubTasksPanel } from '@/components/incident/SubTasksPanel'
import { EvidenceDossier } from '@/components/incident/EvidenceDossier'
import { ConfidenceTrajectory } from '@/components/incident/ConfidenceTrajectory'
import { IncidentTimeline } from '@/components/incident/IncidentTimeline'
import { HivePulse } from '@/components/hive/HivePulse'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HiveProgress } from '@/components/hive/HiveProgress'
import { HiveDivider } from '@/components/hive/HiveDivider'
import { useDemo } from '@/components/DemoContext'
import { useIncident, useSubTickets, useEvidence, useAgentLogs } from '@/hooks/useIncidents'
import { useSubmitApproval } from '@/hooks/useApprovals'
import { useIncidentWebSocket } from '@/hooks/useIncidentWebSocket'
import { useIncidentStore } from '@/store/incidentStore'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  MOCK_INCIDENTS,
  MOCK_SUB_TICKETS,
  MOCK_SUB_TICKETS_3038,
  MOCK_AGENT_LOGS,
  MOCK_EVIDENCE_3038,
} from '@/mock'

const sevColor: Record<string, { bg: string; text: string }> = {
  P1: { bg: 'rgba(220,38,38,0.1)', text: 'var(--danger)' },
  P2: { bg: 'var(--amber-glow)', text: 'var(--amber)' },
  P3: { bg: 'rgba(37,99,235,0.1)', text: 'var(--blue)' },
}

function DecompositionPipeline({ status }: { status: string }) {
  const stages = ['Triage', 'Root Cause', 'Remediation', 'Verification', 'Approval']
  const stageMap: Record<string, number> = {
    incoming: 0, triage: 1, investigating: 2,
    awaiting_approval: 4, approved: 5, rejected: 5, resolved: 5,
  }
  const active = stageMap[status] ?? 0

  const stageStyle = (i: number): React.CSSProperties => {
    const done = i < active
    const current = i === active
    return {
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 500,
      border: `1px solid ${done ? 'var(--success)' : current ? 'var(--amber)' : 'var(--border)'}`,
      background: done ? 'rgba(22,163,74,0.08)' : current ? 'var(--amber-glow)' : 'transparent',
      color: done ? 'var(--success)' : current ? 'var(--amber)' : 'var(--text-faint)',
    }
  }

  return (
    <>
      <div className="pipeline-horizontal" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {stages.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={stageStyle(i)}>
              {i < active && <HivePulse variant="green" pulse={false} size={5} />}
              {i === active && <HivePulse variant="amber" size={5} />}
              {s}
            </div>
            {i < stages.length - 1 && (
              <span style={{ fontSize: 12, color: i < active ? 'var(--success)' : 'var(--border)' }}>→</span>
            )}
          </div>
        ))}
      </div>
      <div className="pipeline-vertical" style={{ display: 'none', flexDirection: 'column', gap: 0 }}>
        {stages.map((s, i) => (
          <div key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: i < active ? 'rgba(22,163,74,0.1)' : i === active ? 'var(--amber-glow)' : 'var(--elevated)',
              }}>
                {i < active && <HivePulse variant="green" pulse={false} size={5} />}
                {i === active && <HivePulse variant="amber" size={5} />}
                {i > active && <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{i + 1}</span>}
              </div>
              <span style={{
                fontSize: 13,
                color: i < active ? 'var(--success)' : i === active ? 'var(--amber)' : 'var(--text-faint)',
                fontWeight: i === active ? 600 : 400,
              }}>{s}</span>
            </div>
            {i < stages.length - 1 && (
              <div style={{ width: 1, height: 16, marginLeft: 12, background: i < active ? 'var(--success)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { advanceToPhase } = useDemo()
  const { triggerCelebration } = useIncidentStore()
  usePageTitle(id ? `Incident ${id}` : 'Incident')

  // Real data hooks with polling
  const { data: liveIncident, isLoading, isError } = useIncident(id)
  const { data: liveSubTickets = [] } = useSubTickets(id)
  const { data: liveLogs = [] } = useAgentLogs(id)
  const submitApproval = useSubmitApproval()

  // WebSocket for live sub-ticket updates
  useIncidentWebSocket(id)

  // Fallback to mock data when backend is unavailable
  const mockIncident = MOCK_INCIDENTS.find(i => i.incident_id === id)
  const incident = isError ? mockIncident : liveIncident

  const sub_tickets = isError
    ? (id === 'INC-3041' ? MOCK_SUB_TICKETS : id === 'INC-3038' ? MOCK_SUB_TICKETS_3038 : [])
    : liveSubTickets

  const logs = isError
    ? MOCK_AGENT_LOGS.filter(l => l.incident_id === id)
    : liveLogs

  // Evidence — only fetch when awaiting_approval
  const showDossier = incident?.status === 'awaiting_approval'
  const { data: liveEvidence } = useEvidence(id, showDossier && !isError)
  const evidence = isError
    ? (id === 'INC-3038' ? MOCK_EVIDENCE_3038 : null)
    : liveEvidence

  if (isLoading && !isError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 12 }}>
      <HiveLoader size="lg" label="Loading incident..." />
    </div>
  )

  if (!incident) {
    return (
      <div style={{ padding: 24 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--amber)', textDecoration: 'none' }}>← Back</Link>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>Incident not found.</p>
      </div>
    )
  }

  const sev = sevColor[incident.severity] ?? { bg: 'transparent', text: 'var(--text-muted)' }

  const handleApprove = () => {
    if (!id) return
    submitApproval.mutate({ incidentId: id, decision: 'approved' }, {
      onSuccess: () => {
        advanceToPhase(4)
        triggerCelebration()
      },
    })
  }

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <Link to="/" style={{ fontSize: 13, color: 'var(--amber)', textDecoration: 'none' }}>← All Incidents</Link>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{
          borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700,
          background: sev.bg, color: sev.text,
        }}>
          {incident.severity}
        </span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-faint)' }}>
              {incident.incident_id}
            </span>
            <HivePulse
              variant={incident.status === 'resolved' ? 'green' : 'amber'}
              pulse={incident.status !== 'resolved'}
              size={5}
            />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
            {incident.title}
          </h1>
          {incident.description && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              {incident.description}
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
            {incident.service} · {incident.source} · {incident.category}
          </p>
        </div>
      </div>

      <HiveDivider />

      <div>
        <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 8 }}>
          Decomposition Pipeline
        </h3>
        <DecompositionPipeline status={incident.status} />
      </div>

      <HiveDivider />

      <SubTasksPanel sub_tickets={sub_tickets} />

      <HiveDivider />

      {/* Confidence trajectory sparkline */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 8 }}>
        <ConfidenceTrajectory subTickets={sub_tickets} />
      </div>

      <HiveDivider />

      {/* Live Agent Activity — Slack-style timeline */}
      {logs.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Live agent activity
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
            <IncidentTimeline logs={logs} />
          </div>
        </div>
      )}

      {showDossier && evidence && (
        <>
          <HiveDivider />
          <EvidenceDossier
            evidence={evidence}
            onApprove={handleApprove}
            onReject={(reason) => id && submitApproval.mutate({ incidentId: id, decision: 'rejected', notes: reason })}
            onRevise={(notes) => id && submitApproval.mutate({ incidentId: id, decision: 'revision_requested', notes })}
          />
        </>
      )}

      {incident.resolution_summary && (
        <>
          <HiveDivider />
          <div style={{ borderRadius: 10, border: '1px solid rgba(22,163,74,0.2)', background: 'rgba(22,163,74,0.04)', padding: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--success)', marginBottom: 8 }}>
              Resolution
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {incident.resolution_summary}
            </p>
          </div>
        </>
      )}

      {sub_tickets.some(t => t.confidence_score != null) && (
        <>
          <HiveDivider />
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 8 }}>
              Overall Confidence
            </h3>
            {(() => {
              const scores = sub_tickets.filter(t => t.confidence_score != null).map(t => t.confidence_score!)
              const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
              return <HiveProgress value={avg} label={`${Math.round(avg * 100)}% avg confidence`} />
            })()}
          </div>
        </>
      )}
    </div>
  )
}
