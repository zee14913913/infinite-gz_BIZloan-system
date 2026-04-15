'use client'
import { useState } from 'react'

interface Props {
  productId: string
  value: string | null
  onSaved: (summary: string) => void
}

export function BlockCEditor({ productId, value, onSaved }: Props) {
  const [text, setText] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const r = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_c_summary: text }),
      })
      if (!r.ok) throw new Error('Save failed')
      setMsg('Saved')
      onSaved(text)
    } catch {
      setMsg('Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>客户流程说明</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 13, color: msg === 'Saved' ? 'var(--color-status-done)' : 'var(--color-status-alert)' }}>{msg}</span>}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ minHeight: 36, padding: '8px 20px' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
        Summarize the client-facing process: document preparation → approval waiting → offer & disbursement → key notes.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={16}
        style={{
          width: '100%', padding: '12px 16px', fontSize: 14,
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          outline: 'none', resize: 'vertical', lineHeight: 1.7,
          fontFamily: 'var(--font-inter)',
        }}
        placeholder="Enter client-facing process summary here…"
      />
    </div>
  )
}
