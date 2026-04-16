import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: { cases: { orderBy: { created_at: 'desc' }, take: 20 } },
  })
  if (!client) return ApiResponse.notFound()
  return ApiResponse.ok(client)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()
  const {
    company_name, ssm_number, company_type, industry_category,
    industry_subcategory, incorporation_date, registered_address,
    operating_address, bumiputera_status,
    primary_contact_name, primary_contact_ic,
    primary_contact_phone, primary_contact_email,
  } = body

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(company_name        && { company_name }),
      ...(ssm_number          && { ssm_number }),
      ...(company_type        && { company_type }),
      ...(industry_category   && { industry_category }),
      ...(industry_subcategory !== undefined && { industry_subcategory }),
      ...(incorporation_date  && { incorporation_date: new Date(incorporation_date) }),
      ...(registered_address  && { registered_address }),
      ...(operating_address   !== undefined && { operating_address }),
      ...(bumiputera_status   !== undefined && { bumiputera_status }),
      ...(primary_contact_name  && { primary_contact_name }),
      ...(primary_contact_ic    && { primary_contact_ic }),
      ...(primary_contact_phone && { primary_contact_phone }),
      ...(primary_contact_email && { primary_contact_email }),
    },
  })
  return ApiResponse.ok(client)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  await prisma.client.delete({ where: { id } })
  return ApiResponse.ok({ id })
}
