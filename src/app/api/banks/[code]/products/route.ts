import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { calcBlockACompletion, calcBlockBCompletion } from '@/lib/completion'
import { safeParseJSON, defaultBlockA, defaultBlockB } from '@/types/bank.types'
import type { ProductBlockA, ProcessStep } from '@/types/bank.types'
import { LoanStructure, CollateralRequirement, GuaranteeScheme } from '@/generated/prisma/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const bank = await prisma.bank.findUnique({ where: { code: code.toUpperCase() } })
    if (!bank) return ApiResponse.notFound('Bank not found')
    const products = await prisma.product.findMany({
      where: { bank_id: bank.id },
      orderBy: { product_code: 'asc' },
    })
    return ApiResponse.ok(products)
  } catch {
    return ApiResponse.serverError('Failed to fetch products')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const body = await request.json()
    if (!body.product_code || !body.product_name_en) {
      return ApiResponse.badRequest('product_code and product_name_en are required')
    }
    const bank = await prisma.bank.findUnique({ where: { code: code.toUpperCase() } })
    if (!bank) return ApiResponse.notFound('Bank not found')

    const blockA = safeParseJSON<ProductBlockA>(JSON.stringify(body.block_a ?? defaultBlockA()), defaultBlockA())
    const blockB = safeParseJSON<ProcessStep[]>(JSON.stringify(body.block_b ?? defaultBlockB()), defaultBlockB())
    const block_a_completion_pct = calcBlockACompletion(blockA)
    const block_b_completion_pct = calcBlockBCompletion(blockB)

    const product = await prisma.product.create({
      data: {
        bank_id:               bank.id,
        product_code:          body.product_code.trim(),
        product_name_en:       body.product_name_en,
        product_name_zh:       body.product_name_zh ?? '',
        loan_structure:        body.loan_structure as LoanStructure,
        collateral_requirement:body.collateral_requirement as CollateralRequirement,
        guarantee_scheme:      body.guarantee_scheme as GuaranteeScheme,
        is_shariah:            body.is_shariah ?? false,
        is_active:             body.is_active ?? true,
        block_a_json:          JSON.stringify(blockA),
        block_b_json:          JSON.stringify(blockB),
        block_c_summary:       body.block_c_summary ?? null,
        block_a_completion_pct,
        block_b_completion_pct,
        last_verified_date:    body.last_verified_date ? new Date(body.last_verified_date) : null,
      },
    })
    return ApiResponse.created(product)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') return ApiResponse.badRequest('Product code already exists for this bank')
    return ApiResponse.serverError('Failed to create product')
  }
}
