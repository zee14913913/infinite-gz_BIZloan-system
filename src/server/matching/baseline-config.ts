// =============================================================================
// ⚠️  TEMPORARY BASELINE CONFIG — IMPLEMENTATION PLACEHOLDERS ONLY
//
// These values exist solely to make the matching engine runnable during
// development before Phase 3 real config population.
//
// DO NOT treat these as real market rules.
// DO NOT use these in production loan assessments.
// REPLACE ALL values in Phase 3 with real Malaysian SME market data.
//
// Each numeric value is annotated with:
//   [PLACEHOLDER] — must be replaced in Phase 3
// =============================================================================

import type { GlobalEngineDefaults, BankPolicyConfig, ProductPolicyConfig } from '@/types/policy.types'
import type { IndustryCategory } from '@/types/case.types'

// ---------------------------------------------------------------------------
// Industry risk fallback map
// All industries default to MEDIUM risk.
// Phase 3 will replace with real Malaysian bank-sector assessments.
// ---------------------------------------------------------------------------

const PLACEHOLDER_INDUSTRY_RISK_MAP: Record<IndustryCategory, 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW'> = {
  MANUFACTURING:           'MEDIUM',    // [PLACEHOLDER]
  TRADING_RETAIL:          'MEDIUM',    // [PLACEHOLDER]
  FOOD_BEVERAGE:           'MEDIUM',    // [PLACEHOLDER]
  CONSTRUCTION:            'MEDIUM',    // [PLACEHOLDER]
  PROPERTY_DEVELOPER:      'MEDIUM',    // [PLACEHOLDER]
  IT_TECHNOLOGY:           'MEDIUM',    // [PLACEHOLDER]
  PROFESSIONAL_SERVICES:   'MEDIUM',    // [PLACEHOLDER]
  EDUCATION:               'MEDIUM',    // [PLACEHOLDER]
  HEALTHCARE:              'MEDIUM',    // [PLACEHOLDER]
  LOGISTICS_TRANSPORT:     'MEDIUM',    // [PLACEHOLDER]
  AGRICULTURE:             'MEDIUM',    // [PLACEHOLDER]
  HOSPITALITY_TOURISM:     'MEDIUM',    // [PLACEHOLDER]
  FINANCIAL_SERVICES:      'MEDIUM',    // [PLACEHOLDER]
  OTHER:                   'MEDIUM',    // [PLACEHOLDER]
}

// ---------------------------------------------------------------------------
// GLOBAL_ENGINE_DEFAULTS_BASELINE
// Generic market-wide fallback — NOT real Malaysian SME market values.
// ---------------------------------------------------------------------------

export const GLOBAL_ENGINE_DEFAULTS_BASELINE: GlobalEngineDefaults = {
  // -- Business track record [PLACEHOLDER] -----------------------------------
  defaultMinYearsInBusiness:     2,      // [PLACEHOLDER] typical MY SME: 2–3 years
  defaultMinProfitableYears:     1,      // [PLACEHOLDER]
  defaultMinAnnualRevenue:       300_000, // [PLACEHOLDER] RM 300k — system floor only
  defaultMinAvgMonthlyInflow:    25_000,  // [PLACEHOLDER] RM 25k/month

  // -- CTOS [PLACEHOLDER] ---------------------------------------------------
  defaultMinCtosScore:            600,   // [PLACEHOLDER]
  defaultCtosSoftBlockLowerBound: 550,   // [PLACEHOLDER]
  defaultCtosCleanThreshold:      700,   // [PLACEHOLDER]

  // -- CCRIS ----------------------------------------------------------------
  defaultCcrisMajorIssueIsHardBlock:      true,  // [PLACEHOLDER]
  defaultCcrisMinorIssueRaisesRiskFlag:   true,  // [PLACEHOLDER]

  // -- DSCR [PLACEHOLDER] ---------------------------------------------------
  defaultDscrMin:            1.0,  // [PLACEHOLDER]
  defaultDscrPreferred:      1.5,  // [PLACEHOLDER]

  // -- Debt burden [PLACEHOLDER] --------------------------------------------
  defaultMaxTotalDebtToAnnualRevenuePct: 80,   // [PLACEHOLDER]
  defaultMaxInstalmentToFreeCashFlowPct: 70,   // [PLACEHOLDER]

  // -- Statement quality [PLACEHOLDER] -------------------------------------
  defaultBounceChequeRiskFlagThreshold:  1,    // [PLACEHOLDER]
  defaultBounceChequeHardBlockThreshold: 5,    // [PLACEHOLDER]
  defaultMaxCashInflowPct:               0.30, // [PLACEHOLDER]
  defaultMaxSingleCustomerConcentrationPct: 0.50, // [PLACEHOLDER]
  defaultMinEndingBalanceToInflowRatio:  0.10, // [PLACEHOLDER]

  // -- Statement discount config [PLACEHOLDER] ----------------------------
  statementDiscounts: {
    bounceTier1MaxCount:           1,    // [PLACEHOLDER]
    bounceTier2MaxCount:           3,    // [PLACEHOLDER]
    bounceTier1Multiplier:         0.9,  // [PLACEHOLDER]
    bounceTier2Multiplier:         0.8,  // [PLACEHOLDER]
    bounceTier3Multiplier:         0.7,  // [PLACEHOLDER]
    concentrationThresholdPct:     0.50, // [PLACEHOLDER]
    concentrationMultiplier:       0.85, // [PLACEHOLDER]
    lowBalanceRatioThreshold:      0.10, // [PLACEHOLDER]
    lowBalanceMultiplier:          0.90, // [PLACEHOLDER]
    highCashInflowThresholdPct:    0.30, // [PLACEHOLDER]
    highCashInflowMultiplier:      0.80, // [PLACEHOLDER]
  },

  // -- Industry risk mapping -----------------------------------------------
  defaultIndustryRiskMapping: PLACEHOLDER_INDUSTRY_RISK_MAP,

  // -- Amount sizing fallbacks [PLACEHOLDER] --------------------------------
  defaultTurnoverMultiplierMin:      2.0, // [PLACEHOLDER]
  defaultTurnoverMultiplierMax:      4.0, // [PLACEHOLDER]
  defaultMaxLoanToAnnualRevenuePct:  40,  // [PLACEHOLDER]
  defaultDscrForAmountSizing:        1.25, // [PLACEHOLDER]

  // -- Scoring band thresholds [PLACEHOLDER] --------------------------------
  scoringThresholds: {
    highRiskFlagCountForLow:    2, // [PLACEHOLDER]
    highRiskFlagCountForMedium: 1, // [PLACEHOLDER]
    medRiskFlagCountForMedium:  3, // [PLACEHOLDER]
  },

  // -- Risk flag default severities [PLACEHOLDER] ---------------------------
  defaultCashInflowRiskSeverity:             'MEDIUM', // [PLACEHOLDER]
  defaultCustomerConcentrationRiskSeverity:  'MEDIUM', // [PLACEHOLDER]
  defaultLeverageHighRiskSeverity:           'MEDIUM', // [PLACEHOLDER]
}

