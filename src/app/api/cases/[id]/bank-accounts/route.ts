import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { aggregateBankAccounts, recalculateFinancials } from '@/lib/financial-calculator'

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

  const caseExists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } })
  if (!caseExists) return ApiResponse.notFound('Case not found')

  const fin = await ensureFinancials(caseId)

  const account = await prisma.bankAccountSummary.create({
    data: {
      financials_id:        fin.id,
      bank_name:            body.bank_name ?? '',
      account_number_last4: body.account_number_last4 ?? '****',
      is_primary:           body.is_primary ?? false,
      avg_monthly_inflow:   body.avg_monthly_inflow   ? Number(body.avg_monthly_inflow)   : null,
      avg_monthly_outflow:  body.avg_monthly_outflow  ? Number(body.avg_monthly_outflow)  : null,
      avg_ending_balance:   body.avg_ending_balance   ? Number(body.avg_ending_balance)   : null,
      months_of_data:       body.months_of_data       ? Number(body.months_of_data)       : 6,
      bounce_count:         body.bounce_count         ? Number(body.bounce_count)         : 0,
      concentration_risk:   body.concentration_risk   ?? false,
      cash_inflow_pct:      body.cash_inflow_pct      ? Number(body.cash_inflow_pct)      : null,
    },
  })

  // Re-aggregate and recalculate derived fields
  const allAccounts = await prisma.bankAccountSummary.findMany({ where: { financials_id: fin.id } })
  await aggregateBankAccounts(fin.id, allAccounts)
  const updated = await recalculateFinancials(caseId)
  return ApiResponse.created({ account, financials: updated })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  if (!accountId) return ApiResponse.badRequest('accountId query param required')

  // Ownership check: verify the account belongs to this case's financials
  const account = await prisma.bankAccountSummary.findUnique({
    where: { id: accountId },
    include: { financials: { select: { case_id: true } } },
  })
  if (!account) return ApiResponse.notFound('Bank account not found')
  if (account.financials.case_id !== caseId) return ApiResponse.forbidden('Account does not belong to this case')

  await prisma.bankAccountSummary.delete({ where: { id: accountId } })

  const fin = await prisma.caseFinancials.findUnique({ where: { case_id: caseId } })
  if (fin) {
    const remaining = await prisma.bankAccountSummary.findMany({ where: { financials_id: fin.id } })
    await aggregateBankAccounts(fin.id, remaining)
    await recalculateFinancials(caseId)
  }
  return ApiResponse.ok({ deleted: accountId })
}
