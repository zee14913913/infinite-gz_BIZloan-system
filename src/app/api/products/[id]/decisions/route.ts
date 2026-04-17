import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { crossValidateProduct } from '@/server/evidence/crossValidate'

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
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id: productId } = await params
  const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!exists) return ApiResponse.notFound('Product not found')

  const summary = await crossValidateProduct(productId)
  return ApiResponse.ok(summary)
}
