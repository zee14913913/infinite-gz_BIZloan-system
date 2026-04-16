// =============================================================================
// BCIS — Engine Policy Config Types
//
// Three-level config hierarchy: GlobalEngineDefaults → BankPolicyConfig → ProductPolicyConfig
// Resolution order: Product > Bank > Global (product value wins when non-null).
//
// No business logic. No numeric threshold values.
// Names match the approved rule-configuration architecture exactly.
// =============================================================================

import type { IndustryCategory, CompanyType } from './case.types'

// -----------------------------------------------------------------------------
// Shared sub-types
// -----------------------------------------------------------------------------

/**
 * Confidence level of a rule or data field.
 * Mirrors FieldConfidence from Corporate-Loan_Assessment.md §3.1.
 */
export type FieldConfidenceValue =
  | 'CONFIRMED'
  | 'LIKELY'
  | 'ESTIMATED'
  | 'CONFLICT'
  | 'MISSING'

/**
 * Industry risk classification used in the engine's risk-flag evaluation.
 * Stored in GlobalEngineDefaults.defaultIndustryRiskMapping and
 * BankPolicyConfig.industryRiskMapping.
 */
export type IndustryRiskLevel =
  | 'VERY_HIGH'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'VERY_LOW'

/**
 * All discount multipliers applied inside applyStatementDiscounts().
 * Tier thresholds are bounced-cheque count boundaries.
 * All multiplier fields represent factors in the range (0.0, 1.0].
 */
export interface StatementDiscountConfig {
  /** Upper bound of Tier 1 bounce count (e.g. "1 bounce is Tier 1"). */
  bounceTier1MaxCount: number

  /** Upper bound of Tier 2 bounce count. Tier 3 is anything above this. */
  bounceTier2MaxCount: number

  /** Multiplier applied to rawInflow when bounce count falls in Tier 1. */
  bounceTier1Multiplier: number

  /** Multiplier applied to rawInflow when bounce count falls in Tier 2. */
  bounceTier2Multiplier: number

  /** Multiplier applied to rawInflow when bounce count exceeds Tier 2 max. */
  bounceTier3Multiplier: number

  /**
   * Single-customer concentration % (0.0–1.0) that triggers the
   * concentration discount.
   */
  concentrationThresholdPct: number

  /** Multiplier applied to rawInflow when concentration exceeds threshold. */
  concentrationMultiplier: number

  /**
   * Ratio of (avgEndingBalance / avgInflow) below which the
   * low-balance discount applies.
   */
  lowBalanceRatioThreshold: number

  /** Multiplier applied to rawInflow when ending-balance ratio is below threshold. */
  lowBalanceMultiplier: number

  /** Cash-inflow % (0.0–1.0) above which the high-cash-inflow discount applies. */
  highCashInflowThresholdPct: number

  /** Multiplier applied to rawInflow when cash-inflow % exceeds threshold. */
  highCashInflowMultiplier: number
}

// -----------------------------------------------------------------------------
// GlobalEngineDefaults
// Market-level fallback assumptions for Malaysian SME lending.
// Every field here can be overridden at bank or product level.
// All numeric fields are type `number`; no literal values are set here.
// -----------------------------------------------------------------------------

export interface GlobalEngineDefaults {

  // -- Business track record --------------------------------------------------

  /**
   * Minimum years the company must have been operating.
   * Triggers HARD_BLOCK when violated and no product override exists.
   */
  defaultMinYearsInBusiness: number

  /**
   * Minimum consecutive years of profitable operations.
   * Violations surface as a RiskFlag, not an automatic hard block.
   */
  defaultMinProfitableYears: number

  // -- Revenue & turnover -----------------------------------------------------

  /**
   * Absolute floor for annual revenue (RM).
   * Triggers HARD_BLOCK when violated and productConfig.minAnnualRevenue is null.
   */
  defaultMinAnnualRevenue: number

  /**
   * Minimum average monthly bank inflow (RM).
   * Used when a product has no explicit turnover-based rule.
   */
  defaultMinAvgMonthlyInflow: number

  // -- CTOS -------------------------------------------------------------------

  /**
   * Minimum acceptable CTOS score.
   * Below this → HARD_BLOCK (or SOFT_BLOCK depending on bank config).
   */
  defaultMinCtosScore: number

