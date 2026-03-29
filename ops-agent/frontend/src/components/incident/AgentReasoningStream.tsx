// Live agent reasoning stream — typing effect from SSE or mock simulation
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { HivePulse } from '@/components/hive/HivePulse'

interface AgentReasoningStreamProps {
  incidentId: string
  agentType: string
  isActive: boolean
}

// Simulated reasoning text per agent type
const MOCK_REASONING: Record<string, string[]> = {
  triage: [
    'Analyzing incident metadata...',
    'Matching causal signature against known patterns...',
    'Cross-referencing service topology map...',
    'Classification complete.',
  ],
  root_cause: [
    'Scanning service logs for error patterns...',
    'Correlating with recent deployments...',
    'Checking config diff for changes...',
    'Synthesizing root cause hypothesis...',
  ],
  remediation: [
    'Querying playbook store for matching remediation...',
    'Validating fix against blast radius...',
    'Estimating rollback time and risk...',
    'Remediation plan assembled.',
  ],
  verification: [
    'Executing fix in sandbox environment...',
    'Running health checks post-change...',
    'Measuring error rate delta...',
    'Verification complete.',
  ],
}

export function AgentReasoningStream({ incidentId, agentType, isActive }: AgentReasoningStreamProps) {
  const [streamedText, setStreamedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!isActive) return

    // Try SSE first, fall back to mock typing
    const trySSE = async () => {
      try {
        const es = new EventSource(`/api/incidents/${incidentId}/stream/${agentType}`)
        let received = false

        const timeout = setTimeout(() => {
          if (!received) { es.close(); simulateMock() }
        }, 2000)

        es.onmessage = (event) => {
          received = true
          clearTimeout(timeout)
          try {
            const data = JSON.parse(event.data)
            if (data.text && mountedRef.current) {
              setIsStreaming(true)
              setStreamedText(prev => prev + data.text)
              containerRef.current?.scrollTo(0, containerRef.current.scrollHeight)
            }
            if (data.done) { es.close(); setIsStreaming(false) }
          } catch { /* ignore */ }
        }

        es.onerror = () => {
          clearTimeout(timeout)
          es.close()
          if (!received) simulateMock()
        }
      } catch {
        simulateMock()
      }
    }

    // Mock typing simulation
    const simulateMock = async () => {
      setIsStreaming(true)
      const phrases = MOCK_REASONING[agentType] ?? MOCK_REASONING.triage
      for (const phrase of phrases) {
        for (const char of phrase) {
          if (!mountedRef.current) return
          setStreamedText(prev => prev + char)
          await new Promise(r => setTimeout(r, 18))
        }
        if (!mountedRef.current) return
        setStreamedText(prev => prev + '\n')
        await new Promise(r => setTimeout(r, 300))
      }
      if (mountedRef.current) setIsStreaming(false)
    }

    trySSE()
  }, [isActive, incidentId, agentType])

  if (!streamedText && !isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      style={{
        marginTop: 8, padding: '10px 12px',
        background: 'var(--elevated)', borderLeft: '2px solid var(--amber)',
        borderRadius: '0 6px 6px 0', maxHeight: 120, overflowY: 'auto',
      }}
      ref={containerRef}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {isStreaming && <HivePulse variant="amber" size={4} />}
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isStreaming ? 'Reasoning live' : 'Reasoning complete'}
        </span>
      </div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
        {streamedText}
        {isStreaming && (
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ color: 'var(--amber)' }}>
            ▊
          </motion.span>
        )}
      </p>
    </motion.div>
  )
}
