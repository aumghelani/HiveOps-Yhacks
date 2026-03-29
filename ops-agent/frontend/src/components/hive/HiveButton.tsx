// Standard button for HiveOps — hover lift, press scale, loading state
import { motion } from 'framer-motion'
import { HiveLoader } from './HiveLoader'

interface HiveButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'danger' | 'ghost' | 'subtle' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  style?: React.CSSProperties
  fullWidth?: boolean
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--amber)', color: '#0A0C0F', border: 'none' },
  danger:  { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' },
  ghost:   { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
  subtle:  { background: 'var(--elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  success: { background: 'transparent', color: 'var(--success)', border: '1px solid var(--success)' },
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: 12, borderRadius: 6 },
  md: { padding: '8px 16px', fontSize: 13, borderRadius: 8 },
  lg: { padding: '11px 22px', fontSize: 14, borderRadius: 10 },
}

export function HiveButton({
  children, variant = 'ghost', size = 'md', isLoading = false,
  disabled = false, onClick, style, fullWidth = false,
}: HiveButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={!disabled ? {
        y: -1,
        boxShadow: variant === 'primary'
          ? '0 4px 16px var(--amber-glow)' : '0 4px 12px rgba(0,0,0,0.15)',
      } : {}}
      whileTap={!disabled ? { scale: 0.97, y: 0 } : {}}
      transition={{ duration: 0.15 }}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--font-body)', fontWeight: 500,
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {isLoading ? <HiveLoader size="sm" /> : children}
    </motion.button>
  )
}
