// =============================================================================
// BCIS Matching Engine — Config Resolution
//
// Implements Product > Bank > Global precedence for every threshold the engine
// needs.  All resolved values come from config objects — no numeric literals.
// =============================================================================

import type {
  GlobalEngineDefaults,
  BankPolicyConfig,
  ProductPolicyConfig,
  StatementDiscountConfig,
  IndustryRiskLevel,
} from '@/types/policy.types'
import type { IndustryCategory, CompanyType } from '@/types/case.types'

// ────────────────────────────────────────────────────────────────────────────
// Internal coalescing primitives
// ────────────────────────────────────────────────────────────────────────────

/** Returns the first value that is neither null nor undefined. */
function coalesce<T>(...values: (T | null | undefined)[]): T | null {
  for (const v of values) {
    if (v !== null && v !== undefined) return v
  }
  return null
}

/**
 * Returns the first non-null / non-undefined override,
 * or `fallback` when all overrides are absent.
 *
 * Argument order = precedence order: leftmost override wins.
 */
function coalesceOrDefault<T>(
  fallback: T,
  ...overrides: (T | null | undefined)[]
): T {
  return coalesce(...overrides) ?? fallback
}

// ────────────────────────────────────────────────────────────────────────────
// ResolvedConfig
// Every effective threshold and preference after Product > Bank > Global merge.
// ────────────────────────────────────────────────────────────────────────────

export interface ResolvedConfig {
  // -- Business track record -------------------------------------------------
  /** Resolved minimum operating age in months. null = no floor set. */
  minCompanyAgeMonths: number | null
  /** Resolved minimum count of profitable financial years. */
  minProfitableYears: number
  /** Resolved minimum annual revenue (RM). null = no floor set. */
  minAnnualRevenue: number | null

  // -- CTOS ------------------------------------------------------------------
  minCtosScore: number
  ctosSoftBlockLowerBound: number
  ctosCleanThreshold: number
  ctosHardBlockOnSoftRange: boolean

  // -- CCRIS -----------------------------------------------------------------
  ccrisMajorIssueIsHardBlock: boolean
  ccrisMinorIssueRaisesRiskFlag: boolean
  ccrisStrictnessLevel: BankPolicyConfig['ccrisStrictnessLevel']

  // -- DSCR ------------------------------------------------------------------
  /**
   * Product-level DSCR hard floor.  null = no product HARD_BLOCK on DSCR.
   * Sourced ONLY from productConfig.dscrMin — never bank/global, because those
   * levels raise RiskFlags, not HARD_BLOCK EligibilityFlags.
   */
  dscrHardMin: number | null
  /** Resolved preferred DSCR for the DSCR_WEAK RiskFlag. */
  dscrPreferred: number | null
  /** DSCR value used as the target coverage in Method C amount back-calculation. */
  dscrForAmountSizing: number | null

  // -- Debt burden -----------------------------------------------------------
  maxTotalDebtToAnnualRevenuePct: number
  maxInstalmentToFreeCashFlowPct: number

  // -- Statement quality -----------------------------------------------------
  bounceChequeRiskFlagThreshold: number
  bounceChequeHardBlockThreshold: number
  maxCashInflowPct: number
  maxSingleCustomerConcentrationPct: number
  minEndingBalanceToInflowRatio: number
  statementDiscounts: StatementDiscountConfig

  // -- Collateral ------------------------------------------------------------
  ltvMax: number | null
  collateralCoverageMin: number | null
  collateralStrictnessLevel: BankPolicyConfig['collateralStrictnessLevel']

  // -- Guarantee -------------------------------------------------------------
  guaranteeSchemeRequired: boolean
  guaranteeSchemeUsagePreference: BankPolicyConfig['guaranteeSchemeUsagePreference']

  // -- Industry --------------------------------------------------------------
  /** Returns the effective risk level for a given industry after bank/global merge. */
  industryRiskLevel: (industry: IndustryCategory) => IndustryRiskLevel
  /** True when bankConfig.industryRiskMapping overrides global for this industry. */
  isBankIndustryMapOverridden: (industry: IndustryCategory) => boolean
  excludedIndustriesBankLevel: IndustryCategory[]
  excludedIndustriesProduct: IndustryCategory[]
  eligibleCompanyTypesProduct: CompanyType[]

  // -- Amount sizing — Method A (turnover) -----------------------------------
  turnoverMultiplierMin: number
  turnoverMultiplierMax: number

