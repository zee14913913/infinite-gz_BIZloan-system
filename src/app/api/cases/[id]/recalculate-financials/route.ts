import { NextRequest } from 'next/server'
import ApiResponse from '@/lib/api-response'
import { recalculateFinancials } from '@/lib/financial-calculator'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const result = await recalculateFinancials(id)
  if (!result) return ApiResponse.notFound('No financials record for this case')
  return ApiResponse.ok(result)
}
