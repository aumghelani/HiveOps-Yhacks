// Wrapper that shows amber dot cluster on hover of any element
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HiveHoverDotsProps {
  children: React.ReactNode
  pattern?: 'corner' | 'edge' | 'center'
  dotCount?: number
  dotSize?: number
  style?: React.CSSProperties
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function HiveHoverDots({
  children, pattern = 'corner', dotCount = 6, dotSize = 3,
  style, className, onClick,
}: HiveHoverDotsProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getDotPositions = () => {
    if (pattern === 'corner') {
      return [
        { x: '8%', y: '15%' }, { x: '92%', y: '15%' },
        { x: '8%', y: '85%' }, { x: '92%', y: '85%' },
        { x: '50%', y: '8%' }, { x: '50%', y: '92%' },
      ].slice(0, dotCount)
    }
    if (pattern === 'edge') {
      return Array.from({ length: dotCount }, (_, i) => ({
        x: `${(i / (dotCount - 1)) * 90 + 5}%`,
        y: i % 2 === 0 ? '6%' : '94%',
      }))
    }
    return Array.from({ length: dotCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / dotCount
      return { x: `${50 + 35 * Math.cos(angle)}%`, y: `${50 + 35 * Math.sin(angle)}%` }
    })
  }

  const dots = getDotPositions()

  return (
    <div
      style={{ position: 'relative', ...style }}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
            {dots.map((pos, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.35, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25, ease: 'backOut' }}
                style={{
                  position: 'absolute', left: pos.x, top: pos.y,
                  width: dotSize, height: dotSize, borderRadius: '50%',
                  background: 'var(--amber)', transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
