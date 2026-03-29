// 7-dot hexagonal pulse loader — replaces all spinners in HiveOps
import { motion } from 'framer-motion'

interface HiveLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function HiveLoader({ size = 'md', label }: HiveLoaderProps) {
  const dotSizes = { sm: 3, md: 5, lg: 8 }
  const radii   = { sm: 10, md: 16, lg: 24 }
  const r = dotSizes[size]
  const R = radii[size]
  const totalSize = (R + r) * 2 + 4

  // 7 dots: center + 6 outer ring clockwise from top
  const positions = [
    { x: 0, y: 0 },
    ...Array.from({ length: 6 }, (_, i) => ({
      x: Math.cos((Math.PI / 3) * i - Math.PI / 2) * R,
      y: Math.sin((Math.PI / 3) * i - Math.PI / 2) * R,
    })),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg
        width={totalSize}
        height={totalSize}
        viewBox={`${-totalSize/2} ${-totalSize/2} ${totalSize} ${totalSize}`}
      >
        {positions.map((pos, i) => (
          <motion.circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r={r}
            fill="var(--amber)"
            initial={{ opacity: 0.15, scale: 0.8 }}
            animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
      {label && (
        <p style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
        }}>
          {label}
        </p>
      )}
    </div>
  )
}