  /**
   * Lower bound of the "soft block" CTOS range.
   * Scores in [defaultCtosSoftBlockLowerBound, defaultMinCtosScore) can be
   * escalated to HARD_BLOCK by bankConfig.ctosHardBlockOnSoftRange.
   */
  defaultCtosSoftBlockLowerBound: number

  /**
   * Score at or above which no CTOS-related flag is raised at all.
   * Scores in [defaultMinCtosScore, defaultCtosCleanThreshold) produce
   * a CTOS_WEAK RiskFlag.
   */
  defaultCtosCleanThreshold: number

  // -- CCRIS ------------------------------------------------------------------

  /**
   * Whether CCRIS MAJOR_ISSUE is an automatic HARD_BLOCK globally.
   * Individual banks can tighten or relax via ccrisStrictnessLevel.
   */
  defaultCcrisMajorIssueIsHardBlock: boolean

  /**
   * Whether CCRIS MINOR_ISSUE surfaces as a RiskFlag by default.
   * Banks can suppress this via ccrisStrictnessLevel = 'LENIENT'.
   */
  defaultCcrisMinorIssueRaisesRiskFlag: boolean

  // -- DSCR -------------------------------------------------------------------

  /**
   * Global DSCR minimum fallback.
   * Used when productConfig.dscrMin is null.
   * At the global level, violation surfaces as HIGH RiskFlag (not HARD_BLOCK).
   * Product-level dscrMin always produces HARD_BLOCK.
   */
  defaultDscrMin: number

  /**
   * Preferred DSCR.
   * Below this (but above dscrMin) → MEDIUM RiskFlag: DSCR_WEAK.
   */
  defaultDscrPreferred: number

  // -- Debt burden ------------------------------------------------------------

  /**
   * Maximum ratio of total existing debt to annual revenue (%).
   * Exceeding this → LEVERAGE_HIGH RiskFlag.
   */
  defaultMaxTotalDebtToAnnualRevenuePct: number

  /**
   * Maximum ratio of total monthly instalments to free monthly cash flow (%).
   * Free cash flow = (ebitdaY1 / 12) - totalExistingMonthlyRepayment.
   */
  defaultMaxInstalmentToFreeCashFlowPct: number

  // -- Statement quality ------------------------------------------------------

  /**
   * Bounce count above which HIGH_BOUNCE_CHEQUES RiskFlag is raised.
   * Must be less than defaultBounceChequeHardBlockThreshold.
   */
  defaultBounceChequeRiskFlagThreshold: number

  /**
   * Bounce count above which HARD_BLOCK EligibilityFlag is raised.
   */
  defaultBounceChequeHardBlockThreshold: number

  /**
   * Cash-inflow % above which HIGH_CASH_INFLOW_PCT RiskFlag is raised.
   */
  defaultMaxCashInflowPct: number

  /**
   * Single-customer concentration % above which HIGH_CUSTOMER_CONCENTRATION
   * RiskFlag is raised.
   */
  defaultMaxSingleCustomerConcentrationPct: number

  /**
   * Minimum ratio of (avgMonthlyEndingBalance / avgMonthlyInflow).
   * Below this → component of STATEMENT_QUALITY_ISSUE composite flag.
   */
  defaultMinEndingBalanceToInflowRatio: number

  // -- Statement discount multipliers ----------------------------------------

  /** All discount multipliers consumed by applyStatementDiscounts(). */
  statementDiscounts: StatementDiscountConfig

  // -- Industry risk mapping --------------------------------------------------

  /**
   * Default risk classification per IndustryCategory.
   * Per-bank overrides are stored in BankPolicyConfig.industryRiskMapping.
   */
  defaultIndustryRiskMapping: Record<IndustryCategory, IndustryRiskLevel>

  // -- Risk flag default severities ------------------------------------------

  /**
   * Default severity for HIGH_CASH_INFLOW_PCT risk flag.
   * Overridable per bank via BankPolicyConfig.cashInflowRiskSeverityOverride.
   */
  defaultCashInflowRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW'

  /**
   * Default severity for HIGH_CUSTOMER_CONCENTRATION risk flag.
   * Overridable per bank via BankPolicyConfig.customerConcentrationRiskSeverityOverride.
   */
  defaultCustomerConcentrationRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW'

  /**
   * Default severity for LEVERAGE_HIGH risk flag.
   * Overridable per bank via BankPolicyConfig.leverageHighRiskSeverityOverride.
   */
  defaultLeverageHighRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW'

  // -- Amount sizing fallbacks ------------------------------------------------

