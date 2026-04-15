import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { calcBlockACompletion, calcBlockBCompletion } from '@/lib/completion'
import { safeParseJSON } from '@/types/bank.types'
import type { ProductBlockA, ProcessStep } from '@/types/bank.types'
import { LoanStructure, CollateralRequirement, GuaranteeScheme } from '@/generated/prisma/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { bank: true, decisions: { orderBy: { field_name: 'asc' } } },
    })
    if (!product) return ApiResponse.notFound('Product not found')
    return ApiResponse.ok(product)
  } catch {
    return ApiResponse.serverError('Failed to fetch product')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return ApiResponse.notFound('Product not found')

    // Parse block JSON if provided, otherwise keep existing
    let block_a_completion_pct = existing.block_a_completion_pct
    let block_b_completion_pct = existing.block_b_completion_pct
    let block_a_json = existing.block_a_json
    let block_b_json = existing.block_b_json

    if (body.block_a !== undefined) {
      const parsed = safeParseJSON<ProductBlockA | null>(JSON.stringify(body.block_a), null)
      block_a_json = parsed ? JSON.stringify(parsed) : null
      block_a_completion_pct = calcBlockACompletion(parsed)
    }
    if (body.block_b !== undefined) {
      const parsed = safeParseJSON<ProcessStep[] | null>(JSON.stringify(body.block_b), null)
      block_b_json = parsed ? JSON.stringify(parsed) : null
      block_b_completion_pct = calcBlockBCompletion(parsed)
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.product_code          !== undefined && { product_code: body.product_code }),
        ...(body.product_name_en       !== undefined && { product_name_en: body.product_name_en }),
        ...(body.product_name_zh       !== undefined && { product_name_zh: body.product_name_zh }),
        ...(body.loan_structure        !== undefined && { loan_structure: body.loan_structure as LoanStructure }),
        ...(body.collateral_requirement!== undefined && { collateral_requirement: body.collateral_requirement as CollateralRequirement }),
        ...(body.guarantee_scheme      !== undefined && { guarantee_scheme: body.guarantee_scheme as GuaranteeScheme }),
        ...(body.is_shariah            !== undefined && { is_shariah: body.is_shariah }),
        ...(body.is_active             !== undefined && { is_active: body.is_active }),
        ...(body.block_c_summary       !== undefined && { block_c_summary: body.block_c_summary }),
        ...(body.last_verified_date    !== undefined && { last_verified_date: body.last_verified_date ? new Date(body.last_verified_date) : null }),
        block_a_json,
        block_b_json,
        block_a_completion_pct,
        block_b_completion_pct,
      },
    })
    return ApiResponse.ok(product)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return ApiResponse.notFound('Product not found')
    return ApiResponse.serverError('Failed to update product')
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return ApiResponse.ok({ deleted: true })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') return ApiResponse.notFound('Product not found')
    return ApiResponse.serverError('Failed to delete product')
  }
}
