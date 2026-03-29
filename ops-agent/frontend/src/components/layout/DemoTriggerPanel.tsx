// Demo trigger panel — slide-down with 7 scenario cards
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { HiveButton } from '@/components/hive/HiveButton'
import { HiveLoader } from '@/components/hive/HiveLoader'
import axios from 'axios'
import { api } from '@/api/client'
import { useQueryClient } from '@tanstack/react-query'

interface Scenario {
  key: string
  title: string
  service: string
  severity: 'P1' | 'P2'
  source: string
  description: string
}

const SCENARIOS: Scenario[] = [
  { key: 'payment_api_500', title: 'Payment API 500 errors', service: 'payment-api', severity: 'P1', source: 'Jira', description: 'ConnectionPoolExhausted · 34% error rate' },
  { key: 'auth_jwt_failure', title: 'Auth service 401 failures', service: 'auth-service', severity: 'P1', source: 'PagerDuty', description: 'JWT_SECRET missing after config push' },
  { key: 'order_service_oom', title: 'Order service OOM kill loop', service: 'order-service', severity: 'P2', source: 'Kubernetes', description: 'Pod memory limit exceeded' },
  { key: 'search_stale_index', title: 'Search returning no results', service: 'search-service', severity: 'P2', source: 'Zendesk', description: 'Stale shard replica after deploy' },
  { key: 'vpn_gateway_down', title: 'VPN gateway failure', service: 'vpn-gateway', severity: 'P1', source: 'ServiceNow', description: '200+ engineers locked out' },
  { key: 'billing_overcharge', title: 'Billing engine overcharging', service: 'billing-engine', severity: 'P1', source: 'ITSM', description: 'Rounding logic regression · 1,400 invoices' },
  { key: 'notification_backlog', title: 'Notification queue backlog', service: 'notification-service', severity: 'P2', source: 'manual', description: '2.3M messages queued · 45min+ delay' },
]

const SEV_COLOR = { P1: 'var(--danger)', P2: 'var(--warning)' }

export function DemoTriggerPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [triggeredKey, setTriggeredKey] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleTrigger = async (scenario: Scenario) => {
    setTriggeredKey(scenario.key)
    try {
      // Use the webhook endpoint directly with scenario-specific data
      const { data } = await axios.post('/api/incidents/webhook', {
        title: scenario.title,
        service: scenario.service,
        severity: scenario.severity,
        description: scenario.description,
        source: scenario.source,
      })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      setIsOpen(false)
      setTriggeredKey(null)
      navigate(`/incident/${data.incident_id}`)
    } catch {
      // Fallback: use the default trigger
      try {
        const data = await api.incidents.triggerDemo()
        queryClient.invalidateQueries({ queryKey: ['incidents'] })
        setIsOpen(false)
        navigate(`/incident/${data.incident_id}`)
      } catch { /* backend down */ }
      setTriggeredKey(null)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <HiveButton variant="primary" size="sm" onClick={() => setIsOpen(prev => !prev)}>
        Trigger Demo
      </HiveButton>

      <AnimatePresence>
        {isOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 400, background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, zIndex: 50,
                boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Select demo scenario
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{SCENARIOS.length} available</span>
              </div>

              <div className="hive-scrollbar" style={{ maxHeight: 420, overflowY: 'auto' }}>
                {SCENARIOS.map((s, i) => (
                  <motion.button
                    key={s.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleTrigger(s)}
                    disabled={triggeredKey !== null}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'transparent',
                      border: 'none', borderBottom: i < SCENARIOS.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: SEV_COLOR[s.severity],
                        fontFamily: 'var(--font-mono)', background: `${SEV_COLOR[s.severity]}18`,
                        padding: '2px 6px', borderRadius: 4,
                      }}>{s.severity}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </span>
                      {triggeredKey === s.key && <HiveLoader size="sm" />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', background: 'var(--elevated)', padding: '1px 6px', borderRadius: 4 }}>
                        {s.service}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>via {s.source}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.description}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
