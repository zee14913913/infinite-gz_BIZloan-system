'use client'

import { useState, useCallback } from 'react'
import FinancialsTab from './FinancialsTab'

// ── Utility types (JSON-serialised from Prisma) ───────────────────────────────

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
    directors: unknown[]
    matching_results: unknown[]
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
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'financials' && (
        <FinancialsTab
          caseId={case_.id}
          financials={financials}
          onUpdate={handleFinancialsUpdate}
        />
      )}
      {activeTab === 'directors' && (
        <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
          董事信用评估 — Phase 4 实现
        </div>
      )}
      {activeTab === 'matching' && (
        <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
          匹配结果 — Phase 4 实现
        </div>
      )}
      {activeTab === 'solution' && (
        <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
          方案设计 — Phase 4 实现
        </div>
      )}
      {activeTab === 'docs' && (
        <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
          文件清单 — Phase 6 实现
        </div>
      )}
    </div>
  )
}
