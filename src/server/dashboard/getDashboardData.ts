// =============================================================================
// BCIS — Dashboard Data Module
//
// Provides getDashboardData() for the server-rendered /dashboard page.
// All aggregation is done via Prisma queries against existing tables.
// No new models required; no in-memory aggregation unless unavoidable.
// =============================================================================

import { prisma } from '@/lib/prisma'

const STALE_DAYS = 90
const STALE_MS   = STALE_DAYS * 24 * 60 * 60 * 1000

const CLOSED_STATUSES = ['CLOSED', 'REJECTED', 'DISBURSED']

// ---------------------------------------------------------------------------
// Exported interface
// ---------------------------------------------------------------------------

export interface CaseStatusCount {
  status: string
  count:  number
}

export interface MatchScoreCount {
  score: string
  count: number
}

export interface AdvisorSummary {
  advisorId:  string
  advisorName: string
  totalCases: number
  openCases:  number
}

export interface RecentCase {
  id:           string
  case_reference: string
  companyName:  string
  status:       string
  updated_at:   Date
}

export interface RecentProduct {
  id:                    string
  product_name_en:       string
  bankCode:              string
  block_a_completion_pct: number
  updated_at:            Date
}

export interface DashboardData {
  // ── Case pipeline ──────────────────────────────────────────────────────────
  totalCases:            number
  casesByStatus:         CaseStatusCount[]
  overdueFollowUpCount:  number
  dueSoonFollowUpCount:  number   // due within 7 days (not yet overdue)
  overdueFollowUpCases:  RecentCase[]

  // ── Match quality ──────────────────────────────────────────────────────────
  totalMatchingResults:      number
  matchScoreDistribution:    MatchScoreCount[]
  casesWithMatchRunCount:    number

  // ── Product knowledge health ───────────────────────────────────────────────
  totalActiveProducts:       number
  productsBelow50:           number   // block_a_completion_pct < 50
  products50to80:            number   // 50 <= pct < 80
  products80plus:            number   // pct >= 80
  staleProductCount:         number   // last_verified_date > 90 days
  totalFieldEvidenceCount:   number
  totalFieldDecisionCount:   number

  // ── Advisor productivity ────────────────────────────────────────────────────
  advisorSummaries:          AdvisorSummary[]

  // ── Recent activity ────────────────────────────────────────────────────────
  recentCases:               RecentCase[]
  recentProducts:            RecentProduct[]
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData> {
  const now        = new Date()
  const staleDate  = new Date(now.getTime() - STALE_MS)
  const dueSoonEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Run all queries in parallel for performance
  const [
    totalCases,
    allCases,
    overdueFollowUpRaw,
    overdueFollowUpTotalCount,
    totalMatchingResults,
    matchGroupRaw,
    distinctCasesWithMatch,
    products,
    totalFieldEvidenceCount,
    totalFieldDecisionCount,
    advisorCases,
    advisors,
    recentCasesRaw,
    recentProductsRaw,
  ] = await Promise.all([
    // 1. Total cases
    prisma.case.count(),

    // 2. All cases for status grouping + follow-up logic
    // Prisma groupBy on String status is straightforward
    prisma.case.findMany({
      select: { status: true, follow_up_date: true, id: true, case_reference: true, updated_at: true,
        advisor_id: true,
        client: { select: { company_name: true } } },
    }),

    // 3. Overdue follow-up display rows (capped at 5 for the dashboard list)
    prisma.case.findMany({
      where:  { follow_up_date: { lt: now }, status: { notIn: CLOSED_STATUSES } },
      select: { id: true, case_reference: true, follow_up_date: true, status: true, updated_at: true,
        client: { select: { company_name: true } } },
      orderBy: { follow_up_date: 'asc' },
      take: 5,
    }),

    // 3b. True total count of overdue follow-up cases (same where, no take limit)
    prisma.case.count({
      where: { follow_up_date: { lt: now }, status: { notIn: CLOSED_STATUSES } },
    }),

    // 4. Total matching results
    prisma.matchingResult.count(),

    // 5. Match score grouping
    // Prisma doesn't support groupBy on enum with string ordering, so we load counts manually.
    // This is intentional: MatchScore enum has only 4 values, not a scalability concern.
    Promise.all([
      prisma.matchingResult.count({ where: { overall_score: 'HIGH' } }),
      prisma.matchingResult.count({ where: { overall_score: 'MEDIUM' } }),
      prisma.matchingResult.count({ where: { overall_score: 'LOW' } }),
      prisma.matchingResult.count({ where: { overall_score: 'INELIGIBLE' } }),
    ]),

    // 6. Cases with at least one match run
    prisma.matchingResult.groupBy({ by: ['case_id'] }).then(r => r.length),

    // 7. All active products for completion bucketing
    // Prisma doesn't support conditional COUNT in a single query, so we load minimal fields.
    prisma.product.findMany({
      where:  { is_active: true },
      select: { id: true, block_a_completion_pct: true, last_verified_date: true },
    }),

    // 8. Evidence count
    prisma.fieldEvidence.count(),

    // 9. Decision count
    prisma.fieldDecision.count(),

    // 10. Cases grouped by advisor_id
    prisma.case.groupBy({
      by: ['advisor_id'],
      _count: { id: true },
    }),

    // 11. User records for advisor name lookup
    prisma.user.findMany({ select: { id: true, name: true } }),

    // 12. Recent cases
    prisma.case.findMany({
      select: { id: true, case_reference: true, status: true, updated_at: true,
        client: { select: { company_name: true } } },
      orderBy: { updated_at: 'desc' },
      take: 10,
    }),

    // 13. Recent products
    prisma.product.findMany({
      where:   { is_active: true },
      select:  { id: true, product_name_en: true, block_a_completion_pct: true, updated_at: true,
        bank: { select: { code: true } } },
      orderBy: { updated_at: 'desc' },
      take: 10,
    }),
  ])

  // ── Case status grouping ────────────────────────────────────────────────────
  const statusMap = new Map<string, number>()
  for (const c of allCases) {
    statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1)
  }
  const casesByStatus: CaseStatusCount[] = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // ── Follow-up due-soon count ────────────────────────────────────────────────
  const dueSoonFollowUpCount = allCases.filter(c =>
    c.follow_up_date &&
    c.follow_up_date >= now &&
    c.follow_up_date <= dueSoonEnd &&
    !CLOSED_STATUSES.includes(c.status),
  ).length

