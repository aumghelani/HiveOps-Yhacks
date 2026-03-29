// Shell layout — sidebar + main content + mobile tab bar + celebration overlays
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { useDemo } from '@/components/DemoContext'
import { useIncidents } from '@/hooks/useIncidents'
import { usePendingApprovals } from '@/hooks/useApprovals'
import { HivePulse } from '@/components/hive/HivePulse'
import { HiveProgress } from '@/components/hive/HiveProgress'
import { HiveOpsLogo } from '@/components/shared/HiveOpsLogo'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { QueenBee } from '@/components/chat/HiveBot'
import { MOCK_PATTERN_FAMILIES } from '@/mock'

const navItems = [
  { to: '/', label: 'Incidents', icon: '!' },
  { to: '/memory', label: 'Memory Bank', icon: 'M' },
  { to: '/playbooks', label: 'Playbooks', icon: 'P' },
  { to: '/audit', label: 'Audit Log', icon: 'A' },
]

export function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const { showResolutionBanner, showFlash } = useDemo()
  const location = useLocation()

  const { data: liveIncidents = [] } = useIncidents()
  const { data: pending = [] } = usePendingApprovals()

  const activeCount = liveIncidents.filter(i => i.status === 'investigating' || i.status === 'triage').length
  const pendingCount = pending.length

  const agentStatus =
    activeCount > 0 ? `${activeCount * 5} agents active` :
    pendingCount > 0 ? `${pendingCount} awaiting review` :
    'All systems nominal'

  const pulseVariant: 'blue' | 'amber' | 'green' =
    activeCount > 0 ? 'blue' :
    pendingCount > 0 ? 'amber' :
    'green'

  const totalIncidents = MOCK_PATTERN_FAMILIES.reduce((s, pf) => s + pf.incident_count, 0)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Sidebar — fixed height, never scrolls */}
      <aside className="sidebar-wrapper" style={{
        width: 224, flexDirection: 'column', height: '100vh',
        borderRight: '1px solid var(--border)', background: 'var(--surface)',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <HiveOpsLogo size="md" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <HivePulse variant={pulseVariant} size={5} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agentStatus}</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-body)',
                transition: 'background 150ms, color 150ms',
                background: isActive ? 'var(--amber-glow)' : 'transparent',
                color: isActive ? 'var(--amber)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <span style={{
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: 'var(--elevated)',
              }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Intelligence section */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Intelligence
          </p>
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{totalIncidents} indexed incidents</p>
            <HiveProgress value={0.8} total={10} label="80% patterns indexed" size="sm" />
          </div>
        </div>

        {/* System health dots */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <HivePulse variant="green" size={6} pulse={false} />
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>API</span>
          <HivePulse variant="green" size={6} pulse={false} />
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Memory</span>
          <HivePulse variant="amber" size={6} />
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Agents</span>
        </div>

        {/* Theme toggle — desktop only */}
        <div style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, transition: 'all 200ms ease',
              width: '100%',
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </aside>

      {/* Main content — this is the only thing that scrolls */}
      <main style={{ flex: 1, overflowY: 'auto', height: '100vh', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* QueenBee chatbot */}
      <QueenBee />

      {/* Mobile bottom tab bar */}
      <MobileTabBar />

      {/* Mobile theme toggle — floating above nav bar, left side */}
      <button
        onClick={toggleTheme}
        className="mobile-theme-toggle"
        style={{
          position: 'fixed', bottom: 72, left: 16, zIndex: 55,
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border)',
          cursor: 'pointer', fontSize: 14,
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Resolution celebration banner */}
      <AnimatePresence>
        {showResolutionBanner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, height: 56,
              background: 'var(--success)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 999,
              fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff', fontSize: 15,
            }}
          >
            Resolution approved · Memory bank updated
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amber screen flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, times: [0, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0, background: 'var(--amber)',
              pointerEvents: 'none', zIndex: 998,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
