// Memory Bank page — pattern families with dot-based progress
// Uses mock pattern families (pre-seeded visual data); resolved incidents could come from API in future
import { useState, useEffect } from 'react'
import { MOCK_PATTERN_FAMILIES } from '@/mock'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HiveProgress } from '@/components/hive/HiveProgress'
import { HivePattern } from '@/components/hive/HivePattern'

export function MemoryBankPage() {
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <HiveLoader size="md" label="Querying pattern memory..." />
      </div>
    )
  }

  const patterns = MOCK_PATTERN_FAMILIES

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Memory Bank</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {patterns.length} pattern families · {patterns.reduce((s, p) => s + p.incident_count, 0)} incidents indexed
          </p>
        </div>
        <HiveProgress value={0.8} total={10} label="80% patterns indexed" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {patterns.map(pf => (
          <div key={pf.id} style={{
            borderRadius: 10, border: '1px solid var(--border)', padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{pf.label}</h2>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{pf.causal_sig}</p>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{pf.incident_count} incidents</span>
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 24 }}>
              <HiveProgress value={pf.success_rate} label={`${Math.round(pf.success_rate * 100)}% success`} size="sm" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Avg resolution: <strong style={{ color: 'var(--text-primary)' }}>{pf.avg_resolution_min}m</strong>
              </span>
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              {pf.top_services.map(s => (
                <span key={s} style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 11,
                  background: 'var(--elevated)', color: 'var(--text-faint)',
                }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Mini sparkline */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-end', gap: 2, height: 20 }}>
              {pf.recent_resolution_times.map((t, i) => (
                <div key={i} style={{
                  width: 6, borderRadius: '2px 2px 0 0',
                  background: 'var(--amber)', opacity: 0.4,
                  height: `${Math.max(15, (t / 60) * 100)}%`,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {patterns.length === 0 && (
        <div style={{ position: 'relative', borderRadius: 12, border: '1px solid var(--border)', padding: 48, textAlign: 'center' }}>
          <HivePattern opacity={0.04} />
          <p style={{ position: 'relative', fontSize: 13, color: 'var(--text-muted)' }}>No patterns in memory bank</p>
        </div>
      )}
    </div>
  )
}