  // ── Match score distribution ────────────────────────────────────────────────
  const [highCount, mediumCount, lowCount, ineligibleCount] = matchGroupRaw
  const matchScoreDistribution: MatchScoreCount[] = [
    { score: 'HIGH',       count: highCount },
    { score: 'MEDIUM',     count: mediumCount },
    { score: 'LOW',        count: lowCount },
    { score: 'INELIGIBLE', count: ineligibleCount },
  ]

  // ── Product completion buckets ──────────────────────────────────────────────
  let productsBelow50 = 0, products50to80 = 0, products80plus = 0, staleProductCount = 0
  for (const p of products) {
    const pct = p.block_a_completion_pct
    if (pct < 50) productsBelow50++
    else if (pct < 80) products50to80++
    else products80plus++
    if (p.last_verified_date && new Date(p.last_verified_date) < staleDate) staleProductCount++
  }

  // ── Advisor summaries (top 5) ───────────────────────────────────────────────
  const userMap = new Map(advisors.map(u => [u.id, u.name]))
  const openByAdvisor = new Map<string, number>()
  for (const c of allCases) {
    if (!CLOSED_STATUSES.includes(c.status)) {
      openByAdvisor.set(c.advisor_id, (openByAdvisor.get(c.advisor_id) ?? 0) + 1)
    }
  }
  const advisorSummaries: AdvisorSummary[] = advisorCases
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 5)
    .map(row => ({
      advisorId:   row.advisor_id,
      advisorName: userMap.get(row.advisor_id) ?? row.advisor_id,
      totalCases:  row._count.id,
      openCases:   openByAdvisor.get(row.advisor_id) ?? 0,
    }))

  // ── Shape return data ───────────────────────────────────────────────────────
  return {
    totalCases,
    casesByStatus,
    overdueFollowUpCount:  overdueFollowUpTotalCount,
    dueSoonFollowUpCount,
    overdueFollowUpCases:  overdueFollowUpRaw.map(c => ({
      id:            c.id,
      case_reference: c.case_reference,
      companyName:   c.client.company_name,
      status:        c.status,
      updated_at:    c.updated_at,
    })),
    totalMatchingResults,
    matchScoreDistribution,
    casesWithMatchRunCount: distinctCasesWithMatch,
    totalActiveProducts:    products.length,
    productsBelow50,
    products50to80,
    products80plus,
    staleProductCount,
    totalFieldEvidenceCount,
    totalFieldDecisionCount,
    advisorSummaries,
    recentCases: recentCasesRaw.map(c => ({
      id:             c.id,
      case_reference: c.case_reference,
      companyName:    c.client.company_name,
      status:         c.status,
      updated_at:     c.updated_at,
    })),
    recentProducts: recentProductsRaw.map(p => ({
      id:                     p.id,
      product_name_en:        p.product_name_en,
      bankCode:               p.bank.code,
      block_a_completion_pct: p.block_a_completion_pct,
      updated_at:             p.updated_at,
    })),
  }
}
