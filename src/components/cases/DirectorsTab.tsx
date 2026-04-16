'use client'

import { useState } from 'react'
import type { DirectorRow } from './CaseDetailClient'

type Props = {
  caseId:    string
  directors: DirectorRow[]
  onUpdate:  (d: DirectorRow[]) => void
}

const ROLE_ZH:    Record<string, string> = { DIRECTOR: '董事', GUARANTOR: '担保人', BOTH: '董事兼担保人' }
const EMPLOYER_ZH: Record<string, string> = {
  GOVERNMENT: '政府', GLC: 'GLC', PLC: '上市公司', MNC: '跨国企业',
  LARGE_PRIVATE: '大型私企', SME: '中小企业', SELF_EMPLOYED: '自雇', OTHER: '其他',
}
const BAND_BADGE: Record<string, string> = {
  STRONG: 'badge-confirmed', ACCEPTABLE: 'badge-todo',
  MARGINAL: 'badge-conflict', WEAK: 'badge-conflict',
}
const BAND_ZH: Record<string, string> = {
  STRONG: '优', ACCEPTABLE: '良', MARGINAL: '边缘', WEAK: '弱',
}
const CCRIS_ZH: Record<string, string> = {
  CLEAN: '干净', MINOR_ISSUE: '轻微', MAJOR_ISSUE: '重大', UNKNOWN: '未知',
}

const EMPTY_FORM = {
  full_name: '', ic_number: '', role: 'DIRECTOR', employer_type: 'SME', employer_name: '',
  epf_continuous_months: '', epf_last_contribution_month: '', ctos_score: '',
  ccris_status: 'UNKNOWN', ccris_notes: '',
}

