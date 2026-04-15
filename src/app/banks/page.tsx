import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProgressBar } from '@/components/banks/ProgressBar'

const TYPE_BADGE: Record<string, string> = {
  COMMERCIAL_BANK:  'badge-confirmed',
  ISLAMIC_BANK:     'badge-todo',
  DFI:              'badge-conflict',
  GUARANTEE_AGENCY: 'badge-missing',
  BNM_FUND:         'badge-confirmed',
  P2P_PLATFORM:     'badge-conflict',
  COOPERATIVE:      'badge-missing',
}

function isStale(date: Date | null): boolean {
  if (!date) return false
  return (Date.now() - new Date(date).getTime()) > 90 * 24 * 60 * 60 * 1000
}

export default async function BanksPage() {
  const banks = await prisma.bank.findMany({
    include: {
      products: {
        select: { id: true, block_a_completion_pct: true, block_b_completion_pct: true, last_verified_date: true },
      },
    },
    orderBy: { code: 'asc' },
  })

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Product Knowledge Base</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
            {banks.length} institutions · {banks.reduce((s, b) => s + b.products.length, 0)} products
          </p>
        </div>
        <Link href="/banks/new" className="btn btn-primary" style={{ minHeight: 40, padding: '8px 24px', textDecoration: 'none' }}>
          + Add Institution
        </Link>
      </div>

      {banks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-playfair)', fontSize: 20, marginBottom: 8 }}>
            No institutions yet
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Seed data should populate 20 institutions. Run <code style={{ background: 'var(--color-bg-muted)', padding: '2px 6px', borderRadius: 4 }}>npx prisma db seed</code>
          </p>
        </div>
      ) : (
        <div className="table-scroll-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Products</th>
                <th>CGC</th>
                <th>SJPP</th>
                <th>BNM</th>
                <th>Block A</th>
                <th>Block B</th>
                <th>Last Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banks.map(bank => {
                const n = bank.products.length
                const avgA = n ? Math.round(bank.products.reduce((s, p) => s + p.block_a_completion_pct, 0) / n) : 0
                const avgB = n ? Math.round(bank.products.reduce((s, p) => s + p.block_b_completion_pct, 0) / n) : 0
                const lastVerified = bank.products.reduce<Date | null>((latest, p) => {
                  if (!p.last_verified_date) return latest
                  if (!latest || p.last_verified_date > latest) return p.last_verified_date
                  return latest
                }, null)
                const stale = isStale(lastVerified)

                return (
                  <tr key={bank.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{bank.code}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{bank.name_zh}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{bank.name_en}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${TYPE_BADGE[bank.type] ?? 'badge-missing'}`} style={{ fontSize: 11 }}>
                        {bank.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {n > 0
                        ? <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{n}</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {bank.cgc_partner
                        ? <span style={{ color: 'var(--color-status-done)' }}>✓</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>✗</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {bank.sjpp_partner
                        ? <span style={{ color: 'var(--color-status-done)' }}>✓</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>✗</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {bank.bnm_fund_partner
                        ? <span style={{ color: 'var(--color-status-done)' }}>✓</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>✗</span>}
                    </td>
                    <td style={{ minWidth: 110 }}>
                      {n > 0 ? <ProgressBar pct={avgA} /> : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ minWidth: 110 }}>
                      {n > 0 ? <ProgressBar pct={avgB} /> : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      {lastVerified ? (
                        <span style={{ fontSize: 12, color: stale ? 'var(--color-status-pending)' : 'var(--color-text-muted)' }}>
                          {stale && '⚠ '}
                          {new Date(lastVerified).toLocaleDateString('en-MY')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link href={`/banks/${bank.code}`} className="btn-table-action">View</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
