'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PURPOSES = [
  { value: 'WORKING_CAPITAL',    label: '营运资金' },
  { value: 'PROPERTY_PURCHASE',  label: '物业购置' },
  { value: 'EQUIPMENT_MACHINERY',label: '设备/机械' },
  { value: 'BUSINESS_EXPANSION', label: '业务扩张' },
  { value: 'DEBT_REFINANCING',   label: '债务重组' },
  { value: 'TRADE_FINANCING',    label: '贸易融资' },
  { value: 'PROJECT_FINANCING',  label: '项目融资' },
  { value: 'OTHER',              label: '其他' },
]

const COMPANY_TYPES = [
  { value: 'SDN_BHD',        label: 'Sdn Bhd' },
  { value: 'BHD',            label: 'Bhd (上市)' },
  { value: 'ENTERPRISE',     label: 'Enterprise' },
  { value: 'PARTNERSHIP',    label: 'Partnership' },
  { value: 'LLP',            label: 'LLP' },
  { value: 'SOLE_PROPRIETOR',label: 'Sole Proprietor' },
]

const INDUSTRIES = [
  { value: 'MANUFACTURING',         label: '制造业' },
  { value: 'TRADING_RETAIL',        label: '贸易/零售' },
  { value: 'FOOD_BEVERAGE',         label: '餐饮' },
  { value: 'CONSTRUCTION',          label: '建筑' },
  { value: 'PROPERTY_DEVELOPER',    label: '房地产开发' },
  { value: 'IT_TECHNOLOGY',         label: 'IT/科技' },
  { value: 'PROFESSIONAL_SERVICES', label: '专业服务' },
  { value: 'EDUCATION',             label: '教育' },
  { value: 'HEALTHCARE',            label: '医疗健康' },
  { value: 'LOGISTICS_TRANSPORT',   label: '物流/运输' },
  { value: 'AGRICULTURE',           label: '农业' },
  { value: 'HOSPITALITY_TOURISM',   label: '酒店/旅游' },
  { value: 'FINANCIAL_SERVICES',    label: '金融服务' },
  { value: 'OTHER',                 label: '其他' },
]

type Step = 'client' | 'loan'

