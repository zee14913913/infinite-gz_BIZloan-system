'use client'
import { useState } from 'react'
import type { Bank, Product, FieldDecision } from '@/generated/prisma/client'
import { BlockATab } from './BlockATab'
import { BlockBTab } from './BlockBTab'
import { BlockCEditor } from './BlockCEditor'
import { RulesDecisionTab } from './RulesDecisionTab'
import { ProductSheet } from './ProductSheet'

interface BankWithProducts extends Bank {
  products: (Product & { decisions: FieldDecision[] })[]
}

const TABS = ['📋 Block A', '🔄 Block B', '📝 Block C', '🗂 Evidence', '⚖ Rules Decision']

// Extracted outside the parent component to satisfy react-hooks/static-components rule
function ProductSelector({
  products,
  selectedId,
  onSelect,
}: {
  products: BankWithProducts['products']
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (!products.length) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
        No products yet. Add one in the Block A tab.
      </p>
    )
  }
  return (
    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
        Product
      </label>
      <select
        className="form-select"
        style={{ maxWidth: 280 }}
        value={selectedId ?? ''}
        onChange={e => onSelect(e.target.value)}
      >
        <option value="">— select —</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>
            {p.product_code} — {p.product_name_zh || p.product_name_en}
          </option>
        ))}
      </select>
    </div>
  )
}

export function BankDetailClient({ bank: initial }: { bank: BankWithProducts }) {
  const [bank]        = useState(initial)
  const [products, setProducts] = useState(initial.products)
  const [tab, setTab] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.products[0]?.id ?? null
  )
  // undefined = sheet closed; null = create mode; Product = edit mode
  const [sheetProduct, setSheetProduct] = useState<Product | null | undefined>(undefined)

  const selected = products.find(p => p.id === selectedId) ?? null

  function openCreate() { setSheetProduct(null) }
  function openEdit(p: Product) { setSheetProduct(p) }
  function closeSheet() { setSheetProduct(undefined) }

  function handleSaved(saved: Product) {
    setProducts(prev => {
      const exists = prev.find(p => p.id === saved.id)
      if (exists) {
        return prev.map(p =>
          p.id === saved.id ? { ...p, ...saved } : p
        )
      }
      return [...prev, { ...saved, decisions: [] }]
    })
    setSelectedId(saved.id)
    closeSheet()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(p => p.id !== id))
    if (selectedId === id) {
      setSelectedId(products.find(p => p.id !== id)?.id ?? null)
    }
  }

  async function handleRecalculate(id: string) {
    const r = await fetch(`/api/products/${id}/recalculate`, { method: 'POST' })
    if (!r.ok) return
    const { data } = await r.json() as { data: { block_a_completion_pct: number; block_b_completion_pct: number } }
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, ...data } : p)
    )
  }

  function handleBlockBSaved() {
    if (selectedId) handleRecalculate(selectedId)
  }

  function handleBlockCSaved(summary: string) {
    setProducts(prev =>
      prev.map(p => p.id === selectedId ? { ...p, block_c_summary: summary } : p)
    )
  }

  return (
    <div>
      {/* Bank header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>{bank.name_zh || bank.name_en}</h2>
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                {bank.code}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="status-badge badge-todo">{bank.type.replace(/_/g, ' ')}</span>
              {bank.is_shariah_compliant && <span className="status-badge badge-confirmed">Shariah</span>}
              {bank.cgc_partner && <span className="status-badge badge-confirmed">CGC</span>}
              {bank.sjpp_partner && <span className="status-badge badge-confirmed">SJPP</span>}
              {bank.bnm_fund_partner && <span className="status-badge badge-confirmed">BNM Fund</span>}
              <span className="status-badge badge-missing">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <a
            href={bank.official_website}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ minHeight: 36, padding: '6px 16px', fontSize: 13, textDecoration: 'none' }}
          >
            Official Site ↗
          </a>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="tab-nav" style={{ marginBottom: 24 }}>
        {TABS.map((label, i) => (
          <button
            key={i}
            className={`tab-btn${tab === i ? ' active' : ''}`}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 0 && (
          <BlockATab
            products={products}
            onEdit={openEdit}
            onDelete={handleDelete}
            onRecalculate={handleRecalculate}
            onNew={openCreate}
          />
        )}

        {tab === 1 && (
          <>
            <ProductSelector products={products} selectedId={selectedId} onSelect={setSelectedId} />
            {selected ? (
              <BlockBTab productId={selected.id} blockBJson={selected.block_b_json} onSaved={handleBlockBSaved} />
            ) : (
              <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 32 }}>
                Select a product above to view Block B steps.
              </div>
            )}
          </>
        )}

        {tab === 2 && (
          <>
            <ProductSelector products={products} selectedId={selectedId} onSelect={setSelectedId} />
            {selected ? (
              <BlockCEditor productId={selected.id} value={selected.block_c_summary} onSaved={handleBlockCSaved} />
            ) : (
              <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 32 }}>
                Select a product above to edit Block C summary.
              </div>
            )}
          </>
        )}

        {tab === 3 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-playfair)', fontSize: 18, marginBottom: 8 }}>
              Evidence Library — Phase 5
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Evidence collection and cross-validation are implemented in Phase 5.
            </p>
          </div>
        )}

        {tab === 4 && (
          <>
            <ProductSelector products={products} selectedId={selectedId} onSelect={setSelectedId} />
            {selected ? (
              <RulesDecisionTab decisions={selected.decisions} />
            ) : (
              <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 32 }}>
                Select a product above to view rules decisions.
              </div>
            )}
          </>
        )}
      </div>

      {/* Product create/edit sheet */}
      {sheetProduct !== undefined && (
        <ProductSheet
          bankCode={bank.code}
          product={sheetProduct}
          onClose={closeSheet}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
