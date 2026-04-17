import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BankDetailClient } from '@/components/banks/BankDetailClient'

interface Props { params: Promise<{ code: string }> }

const STALE_MS = 90 * 24 * 60 * 60 * 1000

function isProductStale(date: Date | null | undefined): boolean {
  if (!date) return false
  return (Date.now() - new Date(date).getTime()) > STALE_MS
}

function StatPill({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 18px', background: 'var(--color-bg-inset)',
      borderRadius: 'var(--radius-md)', minWidth: 90 }}>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-playfair)', fontVariantNumeric: 'tabular-nums',
        color: alert ? 'var(--color-status-alert)' : 'var(--color-text-primary)' }}>
        {value}
      </div>
      <div className="section-label" style={{ marginTop: 2 }}>{label}</div>
    </div>
  )
}

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

  const products    = bank.products
  const n           = products.length
  const avgA        = n ? Math.round(products.reduce((s, p) => s + p.block_a_completion_pct, 0) / n) : 0
  const avgB        = n ? Math.round(products.reduce((s, p) => s + p.block_b_completion_pct, 0) / n) : 0
  const evidenceCount  = products.reduce((s, p) => s + p.evidences.length, 0)
  const decisionCount  = products.reduce((s, p) => s + p.decisions.length, 0)
  const staleCount     = products.filter(p => isProductStale(p.last_verified_date)).length

  return (
    <div className="page-content">
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatPill label="产品数" value={n} />
        <StatPill label="Block A 均值" value={`${avgA}%`} alert={avgA < 50} />
        <StatPill label="Block B 均值" value={`${avgB}%`} alert={avgB < 50} />
        <StatPill label="证据记录" value={evidenceCount} />
        <StatPill label="规则决策" value={decisionCount} />
        {staleCount > 0 && <StatPill label="待核实产品" value={staleCount} alert />}
      </div>
      <BankDetailClient bank={bank} />
    </div>
  )
}