  // -- Amount sizing — Method B (revenue) ------------------------------------
  maxLoanToAnnualRevenuePct: number

  // -- Product loan bounds ---------------------------------------------------
  minLoanAmount: number | null
  maxLoanAmount: number | null
  maxTenureMonths: number | null
  rateMin: number | null

  // -- Score band thresholds -------------------------------------------------
  scoringThresholds: GlobalEngineDefaults['scoringThresholds']

  // -- Bank preferences (for RiskFlags only, not EligibilityFlags) ----------
  preferredBusinessAgeYearsMin: number | null

  // -- Profitability strictness (Fix 2) -------------------------------------
  /** Controls severity of BELOW_MIN_PROFITABLE_YEARS. Independent of ccrisStrictnessLevel. */
  profitabilityStrictnessLevel: BankPolicyConfig['profitabilityStrictnessLevel']

  // -- Risk flag severities (Fix 4) ----------------------------------------
  cashInflowRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW'
  customerConcentrationRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW'
  leverageHighRiskSeverity: 'HIGH' | 'MEDIUM' | 'LOW'

  // -- Source attribution metadata (Fix 3) ----------------------------------
  // One field per threshold that impl.ts uses for EligibilityFlag/RiskFlag.sourceConfig.
  // Computed once here so impl.ts never reads raw bankConfig/globalOverrides directly.
  sourceConfigForMinAnnualRevenue:     'PRODUCT' | 'BANK' | 'GLOBAL'
  sourceConfigForMinCompanyAge:        'PRODUCT' | 'BANK' | 'GLOBAL'
  sourceConfigForMinProfitableYears:   'BANK' | 'GLOBAL'
  sourceConfigForMinCtosScore:         'BANK' | 'GLOBAL'
  sourceConfigForCtosCleanliness:      'BANK' | 'GLOBAL'
  sourceConfigForDscrPreferred:        'PRODUCT' | 'BANK' | 'GLOBAL'
  sourceConfigForBounceThreshold:      'BANK' | 'GLOBAL'
  sourceConfigForCashInflowPct:        'BANK' | 'GLOBAL'
  sourceConfigForConcentrationPct:     'BANK' | 'GLOBAL'
  sourceConfigForLeverageRatio:        'BANK' | 'GLOBAL'
}

// ────────────────────────────────────────────────────────────────────────────
// resolveConfig
// ────────────────────────────────────────────────────────────────────────────

