// ─────────────────────────────────────────────────────────────────────────────
// CASE_STATUS
// Case.status is intentionally modeled as String (not Prisma enum).
// Business workflow states may evolve; this const is the single source of truth
// for allowed values. All application code MUST use these constants when
// reading or writing Case.status — never use bare string literals.
// ─────────────────────────────────────────────────────────────────────────────
export const CASE_STATUS = {
  INTAKE:          'INTAKE',
  ANALYSIS:        'ANALYSIS',
  ADVISOR_REVIEW:  'ADVISOR_REVIEW',
  STRUCTURE_READY: 'STRUCTURE_READY',
  SUBMISSION:      'SUBMISSION',
  PENDING_BANK:    'PENDING_BANK',
  APPROVED:        'APPROVED',
  REJECTED:        'REJECTED',
  DISBURSED:       'DISBURSED',
  CLOSED:          'CLOSED',
} as const

export type CaseStatus = (typeof CASE_STATUS)[keyof typeof CASE_STATUS]

// Active statuses (used for Dashboard "active cases" count)
export const ACTIVE_CASE_STATUSES: CaseStatus[] = [
  CASE_STATUS.INTAKE,
  CASE_STATUS.ANALYSIS,
  CASE_STATUS.ADVISOR_REVIEW,
  CASE_STATUS.STRUCTURE_READY,
  CASE_STATUS.SUBMISSION,
  CASE_STATUS.PENDING_BANK,
  CASE_STATUS.APPROVED,
  CASE_STATUS.DISBURSED,
]
