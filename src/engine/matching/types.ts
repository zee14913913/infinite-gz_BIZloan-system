// =============================================================================
// BCIS Matching Engine — Type Definitions
// Phase 2A: types only, zero implementation logic, zero numeric literals.
//
// Domain models (CaseWithFinancials, ProductPolicyConfig, BankPolicyConfig,
// GlobalEngineDefaults, IndustryCategory, etc.) are defined elsewhere and
// imported by public-api.ts; they are NOT redefined here.
// =============================================================================

// -----------------------------------------------------------------------------
// EligibilityFlagType
// Each variant maps to a specific eligibility rule check.
// Severity is assigned at evaluation time, not at the enum level, because the
// same flag type can be HARD_BLOCK under one bank config and SOFT_BLOCK under
// another.
// -----------------------------------------------------------------------------

export enum EligibilityFlagType {
  /** Company's industry is in the product's or bank's exclusion list. */
  INDUSTRY_EXCLUDED                = 'INDUSTRY_EXCLUDED',

  /** Applicant's annual revenue falls below the minimum threshold. */
  BELOW_MIN_ANNUAL_REVENUE         = 'BELOW_MIN_ANNUAL_REVENUE',

  /** Company has been operating for fewer months than required. */
  BELOW_MIN_YEARS_IN_BUSINESS      = 'BELOW_MIN_YEARS_IN_BUSINESS',

  /** Company does not have enough years of profitable operations. */
  BELOW_MIN_PROFITABLE_YEARS       = 'BELOW_MIN_PROFITABLE_YEARS',

  /** Calculated DSCR is below the product's hard minimum. */
  BELOW_PRODUCT_DSCR_MIN           = 'BELOW_PRODUCT_DSCR_MIN',

  /** Applicant's CTOS score is below the minimum acceptable threshold. */
  CTOS_BELOW_MIN                   = 'CTOS_BELOW_MIN',

  /** CCRIS record shows a major issue that cannot be overlooked. */
  CCRIS_MAJOR_ISSUE                = 'CCRIS_MAJOR_ISSUE',

  /**
   * Available collateral does not meet the product's LTV or coverage
   * ratio requirements.
   */
  COLLATERAL_INSUFFICIENT          = 'COLLATERAL_INSUFFICIENT',

  /**
   * Product requires a guarantee scheme (e.g. CGC / SJPP) but none is
   * available or applicable for this case.
   */
  GUARANTEE_REQUIRED_NOT_AVAILABLE = 'GUARANTEE_REQUIRED_NOT_AVAILABLE',

  /**
   * Catch-all for product-specific hard rules that do not fit the named
   * categories above (e.g. bumiputera-only products, sector-specific caps,
   * company-type restrictions).
   */
  PRODUCT_SPECIFIC_HARDBLOCK       = 'PRODUCT_SPECIFIC_HARDBLOCK',
}

// -----------------------------------------------------------------------------
// EligibilityFlag
// A single evaluated eligibility check result.
// -----------------------------------------------------------------------------

export interface EligibilityFlag {
  /** Which eligibility rule this flag represents. */
  type: EligibilityFlagType

  /**
   * HARD_BLOCK  → case is ineligible for this product.
   * SOFT_BLOCK  → case may still proceed but requires underwriter review.
   * WARNING     → informational; does not block eligibility.
   */
  severity: 'HARD_BLOCK' | 'SOFT_BLOCK' | 'WARNING'

  /** true if the case satisfies this rule; false if it fails. */
  passed: boolean

  /** The CaseFinancials or Case field that was evaluated. */
  field: string

  /** The value the case presented, serialised to string for display. */
  actualValue: string | null

  /** The threshold / requirement the config demanded. */
  requiredValue: string | null

  /**
   * Which config layer supplied the threshold that was evaluated.
   * PRODUCT > BANK > GLOBAL resolution order.
   */
  sourceConfig: 'PRODUCT' | 'BANK' | 'GLOBAL'

  /** Optional human-readable note explaining the flag. */
  notes: string | null
}

// -----------------------------------------------------------------------------
// RiskFlagType
// Conditions that do not block eligibility outright but reduce MatchScore
// and estimated approval probability.
// -----------------------------------------------------------------------------

export enum RiskFlagType {
  /** DSCR is above the hard minimum but below the preferred level. */
  DSCR_WEAK                   = 'DSCR_WEAK',

  /** Number of returned / bounced cheques in the last 12 months is elevated. */
  HIGH_BOUNCE_CHEQUES          = 'HIGH_BOUNCE_CHEQUES',

  /** Cash transactions make up a disproportionate share of total inflow. */
  HIGH_CASH_INFLOW_PCT         = 'HIGH_CASH_INFLOW_PCT',

  /** A single customer accounts for an outsized share of total inflows. */
  HIGH_CUSTOMER_CONCENTRATION  = 'HIGH_CUSTOMER_CONCENTRATION',

  /** CTOS score is above the hard minimum but below the preferred comfort level. */
  CTOS_WEAK                   = 'CTOS_WEAK',

  /** CCRIS record shows minor issues (not major). */
  CCRIS_MINOR_ISSUE            = 'CCRIS_MINOR_ISSUE',

