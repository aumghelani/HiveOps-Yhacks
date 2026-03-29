// Single pulsing dot for inline status indication
import { motion } from 'framer-motion'

type PulseVariant = 'amber' | 'blue' | 'green' | 'red' | 'gray'

interface HivePulseProps {
  variant?: PulseVariant
  size?: number
  pulse?: boolean
}

const colors: Record<PulseVariant, string> = {
  amber: 'var(--amber)',
  blue:  'var(--blue)',
  green: 'var(--success)',
  red:   'var(--danger)',
  gray:  'var(--text-faint)',
}

export function HivePulse({
  variant = 'amber',
  size = 6,
  pulse = true,
}: HivePulseProps) {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors[variant],
        flexShrink: 0,
        display: 'inline-block',
      }}
      animate={pulse ? {
        opacity: [1, 0.3, 1],
        scale: [1, 1.3, 1],
      } : { opacity: 1, scale: 1 }}
      transition={pulse ? {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      } : {}}
    />
  )
}
