import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { generateCaseReference } from '@/lib/case-reference'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const advisorId = searchParams.get('advisorId')

  const cases = await prisma.case.findMany({
    where: {
      ...(status    && { status }),
      ...(advisorId && { advisor_id: advisorId }),
    },
    include: {
      client: { select: { company_name: true, industry_category: true } },
      _count: { select: { matching_results: true } },
    },
    orderBy: { updated_at: 'desc' },
    take: 100,
  })
  return ApiResponse.ok(cases)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const body = await req.json()
  const {
    client_id, purpose, purpose_description,
    requested_amount, acceptable_max_monthly_repayment,
    preferred_tenure_months, urgency, notes,
  } = body

  if (!client_id || !purpose || !requested_amount) {
    return ApiResponse.badRequest('client_id, purpose, and requested_amount are required')
  }

  const client = await prisma.client.findUnique({ where: { id: client_id } })
  if (!client) return ApiResponse.notFound('Client not found')

  const advisorId = session?.user?.id
  if (!advisorId) return ApiResponse.unauthorized()

  const case_reference = await generateCaseReference()

  const newCase = await prisma.case.create({
    data: {
      client_id,
      case_reference,
      advisor_id:                      advisorId,
      purpose,
      purpose_description:             purpose_description ?? null,
      requested_amount:                Number(requested_amount),
      acceptable_max_monthly_repayment: acceptable_max_monthly_repayment
        ? Number(acceptable_max_monthly_repayment) : null,
      preferred_tenure_months:         preferred_tenure_months
        ? Number(preferred_tenure_months) : null,
      urgency:                         urgency ?? 'MEDIUM',
      notes:                           notes ?? null,
      status:                          'INTAKE',
    },
    include: { client: true },
  })
  return ApiResponse.created(newCase)
}
