// =============================================================================
// BCIS — Server-Side Matching Engine Orchestrator
//
// Executes the four public engine functions in the correct order and returns
// a single structured result.  All engine logic stays in the engine package;
// this module only wires inputs to outputs.
//
// Execution order:
//   1. computeAmountRange   — needs effectiveInflow input
//   2. computeEligibilityFlags
//   3. computeRiskFlags     — receives effectiveInflow + estimatedMaxAmount
//   4. computeMatchScore    — receives flag arrays + resolved scoring thresholds
// =============================================================================

import type { CaseWithFinancials } from '@/types/case.types'
import type {
  GlobalEngineDefaults,
  BankPolicyConfig,
  ProductPolicyConfig,
} from '@/types/policy.types'

import {
  computeEligibilityFlags,
  computeRiskFlags,
  computeMatchScore,
  computeAmountRange,
} from '@/engine/matching/public-api'

import type {
  EligibilityFlag,
  RiskFlag,
  MatchScore,
  AmountCalculationBreakdown,
} from '@/engine/matching/types'

// ---------------------------------------------------------------------------
// MatchingEngineResult
// ---------------------------------------------------------------------------

export interface MatchingEngineResult {
  eligibilityFlags:           EligibilityFlag[]
  riskFlags:                  RiskFlag[]
  matchScore:                 MatchScore
  amountCalculationBreakdown: AmountCalculationBreakdown
}

// ---------------------------------------------------------------------------
// deriveEffectiveInflow
// Resolves the effectiveInflow the engine needs as a scalar input.
//
// When the financial calculator has already written effective_monthly_inflow
// to the DB, the engine reads it directly from financials (preferred path).
// If not yet computed, fall back to the raw 6m avg or 12m avg.
//
// This helper lives here rather than in the engine so that the engine's public
// API remains pure (no DB or config side-effects).
// ---------------------------------------------------------------------------

function deriveEffectiveInflow(financials: CaseWithFinancials['financials']): number {
  // Prefer the pre-computed engine value (financial calculator output)
  if (typeof financials.effectiveMonthlyInflow === 'number' && financials.effectiveMonthlyInflow > 0) {
    return financials.effectiveMonthlyInflow
  }
  // Fallback: raw inflow — the engine will still produce sensible results,
  // but statement-quality discounts will NOT have been applied.
  return financials.avgMonthlyInflow6m
    ?? financials.avgMonthlyInflow12m
    ?? 0
}

// ---------------------------------------------------------------------------
// runMatchingEngine — main export
// ---------------------------------------------------------------------------

export function runMatchingEngine(
  cas:            CaseWithFinancials,
  productConfig:  ProductPolicyConfig,
  bankConfig:     BankPolicyConfig,
  globalDefaults: GlobalEngineDefaults,
): MatchingEngineResult {
  const effectiveInflow = deriveEffectiveInflow(cas.financials)

  // Step 1: Amount range (needed for estimatedMaxAmount passed to risk flags)
  const amountCalculationBreakdown = computeAmountRange(
    cas, productConfig, bankConfig, globalDefaults, effectiveInflow,
  )

  // Step 2: Eligibility flags
  const eligibilityFlags = computeEligibilityFlags(
    cas, productConfig, bankConfig, globalDefaults,
  )

  // Step 3: Risk flags — pass estimatedMaxAmount from the breakdown
  const riskFlags = computeRiskFlags(
    cas, productConfig, bankConfig, globalDefaults,
    effectiveInflow,
    amountCalculationBreakdown.finalMax,
  )

  // Step 4: Match score — use the globally-resolved scoring thresholds
  const matchScore = computeMatchScore(
    eligibilityFlags,
    riskFlags,
    globalDefaults.scoringThresholds,
  )

  return {
    eligibilityFlags,
    riskFlags,
    matchScore,
    amountCalculationBreakdown,
  }
}