  /** Fallback lower-bound turnover multiplier for Method A. */
  defaultTurnoverMultiplierMin: number

  /** Fallback upper-bound turnover multiplier for Method A. */
  defaultTurnoverMultiplierMax: number

  /** Fallback max loan as % of annual revenue for Method B. */
  defaultMaxLoanToAnnualRevenuePct: number

  /**
   * Fallback DSCR value used in Method C back-calculation when
   * productConfig.dscrMin is null.
   */
  defaultDscrForAmountSizing: number

  // -- Scoring band thresholds ------------------------------------------------

  /**
   * Count-based thresholds used by computeMatchScore to assign
   * HIGH / MEDIUM / LOW / INELIGIBLE.
   *
   * Structurally identical to ScoringThresholds in engine/matching/types.ts.
   * globalDefaults.scoringThresholds can be passed directly wherever
   * ScoringThresholds is expected (TypeScript structural compatibility).
   */
  scoringThresholds: {
    /** HIGH RiskFlag count at or above which MatchScore becomes LOW. */
    highRiskFlagCountForLow: number

    /**
     * HIGH RiskFlag count at or above which MatchScore becomes MEDIUM.
     * Must be strictly less than highRiskFlagCountForLow.
     */
    highRiskFlagCountForMedium: number

    /**
     * MEDIUM RiskFlag count at or above which MatchScore becomes MEDIUM,
     * when no HIGH RiskFlags are present.
     */
    medRiskFlagCountForMedium: number
  }
}

// -----------------------------------------------------------------------------
// BankPolicyConfig
// Per-bank lending appetite and risk preferences.
// One record per Bank.  Merges over GlobalEngineDefaults at engine resolve time.
// Fields set here override GlobalEngineDefaults for this bank's products.
// -----------------------------------------------------------------------------

export interface BankPolicyConfig {

  /** Foreign key → Bank.code */
  bankCode: string

  // -- Global field overrides -------------------------------------------------

  /**
   * Selective overrides for any scalar threshold in GlobalEngineDefaults.
   * Excludes defaultIndustryRiskMapping, statementDiscounts, and
   * scoringThresholds which have dedicated override fields below.
   */
  globalOverrides: Partial<
    Omit<
      GlobalEngineDefaults,
      'defaultIndustryRiskMapping' | 'statementDiscounts' | 'scoringThresholds'
    >
  >

  /** Per-bank industry risk classification overrides. Partial: only specified entries differ. */
  industryRiskMapping?: Partial<Record<IndustryCategory, IndustryRiskLevel>>

  /** Per-bank statement discount multiplier overrides. */
  statementDiscountOverrides?: Partial<StatementDiscountConfig>

  // -- CTOS / CCRIS strictness ------------------------------------------------

  /**
   * Bank-specific minimum CTOS score.
   * Takes precedence over globalOverrides.defaultMinCtosScore when non-null.
   * Source: Bank.personalMinCtos (seed data).
   */
  minCtosScore: number | null

  /**
   * How this bank interprets CCRIS results.
   * STRICT:   MINOR_ISSUE → SOFT_BLOCK; MAJOR_ISSUE always HARD_BLOCK.
   * MODERATE: MINOR_ISSUE → MEDIUM RiskFlag.
   * LENIENT:  MINOR_ISSUE → no flag raised.
   */
  ccrisStrictnessLevel: 'STRICT' | 'MODERATE' | 'LENIENT'

  /**
   * When true, CTOS scores in the soft-block range are treated as HARD_BLOCK
   * rather than SOFT_BLOCK by this bank.
   */
  ctosHardBlockOnSoftRange: boolean

  // -- Collateral strictness --------------------------------------------------

  /**
   * STRICT:   missing/insufficient collateral → HARD_BLOCK even if product is UNSECURED.
   * MODERATE: missing/insufficient collateral → SOFT_BLOCK.
   * LENIENT:  no extra flag beyond what the product specifies.
   */
  collateralStrictnessLevel: 'STRICT' | 'MODERATE' | 'LENIENT'

  // -- Industry preferences ---------------------------------------------------

  /** Industries this bank actively targets. Raises estimatedApprovalProbability. */
  preferredIndustries: IndustryCategory[]

  /** Industries this bank is cautious about. Triggers LOW-severity RiskFlag. */
  discouragedIndustries: IndustryCategory[]

  /**
   * Industries this bank will not finance.
   * Triggers HARD_BLOCK EligibilityFlag (bank-level exclusion).
   */
  excludedIndustriesBankLevel: IndustryCategory[]