export default function NewCasePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('client')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Client fields
  const [company_name, setCompanyName]   = useState('')
  const [ssm_number, setSsmNumber]       = useState('')
  const [company_type, setCompanyType]   = useState('SDN_BHD')
  const [industry, setIndustry]          = useState('TRADING_RETAIL')
  const [incorp_date, setIncorpDate]     = useState('')
  const [reg_address, setRegAddress]     = useState('')
  const [bumi, setBumi]                  = useState(false)
  const [contact_name, setContactName]   = useState('')
  const [contact_ic, setContactIc]       = useState('')
  const [contact_phone, setContactPhone] = useState('')
  const [contact_email, setContactEmail] = useState('')

  // Loan fields
  const [purpose, setPurpose]             = useState('WORKING_CAPITAL')
  const [amount, setAmount]               = useState('')
  const [max_monthly, setMaxMonthly]      = useState('')
  const [tenure, setTenure]               = useState('')
  const [urgency, setUrgency]             = useState('MEDIUM')
  const [notes, setNotes]                 = useState('')

  const clientValid = company_name && ssm_number && incorp_date && reg_address
    && contact_name && contact_ic && contact_phone && contact_email

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      // 1. Create or find client
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name, ssm_number,
          company_type, industry_category: industry,
          incorporation_date: incorp_date,
          registered_address: reg_address,
          bumiputera_status: bumi,
          primary_contact_name: contact_name,
          primary_contact_ic: contact_ic,
          primary_contact_phone: contact_phone,
          primary_contact_email: contact_email,
        }),
      })
      const clientData = await clientRes.json()

      // If SSM already exists, fetch the existing client
      let clientId: string
      if (clientRes.status === 409) {
        const listRes = await fetch(`/api/clients?q=${encodeURIComponent(ssm_number)}`)
        const listData = await listRes.json()
        clientId = listData.data?.[0]?.id
        if (!clientId) { setError('客户 SSM 已存在但无法找到记录'); setSaving(false); return }
      } else if (!clientRes.ok) {
        setError(clientData.error ?? '创建客户失败')
        setSaving(false)
        return
      } else {
        clientId = clientData.data?.id
      }

      // 2. Create case
      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          purpose,
          requested_amount: Number(amount),
          acceptable_max_monthly_repayment: max_monthly ? Number(max_monthly) : undefined,
          preferred_tenure_months: tenure ? Number(tenure) : undefined,
          urgency,
          notes: notes || undefined,
        }),
      })
      const caseData = await caseRes.json()
      if (!caseRes.ok) { setError(caseData.error ?? '创建案件失败'); setSaving(false); return }

      router.push(`/cases/${caseData.data.id}`)
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  return (
    <div className="page-content" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0 }}>新建案件</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0', fontSize: 14 }}>
          {step === 'client' ? '第一步：客户信息' : '第二步：贷款需求'}
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['client', 'loan'] as Step[]).map((s, i) => (
          <div key={s} style={{
            padding: '6px 18px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
            background: step === s ? 'var(--color-accent-gold)' : 'var(--color-bg-muted)',
            color: step === s ? '#fff' : 'var(--color-text-muted)',
          }}>
            {i + 1}. {s === 'client' ? '客户信息' : '贷款需求'}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 'var(--radius-md)',
          background: 'var(--color-status-alert-bg)', border: '1px solid var(--color-status-alert)',
          color: 'var(--color-status-alert)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        {step === 'client' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">公司名称 *</label>
              <input className="form-input" value={company_name} onChange={e => setCompanyName(e.target.value)} placeholder="ABC Sdn Bhd" />
            </div>
            <div>
              <label className="form-label">SSM 注册号 *</label>
              <input className="form-input" value={ssm_number} onChange={e => setSsmNumber(e.target.value)} placeholder="202301012345" />
            </div>
            <div>
              <label className="form-label">公司类型 *</label>
              <select className="form-input" value={company_type} onChange={e => setCompanyType(e.target.value)}>
                {COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">主要行业 *</label>
              <select className="form-input" value={industry} onChange={e => setIndustry(e.target.value)}>
                {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">注册日期 *</label>
              <input type="date" className="form-input" value={incorp_date} onChange={e => setIncorpDate(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">注册地址 *</label>
              <input className="form-input" value={reg_address} onChange={e => setRegAddress(e.target.value)} placeholder="No. 1, Jalan Ampang, 50450 Kuala Lumpur" />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="bumi" checked={bumi} onChange={e => setBumi(e.target.checked)} />
              <label htmlFor="bumi" style={{ fontSize: 14, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                Bumiputera 企业
              </label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p className="section-label" style={{ marginBottom: 12 }}>主要联系人</p>
            </div>
            <div>
              <label className="form-label">姓名 *</label>
              <input className="form-input" value={contact_name} onChange={e => setContactName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">IC 号码 *</label>
              <input className="form-input" value={contact_ic} onChange={e => setContactIc(e.target.value)} placeholder="900101-14-1234" />
            </div>
            <div>
              <label className="form-label">电话 *</label>
              <input className="form-input" value={contact_phone} onChange={e => setContactPhone(e.target.value)} placeholder="012-3456789" />
            </div>
            <div>
              <label className="form-label">电子邮件 *</label>
              <input className="form-input" type="email" value={contact_email} onChange={e => setContactEmail(e.target.value)} />
            </div>
          </div>
        )}

        {step === 'loan' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            <div>
              <label className="form-label">贷款用途 *</label>
              <select className="form-input" value={purpose} onChange={e => setPurpose(e.target.value)}>
                {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">紧急程度</label>
              <select className="form-input" value={urgency} onChange={e => setUrgency(e.target.value)}>
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            </div>
            <div>
              <label className="form-label">申请金额（RM）*</label>
              <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500000" />
            </div>
            <div>
              <label className="form-label">可接受最高月供（RM）</label>
              <input className="form-input" type="number" value={max_monthly} onChange={e => setMaxMonthly(e.target.value)} placeholder="8000" />
            </div>
            <div>
              <label className="form-label">希望年限（月）</label>
              <input className="form-input" type="number" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="60" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">备注</label>
              <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
        {step === 'loan' && (
          <button className="btn btn-secondary" onClick={() => setStep('client')}>← 返回</button>
        )}
        {step === 'client' && (
          <button className="btn btn-primary" disabled={!clientValid}
            onClick={() => setStep('loan')}>
            下一步 →
          </button>
        )}
        {step === 'loan' && (
          <button className="btn btn-primary" disabled={!amount || saving} onClick={handleSubmit}>
            {saving ? '创建中…' : '创建案件'}
          </button>
        )}
      </div>
    </div>
  )
}
