import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BankDetailClient } from '@/components/banks/BankDetailClient'

interface Props { params: Promise<{ code: string }> }

export default async function BankDetailPage({ params }: Props) {
  const { code } = await params
  const bank = await prisma.bank.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      products: {
        include: { decisions: { orderBy: { field_name: 'asc' } }, evidences: { orderBy: { created_at: 'desc' } } },
        orderBy: { product_code: 'asc' },
      },
    },
  })
  if (!bank) notFound()
  return <BankDetailClient bank={bank} />
}
