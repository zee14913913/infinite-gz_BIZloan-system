// =============================================================================
// Case Reference Generator
// Format: BCIS-YYYY-XXXX  (e.g. BCIS-2026-0001)
// Sequence resets each calendar year.
// =============================================================================

import { prisma } from '@/lib/prisma'

export async function generateCaseReference(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `BCIS-${year}-`

  // Find the highest sequence number for this year
  const last = await prisma.case.findFirst({
    where: { case_reference: { startsWith: prefix } },
    orderBy: { case_reference: 'desc' },
    select: { case_reference: true },
  })

  const nextSeq = last
    ? parseInt(last.case_reference.slice(prefix.length), 10) + 1
    : 1

  return `${prefix}${String(nextSeq).padStart(4, '0')}`
}
