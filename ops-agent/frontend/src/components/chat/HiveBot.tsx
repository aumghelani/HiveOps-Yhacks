// QueenBee — context-aware incident chatbot powered by Lava
// Single floating button → slides open panel from right
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { api } from '@/api/client'
import { useIncidentStore } from '@/store/incidentStore'
import { HivePulse } from '@/components/hive/HivePulse'
import { HiveLoader } from '@/components/hive/HiveLoader'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface QuickAction {
  label: string
  icon: string
  message: string
}

const INCIDENT_ACTIONS: QuickAction[] = [
  { label: 'Summarize', icon: '📋', message: 'Give me a full summary of this incident' },
  { label: 'Root cause', icon: '🔍', message: 'What is the root cause of this incident?' },
  { label: 'Should I approve?', icon: '✅', message: 'Should I approve this fix? Is it safe?' },
  { label: 'Risk assessment', icon: '⚠️', message: 'What are the risks of this remediation?' },
  { label: 'Agent progress', icon: '🤖', message: 'What have the agents found so far?' },
  { label: 'Similar incidents', icon: '🔗', message: 'Show me similar past incidents and how they were resolved' },
  { label: 'Explain fix', icon: '🔧', message: 'Explain the proposed fix in plain language' },
  { label: 'Blast radius', icon: '💥', message: 'What is the blast radius? Which services are affected?' },
]

const GENERAL_ACTIONS: QuickAction[] = [
  { label: 'What is HiveOps?', icon: '⬡', message: 'What is HiveOps and how does it work?' },
  { label: 'How do agents work?', icon: '🤖', message: 'How do the HiveOps agents work? What does each one do?' },
  { label: 'Memory bank', icon: '🧠', message: 'How does the memory bank find similar incidents?' },
  { label: 'Approval process', icon: '✅', message: 'How does the human approval process work?' },
  { label: 'Playbooks', icon: '📖', message: 'What are playbooks and how are they used?' },
  { label: 'SRE best practices', icon: '🎯', message: 'What are the best practices for incident response?' },
]

interface SlashCommand {
  command: string
  description: string
  message: string
  requiresIncident: boolean
}

const SLASH_COMMANDS: SlashCommand[] = [
  { command: '/summary', description: 'Full incident summary', message: 'Give me a full summary of this incident', requiresIncident: true },
  { command: '/rootcause', description: 'What caused this', message: 'What is the root cause?', requiresIncident: true },
  { command: '/approve', description: 'Should I approve?', message: 'Should I approve this fix? Assess the risk.', requiresIncident: true },
  { command: '/risk', description: 'Risk assessment', message: 'What are the risks of this remediation?', requiresIncident: true },
  { command: '/agents', description: 'Agent progress', message: 'What have the agents found so far?', requiresIncident: true },
  { command: '/similar', description: 'Past similar incidents', message: 'Show me similar past incidents', requiresIncident: true },
  { command: '/fix', description: 'Explain the proposed fix', message: 'Explain the proposed fix in simple terms', requiresIncident: true },
  { command: '/blast', description: 'Blast radius', message: 'What is the blast radius?', requiresIncident: true },
  { command: '/help', description: 'What can QueenBee do?', message: 'What can you help me with?', requiresIncident: false },
  { command: '/howto', description: 'How HiveOps works', message: 'How does HiveOps work end to end?', requiresIncident: false },
  { command: '/clear', description: 'Clear chat history', message: '', requiresIncident: false },
]

// Check URL path first, then fall back to split-view selection in Zustand store
function useCurrentIncidentId(): string | undefined {
  const location = useLocation()
  const storeId = useIncidentStore(s => s.selectedIncidentId)
  const match = location.pathname.match(/\/incident\/([^/]+)/)
  return match?.[1] ?? storeId ?? undefined
}

