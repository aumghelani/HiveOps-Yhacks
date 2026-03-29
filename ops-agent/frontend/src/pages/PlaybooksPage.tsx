// Playbooks page — remediation playbook catalog
// Uses mock playbooks; backend /memory/playbooks route can be wired here later
import { useState, useEffect } from 'react'
import { MOCK_PLAYBOOKS } from '@/mock'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HiveProgress } from '@/components/hive/HiveProgress'
import { HivePattern } from '@/components/hive/HivePattern'
import type { PlaybookFull } from '@/types'

function PlaybookCard({ pb }: { pb: PlaybookFull }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{pb.title}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{pb.causal_sig}</span> · {pb.category}
          </p>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Used {pb.used_count}x</span>
      </div>

      <div style={{ marginTop: 12 }}>
        <HiveProgress value={pb.success_rate} label={`${Math.round(pb.success_rate * 100)}% success rate`} size="sm" />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginTop: 12, background: 'none', border: 'none',
          color: 'var(--amber)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        {expanded ? 'Hide steps' : `View ${pb.steps.length} steps`}
      </button>

      {expanded && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pb.steps.map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 8 }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--elevated)', fontFamily: 'var(--font-mono)',
                fontSize: 10, color: 'var(--text-faint)',
              }}>
                {s.step}
              </span>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.action}</p>
                {s.command && (
                  <code style={{
                    display: 'block', marginTop: 2, fontSize: 11,
                    color: 'var(--amber)', fontFamily: 'var(--font-mono)',
                  }}>
                    {s.command}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PlaybooksPage() {
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <HiveLoader size="md" label="Loading playbooks..." />
      </div>
    )
  }

  const playbooks = MOCK_PLAYBOOKS

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Playbooks</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 24 }}>
        {playbooks.length} remediation playbooks
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {playbooks.map(pb => (
          <PlaybookCard key={pb.playbook_id} pb={pb} />
        ))}
      </div>

      {playbooks.length === 0 && (
        <div style={{ position: 'relative', borderRadius: 12, border: '1px solid var(--border)', padding: 48, textAlign: 'center' }}>
          <HivePattern opacity={0.04} />
          <p style={{ position: 'relative', fontSize: 13, color: 'var(--text-muted)' }}>No playbooks configured</p>
        </div>
      )}
    </div>
  )
}
