import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { recalculateDirectorDsr } from '@/lib/financial-calculator'
import type { DirectorRole, EmployerType, CcrisStatus } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ id: string; directorId: string }> }

async function verifyOwnership(caseId: string, directorId: string) {
  const director = await prisma.directorProfile.findUnique({
    where: { id: directorId },
    select: { id: true, case_id: true },
  })
  if (!director) return { error: 'notfound' as const }
  if (director.case_id !== caseId) return { error: 'forbidden' as const }
  return { error: null }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: caseId, directorId } = await params
  const { error } = await verifyOwnership(caseId, directorId)
  if (error === 'notfound')  return ApiResponse.notFound('Director not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Director does not belong to this case')

  const director = await prisma.directorProfile.findUnique({ where: { id: directorId } })
  return ApiResponse.ok(director)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id: caseId, directorId } = await params
  const { error } = await verifyOwnership(caseId, directorId)
  if (error === 'notfound')  return ApiResponse.notFound('Director not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Director does not belong to this case')

  const body = await req.json()

  await prisma.directorProfile.update({
    where: { id: directorId },
    data: {
      ...(body.full_name    && { full_name:    body.full_name }),
      ...(body.ic_number    && { ic_number:    body.ic_number }),
      ...(body.role         && { role:         body.role as DirectorRole }),
      ...(body.employer_type && { employer_type: body.employer_type as EmployerType }),
      ...(body.employer_name && { employer_name: body.employer_name }),
      ...(body.epf_continuous_months !== undefined && {
        epf_continuous_months: body.epf_continuous_months ? Number(body.epf_continuous_months) : null,
      }),
      ...(body.epf_last_contribution_month !== undefined && {
        epf_last_contribution_month: body.epf_last_contribution_month ?? null,
      }),
      ...(body.epf_account2_balance !== undefined && {
        epf_account2_balance: body.epf_account2_balance ? Number(body.epf_account2_balance) : null,
      }),
      ...(body.ctos_score !== undefined && {
        ctos_score: body.ctos_score ? Number(body.ctos_score) : null,
      }),
      ...(body.ccris_status !== undefined && { ccris_status: body.ccris_status as CcrisStatus }),
      ...(body.ccris_notes  !== undefined && { ccris_notes:  body.ccris_notes ?? null }),
      ...(body.income_items_json   !== undefined && {
        income_items_json: JSON.stringify(body.income_items_json),
      }),
      ...(body.personal_loans_json !== undefined && {
        personal_loans_json: JSON.stringify(body.personal_loans_json),
      }),
    },
  })

  // Recompute DSR after any update
  const updated = await recalculateDirectorDsr(directorId)
  return ApiResponse.ok(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id: caseId, directorId } = await params
  const { error } = await verifyOwnership(caseId, directorId)
  if (error === 'notfound')  return ApiResponse.notFound('Director not found')
  if (error === 'forbidden') return ApiResponse.forbidden('Director does not belong to this case')

  await prisma.directorProfile.delete({ where: { id: directorId } })
  return ApiResponse.ok({ deleted: directorId })
}
