import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { auth } from '@/lib/auth'
import type { FieldConfidence, ValueType } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ id: string; decisionId: string }> }

const VALID_CONFIDENCE = new Set<string>(['CONFIRMED', 'LIKELY', 'ESTIMATED', 'CONFLICT', 'MISSING'])
const VALID_VALUE_TYPE = new Set<string>(['POINT_VALUE', 'RANGE', 'TEXT', 'FORMULA'])

async function verifyOwnership(productId: string, decisionId: string) {
  const dec = await prisma.fieldDecision.findUnique({
    where:  { id: decisionId },
    select: { id: true, product_id: true, human_overridden: true },
  })
  if (!dec) return { error: 'notfound' as const, decision: null }
  if (dec.product_id !== productId) return { error: 'forbidden' as const, decision: null }
  return { error: null, decision: dec }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: productId, decisionId } = await params
  const { error } = await verifyOwnership(productId, decisionId)
  if (error === 'notfound')  return ApiResponse.notFound('Decision not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Decision does not belong to this product')

  const decision = await prisma.fieldDecision.findUnique({
    where:   { id: decisionId },
    include: { evidence_links: { include: { evidence: true } } },
  })
  return ApiResponse.ok(decision)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id: productId, decisionId } = await params
  const { error } = await verifyOwnership(productId, decisionId)
  if (error === 'notfound')  return ApiResponse.notFound('Decision not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Decision does not belong to this product')

  const body    = await req.json()
  const session = await auth()

  // Human override: override_reason is mandatory
  if (body.human_overridden === true && !body.override_reason) {
    return ApiResponse.badRequest('override_reason is required when setting human_overridden = true')
  }
  if (body.confidence && !VALID_CONFIDENCE.has(body.confidence)) {
    return ApiResponse.badRequest(`Invalid confidence. Must be one of: ${[...VALID_CONFIDENCE].join(', ')}`)
  }
  if (body.value_type && !VALID_VALUE_TYPE.has(body.value_type)) {
    return ApiResponse.badRequest(`Invalid value_type. Must be one of: ${[...VALID_VALUE_TYPE].join(', ')}`)
  }

  const updated = await prisma.fieldDecision.update({
    where: { id: decisionId },
    data:  {
      ...(body.final_value     !== undefined && { final_value:     body.final_value ?? null }),
      ...(body.confidence      !== undefined && { confidence:      body.confidence as FieldConfidence }),
      ...(body.value_type      !== undefined && { value_type:      body.value_type as ValueType }),
      ...(body.decision_basis  !== undefined && { decision_basis:  body.decision_basis }),
      // Human override fields — set together
      ...(body.human_overridden === true && {
        human_overridden: true,
        override_reason:  body.override_reason,
        override_by:      session?.user?.email ?? body.override_by ?? 'unknown',
        override_at:      new Date(),
      }),
      // Allow reverting an override (human_overridden = false)
      ...(body.human_overridden === false && {
        human_overridden: false,
        override_reason:  null,
        override_by:      null,
        override_at:      null,
      }),
    },
    include: { evidence_links: { include: { evidence: true } } },
  })
  return ApiResponse.ok(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id: productId, decisionId } = await params
  const { error, decision } = await verifyOwnership(productId, decisionId)
  if (error === 'notfound')  return ApiResponse.notFound('Decision not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Decision does not belong to this product')

  if (decision && decision.human_overridden) {
    return ApiResponse.badRequest(
      'Cannot delete a human-overridden decision. Set human_overridden = false first, then delete.',
    )
  }

  // FieldDecisionEvidence rows are cascade-deleted via schema onDelete: Cascade
  await prisma.fieldDecision.delete({ where: { id: decisionId } })
  return ApiResponse.ok({ deleted: decisionId })
}
