// =============================================================================
// BCIS — Prisma Case → Engine CaseWithFinancials mapper
//
// Converts a fully-loaded Prisma Case record (with client + financials +
// collaterals) into the CaseWithFinancials shape the matching engine consumes.
//
// Rules:
// - All missing values map to null — no synthetic values introduced.
// - Collateral net_equity is already persisted (pre-computed at write time).
// - CcrisStatus string values are cast to the engine's CcrisStatus union.
// - CollateralType string values are cast to the engine's CollateralType union.
// =============================================================================

import type {
  Case,
  Client,
  CaseFinancials,
  Collateral,
} from '@/generated/prisma/client'
import type {
  CaseWithFinancials,
  CaseFinancialsForEngine,
  ClientForEngine,
  CollateralView,
  IndustryCategory,
  CompanyType,
  CcrisStatus,
  CollateralType,
} from '@/types/case.types'

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

// Cast helpers use `as` narrowing after runtime validation.
// Unknown values are converted to the "OTHER"/"UNKNOWN" fallback so the
// engine always receives a valid enum member rather than crashing.

function castCcrisStatus(value: string): CcrisStatus {
  const valid: CcrisStatus[] = ['CLEAN', 'MINOR_ISSUE', 'MAJOR_ISSUE', 'UNKNOWN']
  return valid.includes(value as CcrisStatus) ? (value as CcrisStatus) : 'UNKNOWN'
}

function castCollateralType(value: string): CollateralType {
  const valid: CollateralType[] = [
    'RESIDENTIAL_PROPERTY', 'COMMERCIAL_PROPERTY', 'INDUSTRIAL_PROPERTY',
    'LAND', 'FIXED_DEPOSIT', 'SHARES', 'OTHER',
  ]
  return valid.includes(value as CollateralType) ? (value as CollateralType) : 'OTHER'
}

function castIndustryCategory(value: string): IndustryCategory {
  const valid: IndustryCategory[] = [
    'MANUFACTURING', 'TRADING_RETAIL', 'FOOD_BEVERAGE', 'CONSTRUCTION',
    'PROPERTY_DEVELOPER', 'IT_TECHNOLOGY', 'PROFESSIONAL_SERVICES', 'EDUCATION',
    'HEALTHCARE', 'LOGISTICS_TRANSPORT', 'AGRICULTURE', 'HOSPITALITY_TOURISM',
    'FINANCIAL_SERVICES', 'OTHER',
  ]
  return valid.includes(value as IndustryCategory) ? (value as IndustryCategory) : 'OTHER'
}

function castCompanyType(value: string): CompanyType {
  const valid: CompanyType[] = [
    'SDN_BHD', 'BHD', 'ENTERPRISE', 'PARTNERSHIP', 'LLP', 'SOLE_PROPRIETOR',
  ]
  return valid.includes(value as CompanyType) ? (value as CompanyType) : 'SDN_BHD'
}

// ---------------------------------------------------------------------------
// mapCollateral
// ---------------------------------------------------------------------------

function mapCollateral(c: Collateral): CollateralView {
  return {
    type:                  castCollateralType(c.type),
    estimatedMarketValue:  c.estimated_market_value,
    existingEncumbrance:   c.existing_encumbrance,
    netEquity:             c.net_equity,
  }
}

// ---------------------------------------------------------------------------
// mapFinancials
// ---------------------------------------------------------------------------

function mapFinancials(
  f: CaseFinancials & { collaterals: Collateral[] },
): CaseFinancialsForEngine {
  return {
    annualRevenueY1: f.annual_revenue_y1,
    annualRevenueY2: f.annual_revenue_y2,
    annualRevenueY3: f.annual_revenue_y3,
    netProfitY1:     f.net_profit_y1,
    netProfitY2:     f.net_profit_y2,
    netProfitY3:     f.net_profit_y3,
    ebitdaY1:        f.ebitda_y1,

    avgMonthlyInflow6m:    f.avg_monthly_inflow_6m,
    avgMonthlyInflow12m:   f.avg_monthly_inflow_12m,
    avgMonthlyEndingBalance: f.avg_monthly_ending_balance,
    bounceChequeCount12m:  f.bounce_cheque_count_12m,
    cashInflowPct:         f.cash_inflow_pct,
    singleCustomerConcentrationPct: f.single_customer_concentration_pct,

    totalExistingMonthlyRepayment: f.total_existing_monthly_repayment,
    totalExistingOutstanding:      f.total_existing_outstanding,

    ctosScore:    f.ctos_score,
    ccrisStatus:  castCcrisStatus(f.ccris_status),

    collaterals:  f.collaterals.map(mapCollateral),

    // Engine-computed fields — read directly from persisted values.
    // These are written by the financial calculator before matching runs.
    effectiveMonthlyInflow:      f.effective_monthly_inflow,
    calculatedDscr:              f.calculated_dscr,
    totalDebtToAnnualRevenuePct: f.total_debt_to_annual_revenue_pct,
  }
}

// ---------------------------------------------------------------------------
// Prisma input type expected by this mapper
// ---------------------------------------------------------------------------

export type CaseWithRelations = Case & {
  client: Client
  financials: (CaseFinancials & { collaterals: Collateral[] }) | null
}

// ---------------------------------------------------------------------------
// mapCaseToEngineCase — main export
// ---------------------------------------------------------------------------

export function mapCaseToEngineCase(record: CaseWithRelations): CaseWithFinancials {
  const client: ClientForEngine = {
    incorporationDate: record.client.incorporation_date,
    companyType:       castCompanyType(record.client.company_type),
    industryCategory:  castIndustryCategory(record.client.industry_category),
    bumiputeraStatus:  record.client.bumiputera_status,
  }

  // Build a safe empty financials when the record has none yet
  const emptyFinancials: CaseFinancialsForEngine = {
    annualRevenueY1: null, annualRevenueY2: null, annualRevenueY3: null,
    netProfitY1: null, netProfitY2: null, netProfitY3: null,
    ebitdaY1: null,
    avgMonthlyInflow6m: null, avgMonthlyInflow12m: null,
    avgMonthlyEndingBalance: null,
    bounceChequeCount12m: null,
    cashInflowPct: null,
    singleCustomerConcentrationPct: null,
    totalExistingMonthlyRepayment: null,
    totalExistingOutstanding: null,
    ctosScore: null,
    ccrisStatus: 'UNKNOWN',
    collaterals: [],
    effectiveMonthlyInflow: null,
    calculatedDscr: null,
    totalDebtToAnnualRevenuePct: null,
  }

  return {
    id:              record.id,
    requestedAmount: record.requested_amount,
    client,
    financials:      record.financials ? mapFinancials(record.financials) : emptyFinancials,
  }
}
