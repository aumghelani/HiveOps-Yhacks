// Horizontal strip of micro amber dots — used as section divider

export function HiveDivider() {
  const dots = Array.from({ length: 24 }, (_, i) => ({
    x: (i / 23) * 100,
    y: 50 + (Math.sin(i * 1.5) * 30),
    opacity: 0.04 + (i % 3) * 0.02,
    size: i % 4 === 0 ? 2.5 : 1.5,
  }))

  return (
    <div style={{ width: '100%', height: 16, position: 'relative', margin: '8px 0', overflow: 'hidden' }}>
      <svg width="100%" height="16" preserveAspectRatio="none">
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={`${dot.x}%`}
            cy={`${dot.y}%`}
            r={dot.size}
            fill="var(--amber)"
            opacity={dot.opacity}
          />
        ))}
      </svg>
    </div>
  )
}
