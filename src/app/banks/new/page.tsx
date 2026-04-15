'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INSTITUTION_TYPE, type InstitutionTypeValue } from '@/lib/enums'

export default function NewBankPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    code: '', name_en: '', name_zh: '', name_bm: '',
    type: INSTITUTION_TYPE.COMMERCIAL_BANK as InstitutionTypeValue,
    is_shariah_compliant: false, official_website: '',
    cgc_partner: false, sjpp_partner: false, bnm_fund_partner: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function upd(k: string, v: unknown) { setForm(prev => ({ ...prev, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const r = await fetch('/api/banks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const j = await r.json()
      if (!r.ok) { setError(j.error ?? 'Failed'); return }
      router.push(`/banks/${j.data.code}`)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>Add Institution</h2>
      <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ color: 'var(--color-status-alert)', fontSize: 14, padding: '8px 12px', background: 'var(--color-status-alert-bg)', borderRadius: 'var(--radius-md)' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Code', 'code','text','MBB'],['Name (EN)','name_en','text','Maybank'],['Name (ZH)','name_zh','text','马来亚银行'],['Name (BM)','name_bm','text','Maybank'],['Website','official_website','url','https://'],].map(([lbl,k,,ph]) => (
            <div key={k as string}>
              <label className="form-label">{lbl}</label>
              <input className="form-input" placeholder={ph as string} value={(form as Record<string,unknown>)[k as string] as string}
                onChange={e => upd(k as string, e.target.value)} required={k === 'code' || k === 'name_en'} />
            </div>
          ))}
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => upd('type', e.target.value)}>
              {Object.values(INSTITUTION_TYPE).map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['CGC Partner','cgc_partner'],['SJPP Partner','sjpp_partner'],['BNM Fund Partner','bnm_fund_partner'],['Shariah Compliant','is_shariah_compliant']].map(([lbl,k]) => (
            <label key={k as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={(form as Record<string,unknown>)[k as string] as boolean} onChange={e => upd(k as string, e.target.checked)} />
              {lbl}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()} style={{ minHeight: 40, padding: '8px 20px' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ minHeight: 40, padding: '8px 24px' }}>
            {saving ? 'Creating…' : 'Create Institution'}
          </button>
        </div>
      </form>
    </div>
  )
}
