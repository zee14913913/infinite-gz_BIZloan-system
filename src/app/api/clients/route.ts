import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  const clients = await prisma.client.findMany({
    where: q ? {
      OR: [
        { company_name:  { contains: q } },
        { ssm_number:    { contains: q } },
      ],
    } : undefined,
    orderBy: { created_at: 'desc' },
    take: 100,
    include: { _count: { select: { cases: true } } },
  })
  return ApiResponse.ok(clients)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    company_name, ssm_number, company_type, industry_category,
    industry_subcategory, incorporation_date, registered_address,
    operating_address, bumiputera_status,
    primary_contact_name, primary_contact_ic,
    primary_contact_phone, primary_contact_email,
  } = body

  if (!company_name || !ssm_number || !company_type || !industry_category
    || !incorporation_date || !registered_address
    || !primary_contact_name || !primary_contact_ic
    || !primary_contact_phone || !primary_contact_email) {
    return ApiResponse.badRequest('Missing required client fields')
  }

  const existing = await prisma.client.findUnique({ where: { ssm_number } })
  if (existing) return ApiResponse.error(409, `Client with SSM ${ssm_number} already exists`)

  const client = await prisma.client.create({
    data: {
      company_name, ssm_number, company_type, industry_category,
      industry_subcategory: industry_subcategory ?? null,
      incorporation_date:   new Date(incorporation_date),
      registered_address,
      operating_address:    operating_address ?? null,
      bumiputera_status:    bumiputera_status ?? false,
      primary_contact_name, primary_contact_ic,
      primary_contact_phone, primary_contact_email,
    },
  })
  return ApiResponse.created(client)
}
