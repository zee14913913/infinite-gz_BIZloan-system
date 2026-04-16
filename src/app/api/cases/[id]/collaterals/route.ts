import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { recalculateFinancials } from '@/lib/financial-calculator'
import type { CollateralType } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ id: string }> }

async function ensureFinancials(caseId: string) {
  return prisma.caseFinancials.upsert({
    where:  { case_id: caseId },
    create: { case_id: caseId },
    update: {},
  })
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const body = await req.json()

  if (!body.type || body.estimated_market_value === undefined) {
    return ApiResponse.badRequest('type and estimated_market_value are required')
  }

  const fin = await ensureFinancials(caseId)

  const marketValue   = Number(body.estimated_market_value)
  const encumbrance   = Number(body.existing_encumbrance ?? 0)
  const netEquity     = marketValue - encumbrance

  const collateral = await prisma.collateral.create({
    data: {
      financials_id:         fin.id,
      type:                  body.type as CollateralType,
      description:           body.description ?? '',
      estimated_market_value: marketValue,
      existing_encumbrance:  encumbrance,
      net_equity:            netEquity,
      valuation_date:        body.valuation_date ? new Date(body.valuation_date) : null,
      title_type:            body.title_type ?? null,
    },
  })

  const updated = await recalculateFinancials(caseId)
  return ApiResponse.created({ collateral, financials: updated })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const { searchParams } = new URL(req.url)
  const collateralId = searchParams.get('collateralId')
  if (!collateralId) return ApiResponse.badRequest('collateralId query param required')

  await prisma.collateral.delete({ where: { id: collateralId } })
  const updated = await recalculateFinancials(caseId)
  return ApiResponse.ok({ deleted: collateralId, financials: updated })
}
