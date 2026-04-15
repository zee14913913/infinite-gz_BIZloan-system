import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { InstitutionType } from '@/generated/prisma/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const bank = await prisma.bank.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        products: {
          orderBy: { product_code: 'asc' },
        },
      },
    })
    if (!bank) return ApiResponse.notFound('Bank not found')
    return ApiResponse.ok(bank)
  } catch {
    return ApiResponse.serverError('Failed to fetch bank')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const body = await request.json()
    if (body.type && !Object.values(InstitutionType).includes(body.type)) {
      return ApiResponse.badRequest(`Invalid type`)
    }
    const bank = await prisma.bank.update({
      where: { code: code.toUpperCase() },
      data: {
        ...(body.name_en              !== undefined && { name_en: body.name_en }),
        ...(body.name_zh              !== undefined && { name_zh: body.name_zh }),
        ...(body.name_bm              !== undefined && { name_bm: body.name_bm }),
        ...(body.type                 !== undefined && { type: body.type as InstitutionType }),
        ...(body.is_shariah_compliant !== undefined && { is_shariah_compliant: body.is_shariah_compliant }),
        ...(body.official_website     !== undefined && { official_website: body.official_website }),
        ...(body.sme_portal_url       !== undefined && { sme_portal_url: body.sme_portal_url }),
        ...(body.cgc_partner          !== undefined && { cgc_partner: body.cgc_partner }),
        ...(body.sjpp_partner         !== undefined && { sjpp_partner: body.sjpp_partner }),
        ...(body.bnm_fund_partner     !== undefined && { bnm_fund_partner: body.bnm_fund_partner }),
        ...(body.personal_dsr_low_threshold  !== undefined && { personal_dsr_low_threshold: body.personal_dsr_low_threshold }),
        ...(body.personal_dsr_high_threshold !== undefined && { personal_dsr_high_threshold: body.personal_dsr_high_threshold }),
        ...(body.personal_income_cutoff      !== undefined && { personal_income_cutoff: body.personal_income_cutoff }),
        ...(body.personal_min_ctos           !== undefined && { personal_min_ctos: body.personal_min_ctos }),
        ...(body.personal_approval_rate_pct  !== undefined && { personal_approval_rate_pct: body.personal_approval_rate_pct }),
      },
    })
    return ApiResponse.ok(bank)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return ApiResponse.notFound('Bank not found')
    return ApiResponse.serverError('Failed to update bank')
  }
}
