// Bottom navigation bar shown on mobile only (<768px)
import { NavLink } from 'react-router-dom'
import { HivePulse } from '@/components/hive/HivePulse'

const tabs = [
  { to: '/', label: 'Incidents', icon: '≡' },
  { to: '/memory', label: 'Memory', icon: '◈' },
  { to: '/playbooks', label: 'Playbooks', icon: '⊞' },
  { to: '/audit', label: 'Audit', icon: '✓' },
]

export function MobileTabBar() {
  return (
    <nav className="mobile-tab-bar" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      zIndex: 100,
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center', gap: 3,
            textDecoration: 'none',
            color: isActive ? 'var(--amber)' : 'var(--text-muted)',
            fontSize: 10, fontFamily: 'var(--font-body)', position: 'relative' as const,
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <HivePulse variant="amber" size={4} pulse={false} />
              )}
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
