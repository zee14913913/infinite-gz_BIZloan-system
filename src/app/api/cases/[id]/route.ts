import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const case_ = await prisma.case.findUnique({
    where: { id },
    include: {
      client: true,
      financials: {
        include: {
          bank_accounts:  true,
          existing_loans: true,
          collaterals:    true,
        },
      },
      directors: true,
      matching_results: {
        include: { product: { include: { bank: true } } },
        orderBy: { calculated_at: 'desc' },
      },
    },
  })
  if (!case_) return ApiResponse.notFound()
  return ApiResponse.ok(case_)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()
  const {
    purpose, purpose_description, requested_amount,
    acceptable_max_monthly_repayment, preferred_tenure_months,
    urgency, status, follow_up_date, notes,
  } = body

  const exists = await prisma.case.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return ApiResponse.notFound()

  const updated = await prisma.case.update({
    where: { id },
    data: {
      ...(purpose              && { purpose }),
      ...(purpose_description !== undefined && { purpose_description }),
      ...(requested_amount    && { requested_amount: Number(requested_amount) }),
      ...(acceptable_max_monthly_repayment !== undefined && {
        acceptable_max_monthly_repayment: acceptable_max_monthly_repayment
          ? Number(acceptable_max_monthly_repayment) : null,
      }),
      ...(preferred_tenure_months !== undefined && {
        preferred_tenure_months: preferred_tenure_months
          ? Number(preferred_tenure_months) : null,
      }),
      ...(urgency        && { urgency }),
      ...(status         && { status }),
      ...(follow_up_date !== undefined && {
        follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
      }),
      ...(notes !== undefined && { notes }),
    },
  })
  return ApiResponse.ok(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const exists = await prisma.case.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return ApiResponse.notFound()
  await prisma.case.delete({ where: { id } })
  return ApiResponse.ok({ id })
}
