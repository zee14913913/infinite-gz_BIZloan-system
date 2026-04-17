'use client'

import { useState } from 'react'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { FieldConfidenceValue } from '@/types/bank.types'

interface EvidenceLink {
  evidence: {
    id: string
    source_name: string
    source_channel: string
    normalized_value: string | null
    raw_value: string | null
  }
}

export interface DecisionRow {
  id: string
  field_name: string
  step_type: string | null
  final_value: string | null
  value_type: string
  confidence: string
  decision_basis: string
  human_overridden: boolean
  override_by: string | null
  override_reason: string | null
  override_at: string | null
  combined_sources: string
  evidence_links: EvidenceLink[]
  updated_at: string
}

interface Props {
  productId: string
  decisions: DecisionRow[]
  onDecisionsUpdate: (d: DecisionRow[]) => void
}

const CONFIDENCE_VALUES = ['CONFIRMED', 'LIKELY', 'ESTIMATED', 'CONFLICT', 'MISSING']

export function RulesDecisionTab({ productId, decisions, onDecisionsUpdate }: Props) {
  const [running, setRunning]     = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [overrideId, setOverrideId]   = useState<string | null>(null)
  const [overrideForm, setOverrideForm] = useState({ final_value: '', confidence: 'CONFIRMED', override_reason: '' })
  const [saving, setSaving]       = useState(false)

  async function runValidation() {
    setRunning(true); setError(null); setRunResult(null)
    try {
      const res  = await fetch(`/api/products/${productId}/decisions`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '交叉验证失败'); return }
      const s = json.data
      setRunResult(`完成：新增 ${s.created} 条，更新 ${s.updated} 条，跳过（已人工覆盖）${s.skippedLocked} 条`)
      const r2 = await fetch(`/api/products/${productId}/decisions`)
      const j2 = await r2.json()
      if (j2.data) onDecisionsUpdate(j2.data)
    } catch { setError('网络错误，请重试') } finally { setRunning(false) }
  }

  function startOverride(d: DecisionRow) {
    setOverrideForm({ final_value: d.final_value ?? '', confidence: d.confidence, override_reason: '' })
    setOverrideId(d.id); setError(null)
  }
  function cancelOverride() { setOverrideId(null) }

  async function saveOverride() {
    if (!overrideId) return
    if (!overrideForm.override_reason.trim()) { setError('必须填写覆盖原因'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/products/${productId}/decisions/${overrideId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_value: overrideForm.final_value || null,
          confidence: overrideForm.confidence, override_reason: overrideForm.override_reason, human_overridden: true }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '保存失败'); return }
      onDecisionsUpdate(decisions.map(d => d.id === overrideId ? (json.data ?? d) : d))
      cancelOverride()
    } catch { setError('网络错误，请重试') } finally { setSaving(false) }
  }

  async function revertOverride(d: DecisionRow) {
    if (!confirm(`撤销「${d.field_name}」的人工覆盖？`)) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/products/${productId}/decisions/${d.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ human_overridden: false }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '操作失败'); return }
      onDecisionsUpdate(decisions.map(x => x.id === d.id ? (json.data ?? x) : x))
    } catch { setError('网络错误，请重试') } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-status-alert-bg)', border: '1px solid var(--color-status-alert)',
          color: 'var(--color-status-alert)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontWeight:700 }}>×</button>
        </div>
      )}

      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {decisions.length > 0 ? `${decisions.length} 条规则决策` : '尚未运行交叉验证'}
          </p>
          {runResult && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-credit)' }}>{runResult}</p>}
        </div>
        <button className="btn btn-primary" style={{ fontSize: 12, minHeight: 38, padding: '8px 22px' }}
          disabled={running} onClick={runValidation}>
          {running ? '运行中…' : '▶ 运行交叉验证'}
        </button>
      </div>

      {overrideId && (
        <div style={{ padding: 20, background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-accent-gold)' }}>
          <div className="section-label" style={{ marginBottom: 14 }}>人工覆盖</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
            <div><label className="form-label">最终值</label>
              <input className="form-input" value={overrideForm.final_value}
                onChange={e => setOverrideForm(p => ({ ...p, final_value: e.target.value }))} /></div>
            <div><label className="form-label">置信度</label>
              <select className="form-input" value={overrideForm.confidence}
                onChange={e => setOverrideForm(p => ({ ...p, confidence: e.target.value }))}>
                {CONFIDENCE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
              </select></div>
            <div style={{ gridColumn: '1/-1' }}><label className="form-label">覆盖原因 *</label>
              <textarea className="form-input" rows={2} value={overrideForm.override_reason}
                onChange={e => setOverrideForm(p => ({ ...p, override_reason: e.target.value }))}
                style={{ resize: 'vertical', borderRadius: 'var(--radius-md)' }} /></div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }} onClick={cancelOverride}>取消</button>
            <button className="btn btn-primary"   style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }} disabled={saving} onClick={saveOverride}>{saving ? '…' : '保存覆盖'}</button>
          </div>
        </div>
      )}

      {decisions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--color-text-muted)' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: 18, marginBottom: 8 }}>暂无规则决策</p>
          <p style={{ fontSize: 14 }}>在「证据库」收集证据后，点击「运行交叉验证」生成决策</p>
        </div>
      ) : (
        decisions.map(d => (
          <div key={d.id} className="card" style={{ padding: 16, borderLeft: d.human_overridden ? '3px solid var(--color-accent-gold)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 14 }}>{d.field_name}</span>
              {d.step_type && <span className="status-badge badge-todo" style={{ fontSize: 10 }}>{d.step_type}</span>}
              <ConfidenceBadge value={d.confidence as FieldConfidenceValue} />
              {d.human_overridden && <span className="status-badge badge-conflict" style={{ fontSize: 10 }}>人工覆盖</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '6px 24px', fontSize: 13 }}>
              <div>
                <div className="section-label" style={{ marginBottom: 2 }}>最终值</div>
                <div style={{ fontWeight: 600, color: d.final_value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {d.final_value ?? '—'}
                </div>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom: 2 }}>决策依据</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{d.decision_basis}</div>
              </div>
            </div>
            {d.evidence_links.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span className="section-label">支持证据 ({d.evidence_links.length})</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {d.evidence_links.slice(0, 5).map(link => (
                    <span key={link.evidence.id} style={{ fontSize: 11, background: 'var(--color-bg-muted)',
                      padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--color-text-muted)' }}>
                      {link.evidence.source_name}
                      {(link.evidence.normalized_value || link.evidence.raw_value) &&
                        ` → ${link.evidence.normalized_value ?? link.evidence.raw_value}`}
                    </span>
                  ))}
                  {d.evidence_links.length > 5 && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>+{d.evidence_links.length - 5} 条</span>}
                </div>
              </div>
            )}
            {d.human_overridden && d.override_reason && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-accent-gold)',
                background: 'var(--color-accent-subtle)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                📝 {d.override_reason}{d.override_by && <span style={{ color:'var(--color-text-muted)', marginLeft: 8 }}>— {d.override_by}</span>}
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              {overrideId !== d.id && <button className="btn-table-action" onClick={() => startOverride(d)}>人工覆盖</button>}
              {d.human_overridden && <button className="btn-table-action" onClick={() => revertOverride(d)}>撤销覆盖</button>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
