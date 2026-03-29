// Dot-based progress bar — replaces plain bars and percentage text
import { motion } from 'framer-motion'

interface HiveProgressProps {
  value: number       // 0.0 to 1.0
  total?: number      // number of dots (default 10)
  label?: string
  size?: 'sm' | 'md'
}

export function HiveProgress({ value, total = 10, label, size = 'md' }: HiveProgressProps) {
  const filled = Math.round(value * total)
  const dotSize = size === 'sm' ? 5 : 7
  const gap = size === 'sm' ? 4 : 6

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap, alignItems: 'center' }}>
        {Array.from({ length: total }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: i < filled ? 1 : 0.15, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: 'backOut' }}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: 'var(--amber)',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      {label && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      )}
    </div>
  )
}
