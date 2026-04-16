'use client'

import { useState, useCallback } from 'react'
import FinancialsTab from './FinancialsTab'
import DirectorsTab from './DirectorsTab'
import MatchingTab from './MatchingTab'
import SolutionDesignTab from './SolutionDesignTab'

// ── Utility types (JSON-serialised from Prisma) ───────────────────────────────

export type DirectorRow = {
  id: string
  full_name: string
  ic_number: string
  role: string
  employer_type: string
  employer_name: string
  epf_continuous_months: number | null
  epf_last_contribution_month: string | null
  epf_account2_balance: number | null
  ctos_score: number | null
  ccris_status: string
  ccris_notes: string | null
  income_items_json: string | null
  personal_loans_json: string | null
  total_recognized_monthly_income: number | null
  total_personal_monthly_commitment: number | null
  calculated_personal_dsr: number | null
  personal_credit_score: string | null
}

export type MatchingResultRow = {
  id: string
  product_id: string
  overall_score: string
  estimated_amount_min: number | null
  estimated_amount_max: number | null
  eligibility_flags_json: string | null
  risk_flags_json: string | null
  amount_breakdown_json: string | null
  is_selected: boolean
  selected_amount: number | null
  selected_tenure_months: number | null
  advisor_override_notes: string | null
  calculated_at: string
  product: {
    id: string
    product_code: string
    product_name_zh: string
    product_name_en: string
    loan_structure: string
    guarantee_scheme: string
    bank: {
      code: string
      name_zh: string
    }
  }
}

export type CaseDetailProps = {
  case_: {
    id: string
    case_reference: string
    status: string
    requested_amount: number
    purpose: string
    urgency: string
    notes: string | null
    follow_up_date: string | null
    client: {
      company_name: string
      ssm_number: string
      company_type: string
      industry_category: string
      incorporation_date: string
    }
    financials: null | {
      id: string
      annual_revenue_y1: number | null
      annual_revenue_y2: number | null
      annual_revenue_y3: number | null
      net_profit_y1: number | null
      net_profit_y2: number | null
      net_profit_y3: number | null
      ebitda_y1: number | null
      ebitda_y2: number | null
      has_audited_accounts: boolean
      has_tax_filing: boolean
      avg_monthly_inflow_6m: number | null
      avg_monthly_inflow_12m: number | null
      avg_monthly_ending_balance: number | null
      bounce_cheque_count_12m: number | null
      cash_inflow_pct: number | null
      single_customer_concentration_pct: number | null
      total_existing_monthly_repayment: number | null
      total_existing_outstanding: number | null
      ctos_score: number | null
      ctos_grade: string | null
      ccris_status: string
      ccris_notes: string | null
      effective_monthly_inflow: number | null
      calculated_dscr: number | null
      calculated_fcf: number | null
      total_debt_to_annual_revenue_pct: number | null
      bank_accounts: {
        id: string
        bank_name: string
        account_number_last4: string
        is_primary: boolean
        avg_monthly_inflow: number | null
        avg_ending_balance: number | null
        months_of_data: number
        bounce_count: number
        cash_inflow_pct: number | null
      }[]
      existing_loans: {
        id: string
        bank_name: string
        product_type: string
        outstanding_balance: number
        monthly_repayment: number
        maturity_date: string | null
        is_secured: boolean
      }[]
      collaterals: {
        id: string
        type: string
        description: string
        estimated_market_value: number
        existing_encumbrance: number
        net_equity: number
        valuation_date: string | null
        title_type: string | null
      }[]
    }
    directors: DirectorRow[]
    matching_results: MatchingResultRow[]
  }
}

const STATUS_ZH: Record<string, string> = {
  INTAKE: '接案中', ANALYSIS: '分析中', ADVISOR_REVIEW: '顾问审核',
  STRUCTURE_READY: '方案已定', SUBMISSION: '提交中', PENDING_BANK: '等待银行',
  APPROVED: '已批准', REJECTED: '被拒绝', DISBURSED: '已放款', CLOSED: '已结案',
}
const PURPOSE_ZH: Record<string, string> = {
  WORKING_CAPITAL: '营运资金', PROPERTY_PURCHASE: '物业购置',
  EQUIPMENT_MACHINERY: '设备/机械', BUSINESS_EXPANSION: '业务扩张',
  DEBT_REFINANCING: '债务重组', TRADE_FINANCING: '贸易融资',
  PROJECT_FINANCING: '项目融资', OTHER: '其他',
}

const TABS = [
  { key: 'financials', label: '财务数据' },
  { key: 'directors',  label: '董事信用' },
  { key: 'matching',   label: '匹配结果' },
  { key: 'solution',   label: '方案设计' },
  { key: 'docs',       label: '文件清单' },
]

export default function CaseDetailClient({ case_ }: CaseDetailProps) {
  const [activeTab, setActiveTab] = useState('financials')
  const [financials, setFinancials] = useState(case_.financials)
  const [directors, setDirectors]   = useState<DirectorRow[]>(case_.directors)
  const [matchingResults, setMatchingResults] = useState<MatchingResultRow[]>(case_.matching_results)

  const handleFinancialsUpdate = useCallback((updated: CaseDetailProps['case_']['financials']) => {
    setFinancials(updated)
  }, [])

  return (
    <div className="page-content">
      {/* Case header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>{case_.case_reference}</h2>
              <span className="status-badge badge-todo" style={{ fontSize: 11 }}>
                {STATUS_ZH[case_.status] ?? case_.status}
              </span>
              <span className="status-badge badge-missing" style={{ fontSize: 11 }}>
                {PURPOSE_ZH[case_.purpose] ?? case_.purpose}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {case_.client.company_name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              {case_.client.industry_category} · SSM {case_.client.ssm_number}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="amount-display">
              <span className="amount-currency">RM</span>
              {case_.requested_amount.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>申请金额</div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="tab-nav" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key}
            className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
            {t.key === 'matching' && matchingResults.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--color-accent-subtle)', borderRadius: 10,
                padding: '1px 7px', fontSize: 11, fontFamily: 'var(--font-inter)' }}>
                {matchingResults.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'financials' && (
        <FinancialsTab caseId={case_.id} financials={financials} onUpdate={handleFinancialsUpdate} />
      )}
      {activeTab === 'directors' && (
        <DirectorsTab caseId={case_.id} directors={directors} onUpdate={setDirectors} />
      )}
      {activeTab === 'matching' && (
        <MatchingTab
          caseId={case_.id}
          results={matchingResults}
          onResultsUpdate={setMatchingResults}
        />
      )}
      {activeTab === 'solution' && (
        <SolutionDesignTab
          caseId={case_.id}
          results={matchingResults}
          onResultsUpdate={setMatchingResults}
        />
      )}
      {activeTab === 'docs' && (
        <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
          文件清单 — Phase 6 实现
        </div>
      )}
    </div>
  )
}