export function resolveConfig(
  productConfig: ProductPolicyConfig,
  bankConfig: BankPolicyConfig,
  globalDefaults: GlobalEngineDefaults,
): ResolvedConfig {
  const bo = bankConfig.globalOverrides

  // Company age: product is stored in months; bank/global overrides are in years
  const bankAgeOverrideMonths =
    bo.defaultMinYearsInBusiness !== undefined
      ? bo.defaultMinYearsInBusiness * 12
      : undefined
  const globalAgeMonths = globalDefaults.defaultMinYearsInBusiness * 12

  // CTOS: bankConfig.minCtosScore (explicit field) > bank globalOverride > global
  const minCtosScore = coalesceOrDefault(
    globalDefaults.defaultMinCtosScore,
    bankConfig.minCtosScore,   // explicit bank field — highest bank priority
    bo.defaultMinCtosScore,    // bank global-override map — second
  )

  // DSCR for amount sizing: product hard min doubles as the sizing target,
  // then fall through to the dedicated global sizing default
  const dscrForAmountSizing = coalesce(
    productConfig.dscrMin,
    bo.defaultDscrForAmountSizing,
    globalDefaults.defaultDscrForAmountSizing,
  )

  return {
    // ── Business track record ────────────────────────────────────────────────
    minCompanyAgeMonths: coalesce(
      productConfig.minCompanyAgeMonths,
      bankAgeOverrideMonths,
      globalAgeMonths,
    ),
    minProfitableYears: coalesceOrDefault(
      globalDefaults.defaultMinProfitableYears,
      bo.defaultMinProfitableYears,
    ),
    minAnnualRevenue: coalesce(
      productConfig.minAnnualRevenue,
      bo.defaultMinAnnualRevenue,
      globalDefaults.defaultMinAnnualRevenue,
    ),

    // ── CTOS ─────────────────────────────────────────────────────────────────
    minCtosScore,
    ctosSoftBlockLowerBound: coalesceOrDefault(
      globalDefaults.defaultCtosSoftBlockLowerBound,
      bo.defaultCtosSoftBlockLowerBound,
    ),
    ctosCleanThreshold: coalesceOrDefault(
      globalDefaults.defaultCtosCleanThreshold,
      bo.defaultCtosCleanThreshold,
    ),
    ctosHardBlockOnSoftRange: bankConfig.ctosHardBlockOnSoftRange,

    // ── CCRIS ─────────────────────────────────────────────────────────────────
    ccrisMajorIssueIsHardBlock: coalesceOrDefault(
      globalDefaults.defaultCcrisMajorIssueIsHardBlock,
      bo.defaultCcrisMajorIssueIsHardBlock,
    ),
    ccrisMinorIssueRaisesRiskFlag: coalesceOrDefault(
      globalDefaults.defaultCcrisMinorIssueRaisesRiskFlag,
      bo.defaultCcrisMinorIssueRaisesRiskFlag,
    ),
    ccrisStrictnessLevel: bankConfig.ccrisStrictnessLevel,

    // ── DSCR ─────────────────────────────────────────────────────────────────
    dscrHardMin:         productConfig.dscrMin,   // product-only; drives HARD_BLOCK
    dscrPreferred: coalesce(
      productConfig.dscrPreferred,
      bo.defaultDscrPreferred,
      globalDefaults.defaultDscrPreferred,
    ),
    dscrForAmountSizing,

    // ── Debt burden ───────────────────────────────────────────────────────────
    maxTotalDebtToAnnualRevenuePct: coalesceOrDefault(
      globalDefaults.defaultMaxTotalDebtToAnnualRevenuePct,
      bo.defaultMaxTotalDebtToAnnualRevenuePct,
    ),
    maxInstalmentToFreeCashFlowPct: coalesceOrDefault(
      globalDefaults.defaultMaxInstalmentToFreeCashFlowPct,
      bo.defaultMaxInstalmentToFreeCashFlowPct,
    ),

    // ── Statement quality ─────────────────────────────────────────────────────
    bounceChequeRiskFlagThreshold: coalesceOrDefault(
      globalDefaults.defaultBounceChequeRiskFlagThreshold,
      bo.defaultBounceChequeRiskFlagThreshold,
    ),
    bounceChequeHardBlockThreshold: coalesceOrDefault(
      globalDefaults.defaultBounceChequeHardBlockThreshold,
      bo.defaultBounceChequeHardBlockThreshold,
    ),
    maxCashInflowPct: coalesceOrDefault(
      globalDefaults.defaultMaxCashInflowPct,
      bo.defaultMaxCashInflowPct,
    ),
    maxSingleCustomerConcentrationPct: coalesceOrDefault(
      globalDefaults.defaultMaxSingleCustomerConcentrationPct,
      bo.defaultMaxSingleCustomerConcentrationPct,
    ),
    minEndingBalanceToInflowRatio: coalesceOrDefault(
      globalDefaults.defaultMinEndingBalanceToInflowRatio,
      bo.defaultMinEndingBalanceToInflowRatio,
    ),
    statementDiscounts: bankConfig.statementDiscountOverrides
      ? { ...globalDefaults.statementDiscounts, ...bankConfig.statementDiscountOverrides }
      : globalDefaults.statementDiscounts,

    // ── Collateral ────────────────────────────────────────────────────────────
    ltvMax:                    productConfig.ltvMax,
    collateralCoverageMin:     productConfig.collateralCoverageMin,
    collateralStrictnessLevel: bankConfig.collateralStrictnessLevel,

    // ── Guarantee ─────────────────────────────────────────────────────────────
    guaranteeSchemeRequired:        productConfig.guaranteeSchemeRequired,
    guaranteeSchemeUsagePreference: bankConfig.guaranteeSchemeUsagePreference,

    // ── Industry ──────────────────────────────────────────────────────────────
    industryRiskLevel: (industry: IndustryCategory): IndustryRiskLevel =>
      bankConfig.industryRiskMapping?.[industry] ??
      globalDefaults.defaultIndustryRiskMapping[industry],
    isBankIndustryMapOverridden: (industry: IndustryCategory): boolean =>
      bankConfig.industryRiskMapping?.[industry] !== undefined,
    excludedIndustriesBankLevel:  bankConfig.excludedIndustriesBankLevel,
    excludedIndustriesProduct:    productConfig.excludedIndustries,
    eligibleCompanyTypesProduct:  productConfig.eligibleCompanyTypes,

    // ── Amount sizing — Method A ───────────────────────────────────────────────
    // Product > bank global-override > global default
    turnoverMultiplierMin: coalesceOrDefault(
      globalDefaults.defaultTurnoverMultiplierMin,
      productConfig.monthlyTurnoverMultiplierMin,
      bo.defaultTurnoverMultiplierMin,
    ),
    turnoverMultiplierMax: coalesceOrDefault(
      globalDefaults.defaultTurnoverMultiplierMax,
      productConfig.monthlyTurnoverMultiplierMax,
      bo.defaultTurnoverMultiplierMax,
    ),

    // ── Amount sizing — Method B ───────────────────────────────────────────────
    maxLoanToAnnualRevenuePct: coalesceOrDefault(
      globalDefaults.defaultMaxLoanToAnnualRevenuePct,
      productConfig.maxLoanToAnnualRevenuePct,
      bo.defaultMaxLoanToAnnualRevenuePct,
    ),

    // ── Product loan bounds ───────────────────────────────────────────────────
    minLoanAmount:   productConfig.minLoanAmount,
    maxLoanAmount:   productConfig.maxLoanAmount,
    maxTenureMonths: productConfig.maxTenureMonths,
    rateMin:         productConfig.rateMin,

    // ── Score thresholds ──────────────────────────────────────────────────────
    scoringThresholds: globalDefaults.scoringThresholds,

    // ── Bank preferences ──────────────────────────────────────────────────────
    preferredBusinessAgeYearsMin: bankConfig.preferredBusinessAgeYearsMin,

    // ── Profitability strictness (Fix 2) ──────────────────────────────────────
    profitabilityStrictnessLevel: bankConfig.profitabilityStrictnessLevel,

    // ── Risk flag severities (Fix 4) ──────────────────────────────────────────
    cashInflowRiskSeverity:
      bankConfig.cashInflowRiskSeverityOverride ??
      globalDefaults.defaultCashInflowRiskSeverity,
    customerConcentrationRiskSeverity:
      bankConfig.customerConcentrationRiskSeverityOverride ??
      globalDefaults.defaultCustomerConcentrationRiskSeverity,
    leverageHighRiskSeverity:
      bankConfig.leverageHighRiskSeverityOverride ??
      globalDefaults.defaultLeverageHighRiskSeverity,

    // ── Source attribution metadata (Fix 3) ───────────────────────────────────
    sourceConfigForMinAnnualRevenue:
      productConfig.minAnnualRevenue !== null   ? 'PRODUCT'
      : bo.defaultMinAnnualRevenue   !== undefined ? 'BANK'
      : 'GLOBAL',
    sourceConfigForMinCompanyAge:
      productConfig.minCompanyAgeMonths !== null     ? 'PRODUCT'
      : bo.defaultMinYearsInBusiness    !== undefined ? 'BANK'
      : 'GLOBAL',
    sourceConfigForMinProfitableYears:
      bo.defaultMinProfitableYears !== undefined ? 'BANK' : 'GLOBAL',
    sourceConfigForMinCtosScore:
      (bankConfig.minCtosScore !== null || bo.defaultMinCtosScore !== undefined)
        ? 'BANK' : 'GLOBAL',
    sourceConfigForCtosCleanliness:
      (bankConfig.minCtosScore !== null || bo.defaultCtosCleanThreshold !== undefined)
        ? 'BANK' : 'GLOBAL',
    sourceConfigForDscrPreferred:
      productConfig.dscrPreferred !== null ? 'PRODUCT'
      : bo.defaultDscrPreferred   !== undefined ? 'BANK'
      : 'GLOBAL',
    sourceConfigForBounceThreshold:
      bo.defaultBounceChequeRiskFlagThreshold !== undefined ? 'BANK' : 'GLOBAL',
    sourceConfigForCashInflowPct:
      bo.defaultMaxCashInflowPct !== undefined ? 'BANK' : 'GLOBAL',
    sourceConfigForConcentrationPct:
      bo.defaultMaxSingleCustomerConcentrationPct !== undefined ? 'BANK' : 'GLOBAL',
    sourceConfigForLeverageRatio:
      bo.defaultMaxTotalDebtToAnnualRevenuePct !== undefined ? 'BANK' : 'GLOBAL',
  }
}
