// =============================================================================
// BCIS Matching Engine — Public API
// Phase 2A: function signatures only.
//
// IMPLEMENTATION STATUS: all bodies throw 'Not implemented'.
// Phase 2B will provide the full implementation.
//
// Domain models imported below are defined in their respective modules per
// Corporate-Loan_Assessment.md; they are NOT redefined here.
// =============================================================================

// ── Domain model imports (defined elsewhere in the BCIS codebase) ─────────
import type { CaseWithFinancials }  from '@/types/case.types'
import type { ProductPolicyConfig } from '@/types/policy.types'
import type { BankPolicyConfig }    from '@/types/policy.types'
import type { GlobalEngineDefaults } from '@/types/policy.types'

// ── Matching engine type imports ──────────────────────────────────────────
import type {
  EligibilityFlag,
  RiskFlag,
  MatchScore,
  AmountCalculationBreakdown,
  ScoringThresholds,
} from './types'

// -----------------------------------------------------------------------------
// computeEligibilityFlags
//
// Evaluates all eligibility rules for a (case, product, bank, global) tuple
// and returns an EligibilityFlag for every rule that was checked — both passed
// and failed — so callers have a complete audit trail.
//
// Implementation: Phase 2B.
// -----------------------------------------------------------------------------

export function computeEligibilityFlags(
  _cas:            CaseWithFinancials,
  _productConfig:  ProductPolicyConfig,
  _bankConfig:     BankPolicyConfig,
  _globalDefaults: GlobalEngineDefaults,
): EligibilityFlag[] {
  throw new Error('Not implemented: Phase 2B will provide implementation')
}

// -----------------------------------------------------------------------------
// computeRiskFlags
//
// Evaluates all risk-signal rules for a (case, product, bank, global) tuple
// using the pre-discounted effectiveInflow and a pre-computed
// estimatedMaxAmount (from computeAmountRange) so that loan-size preference
// checks can reference a concrete figure.
//
// Implementation: Phase 2B.
// -----------------------------------------------------------------------------

export function computeRiskFlags(
  _cas:                CaseWithFinancials,
  _productConfig:      ProductPolicyConfig,
  _bankConfig:         BankPolicyConfig,
  _globalDefaults:     GlobalEngineDefaults,
  _effectiveInflow:    number,
  _estimatedMaxAmount: number | null,
): RiskFlag[] {
  throw new Error('Not implemented: Phase 2B will provide implementation')
}

// -----------------------------------------------------------------------------
// computeMatchScore
//
// Derives the discrete MatchScore from the outputs of computeEligibilityFlags
// and computeRiskFlags, using the band-boundary counts in ScoringThresholds.
//
// Rule skeleton (qualitative, no numeric literals):
//   any HARD_BLOCK EligibilityFlag that is not passed → INELIGIBLE
//   HIGH-severity RiskFlag count ≥ thresholds.highRiskFlagCountForLow → LOW
//   HIGH-severity RiskFlag count ≥ thresholds.highRiskFlagCountForMedium → MEDIUM
//   MEDIUM-severity RiskFlag count ≥ thresholds.medRiskFlagCountForMedium → MEDIUM
//   otherwise → HIGH
//
// Implementation: Phase 2B.
// -----------------------------------------------------------------------------

export function computeMatchScore(
  _eligibilityFlags: EligibilityFlag[],
  _riskFlags:        RiskFlag[],
  _thresholds:       ScoringThresholds,
): MatchScore {
  throw new Error('Not implemented: Phase 2B will provide implementation')
}

// -----------------------------------------------------------------------------
// computeAmountRange
//
// Runs all three amount-sizing methods (TURNOVER, REVENUE, DSCR) using the
// resolved config fields at product > bank > global precedence, then selects
// the binding constraint as the smallest valid ceiling across all methods and
// the product cap.
//
// Accepts effectiveInflow pre-computed by applyStatementDiscounts() so that
// statement-quality discounting logic is not duplicated here.
//
// Implementation: Phase 2B.
// -----------------------------------------------------------------------------

export function computeAmountRange(
  _cas:             CaseWithFinancials,
  _productConfig:   ProductPolicyConfig,
  _bankConfig:      BankPolicyConfig,
  _globalDefaults:  GlobalEngineDefaults,
  _effectiveInflow: number,
): AmountCalculationBreakdown {
  throw new Error('Not implemented: Phase 2B will provide implementation')
}
