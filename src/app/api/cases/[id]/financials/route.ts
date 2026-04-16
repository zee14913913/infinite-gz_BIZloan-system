import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { recalculateFinancials } from '@/lib/financial-calculator'
import type { CcrisStatus } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const fin = await prisma.caseFinancials.findUnique({
    where: { case_id: id },
    include: { bank_accounts: true, existing_loans: true, collaterals: true },
  })
  if (!fin) return ApiResponse.notFound('No financials record for this case')
  return ApiResponse.ok(fin)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const body = await req.json()

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } })
  if (!caseRecord) return ApiResponse.notFound('Case not found')

  // Upsert the CaseFinancials record (create if missing, update if present)
  const fin = await prisma.caseFinancials.upsert({
    where:  { case_id: caseId },
    create: {
      case_id: caseId,
      ...buildFinancialsData(body),
    },
    update: buildFinancialsData(body),
    include: { bank_accounts: true, existing_loans: true, collaterals: true },
  })

  // Trigger recalculation of derived fields
  const recalculated = await recalculateFinancials(caseId)
  return ApiResponse.ok(recalculated ?? fin)
}

// ---------------------------------------------------------------------------
// buildFinancialsData — safely picks writable fields from request body
// ---------------------------------------------------------------------------

function buildFinancialsData(body: Record<string, unknown>) {
  return {
    // A. Revenue
    ...(body.annual_revenue_y1 !== undefined && { annual_revenue_y1: toFloatOrNull(body.annual_revenue_y1) }),
    ...(body.annual_revenue_y2 !== undefined && { annual_revenue_y2: toFloatOrNull(body.annual_revenue_y2) }),
    ...(body.annual_revenue_y3 !== undefined && { annual_revenue_y3: toFloatOrNull(body.annual_revenue_y3) }),
    ...(body.net_profit_y1     !== undefined && { net_profit_y1:     toFloatOrNull(body.net_profit_y1) }),
    ...(body.net_profit_y2     !== undefined && { net_profit_y2:     toFloatOrNull(body.net_profit_y2) }),
    ...(body.net_profit_y3     !== undefined && { net_profit_y3:     toFloatOrNull(body.net_profit_y3) }),
    ...(body.ebitda_y1         !== undefined && { ebitda_y1:         toFloatOrNull(body.ebitda_y1) }),
    ...(body.ebitda_y2         !== undefined && { ebitda_y2:         toFloatOrNull(body.ebitda_y2) }),
    ...(body.has_audited_accounts !== undefined && { has_audited_accounts: Boolean(body.has_audited_accounts) }),
    ...(body.has_tax_filing       !== undefined && { has_tax_filing:       Boolean(body.has_tax_filing) }),

    // B. Statement aggregates (usually set via bank_accounts child routes)
    ...(body.avg_monthly_inflow_6m             !== undefined && { avg_monthly_inflow_6m:             toFloatOrNull(body.avg_monthly_inflow_6m) }),
    ...(body.avg_monthly_inflow_12m            !== undefined && { avg_monthly_inflow_12m:            toFloatOrNull(body.avg_monthly_inflow_12m) }),
    ...(body.avg_monthly_ending_balance        !== undefined && { avg_monthly_ending_balance:        toFloatOrNull(body.avg_monthly_ending_balance) }),
    ...(body.bounce_cheque_count_12m           !== undefined && { bounce_cheque_count_12m:           toIntOrNull(body.bounce_cheque_count_12m) }),
    ...(body.cash_inflow_pct                   !== undefined && { cash_inflow_pct:                   toFloatOrNull(body.cash_inflow_pct) }),
    ...(body.single_customer_concentration_pct !== undefined && { single_customer_concentration_pct: toFloatOrNull(body.single_customer_concentration_pct) }),

    // D. Credit
    ...(body.ctos_score   !== undefined && { ctos_score:   toIntOrNull(body.ctos_score) }),
    ...(body.ccris_status !== undefined && { ccris_status: body.ccris_status as CcrisStatus }),
    ...(body.ccris_notes  !== undefined && { ccris_notes:  body.ccris_notes as string | null }),
  }
}

function toFloatOrNull(v: unknown): number | null {
  if (v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function toIntOrNull(v: unknown): number | null {
  const n = toFloatOrNull(v)
  return n !== null ? Math.round(n) : null
}