  /** The applicant's industry is classified as HIGH or VERY_HIGH risk. */
  INDUSTRY_HIGH_RISK           = 'INDUSTRY_HIGH_RISK',

  /**
   * Company's operating history is short — above the hard floor but below
   * the bank's preferred business-age threshold.
   */
  SHORT_TRACK_RECORD           = 'SHORT_TRACK_RECORD',

  /** Total existing debt is high relative to annual revenue. */
  LEVERAGE_HIGH                = 'LEVERAGE_HIGH',

  /**
   * Composite flag raised when multiple statement quality sub-issues coexist
   * (low ending-balance ratio, elevated cash %, elevated concentration,
   * non-zero bounces) but none individually breaches its own threshold.
   */
  STATEMENT_QUALITY_ISSUE      = 'STATEMENT_QUALITY_ISSUE',
}

// -----------------------------------------------------------------------------
// RiskFlag
// A single evaluated risk condition result.
// -----------------------------------------------------------------------------

export interface RiskFlag {
  /** Which risk condition this flag represents. */
  type: RiskFlagType

  /**
   * HIGH   → serious concern; contributes strongly to a LOW MatchScore.
   * MEDIUM → moderate concern; contributes to a MEDIUM MatchScore.
   * LOW    → minor concern; noted but does not materially affect score.
   */
  severity: 'HIGH' | 'MEDIUM' | 'LOW'

  /** Human-readable description in Chinese (display in UI). */
  descriptionZh: string

  /** Human-readable description in English (internal / advisor use). */
  descriptionEn: string

  /** Suggested action to mitigate this risk, if applicable. */
  mitigationSuggestion: string | null

  /**
   * Which config layer supplied the threshold that triggered this flag.
   * PRODUCT > BANK > GLOBAL resolution order.
   */
  sourceConfig: 'PRODUCT' | 'BANK' | 'GLOBAL'
}

// -----------------------------------------------------------------------------
// MatchScore
// Discrete overall match quality for a (case, product) pair.
// -----------------------------------------------------------------------------

export type MatchScore = 'HIGH' | 'MEDIUM' | 'LOW' | 'INELIGIBLE'

// -----------------------------------------------------------------------------
// ScoringThresholds
// The three band-boundary counts used by computeMatchScore.
// Lives inside GlobalEngineDefaults.scoringThresholds; extracted here as a
// standalone interface so computeMatchScore can accept it directly.
// Numeric values are intentionally omitted — populated in Phase 3.
// -----------------------------------------------------------------------------

export interface ScoringThresholds {
  /**
   * Count of HIGH-severity RiskFlags at or above which the MatchScore
   * becomes LOW.
   */
  highRiskFlagCountForLow: number

  /**
   * Count of HIGH-severity RiskFlags at or above which the MatchScore
   * becomes MEDIUM (lower bound; must be less than highRiskFlagCountForLow).
   */
  highRiskFlagCountForMedium: number

  /**
   * Count of MEDIUM-severity RiskFlags at or above which the MatchScore
   * becomes MEDIUM, when no HIGH-severity flags are present.
   */
  medRiskFlagCountForMedium: number
}

// -----------------------------------------------------------------------------
// AmountMethodResult
// Output of one amount-sizing calculation method.
// -----------------------------------------------------------------------------

export interface AmountMethodResult {
  /** Which calculation approach produced this result. */
  method: 'TURNOVER' | 'REVENUE' | 'DSCR'

  /**
   * The maximum loan amount (RM) computed by this method.
   * Type is number as a structural placeholder; concrete formula is Phase 2B.
   */
  rawLimit: number

  /** Human-readable summary of the inputs and multipliers that drove this limit. */
  notes: string
}

// -----------------------------------------------------------------------------
// AmountCalculationBreakdown
// Combined result of all three sizing methods, surfaced in
// MatchingResult.amountCalculationBreakdown.
// -----------------------------------------------------------------------------

export interface AmountCalculationBreakdown {
  /**
   * Always contains three entries — one per method (TURNOVER, REVENUE, DSCR).
   * Entries whose inputs were unavailable will carry rawLimit = 0 and a
   * descriptive notes field; they do NOT contribute to bindingMethod selection.
   */
  methods: AmountMethodResult[]

  /**
   * The method (or product cap) whose rawLimit was the smallest valid value,
   * and therefore drives the final amount ceiling.
   * 'NONE' when no method produced a valid result.
   */
  bindingMethod: 'TURNOVER' | 'REVENUE' | 'DSCR' | 'PRODUCT_CAP' | 'NONE'

  /**
   * The effective monthly inflow figure used across all three methods,
   * after applyStatementDiscounts() has been applied.
   */
  effectiveInflowUsed: number

  /**
   * Conservative lower bound for the recommended loan amount (RM).
   * Derived from the TURNOVER method's lower-multiplier result,
   * then floored by productConfig.minLoanAmount.
   * null when insufficient data.
   */
  finalMin: number | null

  /**
   * Conservative upper ceiling for the recommended loan amount (RM).
   * The minimum of all three method rawLimits and productConfig.maxLoanAmount.
   * null when insufficient data.
   */
  finalMax: number | null
}
