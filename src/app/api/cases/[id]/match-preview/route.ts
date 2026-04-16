// =============================================================================
// POST /api/cases/[id]/match-preview
//
// Preview-only: runs the matching engine against one or all active products
// for a given case.  Results are NOT persisted to the MatchingResult table.
//
// Query params:
//   ?productId=<id>   — run against a single product
//   (no param)        — run against all active products (max 50 for safety)
//
// Uses temporary baseline config until Phase 3 real config is populated.
// =============================================================================

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { mapCaseToEngineCase } from '@/server/matching/mapCaseToEngineCase'
import { mapProductToPolicyConfig } from '@/server/matching/mapProductToPolicyConfig'
import { runMatchingEngine } from '@/server/matching/runMatchingEngine'
import {
  GLOBAL_ENGINE_DEFAULTS_BASELINE,
  getTemporaryBankPolicyConfig,
} from '@/server/matching/baseline-config'

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: caseId } = await params

  // ── Load case with all required relations ─────────────────────────────────
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      client: true,
      financials: {
        include: { collaterals: true },
      },
    },
  })

  if (!caseRecord) {
    return ApiResponse.notFound(`Case ${caseId} not found`)
  }

  // ── Resolve target products ───────────────────────────────────────────────
  const url = new URL(_req.url)
  const singleProductId = url.searchParams.get('productId')

  const products = singleProductId
    ? await prisma.product.findMany({
        where: { id: singleProductId, is_active: true },
        include: { bank: true },
      })
    : await prisma.product.findMany({
        where: { is_active: true },
        include: { bank: true },
        take: 50,  // safety cap before Phase 3 pagination
      })

  if (products.length === 0) {
    return ApiResponse.notFound('No active products found for matching')
  }

  // ── Map case to engine shape ───────────────────────────────────────────────
  const engineCase = mapCaseToEngineCase(caseRecord)

  // ── Run engine for each product ───────────────────────────────────────────
  const results = products.map(product => {
    const productConfig = mapProductToPolicyConfig(product)
    const bankConfig    = getTemporaryBankPolicyConfig(product.bank.code)

    const engineResult = runMatchingEngine(
      engineCase,
      productConfig,
      bankConfig,
      GLOBAL_ENGINE_DEFAULTS_BASELINE,
    )

    return {
      productId:    product.id,
      productCode:  product.product_code,
      productName:  product.product_name_zh || product.product_name_en,
      bankCode:     product.bank.code,
      bankName:     product.bank.name_zh,
      matchScore:               engineResult.matchScore,
      eligibilityFlags:         engineResult.eligibilityFlags,
      riskFlags:                engineResult.riskFlags,
      amountCalculationBreakdown: engineResult.amountCalculationBreakdown,
    }
  })

  // Sort: HIGH → MEDIUM → LOW → INELIGIBLE
  const ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INELIGIBLE: 3 }
  results.sort((a, b) => (ORDER[a.matchScore] ?? 9) - (ORDER[b.matchScore] ?? 9))

  return ApiResponse.ok(
    {
      caseId,
      caseReference: caseRecord.case_reference,
      previewOnly:   true,
      configNote:    'Using temporary baseline config — replace in Phase 3',
      productCount:  results.length,
      results,
    },
    'Match preview completed',
  )
}
