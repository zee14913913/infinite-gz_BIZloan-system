import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { InstitutionType } from '@/generated/prisma/client'

export async function GET() {
  try {
    const banks = await prisma.bank.findMany({
      include: {
        products: {
          select: {
            id: true,
            block_a_completion_pct: true,
            block_b_completion_pct: true,
            last_verified_date: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    })
    const data = banks.map(b => ({
      ...b,
      products_count: b.products.length,
      avg_block_a_pct: b.products.length
        ? Math.round(b.products.reduce((s, p) => s + p.block_a_completion_pct, 0) / b.products.length)
        : 0,
      avg_block_b_pct: b.products.length
        ? Math.round(b.products.reduce((s, p) => s + p.block_b_completion_pct, 0) / b.products.length)
        : 0,
      last_verified_date: b.products.reduce<Date | null>((latest, p) => {
        if (!p.last_verified_date) return latest
        if (!latest) return p.last_verified_date
        return p.last_verified_date > latest ? p.last_verified_date : latest
      }, null),
    }))
    return ApiResponse.ok(data)
  } catch {
    return ApiResponse.serverError('Failed to fetch banks')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.code || !body.name_en || !body.type) {
      return ApiResponse.badRequest('code, name_en, and type are required')
    }
    if (!Object.values(InstitutionType).includes(body.type)) {
      return ApiResponse.badRequest(`Invalid type. Must be one of: ${Object.values(InstitutionType).join(', ')}`)
    }
    const bank = await prisma.bank.create({
      data: {
        code:                       body.code.toUpperCase().trim(),
        name_en:                    body.name_en,
        name_zh:                    body.name_zh ?? '',
        name_bm:                    body.name_bm ?? '',
        type:                       body.type as InstitutionType,
        is_shariah_compliant:       body.is_shariah_compliant ?? false,
        official_website:           body.official_website ?? '',
        sme_portal_url:             body.sme_portal_url ?? null,
        cgc_partner:                body.cgc_partner ?? false,
        sjpp_partner:               body.sjpp_partner ?? false,
        bnm_fund_partner:           body.bnm_fund_partner ?? false,
        personal_dsr_low_threshold: body.personal_dsr_low_threshold ?? null,
        personal_dsr_high_threshold:body.personal_dsr_high_threshold ?? null,
        personal_income_cutoff:     body.personal_income_cutoff ?? null,
        personal_min_ctos:          body.personal_min_ctos ?? null,
        personal_approval_rate_pct: body.personal_approval_rate_pct ?? null,
      },
    })
    return ApiResponse.created(bank)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') return ApiResponse.badRequest('Bank code already exists')
    return ApiResponse.serverError('Failed to create bank')
  }
}