  // -- Loan size preferences --------------------------------------------------

  /** Loan amount below this → LOW-severity RiskFlag (not a hard block). */
  preferredLoanSizeMin: number | null

  /** Loan amount above this → LOW-severity RiskFlag (not a hard block). */
  preferredLoanSizeMax: number | null

  // -- Business age preferences -----------------------------------------------

  /**
   * Bank's preferred minimum business age in years.
   * Below this (but above product hard floor) → SHORT_TRACK_RECORD at LOW severity.
   */
  preferredBusinessAgeYearsMin: number | null

  // -- Guarantee scheme preferences -------------------------------------------

  /**
   * PREFERRED:   CGC/SJPP availability improves approval probability estimate.
   * NEUTRAL:     no effect on scoring.
   * DISCOURAGED: bank rarely uses schemes; may slightly lower estimate.
   */
  guaranteeSchemeUsagePreference: 'PREFERRED' | 'NEUTRAL' | 'DISCOURAGED'

  // -- Approval probability calibration ---------------------------------------

  /**
   * Historical base approval rate (%) for this bank.
   * Used to calibrate MatchingResult.estimatedApprovalProbability.
   * Source: Bank.personalApprovalRatePct (seed data).
   */
  historicalApprovalRatePct: number | null

  // -- Profitability strictness -----------------------------------------------

  /**
   * Controls the severity of BELOW_MIN_PROFITABLE_YEARS.
   * STRICT:   years-in-profit violation → HARD_BLOCK.
   * MODERATE: violation → SOFT_BLOCK.
   * LENIENT:  violation → SOFT_BLOCK (same as MODERATE; no special relaxation).
   *
   * Intentionally separate from ccrisStrictnessLevel: a bank may be strict on
   * CCRIS history but forgiving on profitability track record, or vice-versa.
   */
  profitabilityStrictnessLevel: 'STRICT' | 'MODERATE' | 'LENIENT'

  // -- Risk flag severity overrides -------------------------------------------

  /**
   * Severity for HIGH_CASH_INFLOW_PCT risk flag.
   * Defaults to GlobalEngineDefaults.defaultCashInflowRiskSeverity.
   */
  cashInflowRiskSeverityOverride?: 'HIGH' | 'MEDIUM' | 'LOW'

  /**
   * Severity for HIGH_CUSTOMER_CONCENTRATION risk flag.
   * Defaults to GlobalEngineDefaults.defaultCustomerConcentrationRiskSeverity.
   */
  customerConcentrationRiskSeverityOverride?: 'HIGH' | 'MEDIUM' | 'LOW'

  /**
   * Severity for LEVERAGE_HIGH risk flag.
   * Defaults to GlobalEngineDefaults.defaultLeverageHighRiskSeverity.
   */
  leverageHighRiskSeverityOverride?: 'HIGH' | 'MEDIUM' | 'LOW'

  // -- Shariah compliance -----------------------------------------------------

  /** When true, only Shariah-compliant products are evaluated for this bank. */
  shariahOnly: boolean
}

// -----------------------------------------------------------------------------
// ProductPolicyConfig
// Per-product hard eligibility rules and amount sizing parameters.
// One record per Product.
//
// Field names and semantics align exactly with ProductBlockA (spec §3.1).
// Non-null values here take final precedence over bank and global config.
// -----------------------------------------------------------------------------

export interface ProductPolicyConfig {

  /** Foreign key → Product.id */
  productId: string

  // -- Hard eligibility thresholds (violations trigger HARD_BLOCK) ------------

  /**
   * Minimum company operating age in months.
   * Source: ProductBlockA.minCompanyAgeMonths
   */
  minCompanyAgeMonths: number | null

  /**
   * Minimum annual revenue (RM).
   * Source: ProductBlockA.minAnnualRevenue
   */
  minAnnualRevenue: number | null

  /**
   * Accepted company types. Empty array = no restriction.
   * Source: ProductBlockA.eligibleCompanyTypes
   */
  eligibleCompanyTypes: CompanyType[]

  /**
   * Industries this product serves. Empty array = no restriction.
   * Source: ProductBlockA.eligibleIndustries
   */
  eligibleIndustries: IndustryCategory[]

  /**
   * Industries this product will not finance.
   * Triggers INDUSTRY_EXCLUDED HARD_BLOCK.
   * Source: ProductBlockA.excludedIndustries
   */
  excludedIndustries: IndustryCategory[]

