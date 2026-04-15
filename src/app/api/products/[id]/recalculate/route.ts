import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { calcBlockACompletion, calcBlockBCompletion } from '@/lib/completion'
import { safeParseJSON } from '@/types/bank.types'
import type { ProductBlockA, ProcessStep } from '@/types/bank.types'

// POST /api/products/[id]/recalculate
// Phase 2: recalculates block_a_completion_pct and block_b_completion_pct ONLY.
// Does NOT run cross-validation, does NOT write FieldDecision or FieldDecisionEvidence.
// Cross-validation is Phase 5.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return ApiResponse.notFound('Product not found')

    const blockA = safeParseJSON<ProductBlockA | null>(product.block_a_json, null)
    const blockB = safeParseJSON<ProcessStep[] | null>(product.block_b_json, null)
    const block_a_completion_pct = calcBlockACompletion(blockA)
    const block_b_completion_pct = calcBlockBCompletion(blockB)

    const updated = await prisma.product.update({
      where: { id },
      data: { block_a_completion_pct, block_b_completion_pct },
      select: { id: true, block_a_completion_pct: true, block_b_completion_pct: true },
    })
    return ApiResponse.ok(updated)
  } catch {
    return ApiResponse.serverError('Failed to recalculate')
  }
}
