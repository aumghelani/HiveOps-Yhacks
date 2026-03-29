// Embeddable incident detail — used inside the split view panel
// Reuses the same hooks and components as the full IncidentDetailPage
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

// Status border colors
const statusBorder: Record<string, string> = {
  resolved: 'var(--success)', awaiting_approval: 'var(--warning)',
  rejected: 'var(--danger)', investigating: 'var(--blue)',
  triage: 'var(--amber)', incoming: 'var(--danger)', approved: 'var(--success)',
}

function DecompositionPipeline({ status }: { status: string }) {
  const stages = ['Triage', 'Root Cause', 'Remediation', 'Verification', 'Approval']
  const stageMap: Record<string, number> = {
    incoming: 0, triage: 1, investigating: 2,
    awaiting_approval: 4, approved: 5, rejected: 5, resolved: 5,
  }
  const active = stageMap[status] ?? 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {stages.map((s, i) => {
        const done = i < active
        const current = i === active
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px',
              borderRadius: 16, fontSize: 10, fontWeight: 500,
              border: `1px solid ${done ? 'var(--success)' : current ? 'var(--amber)' : 'var(--border)'}`,
              background: done ? 'rgba(22,163,74,0.08)' : current ? 'var(--amber-glow)' : 'transparent',
              color: done ? 'var(--success)' : current ? 'var(--amber)' : 'var(--text-faint)',
            }}>
              {done && <HivePulse variant="green" pulse={false} size={4} />}
              {current && <HivePulse variant="amber" size={4} />}
              {s}
            </div>
            {i < stages.length - 1 && (
              <span style={{ fontSize: 10, color: done ? 'var(--success)' : 'var(--border)' }}>→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function IncidentDetailEmbed({ incidentId }: { incidentId: string }) {
  const { advanceToPhase } = useDemo()
  const { triggerCelebration } = useIncidentStore()

  const { data: liveIncident, isLoading, isError } = useIncident(incidentId)
  const { data: liveSubTickets = [] } = useSubTickets(incidentId)
  const { data: liveLogs = [] } = useAgentLogs(incidentId)
  const submitApproval = useSubmitApproval()

  useIncidentWebSocket(incidentId)

  const mockIncident = MOCK_INCIDENTS.find(i => i.incident_id === incidentId)
  const incident = isError ? mockIncident : liveIncident

  const sub_tickets = isError
    ? (incidentId === 'INC-3041' ? MOCK_SUB_TICKETS : incidentId === 'INC-3038' ? MOCK_SUB_TICKETS_3038 : [])
    : liveSubTickets

  const logs = isError
    ? MOCK_AGENT_LOGS.filter(l => l.incident_id === incidentId)
    : liveLogs

  const showDossier = incident?.status === 'awaiting_approval'
  const { data: liveEvidence } = useEvidence(incidentId, showDossier && !isError)
  const evidence = isError
    ? (incidentId === 'INC-3038' ? MOCK_EVIDENCE_3038 : null)
    : liveEvidence

  if (isLoading && !isError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <HiveLoader size="md" label="Loading incident..." />
    </div>
  )

  if (!incident) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Incident not found.</div>
    )
  }

  const sev = sevColor[incident.severity] ?? { bg: 'transparent', text: 'var(--text-muted)' }
  const border = statusBorder[incident.status] ?? 'var(--border)'

  const handleApprove = () => {
    submitApproval.mutate({ incidentId, decision: 'approved' }, {
      onSuccess: () => { advanceToPhase(4); triggerCelebration() },
    })
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Header with status color accent */}
      <div style={{
        background: 'var(--surface)', border: `1px solid var(--border)`,
        borderLeft: `3px solid ${border}`, borderRadius: '0 10px 10px 0',
        padding: '16px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 700, background: sev.bg, color: sev.text }}>
            {incident.severity}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
            {incident.incident_id}
          </span>
          <HivePulse
            variant={incident.status === 'resolved' ? 'green' : incident.status === 'rejected' ? 'red' : 'amber'}
            pulse={incident.status !== 'resolved' && incident.status !== 'rejected'}
            size={5}
          />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
          {incident.title}
        </h2>
        {incident.description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
            {incident.description}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {[incident.service, incident.source, incident.category, incident.causal_sig].filter(Boolean).map((tag, i) => (
            <span key={i} style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 4,
              background: 'var(--elevated)', color: 'var(--text-faint)',
              fontFamily: 'var(--font-mono)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <DecompositionPipeline status={incident.status} />

      <HiveDivider />

      {/* Confidence trajectory */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
        <ConfidenceTrajectory subTickets={sub_tickets} />
      </div>

      <HiveDivider />

      <SubTasksPanel sub_tickets={sub_tickets} />

      <HiveDivider />

      {/* Agent timeline */}
      {logs.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Agent activity
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
            <IncidentTimeline logs={logs} />
          </div>
        </div>
      )}

      {/* Evidence dossier */}
      {showDossier && evidence && (
        <>
          <HiveDivider />
          <EvidenceDossier
            evidence={evidence}
            onApprove={handleApprove}
            onReject={(reason) => submitApproval.mutate({ incidentId, decision: 'rejected', notes: reason })}
            onRevise={(notes) => submitApproval.mutate({ incidentId, decision: 'revision_requested', notes })}
          />
        </>
      )}

      {/* Resolution */}
      {incident.resolution_summary && (
        <>
          <HiveDivider />
          <div style={{ borderRadius: 10, border: '1px solid rgba(22,163,74,0.2)', background: 'rgba(22,163,74,0.04)', padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--success)', marginBottom: 6 }}>
              Resolution
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {incident.resolution_summary}
            </p>
          </div>
        </>
      )}

      {/* Overall confidence */}
      {sub_tickets.some(t => t.confidence_score != null) && (
        <>
          <HiveDivider />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
              Overall Confidence
            </div>
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