export function QueenBee() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey — I'm QueenBee, your incident advisor. Tap a quick action below or type anything. Navigate to an incident for full context." },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const incidentId = useCurrentIncidentId()

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages, isThinking])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  useEffect(() => {
    if (input.startsWith('/')) {
      setShowSlashMenu(true)
      setSlashFilter(input.toLowerCase())
    } else {
      setShowSlashMenu(false)
      setSlashFilter('')
    }
  }, [input])

  const filteredCommands = SLASH_COMMANDS.filter(cmd => {
    if (slashFilter && !cmd.command.startsWith(slashFilter)) return false
    if (cmd.requiresIncident && !incidentId) return false
    return true
  })

  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const text = (overrideMessage || input).trim()
    if (!text || isThinking) return

    setInput('')
    setShowSlashMenu(false)
    setShowQuickActions(false)

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsThinking(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const { reply } = await api.chat.send(text, incidentId, history)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      let fallback = "I can't reach the server right now. Try again in a moment."
      if (incidentId) {
        fallback = `I'm having trouble connecting, but you're viewing **${incidentId}**. Check the incident detail for agent findings.`
      }
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }])
    } finally {
      setIsThinking(false)
    }
  }, [input, isThinking, messages, incidentId])

  const handleSlashCommand = (cmd: SlashCommand) => {
    if (cmd.command === '/clear') {
      setMessages([{ role: 'assistant', content: "Chat cleared. How can I help?" }])
      setInput('')
      setShowSlashMenu(false)
      setShowQuickActions(true)
      return
    }
    sendMessage(cmd.message)
  }

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const cmd = SLASH_COMMANDS.find(c => c.command === input.trim().toLowerCase())
      if (cmd) handleSlashCommand(cmd)
      else sendMessage()
    }
    if (e.key === 'Escape') setShowSlashMenu(false)
  }

  const quickActions = incidentId ? INCIDENT_ACTIONS : GENERAL_ACTIONS

  return (
    <>
      {/* Floating toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.08, boxShadow: '0 4px 20px var(--amber-glow)' }}
            whileTap={{ scale: 0.95 }}
            className="queenbee-fab"
            style={{
              position: 'fixed', bottom: 80, right: 20, zIndex: 60,
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--amber)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px var(--amber-glow)',
            }}
          >
            <span style={{ fontSize: 22, color: '#0A0C0F', lineHeight: 1 }}>⬡</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="queenbee-backdrop"
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 69 }}
            />

            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="queenbee-panel"
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 380, maxWidth: '100vw', zIndex: 70,
                background: 'var(--surface)', borderLeft: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--amber-glow)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 14 }}>⬡</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      QueenBee
                    </span>
                    {incidentId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <HivePulse variant="amber" size={4} />
                        <span style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                          {incidentId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-faint)', fontSize: 20, padding: 4, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Context indicator */}
              {incidentId && (
                <div style={{
                  padding: '6px 16px', background: 'var(--amber-glow)',
                  fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--font-mono)',
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                }}>
                  <HivePulse variant="amber" size={3} pulse={false} />
                  Context: viewing {incidentId}
                </div>
              )}

              {/* Messages */}
              <div
                ref={scrollRef}
                style={{
                  flex: 1, overflowY: 'auto', padding: '12px 16px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
                  >
                    <div style={{
                      padding: '8px 12px', borderRadius: 12,
                      background: msg.role === 'user' ? 'var(--amber)' : 'var(--elevated)',
                      color: msg.role === 'user' ? '#0A0C0F' : 'var(--text-primary)',
                      fontSize: 13, lineHeight: 1.5,
                      borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                      borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
                    }}>
                      {msg.content.split('\n').map((line, j) => (
                        <p key={j} style={{ margin: j > 0 ? '4px 0 0' : 0 }}>
                          {line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                            part.startsWith('**') && part.endsWith('**')
                              ? <strong key={k}>{part.slice(2, -2)}</strong>
                              : part
                          )}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {isThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: 12, borderBottomLeftRadius: 4,
                      background: 'var(--elevated)', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <HiveLoader size="sm" />
                      <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                        thinking...
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Quick action chips */}
                {showQuickActions && !isThinking && messages.length <= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}
                  >
                    {quickActions.map((action, i) => (
                      <motion.button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        whileHover={{ scale: 1.03, boxShadow: '0 2px 8px var(--amber-glow)' }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        style={{
                          padding: '6px 10px', borderRadius: 8,
                          border: '1px solid var(--border)', background: 'var(--surface)',
                          cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)',
                          fontFamily: 'var(--font-body)',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{action.icon}</span>
                        {action.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Slash command menu */}
              <AnimatePresence>
                {showSlashMenu && filteredCommands.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      borderTop: '1px solid var(--border)',
                      background: 'var(--surface)', maxHeight: 200, overflowY: 'auto',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ padding: '6px 12px 4px', fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Commands
                    </div>
                    {filteredCommands.map((cmd) => (
                      <button
                        key={cmd.command}
                        onClick={() => handleSlashCommand(cmd)}
                        style={{
                          width: '100%', padding: '8px 12px', background: 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontWeight: 600, minWidth: 80 }}>
                          {cmd.command}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {cmd.description}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input — safe area padding for mobile nav + keyboard */}
              <div style={{
                padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
                borderTop: '1px solid var(--border)',
                display: 'flex', gap: 8, flexShrink: 0,
                background: 'var(--surface)',
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={incidentId ? `Type / for commands or ask about ${incidentId}...` : 'Type / for commands or ask the Queen...'}
                  enterKeyHint="send"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--elevated)',
                    color: 'var(--text-primary)', fontSize: 16,
                    fontFamily: 'var(--font-body)', outline: 'none',
                    WebkitAppearance: 'none',
                  }}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 40, height: 40, borderRadius: 8, border: 'none',
                    background: input.trim() ? 'var(--amber)' : 'var(--elevated)',
                    color: input.trim() ? '#0A0C0F' : 'var(--text-faint)',
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}
                >
                  ↑
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
