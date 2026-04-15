'use client'
import type { Product } from '@/generated/prisma/client'
import type { ProductBlockA } from '@/types/bank.types'
import { safeParseJSON } from '@/types/bank.types'
import { ProgressBar } from './ProgressBar'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { FieldConfidenceValue } from '@/types/bank.types'

interface Props {
  products: Product[]
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
  onRecalculate: (id: string) => void
  onNew: () => void
}

function rangeFmt(min: number | null, max: number | null, suffix = '') {
  if (min === null && max === null) return '—'
  if (min !== null && max !== null) return `${min}–${max}${suffix}`
  return `${min ?? max}${suffix}`
}

export function BlockATab({ products, onEdit, onDelete, onRecalculate, onNew }: Props) {
  if (!products.length) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={onNew} style={{ minHeight: 40, padding: '8px 24px' }}>+ New Product</button>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-playfair)', fontSize: 18, marginBottom: 8 }}>No products yet</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Create the first product for this bank to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={onNew} style={{ minHeight: 40, padding: '8px 24px' }}>+ New Product</button>
      </div>
      <div className="table-scroll-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name (ZH)</th>
              <th>Structure</th>
              <th>Amount (RM)</th>
              <th>Tenure (mo)</th>
              <th>Rate (% p.a.)</th>
              <th>Turnover ×</th>
              <th>DSCR Min</th>
              <th>Block A</th>
              <th>Block B</th>
              <th>Confidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const ba = safeParseJSON<ProductBlockA | null>(p.block_a_json, null)
              return (
                <tr key={p.id} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {p.product_code}
                    {!p.is_active && <span className="status-badge badge-missing" style={{ marginLeft: 6, fontSize: 10 }}>Inactive</span>}
                    {p.is_shariah && <span className="status-badge badge-todo" style={{ marginLeft: 6, fontSize: 10 }}>Shariah</span>}
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.product_name_zh || p.product_name_en}
                  </td>
                  <td><span style={{ fontSize: 12 }}>{p.loan_structure.replace(/_/g,' ')}</span></td>
                  <td className="amount-neutral" style={{ whiteSpace: 'nowrap' }}>
                    {rangeFmt(ba?.min_loan_amount ?? null, ba?.max_loan_amount ?? null)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {rangeFmt(ba?.min_tenure_months ?? null, ba?.max_tenure_months ?? null, ' mo')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {rangeFmt(ba?.rate_min ?? null, ba?.rate_max ?? null, '%')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {rangeFmt(ba?.monthly_turnover_multiplier_min ?? null, ba?.monthly_turnover_multiplier_max ?? null, '×')}
                  </td>
                  <td>{ba?.dscr_min ?? '—'}</td>
                  <td style={{ minWidth: 100 }}>
                    <ProgressBar pct={Math.round(p.block_a_completion_pct)} />
                  </td>
                  <td style={{ minWidth: 100 }}>
                    <ProgressBar pct={Math.round(p.block_b_completion_pct)} />
                  </td>
                  <td><ConfidenceBadge value={ba?.confidence as FieldConfidenceValue | null} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, whiteSpace: 'nowrap' }}>
                      <button className="btn-table-action" onClick={() => onEdit(p)}>Edit</button>
                      <button className="btn-table-action" onClick={() => onRecalculate(p.id)} title="Recalculate completion %">↻</button>
                      <button className="btn-table-action" onClick={() => {
                        if (confirm(`Delete product ${p.product_code}?`)) onDelete(p.id)
                      }} style={{ color: 'var(--color-status-alert)' }}>Del</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
