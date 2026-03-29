// Audit log page — chronological agent activity with dot indicators
// Uses mock audit entries as base; real agent_logs from backend augment the display
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_AUDIT_ENTRIES } from '@/mock'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HivePulse } from '@/components/hive/HivePulse'
import { HivePattern } from '@/components/hive/HivePattern'
import { usePageTitle } from '@/hooks/usePageTitle'

const agentColors: Record<string, string> = {
  triage: 'var(--blue)',
  root_cause: 'var(--amber)',
  remediation: 'var(--success)',
  verification: '#a855f7',
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

export function AuditLogPage() {
  usePageTitle('Audit Log')
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <HiveLoader size="md" label="Loading audit trail..." />
      </div>
    )
  }

  const entries = MOCK_AUDIT_ENTRIES

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Audit Log</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 24 }}>
        {entries.length} agent actions logged
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => (
          <div key={entry.log_id} style={{
            borderRadius: 10, border: '1px solid var(--border)', padding: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: agentColors[entry.agent_type] ?? 'var(--text-muted)' }}>
                  {entry.agent_type}
                </span>
                {entry.step_name && (
                  <>
                    <span style={{ color: 'var(--border-strong)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{entry.step_name}</span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{timeAgo(entry.created_at)}</span>
                {i === 0 && <HivePulse variant="amber" size={5} />}
              </div>
            </div>

            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <Link
                  to={`/incident/${entry.incident_id}`}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)', textDecoration: 'none' }}
                >
                  {entry.incident_id}
                </Link>
                <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 8 }}>{entry.incident_title}</span>
                {entry.output_summary && (
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.4 }}>
                    {entry.output_summary}
                  </p>
                )}
              </div>
              {entry.tokens_used && (
                <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{entry.tokens_used} tok</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div style={{ position: 'relative', borderRadius: 12, border: '1px solid var(--border)', padding: 48, textAlign: 'center' }}>
          <HivePattern opacity={0.04} />
          <p style={{ position: 'relative', fontSize: 13, color: 'var(--text-muted)' }}>No agent activity logged</p>
        </div>
      )}
    </div>
  )
}