  // -- DSCR rules -------------------------------------------------------------

  /**
   * Absolute minimum DSCR. Below this → HARD_BLOCK.
   * Source: ProductBlockA.dscrMin
   */
  dscrMin: number | null

  /**
   * Preferred DSCR. Below this (above dscrMin) → HIGH-severity DSCR_WEAK RiskFlag.
   * Source: ProductBlockA.dscrPreferred
   */
  dscrPreferred: number | null

  /**
   * Human-readable formula note.
   * Display / advisory only; not consumed by engine logic.
   * Source: ProductBlockA.dscrFormulaNote
   */
  dscrFormulaNote: string | null

  // -- Amount sizing rules ----------------------------------------------------

  // Method A: Turnover-based
  /**
   * Loan lower-bound = effectiveMonthlyInflow * monthlyTurnoverMultiplierMin.
   * Source: ProductBlockA.monthlyTurnoverMultiplierMin
   */
  monthlyTurnoverMultiplierMin: number | null

  /**
   * Loan upper-bound = effectiveMonthlyInflow * monthlyTurnoverMultiplierMax.
   * Source: ProductBlockA.monthlyTurnoverMultiplierMax
   */
  monthlyTurnoverMultiplierMax: number | null

  // Method B: Revenue-based
  /**
   * Loan ceiling = annualRevenueY1 * (maxLoanToAnnualRevenuePct / 100).
   * Source: ProductBlockA.maxLoanToAnnualRevenuePct
   */
  maxLoanToAnnualRevenuePct: number | null

  // Method C: DSCR back-calculation uses dscrMin + rateMin + maxTenureMonths.

  // -- Product loan bounds (applied as final clamp on all three methods) ------

  /** Source: ProductBlockA.minLoanAmount */
  minLoanAmount: number | null

  /** Source: ProductBlockA.maxLoanAmount */
  maxLoanAmount: number | null

  /** Source: ProductBlockA.minTenureMonths */
  minTenureMonths: number | null

  /** Source: ProductBlockA.maxTenureMonths */
  maxTenureMonths: number | null

  // -- Interest rate (used in Method C PV calculation) ------------------------

  /**
   * Annual interest rate % — conservative lower bound.
   * e.g. 4.5 means 4.5% p.a.  Used as monthlyRate = rateMin / 100 / 12.
   * Source: ProductBlockA.rateMin
   */
  rateMin: number | null

  /** Annual interest rate % — upper bound. Display / advisory only. */
  rateMax: number | null

  /** Source: ProductBlockA.rateType */
  rateType: 'FIXED' | 'FLOATING' | 'BFR_BASED' | null

  /** Human-readable base rate string. Display only. Source: ProductBlockA.baseRate */
  baseRate: string | null

  // -- Collateral / guarantee rules -------------------------------------------

  /**
   * Maximum loan-to-value ratio (%).
   * Used in COLLATERAL_INSUFFICIENT eligibility flag.
   * Source: ProductBlockA.ltvMax
   */
  ltvMax: number | null

  /**
   * Minimum collateral coverage ratio (%).
   * Used in COLLATERAL_INSUFFICIENT eligibility flag.
   * Source: ProductBlockA.collateralCoverageMin
   */
  collateralCoverageMin: number | null

  /**
   * Guarantee scheme fee (%). Advisory only; not used in eligibility logic.
   * Source: ProductBlockA.guaranteeFeePct
   */
  guaranteeFeePct: number | null

  /**
   * When true, a guarantee scheme (CGC / SJPP / BNM) must be available for
   * this product to be eligible → GUARANTEE_REQUIRED_NOT_AVAILABLE HARD_BLOCK.
   */
  guaranteeSchemeRequired: boolean

  // -- Fees (display / advisory only) -----------------------------------------

  /** Source: ProductBlockA.processingFee */
  processingFee: string | null

  /** Source: ProductBlockA.stampDuty */
  stampDuty: string | null

  // -- Data quality metadata --------------------------------------------------

  /** Confidence level of this product's rule data. Source: ProductBlockA.confidence */
  confidence: FieldConfidenceValue | null

  /** ISO date string. Source: ProductBlockA.lastVerifiedDate */
  lastVerifiedDate: string | null

  /** Evidence source URLs. Source: ProductBlockA.sources */
  sources: string[]

  /** Freeform notes. Source: ProductBlockA.notes */
  notes: string | null
}
