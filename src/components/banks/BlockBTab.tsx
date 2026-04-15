'use client'
import { useState } from 'react'
import type { ProcessStep } from '@/types/bank.types'
import { PROCESS_STEP_LABELS, defaultBlockB, safeParseJSON } from '@/types/bank.types'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { FieldConfidenceValue } from '@/types/bank.types'

interface Props { productId: string; blockBJson: string | null; onSaved?: () => void }

function TagList({ items, label }: { items: string[]; label: string }) {
  if (!items.length) return null
  return (
    <div>
      <span className="section-label">{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
        {items.map((t, i) => (
          <span key={i} style={{ fontSize: 12, padding: '2px 8px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-full)', color: 'var(--color-text-secondary)' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function StepCard({ step, index, onEdit }: { step: ProcessStep; index: number; onEdit: (i: number) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card" style={{ marginBottom: 12, cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {step.step_order}
          </span>
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>{PROCESS_STEP_LABELS[step.step_type]}</strong>
            {(step.typical_duration_days_min || step.typical_duration_days_max) && (
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                {step.typical_duration_days_min ?? '?'}–{step.typical_duration_days_max ?? '?'} days
              </span>
            )}
            {step.responsible_party && (
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-accent-gold)' }}>
                {step.responsible_party}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ConfidenceBadge value={step.confidence as FieldConfidenceValue} />
          <button className="btn-table-action" onClick={() => onEdit(index)}>Edit</button>
          <button className="btn-table-action" onClick={() => setOpen(!open)}>
            {open ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--color-border-light)', paddingTop: 16 }}>
          <TagList items={step.trigger_conditions} label="Trigger Conditions" />
          <TagList items={step.key_actions} label="Key Actions" />
          <TagList items={step.common_blockers} label="Common Blockers" />
          <TagList items={step.client_requirements} label="Client Requirements" />
          {step.rejection_reasons.length > 0 && (
            <div>
              <span className="section-label">Rejection Reasons</span>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {step.rejection_reasons.map((r, i) => (
                  <div key={i} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span className={`status-badge ${r.frequency === 'COMMON' ? 'badge-conflict' : 'badge-missing'}`} style={{ fontSize: 10, flexShrink: 0 }}>{r.frequency}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{r.description_zh}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step.empirical_rules.length > 0 && (
            <div>
              <span className="section-label">Empirical Rules</span>
              {step.empirical_rules.map((r, i) => (
                <div key={i} style={{ marginTop: 4, fontSize: 13, background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                  {r.formula}
                </div>
              ))}
            </div>
          )}
          {step.notes && (
            <div>
              <span className="section-label">Notes</span>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{step.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function BlockBTab({ productId, blockBJson, onSaved }: Props) {
  const [steps, setSteps] = useState<ProcessStep[]>(() =>
    safeParseJSON<ProcessStep[]>(blockBJson, defaultBlockB())
  )
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Quick-edit a single step via a text field overlay
  const editStep = steps[editIdx ?? -1]

  async function saveAll() {
    setSaving(true); setMsg('')
    try {
      const r = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_b: steps }),
      })
      if (!r.ok) throw new Error('Failed')
      setMsg('Saved'); setEditIdx(null)
      onSaved?.()
    } catch { setMsg('Error saving') }
    finally { setSaving(false) }
  }

  function updateStep(idx: number, patch: Partial<ProcessStep>) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontFamily: 'var(--font-playfair)' }}>审批流程 Block B — {steps.length} Steps</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 13, color: msg === 'Saved' ? 'var(--color-status-done)' : 'var(--color-status-alert)' }}>{msg}</span>}
          <button className="btn btn-primary" onClick={saveAll} disabled={saving} style={{ minHeight: 36, padding: '8px 20px' }}>
            {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Step editor overlay */}
      {editIdx !== null && editStep && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid var(--color-border-focus)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>Editing: {PROCESS_STEP_LABELS[editStep.step_type]}</strong>
            <button className="btn-table-action" onClick={() => setEditIdx(null)}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Min Duration (days)', 'typical_duration_days_min'],
              ['Max Duration (days)', 'typical_duration_days_max'],
            ].map(([lbl, field]) => (
              <div key={field}>
                <label className="form-label">{lbl}</label>
                <input type="number" className="form-input"
                  value={((editStep as unknown as Record<string, unknown>)[field] as number) ?? ''}
                  onChange={e => updateStep(editIdx, { [field]: e.target.value ? Number(e.target.value) : null } as Partial<ProcessStep>)} />
              </div>
            ))}
            {[
              ['Duration Notes', 'duration_notes'],
              ['Responsible Party', 'responsible_party'],
              ['Site Visit Threshold', 'site_visit_threshold'],
              ['Notes', 'notes'],
            ].map(([lbl, field]) => (
              <div key={field}>
                <label className="form-label">{lbl}</label>
                <input className="form-input"
                  value={((editStep as unknown as Record<string, unknown>)[field] as string) ?? ''}
                  onChange={e => updateStep(editIdx, { [field]: e.target.value || null } as Partial<ProcessStep>)} />
              </div>
            ))}
          </div>
          {([
            ['Trigger Conditions', 'trigger_conditions'],
            ['Key Actions', 'key_actions'],
            ['Common Blockers', 'common_blockers'],
            ['Client Requirements', 'client_requirements'],
            ['Sources', 'sources'],
          ] as [string, keyof ProcessStep][]).map(([lbl, field]) => (
            <div key={field} style={{ marginTop: 10 }}>
              <label className="form-label">{lbl} (comma-separated)</label>
              <input className="form-input"
                value={((editStep[field] ?? []) as string[]).join(', ')}
                onChange={e => updateStep(editIdx, { [field]: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } as Partial<ProcessStep>)} />
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <label className="form-label">Confidence</label>
            <select className="form-select"
              value={editStep.confidence}
              onChange={e => updateStep(editIdx, { confidence: e.target.value as FieldConfidenceValue })}>
              {['CONFIRMED','LIKELY','ESTIMATED','CONFLICT','MISSING'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {steps.map((step, i) => (
        <StepCard key={step.step_type} step={step} index={i} onEdit={setEditIdx} />
      ))}
    </div>
  )
}
