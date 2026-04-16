'use client'

import { useState } from 'react'
import type { MatchingResultRow } from './CaseDetailClient'

type Props = {
  caseId:          string
  results:         MatchingResultRow[]
  onResultsUpdate: (r: MatchingResultRow[]) => void
}

const SCORE_BADGE: Record<string, string> = {
  HIGH: 'badge-confirmed', MEDIUM: 'badge-todo', LOW: 'badge-conflict', INELIGIBLE: 'badge-missing',
}
const SCORE_ZH: Record<string, string> = { HIGH: '高匹配', MEDIUM: '中匹配', LOW: '低匹配', INELIGIBLE: '不符合' }

function rm(v: number | null | undefined) {
  if (v == null) return '—'
  return `RM ${Math.round(v).toLocaleString()}`
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

interface EligFlag { type: string; severity: string; passed: boolean; field: string; actualValue: string | null; requiredValue: string | null; notes: string | null }
interface RiskFlag  { type: string; severity: string; descriptionZh: string; descriptionEn: string; mitigationSuggestion: string | null }
interface AmtMethod { method: string; rawLimit: number; notes: string }
interface AmtBreakdown { methods: AmtMethod[]; bindingMethod: string; finalMin: number | null; finalMax: number | null; effectiveInflowUsed: number }

const SEV_BADGE: Record<string, string> = { HARD_BLOCK: 'badge-conflict', SOFT_BLOCK: 'badge-conflict', WARNING: 'badge-todo', HIGH: 'badge-conflict', MEDIUM: 'badge-todo', LOW: 'badge-missing' }

export default function MatchingTab({ caseId, results, onResultsUpdate }: Props) {
  const [selected, setSelected] = useState<MatchingResultRow | null>(null)
  const [running, setRunning]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function runEngine() {
    setRunning(true); setError(null)
    try {
      const res  = await fetch(`/api/cases/${caseId}/match-run`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '匹配引擎运行失败'); return }
      // Reload results from solutions endpoint
      const r2   = await fetch(`/api/cases/${caseId}/solutions`)
      const j2   = await r2.json()
      if (j2.data) { onResultsUpdate(j2.data); setSelected(null) }
    } catch { setError('网络错误，请重试') } finally { setRunning(false) }
  }

  const eligFlags  = selected ? parseJson<EligFlag[]>(selected.eligibility_flags_json, []) : []
  const riskFlags  = selected ? parseJson<RiskFlag[]>(selected.risk_flags_json, []) : []
  const breakdown  = selected ? parseJson<AmtBreakdown | null>(selected.amount_breakdown_json, null) : null
  const hardBlocks = eligFlags.filter(f => f.severity === 'HARD_BLOCK' && !f.passed)
  const highRisks  = riskFlags.filter(f => f.severity === 'HIGH')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-status-alert-bg)', border: '1px solid var(--color-status-alert)',
          color: 'var(--color-status-alert)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Header with run button */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {results.length > 0 ? `${results.length} 个产品匹配结果` : '尚未运行匹配引擎'}
          </p>
          {results.length > 0 && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              高匹配 {results.filter(r => r.overall_score === 'HIGH').length} ·
              中匹配 {results.filter(r => r.overall_score === 'MEDIUM').length} ·
              低匹配 {results.filter(r => r.overall_score === 'LOW').length} ·
              不符合 {results.filter(r => r.overall_score === 'INELIGIBLE').length}
            </p>
          )}
        </div>
        <button className="btn btn-primary" style={{ fontSize: 12, minHeight: 38, padding: '8px 22px' }}
          disabled={running} onClick={runEngine}>
          {running ? '运行中…' : results.length > 0 ? '重新运行' : '▶ 运行匹配引擎'}
        </button>
      </div>

      {results.length === 0 ? null : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 16 }}>
          {/* Results list */}
          <div className="table-scroll-wrap">
            <table>
              <thead><tr>
                <th>银行</th><th>产品</th><th>结构</th><th>匹配度</th>
                <th>估算额度</th><th>硬拒数</th><th>高风险</th><th>操作</th>
              </tr></thead>
              <tbody>
                {results.map(r => {
                  const ef = parseJson<EligFlag[]>(r.eligibility_flags_json, [])
                  const rf = parseJson<RiskFlag[]>(r.risk_flags_json, [])
                  const hb = ef.filter(f => f.severity === 'HARD_BLOCK' && !f.passed).length
                  const hr = rf.filter(f => f.severity === 'HIGH').length
                  const isActive = selected?.id === r.id
                  return (
                    <tr key={r.id} style={{ background: isActive ? 'var(--color-bg-hover)' : undefined }}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{r.product.bank.name_zh}</td>
                      <td>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{r.product.product_name_zh || r.product.product_name_en}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.product.product_code}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.product.loan_structure}</td>
                      <td><span className={`status-badge ${SCORE_BADGE[r.overall_score] ?? 'badge-missing'}`} style={{ fontSize: 11 }}>{SCORE_ZH[r.overall_score] ?? r.overall_score}</span></td>
                      <td>
                        {r.estimated_amount_min !== null || r.estimated_amount_max !== null ? (
                          <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                            {rm(r.estimated_amount_min)} – {rm(r.estimated_amount_max)}
                          </span>
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td>{hb > 0 ? <span className="status-badge badge-conflict" style={{ fontSize: 11 }}>{hb}</span> : <span style={{ color: 'var(--color-text-muted)' }}>0</span>}</td>
                      <td>{hr > 0 ? <span className="status-badge badge-conflict" style={{ fontSize: 11 }}>{hr}</span> : <span style={{ color: 'var(--color-text-muted)' }}>0</span>}</td>
                      <td>
                        <button className="btn-table-action" onClick={() => setSelected(isActive ? null : r)}>
                          {isActive ? '收起' : '详情'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.product.bank.name_zh} — {selected.product.product_name_zh || selected.product.product_name_en}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {selected.product.product_code} · {selected.product.loan_structure}
                  </div>
                </div>
                <span className={`status-badge ${SCORE_BADGE[selected.overall_score]}`}>{SCORE_ZH[selected.overall_score]}</span>
                <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                  <div><div className="section-label">最低额度</div><div className="amount-credit" style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{rm(selected.estimated_amount_min)}</div></div>
                  <div><div className="section-label">最高额度</div><div className="amount-credit" style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{rm(selected.estimated_amount_max)}</div></div>
                </div>
              </div>

              {/* Eligibility flags */}
              {eligFlags.length > 0 && (
                <div className="card" style={{ padding: 16 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>资格审查 ({hardBlocks.length} 硬拒)</div>
                  {eligFlags.map((f, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span className={`status-badge ${SEV_BADGE[f.severity] ?? 'badge-todo'}`} style={{ fontSize: 10, flexShrink: 0 }}>
                        {f.passed ? '✓' : '✗'} {f.severity}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{f.type}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {f.field} · 实际：{f.actualValue ?? '—'} · 要求：{f.requiredValue ?? '—'}
                        </div>
                        {f.notes && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{f.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Risk flags */}
              {riskFlags.length > 0 && (
                <div className="card" style={{ padding: 16 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>风险信号 ({highRisks.length} 高风险)</div>
                  {riskFlags.map((f, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`status-badge ${SEV_BADGE[f.severity] ?? 'badge-todo'}`} style={{ fontSize: 10 }}>{f.severity}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{f.descriptionZh}</span>
                      </div>
                      {f.mitigationSuggestion && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, paddingLeft: 4 }}>
                          💡 {f.mitigationSuggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Amount breakdown */}
              {breakdown && (
                <div className="card" style={{ padding: 16 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>额度计算依据</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    约束方法：<strong style={{ color: 'var(--color-text-primary)' }}>{breakdown.bindingMethod}</strong>
                    &nbsp;·&nbsp;有效进账：{rm(breakdown.effectiveInflowUsed)}
                  </div>
                  {breakdown.methods.map((m, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: breakdown.bindingMethod === m.method ? 'var(--color-accent-gold)' : 'var(--color-text-secondary)' }}>
                        {m.method} {breakdown.bindingMethod === m.method ? '⬅' : ''}
                      </span>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                        {m.rawLimit > 0 ? rm(m.rawLimit) : <span style={{ color: 'var(--color-text-muted)' }}>无效</span>}
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>{breakdown.methods.find(m => !m.rawLimit)?.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
