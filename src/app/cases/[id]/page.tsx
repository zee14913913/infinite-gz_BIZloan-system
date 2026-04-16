import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CaseDetailClient from '@/components/cases/CaseDetailClient'

type Props = { params: Promise<{ id: string }> }

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params

  const case_ = await prisma.case.findUnique({
    where: { id },
    include: {
      client: true,
      financials: {
        include: {
          bank_accounts:  { orderBy: { created_at: 'asc' } },
          existing_loans: { orderBy: { created_at: 'asc' } },
          collaterals:    { orderBy: { created_at: 'asc' } },
        },
      },
      directors: { orderBy: { created_at: 'asc' } },
      matching_results: {
        include: { product: { include: { bank: true } } },
        orderBy:  [{ overall_score: 'asc' }, { calculated_at: 'desc' }],
      },
    },
  })

  if (!case_) notFound()

  return <CaseDetailClient case_={JSON.parse(JSON.stringify(case_))} />
}
