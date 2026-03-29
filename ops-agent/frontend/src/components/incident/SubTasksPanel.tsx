// SubTasksPanel — numbered list of agent sub-tasks with live status indicators
import { motion, AnimatePresence } from 'framer-motion'
import { HivePulse } from '@/components/hive/HivePulse'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HiveProgress } from '@/components/hive/HiveProgress'
import type { SubTicket } from '@/types'

interface SubTasksPanelProps {
  sub_tickets: SubTicket[]
}

const agentLabels: Record<string, string> = {
  triage: 'Triage agent',
  root_cause: 'RCA agent',
  remediation: 'Remediation agent',
  verification: 'Verification agent',
}

// Checkmark SVG that draws in on mount
function AnimatedCheck() {
  return (
    <motion.svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.path
        d="M3 8.5L6.5 12L13 4"
        stroke="var(--success)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}

function StatusIcon({ status, index }: { status: SubTicket['status']; index: number }) {
  switch (status) {
    case 'completed':
      return <AnimatedCheck />
    case 'running':
      return <HiveLoader size="sm" />
    case 'failed':
      return (
        <span style={{
          width: 20, height: 20, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(220,38,38,0.1)', color: 'var(--danger)', fontSize: 12, fontWeight: 700,
        }}>
          ✕
        </span>
      )
    default:
      return (
        <span style={{
          width: 20, height: 20, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--elevated)', fontFamily: 'var(--font-mono)',
          fontSize: 11, color: 'var(--text-faint)',
        }}>
          {index + 1}
        </span>
      )
  }
}

function elapsed(created_at: string): string {
  const sec = Math.floor((Date.now() - new Date(created_at).getTime()) / 1000)
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m`
}

export function SubTasksPanel({ sub_tickets }: SubTasksPanelProps) {
  if (sub_tickets.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 12 }}>
        <HiveLoader size="md" label="Agents initializing..." />
      </div>
    )
  }

  return (
    <div>
      <h3 style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--text-faint)', marginBottom: 12,
      }}>
        Sub-Tasks
      </h3>

      <AnimatePresence mode="popLayout">
        {sub_tickets.map((ticket, i) => {
          const isRunning = ticket.status === 'running'
          const isCompleted = ticket.status === 'completed'
          const isPending = ticket.status === 'pending'

          return (
            <motion.div
              key={ticket.sub_ticket_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              style={{
                position: 'relative', borderRadius: 10, padding: '10px 12px', marginBottom: 6,
                border: '1px solid var(--border)',
                borderLeft: isRunning ? '3px solid var(--amber)' : '1px solid var(--border)',
                background: isRunning ? 'var(--amber-glow)' : 'transparent',
                opacity: isPending ? 0.5 : isCompleted ? 0.7 : 1,
                transition: 'opacity 300ms, border-color 600ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  <StatusIcon status={ticket.status} index={i} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {ticket.title}
                  </p>
                  {ticket.result_summary && (
                    <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {ticket.result_summary}
                    </p>
                  )}
                  {isCompleted && ticket.confidence_score != null && (
                    <div style={{ marginTop: 6 }}>
                      <HiveProgress
                        value={ticket.confidence_score}
                        size="sm"
                        label={`${Math.round(ticket.confidence_score * 100)}% confidence`}
                      />
                    </div>
                  )}
                </div>

                <div style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, color: 'var(--text-faint)',
                }}>
                  <span>{agentLabels[ticket.agent_type] ?? ticket.agent_type}</span>
                  {isRunning && (
                    <>
                      <span>·</span>
                      <span>{elapsed(ticket.created_at)}</span>
                      <HivePulse variant="blue" size={5} />
                    </>
                  )}
                  {isCompleted && <HivePulse variant="green" pulse={false} size={5} />}
                  {isPending && <span>· waiting</span>}
                </div>
              </div>

              {/* Shimmer bar for running tasks */}
              {isRunning && (
                <div style={{
                  marginTop: 8, height: 2, width: '100%', overflow: 'hidden',
                  borderRadius: 2, background: 'var(--border)',
                }}>
                  <div style={{
                    height: '100%', width: '33%', borderRadius: 2,
                    background: 'var(--amber)', opacity: 0.6,
                    animation: 'shimmer 1.5s infinite',
                  }} />
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