export default function DirectorsTab({ caseId, directors, onUpdate }: Props) {
  const [adding, setAdding]       = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)

  function setField(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function startAdd() { setForm(EMPTY_FORM); setAdding(true); setEditId(null); setError(null) }
  function startEdit(d: DirectorRow) {
    setForm({
      full_name: d.full_name, ic_number: d.ic_number, role: d.role,
      employer_type: d.employer_type, employer_name: d.employer_name,
      epf_continuous_months: d.epf_continuous_months?.toString() ?? '',
      epf_last_contribution_month: d.epf_last_contribution_month ?? '',
      ctos_score: d.ctos_score?.toString() ?? '',
      ccris_status: d.ccris_status, ccris_notes: d.ccris_notes ?? '',
    })
    setEditId(d.id); setAdding(false); setError(null)
  }
  function cancelForm() { setAdding(false); setEditId(null); setError(null) }

  async function saveDirector() {
    setSaving(true); setError(null)
    try {
      const payload = {
        ...form,
        epf_continuous_months: form.epf_continuous_months ? Number(form.epf_continuous_months) : undefined,
        ctos_score: form.ctos_score ? Number(form.ctos_score) : undefined,
      }
      const url    = editId ? `/api/cases/${caseId}/directors/${editId}` : `/api/cases/${caseId}/directors`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json   = await res.json()
      if (!res.ok) { setError(json.error ?? '保存失败'); return }

      if (editId) {
        onUpdate(directors.map(d => d.id === editId ? json.data ?? json : d))
      } else {
        onUpdate([...directors, json.data ?? json])
      }
      cancelForm()
    } catch { setError('网络错误，请重试') } finally { setSaving(false) }
  }

  async function deleteDirector(id: string) {
    if (!confirm('确认删除该董事？')) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/directors/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? '删除失败'); return }
      onUpdate(directors.filter(d => d.id !== id))
    } catch { setError('网络错误，请重试') } finally { setSaving(false) }
  }

  // Refresh a single director's DSR by re-fetching after a PUT with no changes
  async function refreshDsr(d: DirectorRow) {
    setRunningId(d.id); setError(null)
    try {
      const res  = await fetch(`/api/cases/${caseId}/directors/${d.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'DSR 计算失败'); return }
      onUpdate(directors.map(x => x.id === d.id ? (json.data ?? json) : x))
    } catch { setError('网络错误，请重试') } finally { setRunningId(null) }
  }

  // Summary
  const bands = directors.reduce<Record<string, number>>((acc, d) => {
    if (d.personal_credit_score) acc[d.personal_credit_score] = (acc[d.personal_credit_score] ?? 0) + 1
    return acc
  }, {})
  const okCount = (bands.STRONG ?? 0) + (bands.ACCEPTABLE ?? 0)

  const sH = (t: string) => (
    <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8, marginBottom: 16 }}>
      <span className="section-label">{t}</span>
    </div>
  )

  const FORM = (
    <div style={{ padding: 20, background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
      {sH(editId ? '编辑董事/担保人' : '新增董事/担保人')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px 16px' }}>
        {[['full_name','姓名 *'],['ic_number','IC 号 *'],['employer_name','雇主名称 *']].map(([k,l]) => (
          <div key={k}><label className="form-label">{l}</label>
            <input className="form-input" value={form[k as keyof typeof form]} onChange={e => setField(k, e.target.value)} /></div>
        ))}
        <div><label className="form-label">角色 *</label>
          <select className="form-input" value={form.role} onChange={e => setField('role', e.target.value)}>
            {Object.entries(ROLE_ZH).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div><label className="form-label">雇主类型 *</label>
          <select className="form-input" value={form.employer_type} onChange={e => setField('employer_type', e.target.value)}>
            {Object.entries(EMPLOYER_ZH).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div><label className="form-label">CTOS 分数</label>
          <input className="form-input" type="number" value={form.ctos_score} onChange={e => setField('ctos_score', e.target.value)} /></div>
        <div><label className="form-label">CCRIS 状态</label>
          <select className="form-input" value={form.ccris_status} onChange={e => setField('ccris_status', e.target.value)}>
            {Object.entries(CCRIS_ZH).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
        <div><label className="form-label">EPF 连续月数</label>
          <input className="form-input" type="number" value={form.epf_continuous_months} onChange={e => setField('epf_continuous_months', e.target.value)} /></div>
        <div><label className="form-label">EPF 最后供款月份</label>
          <input className="form-input" placeholder="YYYY-MM" value={form.epf_last_contribution_month} onChange={e => setField('epf_last_contribution_month', e.target.value)} /></div>
        <div style={{ gridColumn:'1/-1' }}><label className="form-label">CCRIS 备注</label>
          <input className="form-input" value={form.ccris_notes} onChange={e => setField('ccris_notes', e.target.value)} /></div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }} onClick={cancelForm}>取消</button>
        <button className="btn btn-primary"   style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }} disabled={saving} onClick={saveDirector}>{saving ? '…' : editId ? '保存' : '新增'}</button>
      </div>
    </div>
  )

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

      {/* Summary banner */}
      {directors.length > 0 && (
        <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            共 {directors.length} 位董事/担保人 —
            <strong style={{ color: 'var(--color-credit)', marginLeft: 4 }}>
              {okCount} 位</strong> 信用达标（优/良）
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['STRONG','ACCEPTABLE','MARGINAL','WEAK'].filter(b => bands[b]).map(b => (
              <span key={b} className={`status-badge ${BAND_BADGE[b]}`} style={{ fontSize: 11 }}>
                {BAND_ZH[b]} ×{bands[b]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {(adding || editId) && FORM}

      {/* Directors list */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="section-label">董事 / 担保人列表</span>
          {!adding && !editId && (
            <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }} onClick={startAdd}>
              + 新增
            </button>
          )}
        </div>

        {directors.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>暂无董事/担保人记录</p>
        ) : (
          <div className="table-scroll-wrap">
            <table>
              <thead><tr>
                <th>姓名</th><th>角色</th><th>IC</th><th>雇主</th>
                <th>CTOS</th><th>CCRIS</th><th>EPF连续</th>
                <th>个人DSR</th><th>信用评级</th><th>操作</th>
              </tr></thead>
              <tbody>
                {directors.map(d => {
                  const epfWarn = d.epf_continuous_months !== null && d.epf_continuous_months < 6
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.full_name}</td>
                      <td><span className="status-badge badge-todo" style={{ fontSize: 11 }}>{ROLE_ZH[d.role] ?? d.role}</span></td>
                      <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{d.ic_number}</td>
                      <td style={{ fontSize: 13 }}>{d.employer_name} <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>({EMPLOYER_ZH[d.employer_type] ?? d.employer_type})</span></td>
                      <td className={!d.ctos_score ? '' : d.ctos_score >= 650 ? 'amount-credit' : 'amount-debit'} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {d.ctos_score ?? '—'}
                      </td>
                      <td><span className={`status-badge ${d.ccris_status === 'CLEAN' ? 'badge-confirmed' : d.ccris_status === 'MAJOR_ISSUE' ? 'badge-conflict' : 'badge-todo'}`} style={{ fontSize: 11 }}>{CCRIS_ZH[d.ccris_status] ?? d.ccris_status}</span></td>
                      <td style={{ color: epfWarn ? 'var(--color-status-pending)' : undefined, fontSize: 13 }}>
                        {d.epf_continuous_months !== null ? `${d.epf_continuous_months}M${epfWarn ? ' ⚠' : ''}` : '—'}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {d.calculated_personal_dsr !== null ? `${d.calculated_personal_dsr.toFixed(1)}%` : '—'}
                      </td>
                      <td>
                        {d.personal_credit_score ? (
                          <span className={`status-badge ${BAND_BADGE[d.personal_credit_score]}`} style={{ fontSize: 11 }}>
                            {BAND_ZH[d.personal_credit_score]}
                          </span>
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>未计算</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-table-action" onClick={() => startEdit(d)}>编辑</button>
                          <button className="btn-table-action" disabled={runningId === d.id}
                            onClick={() => refreshDsr(d)}>{runningId === d.id ? '…' : '算DSR'}</button>
                          <button className="btn-table-action" onClick={() => deleteDirector(d.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
