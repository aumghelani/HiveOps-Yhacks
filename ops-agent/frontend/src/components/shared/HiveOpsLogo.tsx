// HiveOps wordmark — the "O" is always a hexagon SVG

interface HiveOpsLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export function HiveOpsLogo({ size = 'md' }: HiveOpsLogoProps) {
  const sizes = {
    sm: { fontSize: 16, hexSize: 14, gap: 2 },
    md: { fontSize: 22, hexSize: 20, gap: 3 },
    lg: { fontSize: 32, hexSize: 28, gap: 4 },
  }
  const s = sizes[size]

  // Pointy-top hexagon path
  const hex = (r: number) => {
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30)
      return `${r + r * Math.cos(angle)},${r + r * Math.sin(angle)}`
    })
    return `M ${points.join(' L ')} Z`
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: s.gap,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: s.fontSize,
      color: 'var(--text-primary)',
      letterSpacing: '-0.02em',
      userSelect: 'none',
    }}>
      <span>Hive</span>
      <svg
        width={s.hexSize}
        height={s.hexSize}
        viewBox={`0 0 ${s.hexSize} ${s.hexSize}`}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <path
          d={hex(s.hexSize / 2 - 1)}
          fill="var(--amber)"
          stroke="var(--amber-deep)"
          strokeWidth="1"
        />
      </svg>
      <span>ps</span>
    </div>
  )
}
