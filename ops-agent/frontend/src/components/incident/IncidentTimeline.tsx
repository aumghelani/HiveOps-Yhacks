// Slack-style incident timeline — each agent "posts" when it completes a step
import { motion, AnimatePresence } from 'framer-motion'
import type { AgentLog } from '@/types'

const AGENT_CONFIG: Record<string, { color: string; initial: string; label: string }> = {
  orchestrator:     { color: '#8B5CF6', initial: 'O', label: 'Orchestrator' },
  triage:           { color: '#3B82F6', initial: 'T', label: 'Triage' },
  root_cause:       { color: '#F59E0B', initial: 'R', label: 'Root Cause' },
  remediation:      { color: '#10B981', initial: 'M', label: 'Remediation' },
  verification:     { color: '#6366F1', initial: 'V', label: 'Verification' },
  reviewer_summary: { color: '#E8A020', initial: 'S', label: 'Summary' },
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export function IncidentTimeline({ logs }: { logs: AgentLog[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
        Waiting for agents to begin...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <AnimatePresence initial={false}>
        {logs.map((log, index) => {
          const config = AGENT_CONFIG[log.agent_type] ?? { color: '#8A8478', initial: '?', label: log.agent_type }

          return (
            <motion.div
              key={log.log_id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'flex', gap: 12, padding: '10px 0',
                borderBottom: index < logs.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Agent avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `${config.color}22`, border: `1px solid ${config.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: config.color,
                fontFamily: 'var(--font-display)', flexShrink: 0,
              }}>
                {config.initial}
              </div>

              {/* Message body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: config.color, fontFamily: 'var(--font-display)' }}>
                    {config.label} agent
                  </span>
                  {log.step_name && (
                    <span style={{
                      fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)',
                      background: 'var(--elevated)', padding: '1px 6px', borderRadius: 4,
                    }}>
                      {log.step_name}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto', flexShrink: 0 }}>
                    {timeAgo(log.created_at)}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, wordBreak: 'break-word' }}>
                  {log.output_summary || log.input_summary || '(processing)'}
                </p>

                {/* Token/latency stats */}
                {(log.tokens_used != null) && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                      {log.tokens_used} tokens
                    </span>
                  </div>
                )}

                {/* Tool calls */}
                {log.tool_calls && log.tool_calls.length > 0 && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ fontSize: 11, color: 'var(--text-faint)', cursor: 'pointer', fontFamily: 'var(--font-mono)', userSelect: 'none' }}>
                      {log.tool_calls.length} tool call{log.tool_calls.length > 1 ? 's' : ''}
                    </summary>
                    <pre style={{
                      marginTop: 6, padding: '8px 10px', background: 'var(--elevated)',
                      borderRadius: 6, fontSize: 10, color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)', overflow: 'auto', maxHeight: 120,
                    }}>
                      {JSON.stringify(log.tool_calls, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
