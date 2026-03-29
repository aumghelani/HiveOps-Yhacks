// Confidence trajectory — pure SVG sparkline showing confidence building per agent
import { motion } from 'framer-motion'
import type { SubTicket } from '@/types'

interface ConfidenceTrajectoryProps {
  subTickets: SubTicket[]
}

const AGENT_ORDER = ['triage', 'root_cause', 'remediation', 'verification']
const AGENT_LABELS = ['Triage', 'RCA', 'Remediation', 'Verification']

export function ConfidenceTrajectory({ subTickets }: ConfidenceTrajectoryProps) {
  const points = AGENT_ORDER.map((agent) => {
    const ticket = subTickets.find(st => st.agent_type === agent && st.confidence_score != null)
    return ticket?.confidence_score ?? null
  })

  const completedPoints = points.filter((p): p is number => p !== null)

  if (completedPoints.length === 0) {
    return (
      <div style={{ height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {AGENT_ORDER.map((_, i) => (
            <motion.div
              key={i}
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-strong)' }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          Agents initializing...
        </span>
      </div>
    )
  }

  // SVG chart dimensions
  const W = 280, H = 60, PAD = 20
  const chartW = W - PAD * 2
  const chartH = H - 10
  const minY = 50, maxY = 100 // show 50%-100% range

  // Build SVG path from completed data points
  const svgPoints = completedPoints.map((val, i) => {
    const x = PAD + (i / Math.max(completedPoints.length - 1, 1)) * chartW
    const y = chartH - ((val * 100 - minY) / (maxY - minY)) * chartH + 5
    return { x, y }
  })

  const linePath = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${svgPoints[svgPoints.length - 1].x} ${H} L ${svgPoints[0].x} ${H} Z`
  const currentConf = completedPoints[completedPoints.length - 1]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Confidence trajectory
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
          {(currentConf * 100).toFixed(0)}%
        </span>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {[50, 75, 100].map(v => {
          const y = chartH - ((v - minY) / (maxY - minY)) * chartH + 5
          return <line key={v} x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.5} />
        })}
        {/* Fill area */}
        <motion.path
          d={areaPath}
          fill="var(--amber)" opacity={0.08}
          initial={{ opacity: 0 }} animate={{ opacity: 0.08 }} transition={{ duration: 0.6 }}
        />
        {/* Line */}
        <motion.path
          d={linePath}
          fill="none" stroke="var(--amber)" strokeWidth={2} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {/* Dots */}
        {svgPoints.map((p, i) => (
          <motion.circle
            key={i} cx={p.x} cy={p.y} r={4}
            fill="var(--amber)" stroke="var(--surface)" strokeWidth={2}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.3, ease: 'backOut' }}
          />
        ))}
      </svg>

      {/* Agent labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: `0 ${PAD}px` }}>
        {AGENT_ORDER.map((agent, i) => {
          const hasData = points[i] !== null
          const isRunning = subTickets.find(st => st.agent_type === agent)?.status === 'running'
          return (
            <div key={agent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <motion.div
                style={{ width: 5, height: 5, borderRadius: '50%', background: hasData ? 'var(--amber)' : 'var(--border-strong)' }}
                animate={isRunning ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                {AGENT_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
