// Incidents page — Gmail-style split view on desktop, full-page navigation on mobile
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_INCIDENTS } from '@/mock'
import { useIncidents } from '@/hooks/useIncidents'
import { HivePulse } from '@/components/hive/HivePulse'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HiveDivider } from '@/components/hive/HiveDivider'
import { HivePattern } from '@/components/hive/HivePattern'
import { DemoTriggerPanel } from '@/components/layout/DemoTriggerPanel'
import { IncidentDetailEmbed } from '@/components/incident/IncidentDetailEmbed'
import { usePageTitle } from '@/hooks/usePageTitle'
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

// Status → left border color for always-visible highlight
const statusBorderColor: Record<string, string> = {
  resolved: 'var(--success)',
  awaiting_approval: 'var(--warning)',
  rejected: 'var(--danger)',
  investigating: 'var(--blue)',
  triage: 'var(--amber)',
  incoming: 'var(--danger)',
  approved: 'var(--success)',
}

// Status → subtle background tint
const statusBgTint: Record<string, string> = {
  resolved: 'rgba(22,163,74,0.04)',
  awaiting_approval: 'rgba(245,158,11,0.05)',
  rejected: 'rgba(220,38,38,0.04)',
  investigating: 'rgba(59,130,246,0.04)',
  triage: 'rgba(232,160,32,0.03)',
  incoming: 'rgba(220,38,38,0.03)',
  approved: 'rgba(22,163,74,0.03)',
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

function IncidentTile({
  incident, delay, isSelected, onClick,
}: {
  incident: Incident; delay: number; isSelected: boolean; onClick: () => void
}) {
  const sev = severityColor[incident.severity]
  const borderColor = statusBorderColor[incident.status] ?? 'var(--border)'
  const bgTint = statusBgTint[incident.status] ?? 'transparent'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px var(--amber-glow)', transition: { duration: 0.12 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        borderRadius: 10,
        border: `1px solid ${isSelected ? 'var(--amber)' : 'var(--border)'}`,
        borderLeft: `3px solid ${borderColor}`,
        padding: '14px 16px',
        cursor: 'pointer',
        background: isSelected ? 'var(--amber-glow)' : bgTint,
        transition: 'background 200ms, border-color 200ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          <span style={{ flexShrink: 0, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700, background: sev.bg, color: sev.text }}>
            {incident.severity}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
                {incident.incident_id}
              </span>
              <HivePulse variant={statusPulse[incident.status]} pulse={incident.status !== 'resolved' && incident.status !== 'rejected'} size={5} />
              <span style={{
                fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
                background: `${borderColor}18`, color: borderColor,
              }}>
                {statusLabel[incident.status]}
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.3 }}>
              {incident.title}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {incident.service} · {timeAgo(incident.created_at)}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{incident.source}</span>
      </div>
    </motion.div>
  )
}

export function IncidentsPage() {
  usePageTitle('Incidents')
  const { data: liveData = [], isLoading, isError } = useIncidents()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

  const incidents = isError ? MOCK_INCIDENTS : liveData
  const active = incidents.filter(i => i.status !== 'resolved')
  const resolved = incidents.filter(i => i.status === 'resolved')

  if (isLoading && !isError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <HiveLoader size="md" label="Loading incidents..." />
    </div>
  )

  const handleTileClick = (id: string) => {
    // On mobile, navigate to full page. On desktop, open split view.
    if (window.innerWidth < 768) {
      navigate(`/incident/${id}`)
    } else {
      setSelectedId(prev => prev === id ? null : id)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: incident list */}
      <div style={{
        width: selectedId ? '380px' : '100%',
        minWidth: selectedId ? 340 : undefined,
        maxWidth: selectedId ? 420 : 860,
        transition: 'width 300ms ease, min-width 300ms ease',
        overflowY: 'auto',
        padding: 24,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Incidents</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {active.length} active · {resolved.length} resolved
            </p>
          </div>
          <DemoTriggerPanel />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {active.map((inc, i) => (
            <IncidentTile
              key={inc.incident_id}
              incident={inc}
              delay={i * 0.04}
              isSelected={selectedId === inc.incident_id}
              onClick={() => handleTileClick(inc.incident_id)}
            />
          ))}
        </div>

        {active.length > 0 && resolved.length > 0 && <HiveDivider />}

        {resolved.length > 0 && (
          <>
            <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 6 }}>
              Resolved
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {resolved.map((inc, i) => (
                <IncidentTile
                  key={inc.incident_id}
                  incident={inc}
                  delay={(active.length + i) * 0.04}
                  isSelected={selectedId === inc.incident_id}
                  onClick={() => handleTileClick(inc.incident_id)}
                />
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

      {/* Right: detail panel (desktop only, split view) */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            key={selectedId}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              flex: 1, overflow: 'hidden', borderLeft: '1px solid var(--border)',
              position: 'relative', background: 'var(--bg)',
            }}
          >
            {/* Hive dot burst on open */}
            <HiveBurstOverlay />

            {/* Close button */}
            <motion.button
              onClick={() => setSelectedId(null)}
              whileHover={{ scale: 1.1, background: 'var(--elevated)' }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10,
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-faint)', fontSize: 16, lineHeight: 1,
              }}
            >
              ×
            </motion.button>

            {/* Full-page link */}
            <Link
              to={`/incident/${selectedId}`}
              style={{
                position: 'absolute', top: 18, right: 56, zIndex: 10,
                fontSize: 11, color: 'var(--amber)', textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Open full ↗
            </Link>

            <div style={{ overflowY: 'auto', height: '100%' }}>
              <IncidentDetailEmbed incidentId={selectedId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Animated dot burst that plays once when the detail panel opens
function HiveBurstOverlay() {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 12
    const distance = 60 + Math.random() * 40
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 2 + Math.random() * 3,
      delay: i * 0.02,
    }
  })

  return (
    <div style={{
      position: 'absolute', top: '50%', left: 0, width: 0, height: 0,
      zIndex: 5, pointerEvents: 'none',
    }}>
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 0.6, scale: 1 }}
          animate={{ x: dot.x, y: dot.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.6, delay: dot.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute', width: dot.size, height: dot.size,
            borderRadius: '50%', background: 'var(--amber)',
          }}
        />
      ))}
    </div>
  )
}
