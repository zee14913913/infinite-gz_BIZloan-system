import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { crossValidateProduct } from '@/server/evidence/crossValidate'
import { evidenceQueue } from '@/lib/queues'
import type { EvidenceJobData } from '@/types/jobs.types'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: productId } = await params
  const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!exists) return ApiResponse.notFound('Product not found')

  const decisions = await prisma.fieldDecision.findMany({
    where:   { product_id: productId },
    orderBy: [{ field_name: 'asc' }, { step_type: 'asc' }],
    include: {
      evidence_links: {
        include: { evidence: true },
      },
    },
  })
  return ApiResponse.ok(decisions)
}

// POST triggers the cross-validation engine (run-validate)
// ?async=true → enqueue background job and return 202
// default (no param) → run synchronously and return results
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: productId } = await params
  const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!exists) return ApiResponse.notFound('Product not found')

  const isAsync = req.nextUrl.searchParams.get('async') === 'true'

  if (isAsync) {
    const jobData: EvidenceJobData = { productId }
    const job = await evidenceQueue.add('cross-validate', jobData)
    return new Response(
      JSON.stringify({ jobId: job.id, message: 'Cross-validation queued', queue: 'evidence' }),
      { status: 202, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Synchronous path — unchanged
  const summary = await crossValidateProduct(productId)
  return ApiResponse.ok(summary)
}
