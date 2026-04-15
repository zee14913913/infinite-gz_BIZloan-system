'use client'
import { useState, useEffect } from 'react'
import type { Product } from '@/generated/prisma/client'
import {
  LOAN_STRUCTURE, COLLATERAL_REQUIREMENT, GUARANTEE_SCHEME,
  type LoanStructureValue, type CollateralRequirementValue, type GuaranteeSchemeValue,
} from '@/lib/enums'
import type { ProductBlockA } from '@/types/bank.types'
import { safeParseJSON, defaultBlockA } from '@/types/bank.types'

interface Props {
  bankCode: string
  product: Product | null   // null = create mode
  onClose: () => void
  onSaved: (p: Product) => void
}

type BA = ProductBlockA

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8, marginBottom: 12, marginTop: 16 }}>
      <span className="section-label">{label}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

function NumField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <Field label={label}>
      <input type="number" className="form-input"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} />
    </Field>
  )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string | null; onChange: (v: string | null) => void; placeholder?: string }) {
  return (
    <Field label={label}>
      <input className="form-input" value={value ?? ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value || null)} />
    </Field>
  )
}

function ArrayField({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <Field label={`${label} (comma-separated)`}>
      <input className="form-input" value={value.join(', ')} placeholder={placeholder}
        onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
    </Field>
  )
}

