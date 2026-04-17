'use client'

import { useState, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface EvidenceRecord {
  id: string
  field_name: string
  step_type: string | null
  raw_text: string
  raw_value: string | null
  normalized_value: string | null
  source_url: string | null
  source_channel: string
  source_name: string
  source_date: string | null
  language: string
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

const CHANNELS = [
  { value: 'OFFICIAL_BANK_WEBSITE',  label: '官方银行网站',    badge: 'badge-source-official' },
  { value: 'OFFICIAL_CGC_SJPP_BNM', label: 'CGC/SJPP/BNM',   badge: 'badge-source-gov' },
  { value: 'FINANCIAL_MEDIA',        label: '财经媒体/比价',    badge: 'badge-source-media' },
  { value: 'ADVISOR_CONSULTANT',     label: '顾问/代理博客',    badge: 'badge-source-agent' },
  { value: 'APPLICANT_COMMUNITY',   label: '申请者社群',       badge: 'badge-source-case' },
  { value: 'AUTHORITY_PLATFORM',    label: '权威平台',         badge: 'badge-source-platform' },
  { value: 'INTERNAL_HANDBOOK',     label: '内部手册',         badge: 'badge-source-internal' },
]

const LANGUAGES = ['ZH', 'EN', 'BM']

function channelInfo(v: string) {
  return CHANNELS.find(c => c.value === v) ?? { value: v, label: v, badge: 'badge-missing' }
}

const EMPTY_FORM = {
  field_name: '', step_type: '', raw_text: '', raw_value: '', normalized_value: '',
  source_url: '', source_channel: 'OFFICIAL_BANK_WEBSITE', source_name: '',
  source_date: '', language: 'ZH',
}

interface Props { productId: string }

export function EvidenceLibraryTab({ productId }: Props) {
  const [evidence, setEvidence]   = useState<EvidenceRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [adding, setAdding]       = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const res  = await fetch(`/api/products/${productId}/evidence`)
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? '加载失败'); return }
        setEvidence(json.data ?? [])
      } catch { setError('网络错误，请重试') } finally { setLoading(false) }
    }
    load()
  }, [productId])

  async function loadEvidence() {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/products/${productId}/evidence`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '加载失败'); return }
      setEvidence(json.data ?? [])
    } catch { setError('网络错误，请重试') } finally { setLoading(false) }
  }

  function setField(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }
  function startAdd() { setForm(EMPTY_FORM); setAdding(true); setEditId(null); setError(null) }
  function startEdit(ev: EvidenceRecord) {
    setForm({
      field_name: ev.field_name, step_type: ev.step_type ?? '',
      raw_text: ev.raw_text, raw_value: ev.raw_value ?? '',
      normalized_value: ev.normalized_value ?? '',
      source_url: ev.source_url ?? '', source_channel: ev.source_channel,
      source_name: ev.source_name,
      source_date: ev.source_date ? ev.source_date.slice(0, 10) : '',
      language: ev.language,
    })
    setEditId(ev.id); setAdding(false); setError(null)
  }
  function cancelForm() { setAdding(false); setEditId(null) }

  async function saveEvidence() {
    setSaving(true); setError(null)
    try {
      const payload = {
        ...form,
        step_type:       form.step_type       || null,
        raw_value:       form.raw_value        || null,
        normalized_value: form.normalized_value || null,
        source_url:      form.source_url       || null,
        source_date:     form.source_date      || null,
      }
      const url    = editId ? `/api/products/${productId}/evidence/${editId}` : `/api/products/${productId}/evidence`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json   = await res.json()
      if (!res.ok) { setError(json.error ?? '保存失败'); return }
      await loadEvidence()
      cancelForm()
    } catch { setError('网络错误，请重试') } finally { setSaving(false) }
  }

  async function deleteEvidence(id: string) {
    if (!confirm('确认删除该证据记录？')) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/products/${productId}/evidence/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? '删除失败'); return }
      setEvidence(p => p.filter(e => e.id !== id))
    } catch { setError('网络错误，请重试') } finally { setSaving(false) }
  }

  // Group evidence by field_name
  const grouped = evidence.reduce<Record<string, EvidenceRecord[]>>((acc, ev) => {
    if (!acc[ev.field_name]) acc[ev.field_name] = []
    acc[ev.field_name].push(ev)
    return acc
  }, {})

  const FormPanel = (
    <div style={{ padding: 20, background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
      <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8, marginBottom: 16 }}>
        <span className="section-label">{editId ? '编辑证据' : '新增证据'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px 16px' }}>
        {[['field_name','字段名 *'],['step_type','步骤类型'],['source_name','来源名称 *'],['source_url','来源URL']].map(([k,l]) => (
          <div key={k}><label className="form-label">{l}</label>
            <input className="form-input" value={form[k as keyof typeof form]} onChange={e => setField(k, e.target.value)} /></div>
        ))}
        <div><label className="form-label">来源渠道 *</label>
          <select className="form-input" value={form.source_channel} onChange={e => setField('source_channel', e.target.value)}>
            {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select></div>
        <div><label className="form-label">语言</label>
          <select className="form-input" value={form.language} onChange={e => setField('language', e.target.value)}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select></div>
        <div><label className="form-label">来源日期</label>
          <input className="form-input" type="date" value={form.source_date} onChange={e => setField('source_date', e.target.value)} /></div>
        <div><label className="form-label">提取值</label>
          <input className="form-input" value={form.raw_value} onChange={e => setField('raw_value', e.target.value)} /></div>
        <div><label className="form-label">标准化值</label>
          <input className="form-input" value={form.normalized_value} onChange={e => setField('normalized_value', e.target.value)} /></div>
        <div style={{ gridColumn:'1/-1' }}><label className="form-label">原始文字 *</label>
          <textarea className="form-input" rows={3} value={form.raw_text} onChange={e => setField('raw_text', e.target.value)}
            style={{ resize:'vertical', borderRadius:'var(--radius-md)' }} /></div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }} onClick={cancelForm}>取消</button>
        <button className="btn btn-primary"   style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }} disabled={saving} onClick={saveEvidence}>{saving ? '…' : editId ? '保存' : '新增'}</button>
      </div>
    </div>
  )

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>加载中…</div>

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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          共 {evidence.length} 条证据 · {Object.keys(grouped).length} 个字段
        </span>
        {!adding && !editId && (
          <button className="btn btn-primary" style={{ fontSize: 12, minHeight: 38, padding: '8px 22px' }} onClick={startAdd}>+ 新增证据</button>
        )}
      </div>

      {(adding || editId) && FormPanel}

      {Object.keys(grouped).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--color-text-muted)' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: 18, marginBottom: 8 }}>暂无证据记录</p>
          <p style={{ fontSize: 14 }}>点击「新增证据」开始收集字段证据</p>
        </div>
      ) : (
        Object.entries(grouped).map(([fieldName, records]) => {
          const isOpen = expanded[fieldName] !== false  // default open
          return (
            <div key={fieldName} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Field header */}
              <div style={{ padding: '12px 18px', background: 'var(--color-bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpanded(p => ({ ...p, [fieldName]: !isOpen }))}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: 14 }}>{fieldName}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-bg-muted)', borderRadius: 10, padding: '1px 8px' }}>
                    {records.length} 条
                  </span>
                  {records.some(r => r.is_verified) && (
                    <span className="status-badge badge-confirmed" style={{ fontSize: 10 }}>已核实</span>
                  )}
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {records.map(ev => {
                    const ch = channelInfo(ev.source_channel)
                    return (
                      <div key={ev.id} style={{ padding: 12, borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                          <span className={`status-badge ${ch.badge}`} style={{ fontSize: 10, flexShrink: 0 }}>{ch.label}</span>
                          {ev.language !== 'ZH' && <span className="status-badge badge-todo" style={{ fontSize: 10 }}>{ev.language}</span>}
                          {ev.is_verified && <span className="status-badge badge-confirmed" style={{ fontSize: 10 }}>✓ 已核实</span>}
                          {ev.step_type && <span className="status-badge badge-missing" style={{ fontSize: 10 }}>{ev.step_type}</span>}
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                            {ev.source_name}
                            {ev.source_date && ` · ${ev.source_date.slice(0, 10)}`}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, margin: '8px 0 4px', color: 'var(--color-text-secondary)',
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {ev.raw_text}
                        </p>
                        {(ev.raw_value || ev.normalized_value) && (
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            {ev.raw_value && <span>提取值：<strong style={{ color:'var(--color-text-primary)' }}>{ev.raw_value}</strong></span>}
                            {ev.normalized_value && <span>标准化：<strong style={{ color:'var(--color-accent-gold)' }}>{ev.normalized_value}</strong></span>}
                          </div>
                        )}
                        {ev.source_url && (
                          <a href={ev.source_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: 'var(--color-source-official)', display: 'block', marginTop: 4,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            🔗 {ev.source_url}
                          </a>
                        )}
                        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                          <button className="btn-table-action" onClick={() => startEdit(ev)}>编辑</button>
                          <button className="btn-table-action" onClick={() => deleteEvidence(ev.id)}>删除</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
