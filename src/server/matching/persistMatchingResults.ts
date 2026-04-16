// =============================================================================
// BCIS — Matching Result Persistence
//
// Accepts engine results and upserts them into the MatchingResult table.
// Keeps engine types untouched; serialises flag arrays to JSON strings.
// estimated_approval_probability: Phase 4 does not implement a probability
// model. Field is left null — Phase 5+ will populate from calibration data.
// =============================================================================

import { prisma } from '@/lib/prisma'
import type { MatchingEngineResult } from '@/server/matching/runMatchingEngine'
import type { MatchScore } from '@/generated/prisma/client'

export interface ProductEngineResult {
  productId:    string
  engineResult: MatchingEngineResult
}

export async function persistMatchingResults(
  caseId: string,
  results: ProductEngineResult[],
): Promise<number> {
  if (results.length === 0) return 0

  let persisted = 0

  for (const { productId, engineResult } of results) {
    const breakdown = engineResult.amountCalculationBreakdown

    await prisma.matchingResult.upsert({
      where:  { case_id_product_id: { case_id: caseId, product_id: productId } },
      create: {
        case_id:    caseId,
        product_id: productId,
        overall_score:         engineResult.matchScore as MatchScore,
        estimated_amount_min:  breakdown.finalMin,
        estimated_amount_max:  breakdown.finalMax,
        // Monthly repayment estimates: Phase 4 — not yet computed; null.
        estimated_monthly_repayment_min: null,
        estimated_monthly_repayment_max: null,
        // Approval probability: Phase 4 — not modelled; null.
        estimated_approval_probability: null,
        eligibility_flags_json: JSON.stringify(engineResult.eligibilityFlags),
        risk_flags_json:        JSON.stringify(engineResult.riskFlags),
        requirement_gaps_json:  JSON.stringify([]),       // Phase 4: not populated
        amount_breakdown_json:  JSON.stringify(breakdown),
        calculated_at:          new Date(),
      },
      update: {
        overall_score:         engineResult.matchScore as MatchScore,
        estimated_amount_min:  breakdown.finalMin,
        estimated_amount_max:  breakdown.finalMax,
        estimated_monthly_repayment_min: null,
        estimated_monthly_repayment_max: null,
        estimated_approval_probability: null,
        eligibility_flags_json: JSON.stringify(engineResult.eligibilityFlags),
        risk_flags_json:        JSON.stringify(engineResult.riskFlags),
        requirement_gaps_json:  JSON.stringify([]),
        amount_breakdown_json:  JSON.stringify(breakdown),
        calculated_at:          new Date(),
      },
    })
    persisted++
  }

  return persisted
}
