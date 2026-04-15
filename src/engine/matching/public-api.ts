// =============================================================================
// BCIS Matching Engine — Public API
// Phase 2B: delegates to impl.ts.
// Signatures and doc-comments are unchanged from Phase 2A.
// =============================================================================

import type { CaseWithFinancials }   from '@/types/case.types'
import type { ProductPolicyConfig }  from '@/types/policy.types'
import type { BankPolicyConfig }     from '@/types/policy.types'
import type { GlobalEngineDefaults } from '@/types/policy.types'

import type {
  EligibilityFlag,
  RiskFlag,
  MatchScore,
  AmountCalculationBreakdown,
  ScoringThresholds,
} from './types'

import {
  computeEligibilityFlagsImpl,
  computeRiskFlagsImpl,
  computeMatchScoreImpl,
  computeAmountRangeImpl,
} from './impl'

// -----------------------------------------------------------------------------
// computeEligibilityFlags
// -----------------------------------------------------------------------------

export function computeEligibilityFlags(
  cas:            CaseWithFinancials,
  productConfig:  ProductPolicyConfig,
  bankConfig:     BankPolicyConfig,
  globalDefaults: GlobalEngineDefaults,
): EligibilityFlag[] {
  return computeEligibilityFlagsImpl(cas, productConfig, bankConfig, globalDefaults)
}

// -----------------------------------------------------------------------------
// computeRiskFlags
// -----------------------------------------------------------------------------

export function computeRiskFlags(
  cas:                CaseWithFinancials,
  productConfig:      ProductPolicyConfig,
  bankConfig:         BankPolicyConfig,
  globalDefaults:     GlobalEngineDefaults,
  effectiveInflow:    number,
  estimatedMaxAmount: number | null,
): RiskFlag[] {
  return computeRiskFlagsImpl(
    cas, productConfig, bankConfig, globalDefaults,
    effectiveInflow, estimatedMaxAmount,
  )
}

// -----------------------------------------------------------------------------
// computeMatchScore
// -----------------------------------------------------------------------------

export function computeMatchScore(
  eligibilityFlags: EligibilityFlag[],
  riskFlags:        RiskFlag[],
  thresholds:       ScoringThresholds,
): MatchScore {
  return computeMatchScoreImpl(eligibilityFlags, riskFlags, thresholds)
}

// -----------------------------------------------------------------------------
// computeAmountRange
// -----------------------------------------------------------------------------

export function computeAmountRange(
  cas:             CaseWithFinancials,
  productConfig:   ProductPolicyConfig,
  bankConfig:      BankPolicyConfig,
  globalDefaults:  GlobalEngineDefaults,
  effectiveInflow: number,
): AmountCalculationBreakdown {
  return computeAmountRangeImpl(cas, productConfig, bankConfig, globalDefaults, effectiveInflow)
}
