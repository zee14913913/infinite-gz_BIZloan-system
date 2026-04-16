import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { recalculateFinancials } from '@/lib/financial-calculator'

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

  if (!body.bank_name || body.monthly_repayment === undefined || body.outstanding_balance === undefined) {
    return ApiResponse.badRequest('bank_name, monthly_repayment, and outstanding_balance are required')
  }

  const caseExists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } })
  if (!caseExists) return ApiResponse.notFound('Case not found')

  const fin = await ensureFinancials(caseId)

  const loan = await prisma.existingLoan.create({
    data: {
      financials_id:        fin.id,
      bank_name:            body.bank_name,
      product_type:         body.product_type   ?? 'Term Loan',
      outstanding_balance:  Number(body.outstanding_balance),
      monthly_repayment:    Number(body.monthly_repayment),
      maturity_date:        body.maturity_date ? new Date(body.maturity_date) : null,
      is_secured:           body.is_secured  ?? false,
      collateral_description: body.collateral_description ?? null,
    },
  })

  const updated = await recalculateFinancials(caseId)
  return ApiResponse.created({ loan, financials: updated })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const { searchParams } = new URL(req.url)
  const loanId = searchParams.get('loanId')
  if (!loanId) return ApiResponse.badRequest('loanId query param required')

  const loan = await prisma.existingLoan.findUnique({
    where: { id: loanId },
    include: { financials: { select: { case_id: true } } },
  })
  if (!loan) return ApiResponse.notFound('Loan not found')
  if (loan.financials.case_id !== caseId) return ApiResponse.forbidden('Loan does not belong to this case')

  await prisma.existingLoan.delete({ where: { id: loanId } })
  const updated = await recalculateFinancials(caseId)
  return ApiResponse.ok({ deleted: loanId, financials: updated })
}
