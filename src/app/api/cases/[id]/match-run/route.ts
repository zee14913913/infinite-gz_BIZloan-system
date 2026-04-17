// =============================================================================
// POST /api/cases/[id]/match-run
//
// Runs the matching engine against all active products and persists results.
// Unlike /match-preview (Phase 2C), this route writes to the DB.
// =============================================================================

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { mapCaseToEngineCase } from '@/server/matching/mapCaseToEngineCase'
import { mapProductToPolicyConfig } from '@/server/matching/mapProductToPolicyConfig'
import { runMatchingEngine } from '@/server/matching/runMatchingEngine'
import { persistMatchingResults } from '@/server/matching/persistMatchingResults'
import {
  GLOBAL_ENGINE_DEFAULTS_BASELINE,
  getTemporaryBankPolicyConfig,
} from '@/server/matching/baseline-config'
import { matchingQueue } from '@/lib/queues'
import { auth } from '@/lib/auth'
import type { MatchingJobData } from '@/types/jobs.types'

const SCORE_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INELIGIBLE: 3 }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params

  // ── Load case (needed for both sync and async paths to validate existence) ─
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      client: true,
      financials: { include: { collaterals: true } },
    },
  })
  if (!caseRecord) return ApiResponse.notFound(`Case ${caseId} not found`)

  const isAsync = req.nextUrl.searchParams.get('async') === 'true'

  if (isAsync) {
    const session = await auth()
    const jobData: MatchingJobData = {
      caseId,
      triggeredBy: session?.user?.email ?? 'unknown',
    }
    const job = await matchingQueue.add('match-run', jobData)
    return new Response(
      JSON.stringify({ jobId: job.id, message: 'Matching run queued', queue: 'matching' }),
      { status: 202, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ── Synchronous path — unchanged ──────────────────────────────────────────
  const products = await prisma.product.findMany({
    where:   { is_active: true },
    include: { bank: true },
    take:    50,
  })
  if (products.length === 0) {
    return ApiResponse.ok({ evaluated: 0, persisted: 0, topScores: [] })
  }

  const engineCase     = mapCaseToEngineCase(caseRecord)
  const productResults = products.map(product => {
    const productConfig = mapProductToPolicyConfig(product)
    const bankConfig    = getTemporaryBankPolicyConfig(product.bank.code)
    const engineResult  = runMatchingEngine(
      engineCase, productConfig, bankConfig, GLOBAL_ENGINE_DEFAULTS_BASELINE,
    )
    return { productId: product.id, engineResult, product }
  })

  const persisted = await persistMatchingResults(
    caseId,
    productResults.map(r => ({ productId: r.productId, engineResult: r.engineResult })),
  )

  const sorted = [...productResults].sort(
    (a, b) => (SCORE_ORDER[a.engineResult.matchScore] ?? 9) - (SCORE_ORDER[b.engineResult.matchScore] ?? 9),
  )
  const topScores = sorted.slice(0, 3).map(r => ({
    productId:   r.productId,
    productName: r.product.product_name_zh || r.product.product_name_en,
    bankCode:    r.product.bank.code,
    matchScore:  r.engineResult.matchScore,
    amountMax:   r.engineResult.amountCalculationBreakdown.finalMax,
  }))

  return ApiResponse.ok({
    evaluated:  products.length,
    persisted,
    topScores,
    configNote: 'Using temporary baseline config — replace in Phase 3',
  })
}
