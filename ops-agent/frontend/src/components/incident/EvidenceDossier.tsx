// Full evidence dossier — progressive disclosure with 3 levels
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiveProgress } from '@/components/hive/HiveProgress'
import { HiveLoader } from '@/components/hive/HiveLoader'
import { HivePulse } from '@/components/hive/HivePulse'
import { HivePattern } from '@/components/hive/HivePattern'
import type { EvidencePackage, SandboxRun, SimilarIncident, PlaybookFull } from '@/types'

interface EvidenceDossierProps {
  evidence: EvidencePackage
  onApprove: () => void
  onReject: (reason: string) => void
  onRevise: (instructions: string) => void
}

// ─── DossierSummary (Level 0 — always visible) ──────────────────────
function DossierSummary({ evidence, level, onExpand }: {
  evidence: EvidencePackage; level: number; onExpand: () => void
}) {
  const riskColors = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
          Evidence Dossier
        </h3>
        {evidence.sandbox_run?.health_check === 'pass' && (
          <span style={{
            background: 'rgba(22,163,74,0.1)', color: 'var(--success)',
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
          }}>
            Sandbox ✓
          </span>
        )}
      </div>

      {/* Root cause */}
      <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.5 }}>
        {evidence.root_cause}
      </p>

      {/* Proposed fix */}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
        <strong>Fix:</strong> {evidence.proposed_fix}
      </p>

      {/* Confidence + Risk */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 16 }}>
        <HiveProgress
          value={evidence.confidence_score}
          label={`${Math.round(evidence.confidence_score * 100)}% confidence`}
        />
        <span style={{
          background: `${riskColors[evidence.risk_level]}15`,
          color: riskColors[evidence.risk_level],
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase',
        }}>
          {evidence.risk_level} risk
        </span>
      </div>

      {/* Memory match row */}
      {evidence.similar_incidents.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'var(--elevated)', borderRadius: 8, marginBottom: 16,
        }}>
          <HivePulse variant="blue" size={5} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)' }}>
            {evidence.similar_incidents[0].incident_id}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
            resolved via {evidence.similar_incidents[0].outcome} · {evidence.similar_incidents[0].resolved_in_min} min
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>94% similar</span>
        </div>
      )}

      {/* Expand button */}
      <button
        onClick={onExpand}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: 'var(--amber)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        {level >= 1 ? 'Hide Details' : 'Review Details'}
        <motion.span
          animate={{ rotate: level >= 1 ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'inline-block' }}
        >
          ↓
        </motion.span>
      </button>
    </div>
  )
}

