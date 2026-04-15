// =============================================================================
// BCIS — Case Domain Types (Engine View)
//
// Defines the read-only shape of case data as consumed by:
//   computeEligibilityFlags / computeRiskFlags / computeAmountRange
//
// NOT a full Prisma record mirror. Only fields referenced in the approved
// engine logic skeleton are present.
// Full Prisma record types live in @/generated/prisma/client.
// No business logic. No numeric values.
// =============================================================================

// -----------------------------------------------------------------------------
// Domain enums — Source: Corporate-Loan_Assessment.md §3.1
// -----------------------------------------------------------------------------

export type IndustryCategory =
  | 'MANUFACTURING'
  | 'TRADING_RETAIL'
  | 'FOOD_BEVERAGE'
  | 'CONSTRUCTION'
  | 'PROPERTY_DEVELOPER'
  | 'IT_TECHNOLOGY'
  | 'PROFESSIONAL_SERVICES'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'LOGISTICS_TRANSPORT'
  | 'AGRICULTURE'
  | 'HOSPITALITY_TOURISM'
  | 'FINANCIAL_SERVICES'
  | 'OTHER'

export type CompanyType =
  | 'SDN_BHD'
  | 'BHD'
  | 'ENTERPRISE'
  | 'PARTNERSHIP'
  | 'LLP'
  | 'SOLE_PROPRIETOR'

export type CcrisStatus =
  | 'CLEAN'
  | 'MINOR_ISSUE'
  | 'MAJOR_ISSUE'
  | 'UNKNOWN'

export type CollateralType =
  | 'RESIDENTIAL_PROPERTY'
  | 'COMMERCIAL_PROPERTY'
  | 'INDUSTRIAL_PROPERTY'
  | 'LAND'
  | 'FIXED_DEPOSIT'
  | 'SHARES'
  | 'OTHER'

// -----------------------------------------------------------------------------
// CollateralView
// Engine-visible projection of a Collateral record.
// netEquity is pre-computed by the financial calculator before the engine runs.
// -----------------------------------------------------------------------------

export interface CollateralView {
  type: CollateralType
  estimatedMarketValue: number
  existingEncumbrance: number
  /**
   * Read-only. Pre-computed: estimatedMarketValue - existingEncumbrance.
   * Used by COLLATERAL_INSUFFICIENT eligibility flag against
   * productConfig.ltvMax and productConfig.collateralCoverageMin.
   */
  netEquity: number
}

// -----------------------------------------------------------------------------
// CaseFinancialsForEngine
// Engine-visible projection of CaseFinancials.
// Contains only fields referenced in the approved engine function skeletons.
//
// Fields marked "engine-computed" are set by the financial calculator before
// runCreditMatching is called. The engine treats them as read-only inputs.
// -----------------------------------------------------------------------------

export interface CaseFinancialsForEngine {

  // -- Revenue & profitability ------------------------------------------------
  annualRevenueY1: number | null
  annualRevenueY2: number | null
  annualRevenueY3: number | null

  /**
   * Y1/Y2/Y3 net profit.
   * Used by BELOW_MIN_PROFITABLE_YEARS to count consecutive profitable years.
   */
  netProfitY1: number | null
  netProfitY2: number | null
  netProfitY3: number | null

  /**
   * EBITDA Year 1.
   * Used in Method C (DSCR back-calculation) amount sizing.
   */
  ebitdaY1: number | null

  // -- Bank statement quality -------------------------------------------------
  /**
   * Average monthly bank inflow — 6-month window (RM).
   * Primary input for Method A turnover-based amount sizing.
   */
  avgMonthlyInflow6m: number | null

  /**
   * Average monthly bank inflow — 12-month window (RM).
   * Fallback when avgMonthlyInflow6m is unavailable.
   */
  avgMonthlyInflow12m: number | null

  /**
   * Average month-end bank balance (RM).
   * Used in low-balance-ratio check for STATEMENT_QUALITY_ISSUE flag.
   */
  avgMonthlyEndingBalance: number | null

  /**
   * Bounced / returned cheque count in the last 12 months.
   * Drives HIGH_BOUNCE_CHEQUES EligibilityFlag / RiskFlag and
   * applyStatementDiscounts() tier selection.
   */
  bounceChequeCount12m: number | null

