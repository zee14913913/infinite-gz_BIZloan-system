import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import type { SourceChannel, Language } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ id: string; evidenceId: string }> }

const VALID_CHANNELS = new Set<string>([
  'OFFICIAL_BANK_WEBSITE', 'OFFICIAL_CGC_SJPP_BNM', 'FINANCIAL_MEDIA',
  'ADVISOR_CONSULTANT', 'APPLICANT_COMMUNITY', 'AUTHORITY_PLATFORM', 'INTERNAL_HANDBOOK',
])
const VALID_LANGUAGES = new Set<string>(['ZH', 'EN', 'BM'])

async function verifyOwnership(productId: string, evidenceId: string) {
  const ev = await prisma.fieldEvidence.findUnique({
    where:  { id: evidenceId },
    select: { id: true, product_id: true },
  })
  if (!ev) return { error: 'notfound' as const }
  if (ev.product_id !== productId) return { error: 'forbidden' as const }
  return { error: null }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: productId, evidenceId } = await params
  const { error } = await verifyOwnership(productId, evidenceId)
  if (error === 'notfound')  return ApiResponse.notFound('Evidence not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Evidence does not belong to this product')

  const evidence = await prisma.fieldEvidence.findUnique({ where: { id: evidenceId } })
  return ApiResponse.ok(evidence)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id: productId, evidenceId } = await params
  const { error } = await verifyOwnership(productId, evidenceId)
  if (error === 'notfound')  return ApiResponse.notFound('Evidence not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Evidence does not belong to this product')

  const body = await req.json()

  if (body.source_channel && !VALID_CHANNELS.has(body.source_channel)) {
    return ApiResponse.badRequest(`Invalid source_channel. Must be one of: ${[...VALID_CHANNELS].join(', ')}`)
  }
  if (body.language && !VALID_LANGUAGES.has(body.language)) {
    return ApiResponse.badRequest(`Invalid language. Must be one of: ${[...VALID_LANGUAGES].join(', ')}`)
  }

  // is_verified must be set together with verified_by and verified_at
  if (body.is_verified === true && !body.verified_by) {
    return ApiResponse.badRequest('verified_by is required when setting is_verified = true')
  }

  const updated = await prisma.fieldEvidence.update({
    where: { id: evidenceId },
    data: {
      ...(body.field_name        !== undefined && { field_name:       body.field_name.trim() }),
      ...(body.step_type         !== undefined && { step_type:        body.step_type ?? null }),
      ...(body.raw_text          !== undefined && { raw_text:         body.raw_text.trim() }),
      ...(body.raw_value         !== undefined && { raw_value:        body.raw_value ? String(body.raw_value).trim() : null }),
      ...(body.normalized_value  !== undefined && { normalized_value: body.normalized_value ? String(body.normalized_value).trim() : null }),
      ...(body.source_url        !== undefined && { source_url:       body.source_url ?? null }),
      ...(body.source_channel    !== undefined && { source_channel:   body.source_channel as SourceChannel }),
      ...(body.source_name       !== undefined && { source_name:      body.source_name.trim() }),
      ...(body.source_date       !== undefined && { source_date:      body.source_date ? new Date(body.source_date) : null }),
      ...(body.language          !== undefined && { language:         body.language as Language }),
      // is_verified + verified_by + verified_at must be updated atomically
      ...(body.is_verified !== undefined && {
        is_verified:  Boolean(body.is_verified),
        verified_by:  body.is_verified ? (body.verified_by ?? null) : null,
        verified_at:  body.is_verified ? new Date() : null,
      }),
    },
  })
  return ApiResponse.ok(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id: productId, evidenceId } = await params
  const { error } = await verifyOwnership(productId, evidenceId)
  if (error === 'notfound')  return ApiResponse.notFound('Evidence not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Evidence does not belong to this product')

  await prisma.fieldEvidence.delete({ where: { id: evidenceId } })
  return ApiResponse.ok({ deleted: evidenceId })
}
