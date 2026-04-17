import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import type { SourceChannel, Language } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ id: string }> }

const VALID_CHANNELS = new Set<string>([
  'OFFICIAL_BANK_WEBSITE', 'OFFICIAL_CGC_SJPP_BNM', 'FINANCIAL_MEDIA',
  'ADVISOR_CONSULTANT', 'APPLICANT_COMMUNITY', 'AUTHORITY_PLATFORM', 'INTERNAL_HANDBOOK',
])
const VALID_LANGUAGES = new Set<string>(['ZH', 'EN', 'BM'])

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: productId } = await params
  const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!exists) return ApiResponse.notFound('Product not found')

  const evidence = await prisma.fieldEvidence.findMany({
    where:   { product_id: productId },
    orderBy: [{ field_name: 'asc' }, { created_at: 'desc' }],
  })
  return ApiResponse.ok(evidence)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: productId } = await params
  const body = await req.json()

  const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!exists) return ApiResponse.notFound('Product not found')

  const { field_name, raw_text, source_channel, source_name } = body
  if (!field_name || !raw_text || !source_channel || !source_name) {
    return ApiResponse.badRequest('field_name, raw_text, source_channel, source_name are required')
  }
  if (!VALID_CHANNELS.has(source_channel)) {
    return ApiResponse.badRequest(`Invalid source_channel. Must be one of: ${[...VALID_CHANNELS].join(', ')}`)
  }
  if (body.language && !VALID_LANGUAGES.has(body.language)) {
    return ApiResponse.badRequest(`Invalid language. Must be one of: ${[...VALID_LANGUAGES].join(', ')}`)
  }

  const evidence = await prisma.fieldEvidence.create({
    data: {
      product_id:      productId,
      field_name:      field_name.trim(),
      step_type:       body.step_type   ?? null,
      raw_text:        raw_text.trim(),
      raw_value:       body.raw_value       ? String(body.raw_value).trim()       : null,
      normalized_value: body.normalized_value ? String(body.normalized_value).trim() : null,
      source_url:      body.source_url    ?? null,
      source_channel:  source_channel as SourceChannel,
      source_name:     source_name.trim(),
      source_date:     body.source_date   ? new Date(body.source_date) : null,
      language:        (body.language ?? 'ZH') as Language,
      is_verified:     false,
    },
  })
  return ApiResponse.created(evidence)
}
