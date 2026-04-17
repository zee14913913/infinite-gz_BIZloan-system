import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import ApiResponse from '@/lib/api-response'
import { recalculateDirectorDsr } from '@/lib/financial-calculator'
import type { DirectorRole, EmployerType, CcrisStatus } from '@/generated/prisma/client'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params

  const caseExists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } })
  if (!caseExists) return ApiResponse.notFound('Case not found')

  const directors = await prisma.directorProfile.findMany({
    where:   { case_id: caseId },
    orderBy: { created_at: 'asc' },
  })
  return ApiResponse.ok(directors)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: caseId } = await params
  const body = await req.json()

  const caseExists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } })
  if (!caseExists) return ApiResponse.notFound('Case not found')

  const { full_name, ic_number, role, employer_type, employer_name } = body
  if (!full_name || !ic_number || !role || !employer_type || !employer_name) {
    return ApiResponse.badRequest('full_name, ic_number, role, employer_type, employer_name are required')
  }

  const VALID_ROLES       = new Set(['DIRECTOR', 'GUARANTOR', 'BOTH'])
  const VALID_EMPLOYERS   = new Set(['GOVERNMENT', 'GLC', 'PLC', 'MNC', 'LARGE_PRIVATE', 'SME', 'SELF_EMPLOYED', 'OTHER'])
  const VALID_CCRIS       = new Set(['CLEAN', 'MINOR_ISSUE', 'MAJOR_ISSUE', 'UNKNOWN'])

  if (!VALID_ROLES.has(role)) {
    return ApiResponse.badRequest(`Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}`)
  }
  if (!VALID_EMPLOYERS.has(employer_type)) {
    return ApiResponse.badRequest(`Invalid employer_type. Must be one of: ${[...VALID_EMPLOYERS].join(', ')}`)
  }
  if (body.ccris_status && !VALID_CCRIS.has(body.ccris_status)) {
    return ApiResponse.badRequest(`Invalid ccris_status. Must be one of: ${[...VALID_CCRIS].join(', ')}`)
  }

  const director = await prisma.directorProfile.create({
    data: {
      case_id:       caseId,
      full_name,
      ic_number,
      role:          role as DirectorRole,
      employer_type: employer_type as EmployerType,
      employer_name,
      epf_continuous_months:       body.epf_continuous_months       ? Number(body.epf_continuous_months)  : null,
      epf_last_contribution_month: body.epf_last_contribution_month ?? null,
      epf_account2_balance:        body.epf_account2_balance        ? Number(body.epf_account2_balance)   : null,
      ctos_score:                  body.ctos_score                  ? Number(body.ctos_score)              : null,
      ccris_status:                (body.ccris_status as CcrisStatus) ?? 'UNKNOWN',
      ccris_notes:                 body.ccris_notes   ?? null,
      income_items_json:           body.income_items_json  ? JSON.stringify(body.income_items_json)   : '[]',
      personal_loans_json:         body.personal_loans_json ? JSON.stringify(body.personal_loans_json) : '[]',
    },
  })

  // Compute DSR immediately after creation
  const withDsr = await recalculateDirectorDsr(director.id)
  return ApiResponse.created(withDsr ?? director)
}