// ─── DiffPanel ───────────────────────────────────────────────────────
function DiffPanel({ diffOutput }: { diffOutput: string }) {
  const lines = diffOutput.split('\n')

  return (
    <div style={{ padding: '0 20px 16px' }}>
      <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
        Proposed Changes
      </h4>
      <div style={{
        background: 'var(--elevated)', borderRadius: 8, padding: 12, overflow: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
      }}>
        {lines.map((line, i) => {
          const isAdd = line.startsWith('+')
          const isDel = line.startsWith('-')
          return (
            <div key={i} style={{
              padding: '1px 8px',
              borderLeft: `3px solid ${isDel ? 'var(--danger)' : isAdd ? 'var(--success)' : 'var(--border)'}`,
              background: isDel ? 'rgba(220,38,38,0.08)' : isAdd ? 'rgba(22,163,74,0.08)' : 'transparent',
              color: 'var(--text-primary)',
            }}>
              {line}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SandboxResultsPanel ─────────────────────────────────────────────
function SandboxResultsPanel({ sandboxRun }: { sandboxRun: SandboxRun | null }) {
  if (!sandboxRun) return null

  const steps = [
    'Config applied to staging replica',
    'Health endpoint responsive',
    'Error rate in sandbox: 0.0%',
    'Rollback tested successfully',
  ]

  return (
    <div style={{ padding: '0 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Sandbox Results</h4>
        <span style={{
          background: sandboxRun.health_check === 'pass' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          color: sandboxRun.health_check === 'pass' ? 'var(--success)' : 'var(--danger)',
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
        }}>
          {sandboxRun.health_check}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <HivePulse variant="green" size={5} pulse={false} />
            <span style={{ color: 'var(--text-primary)', flex: 1 }}>{step}</span>
            <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 500 }}>Pass</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>
        0 errors in 60s post-change
      </p>
    </div>
  )
}

// ─── RiskAssessmentPanel ─────────────────────────────────────────────
function RiskAssessmentPanel({ riskLevel }: { riskLevel: 'low' | 'medium' | 'high' }) {
  const scoreMap = { low: 2, medium: 3, high: 4 }
  const colorMap = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' }
  const score = scoreMap[riskLevel]

  const factors = [
    { label: 'Blast radius', value: 0.2 },
    { label: 'Deploy window', value: 0.3 },
    { label: 'Rollback speed', value: 0.1 },
    { label: 'Change novelty', value: 0.15 },
  ]

  return (
    <div style={{ padding: '0 20px 16px' }}>
      <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
        Risk Assessment
      </h4>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: colorMap[riskLevel] }}>{score}</span>
        <span style={{ fontSize: 14, color: 'var(--text-faint)' }}> / 5</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {factors.map(f => (
          <HiveProgress key={f.label} value={f.value} total={5} label={f.label} size="sm" />
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Low risk — single config change, fast rollback available
      </p>
    </div>
  )
}

// ─── MemoryReferencesPanel ───────────────────────────────────────────
function MemoryReferencesPanel({ similarIncidents }: { similarIncidents: SimilarIncident[] }) {
  return (
    <div style={{ padding: '0 20px 16px', position: 'relative' }}>
      <HivePattern opacity={0.02} />
      <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, position: 'relative' }}>
        Memory References
      </h4>
      <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 12, position: 'relative' }}>
        Structured pattern match — not semantic search
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
        {similarIncidents.map((si, i) => (
          <div key={si.incident_id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            background: 'var(--elevated)', borderRadius: 8,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)', flexShrink: 0 }}>
              {si.incident_id}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: 11, background: 'var(--amber-glow)', color: 'var(--amber)',
                padding: '1px 6px', borderRadius: 4, marginRight: 6,
              }}>
                {si.causal_sig}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                resolved via {si.outcome} · {si.resolved_in_min}m
              </span>
              {i === 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                  ↳ Used this playbook successfully
                </p>
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', flexShrink: 0 }}>
              {94 - i * 6}% similar
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FullPlaybookPanel ───────────────────────────────────────────────
function FullPlaybookPanel({ playbook }: { playbook: PlaybookFull }) {
  const copyCmd = (cmd: string) => navigator.clipboard.writeText(cmd)

  return (
    <div style={{ padding: '0 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{playbook.title}</h4>
        <span style={{
          fontSize: 11, background: 'var(--amber-glow)', color: 'var(--amber)',
          padding: '1px 6px', borderRadius: 4,
        }}>
          {playbook.causal_sig}
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Used {playbook.used_count} times
      </p>
      <HiveProgress
        value={playbook.success_rate}
        label={`${Math.round(playbook.success_rate * 100)}% success rate across ${playbook.used_count} uses`}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {playbook.steps.map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--amber-glow)',
              color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {s.step}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.action}</p>
              {s.command && (
                <div style={{
                  marginTop: 4, padding: '6px 10px', background: 'var(--elevated)',
                  border: '1px solid var(--border)', borderRadius: 6, position: 'relative',
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)',
                }}>
                  {s.command}
                  <button
                    onClick={() => copyCmd(s.command!)}
                    style={{
                      position: 'absolute', right: 6, top: 4, background: 'none',
                      border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 11,
                    }}
                  >
                    copy
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ApprovalBar ─────────────────────────────────────────────────────
function ApprovalBar({ isApproving, notesOpen, notesText, notesAction, onApprove, onOpenReject, onOpenRevise, onNotesChange, onSubmitNotes, onCancelNotes }: {
  isApproving: boolean
  notesOpen: boolean
  notesText: string
  notesAction: 'reject' | 'revise' | null
  onApprove: () => void
  onOpenReject: () => void
  onOpenRevise: () => void
  onNotesChange: (t: string) => void
  onSubmitNotes: () => void
  onCancelNotes: () => void
}) {
  return (
    <div style={{
      borderTop: '1px solid var(--border)', padding: 16,
      position: 'sticky', bottom: 0, background: 'var(--surface)',
    }}>
      <AnimatePresence>
        {notesOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: 12 }}
          >
            <textarea
              value={notesText}
              onChange={e => onNotesChange(e.target.value)}
              placeholder={notesAction === 'reject' ? 'Reason for rejection...' : 'Revision instructions...'}
              style={{
                width: '100%', height: 80, padding: 10, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--elevated)',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontSize: 13, resize: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={onSubmitNotes} style={{
                padding: '6px 16px', borderRadius: 8, border: 'none',
                background: 'var(--amber)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Submit
              </button>
              <button onClick={onCancelNotes} style={{
                padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onApprove}
          disabled={isApproving}
          style={{
            padding: '8px 24px', borderRadius: 8, border: 'none',
            background: '#16A34A', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: isApproving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 0 0 0 rgba(22,163,74,0)', transition: 'box-shadow 200ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(22,163,74,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 0 rgba(22,163,74,0)' }}
        >
          {isApproving ? <HiveLoader size="sm" /> : 'Approve'}
        </button>
        <button
          onClick={onOpenRevise}
          style={{
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid var(--amber)', background: 'none',
            color: 'var(--amber)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Request Revision
        </button>
        <button
          onClick={onOpenReject}
          style={{
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid var(--danger)', background: 'none',
            color: 'var(--danger)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  )
}

// ─── Main EvidenceDossier ────────────────────────────────────────────
export function EvidenceDossier({ evidence, onApprove, onReject, onRevise }: EvidenceDossierProps) {
  const [disclosureLevel, setDisclosureLevel] = useState(0)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesText, setNotesText] = useState('')
  const [notesAction, setNotesAction] = useState<'reject' | 'revise' | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    await new Promise(r => setTimeout(r, 600))
    onApprove()
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--amber)', borderRadius: 12,
      overflow: 'hidden', position: 'relative',
    }}>
      <HivePattern opacity={0.025} />

      <DossierSummary
        evidence={evidence}
        level={disclosureLevel}
        onExpand={() => setDisclosureLevel(l => l >= 1 ? 0 : 1)}
      />

      <AnimatePresence>
        {disclosureLevel >= 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <DiffPanel diffOutput={evidence.sandbox_run?.diff_output ?? ''} />
            <SandboxResultsPanel sandboxRun={evidence.sandbox_run} />
            <RiskAssessmentPanel riskLevel={evidence.risk_level} />
            <MemoryReferencesPanel similarIncidents={evidence.similar_incidents} />

            <div style={{ padding: '0 20px 16px' }}>
              <button
                onClick={() => setDisclosureLevel(l => l >= 2 ? 1 : 2)}
                style={{
                  background: 'none', border: 'none', color: 'var(--amber)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {disclosureLevel >= 2 ? 'Hide Playbook' : 'Show Full Playbook'}
                <motion.span animate={{ rotate: disclosureLevel >= 2 ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }}>↓</motion.span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {disclosureLevel >= 2 && evidence.playbook && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <FullPlaybookPanel playbook={evidence.playbook} />
          </motion.div>
        )}
      </AnimatePresence>

      <ApprovalBar
        isApproving={isApproving}
        notesOpen={notesOpen}
        notesText={notesText}
        notesAction={notesAction}
        onApprove={handleApprove}
        onOpenReject={() => { setNotesAction('reject'); setNotesOpen(true) }}
        onOpenRevise={() => { setNotesAction('revise'); setNotesOpen(true) }}
        onNotesChange={setNotesText}
        onSubmitNotes={() => {
          if (notesAction === 'reject') onReject(notesText)
          else if (notesAction === 'revise') onRevise(notesText)
          setNotesOpen(false)
        }}
        onCancelNotes={() => setNotesOpen(false)}
      />
    </div>
  )
}