// ---------------------------------------------------------------------------
// getTemporaryBankPolicyConfig
// Returns a generic neutral bank config.
// Phase 3 will replace with per-bank config derived from Bank records + seed data.
// ---------------------------------------------------------------------------

export function getTemporaryBankPolicyConfig(bankCode: string): BankPolicyConfig {
  return {
    bankCode,
    globalOverrides:            {},        // [PLACEHOLDER] no bank-specific overrides
    industryRiskMapping:        undefined, // [PLACEHOLDER]
    statementDiscountOverrides: undefined, // [PLACEHOLDER]
    minCtosScore:               null,      // [PLACEHOLDER] falls back to global
    ccrisStrictnessLevel:       'MODERATE', // [PLACEHOLDER]
    ctosHardBlockOnSoftRange:   false,     // [PLACEHOLDER]
    collateralStrictnessLevel:  'MODERATE', // [PLACEHOLDER]
    profitabilityStrictnessLevel: 'MODERATE', // [PLACEHOLDER]
    preferredIndustries:        [],        // [PLACEHOLDER]
    discouragedIndustries:      [],        // [PLACEHOLDER]
    excludedIndustriesBankLevel: [],       // [PLACEHOLDER]
    preferredLoanSizeMin:       null,      // [PLACEHOLDER]
    preferredLoanSizeMax:       null,      // [PLACEHOLDER]
    preferredBusinessAgeYearsMin: null,    // [PLACEHOLDER]
    guaranteeSchemeUsagePreference: 'NEUTRAL', // [PLACEHOLDER]
    historicalApprovalRatePct:  null,      // [PLACEHOLDER]
    shariahOnly:                false,     // [PLACEHOLDER]
    cashInflowRiskSeverityOverride:            undefined, // [PLACEHOLDER]
    customerConcentrationRiskSeverityOverride: undefined, // [PLACEHOLDER]
    leverageHighRiskSeverityOverride:          undefined, // [PLACEHOLDER]
  }
}

// ---------------------------------------------------------------------------
// getTemporaryProductPolicyConfig
// Returns a minimal generic product config for system wiring.
// Phase 3 will replace with ProductPolicyConfig mapped from real block_a_json.
// ---------------------------------------------------------------------------

export function getTemporaryProductPolicyConfig(productId: string): ProductPolicyConfig {
  return {
    productId,
    minCompanyAgeMonths:          null, // [PLACEHOLDER] no product floor set
    minAnnualRevenue:             null, // [PLACEHOLDER]
    eligibleCompanyTypes:         [],   // [PLACEHOLDER] no restriction
    eligibleIndustries:           [],   // [PLACEHOLDER] no restriction
    excludedIndustries:           [],   // [PLACEHOLDER]
    dscrMin:                      null, // [PLACEHOLDER]
    dscrPreferred:                null, // [PLACEHOLDER]
    dscrFormulaNote:              null,
    monthlyTurnoverMultiplierMin: null, // [PLACEHOLDER]
    monthlyTurnoverMultiplierMax: null, // [PLACEHOLDER]
    maxLoanToAnnualRevenuePct:    null, // [PLACEHOLDER]
    minLoanAmount:                null, // [PLACEHOLDER]
    maxLoanAmount:                null, // [PLACEHOLDER]
    minTenureMonths:              null, // [PLACEHOLDER]
    maxTenureMonths:              null, // [PLACEHOLDER]
    rateMin:                      null, // [PLACEHOLDER]
    rateMax:                      null, // [PLACEHOLDER]
    rateType:                     null,
    baseRate:                     null,
    ltvMax:                       null, // [PLACEHOLDER]
    collateralCoverageMin:        null, // [PLACEHOLDER]
    guaranteeFeePct:              null,
    guaranteeSchemeRequired:      false, // [PLACEHOLDER]
    processingFee:                null,
    stampDuty:                    null,
    confidence:                   null,
    lastVerifiedDate:             null,
    sources:                      [],
    notes:                        null,
  }
}
