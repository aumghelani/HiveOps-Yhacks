// Incident list page — shows all active and resolved incidents
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MOCK_INCIDENTS } from '@/mock'
import { useIncidents } from '@/hooks/useIncidents'
import { HivePulse } from '@/components/hive/HivePulse'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HiveHoverDots } from '@/components/hive/HiveHoverDots'
import { HiveDivider } from '@/components/hive/HiveDivider'
import { HivePattern } from '@/components/hive/HivePattern'
import { DemoTriggerPanel } from '@/components/layout/DemoTriggerPanel'
import type { Incident, Severity, IncidentStatus } from '@/types'

const severityColor: Record<Severity, { bg: string; text: string }> = {
  P1: { bg: 'rgba(220,38,38,0.1)', text: 'var(--danger)' },
  P2: { bg: 'var(--amber-glow)', text: 'var(--amber)' },
  P3: { bg: 'rgba(37,99,235,0.1)', text: 'var(--blue)' },
}

const statusLabel: Record<IncidentStatus, string> = {
  incoming: 'Incoming', triage: 'Triage', investigating: 'Investigating',
  awaiting_approval: 'Awaiting Approval', approved: 'Approved',
  rejected: 'Rejected', resolved: 'Resolved',
}

const statusPulse: Record<IncidentStatus, 'red' | 'amber' | 'blue' | 'green' | 'gray'> = {
  incoming: 'red', triage: 'amber', investigating: 'blue',
  awaiting_approval: 'amber', approved: 'green', rejected: 'gray', resolved: 'green',
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

function IncidentRow({ incident, delay }: { incident: Incident; delay: number }) {
  const isActive = incident.status !== 'resolved' && incident.status !== 'rejected'
  const sev = severityColor[incident.severity]

  return (
    <HiveHoverDots pattern="corner" dotCount={4} dotSize={2.5}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.2, ease: 'easeOut' }}
        whileHover={{ y: -3, boxShadow: '0 8px 24px var(--amber-glow)', transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          to={`/incident/${incident.incident_id}`}
          style={{
            display: 'block', borderRadius: 10, border: '1px solid var(--border)',
            padding: 16, textDecoration: 'none', color: 'inherit',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
              <span style={{ flexShrink: 0, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700, background: sev.bg, color: sev.text }}>
                {incident.severity}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
                    {incident.incident_id}
                  </span>
                  <HivePulse variant={statusPulse[incident.status]} pulse={isActive} size={5} />
                  <span style={{ fontSize: 10, color: 'var(--text-faint)', background: 'var(--elevated)', padding: '1px 6px', borderRadius: 4 }}>
                    {statusLabel[incident.status]}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginTop: 4 }}>
                  {incident.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {incident.service} · {timeAgo(incident.created_at)}
                </p>
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0 }}>{incident.source}</span>
          </div>
        </Link>
      </motion.div>
    </HiveHoverDots>
  )
}

export function IncidentsPage() {
  const { data: liveData = [], isLoading, isError } = useIncidents()

  const incidents = isError ? MOCK_INCIDENTS : liveData
  const active = incidents.filter(i => i.status !== 'resolved')
  const resolved = incidents.filter(i => i.status === 'resolved')

  if (isLoading && !isError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <HiveLoader size="md" label="Loading incidents..." />
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Incidents</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {active.length} active · {resolved.length} resolved
          </p>
        </div>
        <DemoTriggerPanel />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.map((inc, i) => (
          <IncidentRow key={inc.incident_id} incident={inc} delay={i * 0.05} />
        ))}
      </div>

      {active.length > 0 && resolved.length > 0 && <HiveDivider />}

      {resolved.length > 0 && (
        <>
          <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 8 }}>
            Resolved
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resolved.map((inc, i) => (
              <IncidentRow key={inc.incident_id} incident={inc} delay={(active.length + i) * 0.05} />
            ))}
          </div>
        </>
      )}

      {incidents.length === 0 && (
        <div style={{ position: 'relative', borderRadius: 12, border: '1px solid var(--border)', padding: 48, textAlign: 'center' }}>
          <HivePattern opacity={0.04} />
          <p style={{ position: 'relative', fontSize: 13, color: 'var(--text-muted)' }}>No incidents reported</p>
        </div>
      )}
    </div>
  )
}
