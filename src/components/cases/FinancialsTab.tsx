'use client'

import { useState } from 'react'
import type { CaseDetailProps } from './CaseDetailClient'

type Fin = NonNullable<CaseDetailProps['case_']['financials']>

type Props = {
  caseId:   string
  financials: Fin | null
  onUpdate: (f: Fin) => void
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function rm(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `RM ${v.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function pct(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `${(v * 100).toFixed(1)}%`
}

function num(v: number | null | undefined, dp = 2) {
  if (v === null || v === undefined) return '—'
  return v.toFixed(dp)
}

function ReadOnlyField({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const color = positive === undefined ? 'var(--color-text-primary)'
    : positive ? 'var(--color-credit)' : 'var(--color-debit)'
  return (
    <div style={{ background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-playfair)', fontVariantNumeric: 'tabular-nums',
        fontSize: 17, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FinancialsTab({ caseId, financials, onUpdate }: Props) {
  const fin = financials
  const [saving, setSaving] = useState(false)
  const [addingAccount, setAddingAccount] = useState(false)
  const [addingLoan, setAddingLoan] = useState(false)
  const [addingCollateral, setAddingCollateral] = useState(false)

  // ── Section A state ───────────────────────────────────────────────────────
  const [revA, setRevA] = useState({
    annual_revenue_y1: fin?.annual_revenue_y1 ?? '',
    annual_revenue_y2: fin?.annual_revenue_y2 ?? '',
    annual_revenue_y3: fin?.annual_revenue_y3 ?? '',
    net_profit_y1:     fin?.net_profit_y1     ?? '',
    net_profit_y2:     fin?.net_profit_y2     ?? '',
    net_profit_y3:     fin?.net_profit_y3     ?? '',
    ebitda_y1:         fin?.ebitda_y1         ?? '',
    ebitda_y2:         fin?.ebitda_y2         ?? '',
    has_audited_accounts: fin?.has_audited_accounts ?? false,
    has_tax_filing:       fin?.has_tax_filing       ?? false,
  })

  // ── Section D state ───────────────────────────────────────────────────────
  const [creditState, setCreditState] = useState({
    ctos_score:   fin?.ctos_score   ?? '',
    ccris_status: fin?.ccris_status ?? 'UNKNOWN',
    ccris_notes:  fin?.ccris_notes  ?? '',
  })

  async function saveSection(data: Record<string, unknown>) {
    setSaving(true)
    const res = await fetch(`/api/cases/${caseId}/financials`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const json = await res.json()
    setSaving(false)
    if (json.data) onUpdate(json.data)
  }

  // ── Add bank account ──────────────────────────────────────────────────────
  const [newAcct, setNewAcct] = useState({ bank_name: '', account_number_last4: '', is_primary: false,
    avg_monthly_inflow: '', avg_ending_balance: '', months_of_data: '6', bounce_count: '0', cash_inflow_pct: '' })

  async function saveAccount() {
    setSaving(true)
    const res = await fetch(`/api/cases/${caseId}/bank-accounts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAcct, avg_monthly_inflow: Number(newAcct.avg_monthly_inflow) || undefined,
        avg_ending_balance: Number(newAcct.avg_ending_balance) || undefined,
        months_of_data: Number(newAcct.months_of_data), bounce_count: Number(newAcct.bounce_count),
        cash_inflow_pct: newAcct.cash_inflow_pct ? Number(newAcct.cash_inflow_pct) / 100 : undefined }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.data?.financials) { onUpdate(json.data.financials); setAddingAccount(false) }
  }

  // ── Add existing loan ─────────────────────────────────────────────────────
  const [newLoan, setNewLoan] = useState({ bank_name: '', product_type: 'Term Loan',
    outstanding_balance: '', monthly_repayment: '', maturity_date: '', is_secured: false })

  async function saveLoan() {
    setSaving(true)
    const res = await fetch(`/api/cases/${caseId}/existing-loans`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newLoan, outstanding_balance: Number(newLoan.outstanding_balance),
        monthly_repayment: Number(newLoan.monthly_repayment) }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.data?.financials) { onUpdate(json.data.financials); setAddingLoan(false) }
  }

  // ── Add collateral ────────────────────────────────────────────────────────
  const COLLATERAL_TYPES = ['RESIDENTIAL_PROPERTY','COMMERCIAL_PROPERTY','INDUSTRIAL_PROPERTY','LAND','FIXED_DEPOSIT','SHARES','OTHER']
  const COLLATERAL_ZH: Record<string,string> = {
    RESIDENTIAL_PROPERTY:'住宅物业', COMMERCIAL_PROPERTY:'商业物业',
    INDUSTRIAL_PROPERTY:'工业物业', LAND:'土地', FIXED_DEPOSIT:'定期存款', SHARES:'股票', OTHER:'其他',
  }
  const [newColl, setNewColl] = useState({ type: 'RESIDENTIAL_PROPERTY', description: '',
    estimated_market_value: '', existing_encumbrance: '0', valuation_date: '', title_type: '' })

  async function saveCollateral() {
    setSaving(true)
    const res = await fetch(`/api/cases/${caseId}/collaterals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newColl,
        estimated_market_value: Number(newColl.estimated_market_value),
        existing_encumbrance: Number(newColl.existing_encumbrance) || 0 }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.data?.financials) { onUpdate(json.data.financials); setAddingCollateral(false) }
  }

  async function deleteItem(endpoint: string) {
    const res = await fetch(endpoint, { method: 'DELETE' })
    const json = await res.json()
    if (json.data?.financials) onUpdate(json.data.financials)
    else if (json.data) {
      // refetch
      const r2 = await fetch(`/api/cases/${caseId}/financials`)
      const j2 = await r2.json()
      if (j2.data) onUpdate(j2.data)
    }
  }

  const sectionHeader = (title: string) => (
    <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8, marginBottom: 16 }}>
      <span className="section-label">{title}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── A. Revenue & Profit ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22 }}>
        {sectionHeader('A. 营收与利润')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 18px' }}>
          {(['y1','y2','y3'] as const).map(yr => (
            <div key={yr}>
              <label className="form-label">年营收 {yr.toUpperCase()} (RM)</label>
              <input className="form-input" type="number"
                value={revA[`annual_revenue_${yr}` as keyof typeof revA] as string}
                onChange={e => setRevA(p => ({ ...p, [`annual_revenue_${yr}`]: e.target.value }))} />
            </div>
          ))}
          {(['y1','y2','y3'] as const).map(yr => (
            <div key={yr}>
              <label className="form-label">净利润 {yr.toUpperCase()} (RM)</label>
              <input className="form-input" type="number"
                value={revA[`net_profit_${yr}` as keyof typeof revA] as string}
                onChange={e => setRevA(p => ({ ...p, [`net_profit_${yr}`]: e.target.value }))} />
            </div>
          ))}
          {(['y1','y2'] as const).map(yr => (
            <div key={yr}>
              <label className="form-label">EBITDA {yr.toUpperCase()} (RM)</label>
              <input className="form-input" type="number"
                value={revA[`ebitda_${yr}` as keyof typeof revA] as string}
                onChange={e => setRevA(p => ({ ...p, [`ebitda_${yr}`]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, gridColumn: '1 / -1', marginTop: 4 }}>
            {[['has_audited_accounts','有 Audited Accounts'],['has_tax_filing','有税务报表']] .map(([k,lbl]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={revA[k as keyof typeof revA] as boolean}
                  onChange={e => setRevA(p => ({ ...p, [k]: e.target.checked }))} />
                {lbl}
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 20px' }}
            disabled={saving}
            onClick={() => saveSection({
              annual_revenue_y1: revA.annual_revenue_y1 || null,
              annual_revenue_y2: revA.annual_revenue_y2 || null,
              annual_revenue_y3: revA.annual_revenue_y3 || null,
              net_profit_y1: revA.net_profit_y1 || null,
              net_profit_y2: revA.net_profit_y2 || null,
              net_profit_y3: revA.net_profit_y3 || null,
              ebitda_y1: revA.ebitda_y1 || null,
              ebitda_y2: revA.ebitda_y2 || null,
              has_audited_accounts: revA.has_audited_accounts,
              has_tax_filing: revA.has_tax_filing,
            })}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {/* ── B. Bank Statements ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22 }}>
        {sectionHeader('B. 银行流水')}
        {fin?.bank_accounts && fin.bank_accounts.length > 0 && (
          <div className="table-scroll-wrap" style={{ marginBottom: 14 }}>
            <table>
              <thead><tr>
                <th>银行</th><th>账号后4位</th><th>月均进账 (RM)</th>
                <th>月均结余 (RM)</th><th>退票次数</th><th>流水月数</th><th>操作</th>
              </tr></thead>
              <tbody>
                {fin.bank_accounts.map(a => (
                  <tr key={a.id}>
                    <td>{a.bank_name}{a.is_primary && <span className="status-badge badge-confirmed" style={{marginLeft:6,fontSize:10}}>主</span>}</td>
                    <td style={{ fontFamily: 'monospace' }}>****{a.account_number_last4}</td>
                    <td className="amount-credit">{a.avg_monthly_inflow !== null ? `RM ${a.avg_monthly_inflow.toLocaleString()}` : '—'}</td>
                    <td className={a.avg_ending_balance !== null && a.avg_ending_balance < 0 ? 'amount-debit' : 'amount-neutral'}>
                      {a.avg_ending_balance !== null ? `RM ${a.avg_ending_balance.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ color: a.bounce_count > 0 ? 'var(--color-status-alert)' : undefined, fontWeight: a.bounce_count > 0 ? 700 : undefined }}>
                      {a.bounce_count}
                    </td>
                    <td>{a.months_of_data}M</td>
                    <td>
                      <button className="btn-table-action"
                        onClick={() => deleteItem(`/api/cases/${caseId}/bank-accounts?accountId=${a.id}`)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {fin.bank_accounts.length > 0 && (
                  <tr style={{ background: 'var(--color-bg-muted)', fontWeight: 600 }}>
                    <td colSpan={2}>合计有效进账</td>
                    <td className="amount-credit">{rm(fin.effective_monthly_inflow)}</td>
                    <td colSpan={4} style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      （扣除流水折扣后）
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {addingAccount ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 16px', padding: '16px', background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
            {[['bank_name','银行名称'],['account_number_last4','账号后4位']].map(([k,lbl]) => (
              <div key={k}>
                <label className="form-label">{lbl}</label>
                <input className="form-input" value={newAcct[k as keyof typeof newAcct] as string}
                  onChange={e => setNewAcct(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            {[['avg_monthly_inflow','月均进账 (RM)'],['avg_ending_balance','月均结余 (RM)'],['months_of_data','流水月数'],['bounce_count','退票次数'],['cash_inflow_pct','现金进账比例 (%)']].map(([k,lbl]) => (
              <div key={k}>
                <label className="form-label">{lbl}</label>
                <input className="form-input" type="number" value={newAcct[k as keyof typeof newAcct] as string}
                  onChange={e => setNewAcct(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="isPrimary" checked={newAcct.is_primary}
                onChange={e => setNewAcct(p => ({ ...p, is_primary: e.target.checked }))} />
              <label htmlFor="isPrimary" style={{ fontSize: 13 }}>主账户</label>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
                onClick={() => setAddingAccount(false)}>取消</button>
              <button className="btn btn-primary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
                disabled={saving} onClick={saveAccount}>{saving ? '…' : '添加'}</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
            onClick={() => setAddingAccount(true)}>+ 添加账户</button>
        )}
      </div>

      {/* ── C. Existing Loans ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22 }}>
        {sectionHeader('C. 现有贷款结构')}
        {fin?.existing_loans && fin.existing_loans.length > 0 && (
          <div className="table-scroll-wrap" style={{ marginBottom: 14 }}>
            <table>
              <thead><tr>
                <th>银行</th><th>类型</th><th>余额 (RM)</th><th>月供 (RM)</th><th>到期日</th><th>操作</th>
              </tr></thead>
              <tbody>
                {fin.existing_loans.map(l => (
                  <tr key={l.id}>
                    <td>{l.bank_name}</td>
                    <td>{l.product_type}</td>
                    <td className="amount-debit">RM {l.outstanding_balance.toLocaleString()}</td>
                    <td className="amount-debit">RM {l.monthly_repayment.toLocaleString()}</td>
                    <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {l.maturity_date ? new Date(l.maturity_date).toLocaleDateString('zh-MY') : '—'}
                    </td>
                    <td>
                      <button className="btn-table-action"
                        onClick={() => deleteItem(`/api/cases/${caseId}/existing-loans?loanId=${l.id}`)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--color-bg-muted)', fontWeight: 600 }}>
                  <td colSpan={2}>合计</td>
                  <td className="amount-debit">{rm(fin.total_existing_outstanding)}</td>
                  <td className="amount-debit">{rm(fin.total_existing_monthly_repayment)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {addingLoan ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 16px', padding: 16, background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
            {[['bank_name','银行名称'],['product_type','贷款类型'],['outstanding_balance','余额 (RM)'],['monthly_repayment','月供 (RM)'],['maturity_date','到期日']].map(([k,lbl]) => (
              <div key={k}>
                <label className="form-label">{lbl}</label>
                <input className="form-input" type={k.includes('date') ? 'date' : k.includes('balance') || k.includes('repayment') ? 'number' : 'text'}
                  value={newLoan[k as keyof typeof newLoan] as string}
                  onChange={e => setNewLoan(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
                onClick={() => setAddingLoan(false)}>取消</button>
              <button className="btn btn-primary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
                disabled={saving} onClick={saveLoan}>{saving ? '…' : '添加'}</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
            onClick={() => setAddingLoan(true)}>+ 添加贷款</button>
        )}
      </div>

      {/* ── D. Credit Status ────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22 }}>
        {sectionHeader('D. 信用状况')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 18px' }}>
          <div>
            <label className="form-label">CTOS 分数</label>
            <input className="form-input" type="number" value={creditState.ctos_score}
              onChange={e => setCreditState(p => ({ ...p, ctos_score: e.target.value }))} placeholder="650" />
          </div>
          <div>
            <label className="form-label">CTOS 等级（自动）</label>
            <div className="form-input" style={{ background: 'var(--color-bg-inset)', cursor: 'default',
              color: fin?.ctos_grade ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
              {fin?.ctos_grade ?? '未计算'}
            </div>
          </div>
          <div>
            <label className="form-label">CCRIS 状态</label>
            <select className="form-input" value={creditState.ccris_status}
              onChange={e => setCreditState(p => ({ ...p, ccris_status: e.target.value }))}>
              <option value="CLEAN">CLEAN — 干净</option>
              <option value="MINOR_ISSUE">MINOR_ISSUE — 轻微瑕疵</option>
              <option value="MAJOR_ISSUE">MAJOR_ISSUE — 重大瑕疵</option>
              <option value="UNKNOWN">UNKNOWN — 未知</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">CCRIS 备注</label>
            <input className="form-input" value={creditState.ccris_notes}
              onChange={e => setCreditState(p => ({ ...p, ccris_notes: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 20px' }}
            disabled={saving}
            onClick={() => saveSection({
              ctos_score:   creditState.ctos_score || null,
              ccris_status: creditState.ccris_status,
              ccris_notes:  creditState.ccris_notes || null,
            })}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {/* ── E. Collaterals ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 22 }}>
        {sectionHeader('E. 抵押物清单')}
        {fin?.collaterals && fin.collaterals.length > 0 && (
          <div className="table-scroll-wrap" style={{ marginBottom: 14 }}>
            <table>
              <thead><tr>
                <th>类型</th><th>描述</th><th>市价 (RM)</th>
                <th>现有贷款余额 (RM)</th><th>净权益 (RM)</th><th>操作</th>
              </tr></thead>
              <tbody>
                {fin.collaterals.map(c => (
                  <tr key={c.id}>
                    <td><span className="status-badge badge-todo" style={{ fontSize: 11 }}>{COLLATERAL_ZH[c.type] ?? c.type}</span></td>
                    <td style={{ fontSize: 13 }}>{c.description || '—'}</td>
                    <td className="amount-credit">RM {c.estimated_market_value.toLocaleString()}</td>
                    <td className="amount-debit">RM {c.existing_encumbrance.toLocaleString()}</td>
                    <td className={c.net_equity >= 0 ? 'amount-credit' : 'amount-debit'}>RM {c.net_equity.toLocaleString()}</td>
                    <td>
                      <button className="btn-table-action"
                        onClick={() => deleteItem(`/api/cases/${caseId}/collaterals?collateralId=${c.id}`)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {addingCollateral ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 16px', padding: 16, background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
            <div>
              <label className="form-label">类型</label>
              <select className="form-input" value={newColl.type} onChange={e => setNewColl(p => ({ ...p, type: e.target.value }))}>
                {COLLATERAL_TYPES.map(t => <option key={t} value={t}>{COLLATERAL_ZH[t] ?? t}</option>)}
              </select>
            </div>
            {[['description','描述'],['estimated_market_value','市价 (RM)'],['existing_encumbrance','现有贷款余额 (RM)'],['valuation_date','估值日期'],['title_type','地契类型']].map(([k,lbl]) => (
              <div key={k}>
                <label className="form-label">{lbl}</label>
                <input className="form-input"
                  type={k.includes('date') ? 'date' : k.includes('value') || k.includes('encumbrance') ? 'number' : 'text'}
                  value={newColl[k as keyof typeof newColl]}
                  onChange={e => setNewColl(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
                onClick={() => setAddingCollateral(false)}>取消</button>
              <button className="btn btn-primary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
                disabled={saving} onClick={saveCollateral}>{saving ? '…' : '添加'}</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" style={{ fontSize: 12, minHeight: 36, padding: '8px 18px' }}
            onClick={() => setAddingCollateral(true)}>+ 添加抵押物</button>
        )}
      </div>

      {/* ── F. Auto-calculated Indicators (read-only) ───────────────────── */}
      <div className="card" style={{ padding: 22 }}>
        {sectionHeader('F. 系统自动计算指标（只读）')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <ReadOnlyField label="有效月均进账" value={rm(fin?.effective_monthly_inflow)} positive={true} />
          <ReadOnlyField label="企业 DSCR"
            value={num(fin?.calculated_dscr)}
            positive={fin != null && fin.calculated_dscr != null ? fin.calculated_dscr >= 1.0 : undefined} />
          <ReadOnlyField label="自由现金流 (年)"
            value={rm(fin?.calculated_fcf)}
            positive={fin != null && fin.calculated_fcf != null ? fin.calculated_fcf >= 0 : undefined} />
          <ReadOnlyField label="总债务/年营收"
            value={fin?.total_debt_to_annual_revenue_pct != null
              ? `${fin.total_debt_to_annual_revenue_pct.toFixed(1)}%` : '—'}
            positive={fin?.total_debt_to_annual_revenue_pct != null
              ? fin.total_debt_to_annual_revenue_pct < 80 : undefined} />
          <ReadOnlyField label="现金进账比例" value={pct(fin?.cash_inflow_pct)} />
          <ReadOnlyField label="总月供"
            value={rm(fin?.total_existing_monthly_repayment)}
            positive={false} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12, marginBottom: 0 }}>
          DSCR = EBITDA_Y1 ÷ (总月供 × 12)　·　FCF = EBITDA_Y1 − (总月供 × 12)　·　修改财务数据后自动重算
        </p>
      </div>

    </div>
  )
}