export function ProductSheet({ bankCode, product, onClose, onSaved }: Props) {
  const isCreate = !product

  const [code, setCode]       = useState(product?.product_code ?? '')
  const [nameEn, setNameEn]   = useState(product?.product_name_en ?? '')
  const [nameZh, setNameZh]   = useState(product?.product_name_zh ?? '')
  const [structure, setStruct]= useState<LoanStructureValue>(product?.loan_structure as LoanStructureValue ?? LOAN_STRUCTURE.TERM_LOAN)
  const [collateral, setColl] = useState<CollateralRequirementValue>(product?.collateral_requirement as CollateralRequirementValue ?? COLLATERAL_REQUIREMENT.UNSECURED)
  const [guarantee, setGuar]  = useState<GuaranteeSchemeValue>(product?.guarantee_scheme as GuaranteeSchemeValue ?? GUARANTEE_SCHEME.NONE)
  const [isShariah, setIsSh]  = useState(product?.is_shariah ?? false)
  const [isActive, setIsAct]  = useState(product?.is_active ?? true)
  const [ba, setBa]           = useState<BA>(() => safeParseJSON<BA>(product?.block_a_json ?? null, defaultBlockA()))
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState<string[]>([])

  useEffect(() => {
    // Reset when product changes
    setCode(product?.product_code ?? '')
    setNameEn(product?.product_name_en ?? '')
    setNameZh(product?.product_name_zh ?? '')
    setStruct(product?.loan_structure as LoanStructureValue ?? LOAN_STRUCTURE.TERM_LOAN)
    setColl(product?.collateral_requirement as CollateralRequirementValue ?? COLLATERAL_REQUIREMENT.UNSECURED)
    setGuar(product?.guarantee_scheme as GuaranteeSchemeValue ?? GUARANTEE_SCHEME.NONE)
    setIsSh(product?.is_shariah ?? false)
    setIsAct(product?.is_active ?? true)
    setBa(safeParseJSON<BA>(product?.block_a_json ?? null, defaultBlockA()))
  }, [product])

  function upd(patch: Partial<BA>) { setBa(prev => ({ ...prev, ...patch })) }

  async function submit() {
    setErrors([])
    const errs: string[] = []
    if (!code.trim()) errs.push('Product code is required')
    if (!nameEn.trim()) errs.push('Product name (EN) is required')
    if (errs.length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        product_code: code.trim(),
        product_name_en: nameEn,
        product_name_zh: nameZh,
        loan_structure: structure,
        collateral_requirement: collateral,
        guarantee_scheme: guarantee,
        is_shariah: isShariah,
        is_active: isActive,
        block_a: ba,
      }
      const url = isCreate ? `/api/banks/${bankCode}/products` : `/api/products/${product!.id}`
      const method = isCreate ? 'POST' : 'PUT'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await r.json()
      if (!r.ok) { setErrors([json.error ?? 'Save failed']); return }
      onSaved(json.data)
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
      background: 'rgba(0,0,0,0.4)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        marginLeft: 'auto', width: '100%', maxWidth: 640,
        background: 'var(--color-bg-surface)',
        height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--color-bg-header)', zIndex: 1 }}>
          <h3 className="text-gradient-gold" style={{ margin: 0, fontFamily: 'var(--font-playfair)' }}>
            {isCreate ? 'New Product' : `Edit — ${product?.product_code}`}
          </h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ minHeight: 36, padding: '6px 16px' }}>✕ Close</button>
        </div>

        <div style={{ padding: '24px', flex: 1 }}>
          {errors.length > 0 && (
            <div style={{ marginBottom: 16, padding: '10px 16px', background: 'var(--color-status-alert-bg)', border: '1px solid var(--color-status-alert)', borderRadius: 'var(--radius-md)', color: 'var(--color-status-alert)', fontSize: 13 }}>
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          {/* ── Product Basics ── */}
          <SectionLabel label="Product Basics" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Product Code *">
              <input className="form-input" value={code} onChange={e => setCode(e.target.value)} placeholder="P01" />
            </Field>
            <Field label="Active">
              <div style={{ paddingTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isActive} onChange={e => setIsAct(e.target.checked)} id="is_active" />
                <label htmlFor="is_active" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Product is active</label>
              </div>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <TextField label="Name (EN) *" value={nameEn} onChange={v => setNameEn(v ?? '')} placeholder="SME Business Loan" />
            <TextField label="Name (ZH)" value={nameZh} onChange={v => setNameZh(v ?? '')} placeholder="中小企业贷款" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <Field label="Loan Structure">
              <select className="form-select" value={structure} onChange={e => setStruct(e.target.value as LoanStructureValue)}>
                {Object.values(LOAN_STRUCTURE).map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
            <Field label="Collateral">
              <select className="form-select" value={collateral} onChange={e => setColl(e.target.value as CollateralRequirementValue)}>
                {Object.values(COLLATERAL_REQUIREMENT).map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
            <Field label="Guarantee Scheme">
              <select className="form-select" value={guarantee} onChange={e => setGuar(e.target.value as GuaranteeSchemeValue)}>
                {Object.values(GUARANTEE_SCHEME).map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isShariah} onChange={e => setIsSh(e.target.checked)} id="is_shariah" />
            <label htmlFor="is_shariah" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Shariah-compliant product</label>
          </div>

          {/* ── Block A: Loan Parameters ── */}
          <SectionLabel label="Block A — Loan Parameters" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NumField label="Min Loan Amount (RM)" value={ba.min_loan_amount} onChange={v => upd({ min_loan_amount: v })} />
            <NumField label="Max Loan Amount (RM)" value={ba.max_loan_amount} onChange={v => upd({ max_loan_amount: v })} />
            <NumField label="Min Tenure (months)" value={ba.min_tenure_months} onChange={v => upd({ min_tenure_months: v })} />
            <NumField label="Max Tenure (months)" value={ba.max_tenure_months} onChange={v => upd({ max_tenure_months: v })} />
          </div>

          {/* ── Block A: Interest Rate ── */}
          <SectionLabel label="Block A — Interest Rate" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <Field label="Rate Type">
              <select className="form-select" value={ba.rate_type ?? ''} onChange={e => upd({ rate_type: (e.target.value || null) as BA['rate_type'] })}>
                <option value="">— select —</option>
                {['FIXED','FLOATING','BFR_BASED'].map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
            <TextField label="Base Rate" value={ba.base_rate} onChange={v => upd({ base_rate: v })} placeholder="BFR+1.5%" />
            <NumField label="Rate Min (%)" value={ba.rate_min} onChange={v => upd({ rate_min: v })} />
            <NumField label="Rate Max (%)" value={ba.rate_max} onChange={v => upd({ rate_max: v })} />
          </div>

          {/* ── Block A: Applicant Qualifications ── */}
          <SectionLabel label="Block A — Applicant Qualifications" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NumField label="Min Company Age (months)" value={ba.min_company_age_months} onChange={v => upd({ min_company_age_months: v })} />
            <div />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <ArrayField label="Eligible Company Types" value={ba.eligible_company_types} onChange={v => upd({ eligible_company_types: v })} placeholder="SDN_BHD, BHD" />
            <ArrayField label="Eligible Industries" value={ba.eligible_industries} onChange={v => upd({ eligible_industries: v })} placeholder="MANUFACTURING, TRADING_RETAIL" />
            <ArrayField label="Excluded Industries" value={ba.excluded_industries} onChange={v => upd({ excluded_industries: v })} placeholder="GAMBLING, TOBACCO" />
          </div>

          {/* ── Block A: Income / Turnover ── */}
          <SectionLabel label="Block A — Income / Turnover Requirements" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NumField label="Min Annual Revenue (RM)" value={ba.min_annual_revenue} onChange={v => upd({ min_annual_revenue: v })} />
            <NumField label="Max Loan / Annual Revenue (%)" value={ba.max_loan_to_annual_revenue_pct} onChange={v => upd({ max_loan_to_annual_revenue_pct: v })} />
            <NumField label="Turnover Multiplier Min" value={ba.monthly_turnover_multiplier_min} onChange={v => upd({ monthly_turnover_multiplier_min: v })} />
            <NumField label="Turnover Multiplier Max" value={ba.monthly_turnover_multiplier_max} onChange={v => upd({ monthly_turnover_multiplier_max: v })} />
          </div>

          {/* ── Block A: DSCR ── */}
          <SectionLabel label="Block A — DSCR Requirements" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NumField label="DSCR Min" value={ba.dscr_min} onChange={v => upd({ dscr_min: v })} />
            <NumField label="DSCR Preferred" value={ba.dscr_preferred} onChange={v => upd({ dscr_preferred: v })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <TextField label="DSCR Formula Note" value={ba.dscr_formula_note} onChange={v => upd({ dscr_formula_note: v })} placeholder="EBITDA / (Total Monthly Repayment × 12)" />
          </div>

          {/* ── Block A: Collateral / Guarantee ── */}
          <SectionLabel label="Block A — Collateral / Guarantee" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <NumField label="LTV Max (%)" value={ba.ltv_max} onChange={v => upd({ ltv_max: v })} />
            <NumField label="Collateral Coverage Min (%)" value={ba.collateral_coverage_min} onChange={v => upd({ collateral_coverage_min: v })} />
            <NumField label="Guarantee Fee (%)" value={ba.guarantee_fee_pct} onChange={v => upd({ guarantee_fee_pct: v })} />
          </div>

          {/* ── Block A: Fees ── */}
          <SectionLabel label="Block A — Fees" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TextField label="Processing Fee" value={ba.processing_fee} onChange={v => upd({ processing_fee: v })} placeholder="1% of loan amount" />
            <TextField label="Stamp Duty" value={ba.stamp_duty} onChange={v => upd({ stamp_duty: v })} placeholder="0.5%" />
          </div>

          {/* ── Block A: Data Quality ── */}
          <SectionLabel label="Block A — Data Quality" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Confidence">
              <select className="form-select" value={ba.confidence ?? ''} onChange={e => upd({ confidence: (e.target.value || null) as BA['confidence'] })}>
                <option value="">— select —</option>
                {['CONFIRMED','LIKELY','ESTIMATED','CONFLICT','MISSING'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <TextField label="Last Verified Date (YYYY-MM-DD)" value={ba.last_verified_date} onChange={v => upd({ last_verified_date: v })} placeholder="2026-01-15" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <ArrayField label="Sources (URLs)" value={ba.sources} onChange={v => upd({ sources: v })} placeholder="https://bank.com/sme, https://cgc.com.my" />
            <Field label="Notes">
              <textarea
                value={ba.notes ?? ''}
                onChange={e => upd({ notes: e.target.value || null })}
                rows={3}
                style={{ width: '100%', padding: '10px 16px', fontSize: 14, border: '1px solid var(--color-border-medium)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-inter)' }} />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-light)', display: 'flex', gap: 12, justifyContent: 'flex-end', background: 'var(--color-bg-surface)', position: 'sticky', bottom: 0 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ minHeight: 40, padding: '8px 24px' }}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving} style={{ minHeight: 40, padding: '8px 28px' }}>
            {saving ? 'Saving…' : isCreate ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
