'use client'

import { useState } from 'react'
import type { MatchingResultRow } from './CaseDetailClient'

type Props = {
  caseId:          string
  results:         MatchingResultRow[]
  onResultsUpdate: (r: MatchingResultRow[]) => void
}

const SCORE_ZH: Record<string, string> = { HIGH: '高匹配', MEDIUM: '中匹配', LOW: '低匹配', INELIGIBLE: '不符合' }
const SCORE_BADGE: Record<string, string> = {
  HIGH: 'badge-confirmed', MEDIUM: 'badge-todo', LOW: 'badge-conflict', INELIGIBLE: 'badge-missing',
}

function rm(v: number | null) { return v != null ? `RM ${Math.round(v).toLocaleString()}` : '—' }

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

interface RiskFlag { severity: string }
interface EligFlag { severity: string; passed: boolean }

export default function SolutionDesignTab({ caseId, results, onResultsUpdate }: Props) {
  const [saving,  setSaving]  = useState<string | null>(null)  // saving resultId
  const [error,   setError]   = useState<string | null>(null)
  // Inline edit state per result: { selectedAmount, selectedTenure, notes }
  const [edits, setEdits] = useState<Record<string, { amount: string; tenure: string; notes: string }>>({})

  function getEdit(r: MatchingResultRow) {
    return edits[r.id] ?? {
      amount: r.selected_amount?.toString() ?? '',
      tenure: r.selected_tenure_months?.toString() ?? '',
      notes:  r.advisor_override_notes ?? '',
    }
  }
  function setEdit(id: string, k: string, v: string) {
    setEdits(p => ({ ...p, [id]: { ...getEdit(results.find(x => x.id === id)!), [k]: v } }))
  }

  async function toggleSelected(r: MatchingResultRow) {
    setSaving(r.id); setError(null)
    try {
      const res  = await fetch(`/api/cases/${caseId}/solutions`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId: r.id, is_selected: !r.is_selected }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '更新失败'); return }
      onResultsUpdate(results.map(x => x.id === r.id ? { ...x, is_selected: !r.is_selected } : x))
    } catch { setError('网络错误，请重试') } finally { setSaving(null) }
  }

  async function saveOverride(r: MatchingResultRow) {
    const e = getEdit(r)
    setSaving(r.id); setError(null)
    try {
      const res  = await fetch(`/api/cases/${caseId}/solutions`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId:               r.id,
          selected_amount:        e.amount  ? Number(e.amount)  : null,
          selected_tenure_months: e.tenure  ? Number(e.tenure)  : null,
          advisor_override_notes: e.notes   || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '保存失败'); return }
      onResultsUpdate(results.map(x => x.id === r.id ? {
        ...x,
        selected_amount:        e.amount ? Number(e.amount) : null,
        selected_tenure_months: e.tenure ? Number(e.tenure) : null,
        advisor_override_notes: e.notes || null,
      } : x))
    } catch { setError('网络错误，请重试') } finally { setSaving(null) }
  }

  const shortlisted = results.filter(r => r.is_selected)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-status-alert-bg)', border: '1px solid var(--color-status-alert)',
          color: 'var(--color-status-alert)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* ── Shortlisted summary cards ─────────────────────────────────────── */}
      {shortlisted.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: 12 }}>已入选方案（{shortlisted.length}/3）</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {shortlisted.map(r => {
              const ef = parseJson<EligFlag[]>(r.eligibility_flags_json, [])
              const rf = parseJson<RiskFlag[]>(r.risk_flags_json, [])
              const hb = ef.filter(f => f.severity === 'HARD_BLOCK' && !f.passed).length
              const hr = rf.filter(f => f.severity === 'HIGH').length
              return (
                <div key={r.id} className="card" style={{ padding: 18, borderLeft: '3px solid var(--color-accent-gold)' }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{r.product.bank.name_zh}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{r.product.product_name_zh || r.product.product_name_en}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className={`status-badge ${SCORE_BADGE[r.overall_score]}`} style={{ fontSize: 10 }}>{SCORE_ZH[r.overall_score]}</span>
                    {hb > 0 && <span className="status-badge badge-conflict" style={{ fontSize: 10 }}>硬拒 ×{hb}</span>}
                    {hr > 0 && <span className="status-badge badge-conflict" style={{ fontSize: 10 }}>高风险 ×{hr}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div>
                      <div className="section-label" style={{ marginBottom: 2 }}>申请额</div>
                      <div className="amount-credit" style={{ fontWeight: 600 }}>
                        {r.selected_amount ? rm(r.selected_amount) : `上限 ${rm(r.estimated_amount_max)}`}
                      </div>
                    </div>
                    <div>
                      <div className="section-label" style={{ marginBottom: 2 }}>年限</div>
                      <div>{r.selected_tenure_months ? `${r.selected_tenure_months} 月` : '—'}</div>
                    </div>
                  </div>
                  {r.advisor_override_notes && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)',
                      background: 'var(--color-bg-inset)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                      📝 {r.advisor_override_notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {results.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          请先在「匹配结果」标签运行匹配引擎
        </div>
      )}

      {/* ── All products selection table ──────────────────────────────────── */}
      {results.length > 0 && (
        <div className="card" style={{ padding: 22 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>选择入围方案（最多 3 个）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map(r => {
              const e = getEdit(r)
              const isShortlisted = shortlisted.length >= 3 && !r.is_selected
              return (
                <div key={r.id} style={{
                  border: `1px solid ${r.is_selected ? 'var(--color-accent-gold)' : 'var(--color-border-light)'}`,
                  borderRadius: 'var(--radius-md)', padding: 14,
                  background: r.is_selected ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <input type="checkbox" checked={r.is_selected} disabled={saving === r.id || isShortlisted}
                      onChange={() => toggleSelected(r)}
                      style={{ marginTop: 3, cursor: isShortlisted ? 'not-allowed' : 'pointer', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{r.product.bank.name_zh}</span>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{r.product.product_name_zh || r.product.product_name_en}</span>
                        <span className={`status-badge ${SCORE_BADGE[r.overall_score]}`} style={{ fontSize: 10 }}>{SCORE_ZH[r.overall_score]}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        引擎额度：{rm(r.estimated_amount_min)} – {rm(r.estimated_amount_max)} · {r.product.loan_structure}
                      </div>

                      {r.is_selected && (
                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px 14px' }}>
                          <div>
                            <label className="form-label">申请金额（RM）</label>
                            <input className="form-input" type="number" value={e.amount}
                              onChange={ev => setEdit(r.id, 'amount', ev.target.value)}
                              placeholder={`最高 ${r.estimated_amount_max ? Math.round(r.estimated_amount_max).toString() : '—'}`} />
                          </div>
                          <div>
                            <label className="form-label">申请年限（月）</label>
                            <input className="form-input" type="number" value={e.tenure}
                              onChange={ev => setEdit(r.id, 'tenure', ev.target.value)} placeholder="60" />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 38, padding: '8px 18px', width: '100%' }}
                              disabled={saving === r.id} onClick={() => saveOverride(r)}>
                              {saving === r.id ? '…' : '保存'}
                            </button>
                          </div>
                          <div style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">顾问备注</label>
                            <textarea className="form-input" rows={2} value={e.notes}
                              onChange={ev => setEdit(r.id, 'notes', ev.target.value)}
                              style={{ resize: 'vertical', borderRadius: 'var(--radius-md)' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
            最多可勾选 3 个产品进入方案。超过 3 个后新勾选将被禁用。
          </p>
        </div>
      )}
    </div>
  )
}
