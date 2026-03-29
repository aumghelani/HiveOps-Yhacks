// Static hex dot texture — used behind empty states and card headers

interface HivePatternProps {
  rows?: number
  cols?: number
  opacity?: number
  style?: React.CSSProperties
}

export function HivePattern({
  rows = 6,
  cols = 12,
  opacity = 0.04,
  style,
}: HivePatternProps) {
  const dots: { x: number; y: number; size: number }[] = []
  const spacingX = 100 / cols
  const spacingY = 100 / rows

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = row % 2 === 0 ? 0 : spacingX / 2
      dots.push({
        x: col * spacingX + offsetX,
        y: row * spacingY,
        size: (row + col) % 3 === 0 ? 2 : 1.5,
      })
    }
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      ...style,
    }}>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={`${dot.x}%`}
            cy={`${dot.y}%`}
            r={dot.size}
            fill="var(--amber)"
            opacity={opacity}
          />
        ))}
      </svg>
    </div>
  )
}