  /**
   * Cash inflow as a proportion of total inflow (0.0–1.0).
   * Drives HIGH_CASH_INFLOW_PCT RiskFlag and discount multiplier.
   */
  cashInflowPct: number | null

  /**
   * Single-customer inflow as a proportion of total inflow (0.0–1.0).
   * Drives HIGH_CUSTOMER_CONCENTRATION RiskFlag and discount multiplier.
   */
  singleCustomerConcentrationPct: number | null

  // -- Existing debt ----------------------------------------------------------
  /**
   * Sum of all existing monthly loan repayments (RM).
   * Used in DSCR denominator and instalments-to-FCF ratio check.
   */
  totalExistingMonthlyRepayment: number | null

  /**
   * Sum of all existing outstanding loan balances (RM).
   * Used in LEVERAGE_HIGH RiskFlag (total debt / annual revenue ratio).
   */
  totalExistingOutstanding: number | null

  // -- Credit profile ---------------------------------------------------------
  /**
   * CTOS score (integer).
   * Drives CTOS_BELOW_MIN EligibilityFlag and CTOS_WEAK RiskFlag.
   */
  ctosScore: number | null

  /**
   * CCRIS status.
   * Drives CCRIS_MAJOR_ISSUE EligibilityFlag and CCRIS_MINOR_ISSUE RiskFlag.
   */
  ccrisStatus: CcrisStatus

  // -- Collaterals ------------------------------------------------------------
  /**
   * All collateral items with pre-computed netEquity values.
   * Used by COLLATERAL_INSUFFICIENT eligibility flag.
   */
  collaterals: CollateralView[]

  // -- Engine-computed fields (read-only inputs) ------------------------------

  /**
   * Effective monthly inflow after applyStatementDiscounts().
   * Pre-computed by the financial calculator before the engine is called.
   */
  effectiveMonthlyInflow: number | null

  /**
   * Debt Service Coverage Ratio.
   * Pre-computed: ebitdaY1 / (totalExistingMonthlyRepayment * 12).
   * Drives BELOW_PRODUCT_DSCR_MIN EligibilityFlag and DSCR_WEAK RiskFlag.
   */
  calculatedDscr: number | null

  /**
   * Ratio of totalExistingOutstanding to annualRevenueY1 (%).
   * Pre-computed. Drives LEVERAGE_HIGH RiskFlag.
   */
  totalDebtToAnnualRevenuePct: number | null
}

// -----------------------------------------------------------------------------
// ClientForEngine
// Engine-visible projection of the Client record.
// -----------------------------------------------------------------------------

export interface ClientForEngine {
  /**
   * Company registration date.
   * Used to compute operating age in months for BELOW_MIN_YEARS_IN_BUSINESS
   * and SHORT_TRACK_RECORD checks.
   */
  incorporationDate: Date

  /**
   * Legal company structure.
   * Compared against productConfig.eligibleCompanyTypes for
   * PRODUCT_SPECIFIC_HARDBLOCK checks.
   */
  companyType: CompanyType

  /**
   * Primary industry classification.
   * Compared against product/bank exclusion lists (INDUSTRY_EXCLUDED) and
   * the industry risk mapping (INDUSTRY_HIGH_RISK / BANK_DISCOURAGED_INDUSTRY).
   */
  industryCategory: IndustryCategory

  /**
   * Whether the company is Bumiputera-owned.
   * Referenced in PRODUCT_SPECIFIC_HARDBLOCK for products that restrict
   * or require Bumiputera ownership.
   */
  bumiputeraStatus: boolean
}

// -----------------------------------------------------------------------------
// CaseWithFinancials
// Primary type consumed by all matching engine functions.
//
// This is the minimal read-only view of a Case enriched with its financial
// data and client profile. A mapper in the API layer constructs this from
// Prisma records before passing it to the engine.
// -----------------------------------------------------------------------------

export interface CaseWithFinancials {
  /** Prisma Case.id */
  id: string

  /**
   * Amount requested by the client / advisor (RM).
   * Compared against bankConfig.preferredLoanSizeMin/Max for loan-size
   * preference risk flags.
   */
  requestedAmount: number

  /** Client profile fields required by eligibility and risk evaluation. */
  client: ClientForEngine

  /** Financial data required by eligibility, risk, and amount calculation. */
  financials: CaseFinancialsForEngine
}
