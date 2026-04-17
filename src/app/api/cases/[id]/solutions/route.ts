import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'

type Ctx = { params: Promise<{ id: string }> }

const SCORE_PRIORITY: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INELIGIBLE: 3 }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const caseExists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } })
  if (!caseExists) return ApiResponse.notFound('Case not found')

  const results = await prisma.matchingResult.findMany({
    where:   { case_id: caseId },
    include: { product: { include: { bank: true } } },
    orderBy: { calculated_at: 'desc' },
  })

  // Sort by score priority (HIGH → MEDIUM → LOW → INELIGIBLE) then by recency
  results.sort((a, b) => {
    const pa = SCORE_PRIORITY[a.overall_score] ?? 9
    const pb = SCORE_PRIORITY[b.overall_score] ?? 9
    return pa - pb
  })

  return ApiResponse.ok(results)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const body = await req.json()

  // body: { resultId, is_selected?, selected_amount?, selected_tenure_months?, advisor_override_notes? }
  const { resultId, is_selected, selected_amount, selected_tenure_months, advisor_override_notes } = body
  if (!resultId) return ApiResponse.badRequest('resultId is required')

  const result = await prisma.matchingResult.findUnique({
    where: { id: resultId },
    select: { id: true, case_id: true, estimated_amount_min: true, estimated_amount_max: true },
  })
  if (!result) return ApiResponse.notFound('Matching result not found')
  if (result.case_id !== caseId) return ApiResponse.forbidden('Result does not belong to this case')

  // Validate selected_amount is within engine range (if range is available)
  if (selected_amount !== undefined && selected_amount !== null) {
    const amt = Number(selected_amount)
    if (result.estimated_amount_max !== null && amt > result.estimated_amount_max) {
      return ApiResponse.badRequest(
        `selected_amount ${amt} exceeds engine maximum ${result.estimated_amount_max}`,
      )
    }
    if (result.estimated_amount_min !== null && amt < result.estimated_amount_min) {
      return ApiResponse.badRequest(
        `selected_amount ${amt} is below engine minimum ${result.estimated_amount_min}`,
      )
    }
  }

  // Enforce max-3 shortlist at the server level
  if (is_selected === true || is_selected === 'true') {
    const currentlySelected = await prisma.matchingResult.count({
      where: { case_id: caseId, is_selected: true, id: { not: resultId } },
    })
    if (currentlySelected >= 3) {
      return ApiResponse.badRequest('Maximum 3 products can be shortlisted per case')
    }
  }

  const updated = await prisma.matchingResult.update({
    where: { id: resultId },
    data: {
      ...(is_selected              !== undefined && { is_selected:              Boolean(is_selected) }),
      ...(selected_amount          !== undefined && { selected_amount:          selected_amount ? Number(selected_amount) : null }),
      ...(selected_tenure_months   !== undefined && { selected_tenure_months:   selected_tenure_months ? Number(selected_tenure_months) : null }),
      ...(advisor_override_notes   !== undefined && { advisor_override_notes:   advisor_override_notes ?? null }),
    },
    include: { product: { include: { bank: true } } },
  })
  return ApiResponse.ok(updated)
}
