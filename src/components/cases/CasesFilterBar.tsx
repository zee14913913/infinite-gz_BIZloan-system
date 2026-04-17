'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'INTAKE',          label: '接案中' },
  { value: 'ANALYSIS',        label: '分析中' },
  { value: 'ADVISOR_REVIEW',  label: '顾问审核' },
  { value: 'STRUCTURE_READY', label: '方案已定' },
  { value: 'SUBMISSION',      label: '提交中' },
  { value: 'PENDING_BANK',    label: '等待银行' },
  { value: 'APPROVED',        label: '已批准' },
  { value: 'REJECTED',        label: '被拒绝' },
  { value: 'DISBURSED',       label: '已放款' },
  { value: 'CLOSED',          label: '已结案' },
]

const URGENCY_OPTIONS = [
  { value: '', label: '全部紧急度' },
  { value: 'HIGH',   label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW',    label: '低' },
]

interface Props {
  advisors: { id: string; name: string }[]
}

export function CasesFilterBar({ advisors }: Props) {
  const router     = useRouter()
  const params     = useSearchParams()

  function update(key: string, value: string) {
    const sp = new URLSearchParams(params.toString())
    if (value) sp.set(key, value)
    else sp.delete(key)
    router.replace(`/cases?${sp.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <select className="form-input" style={{ width: 'auto', minWidth: 120 }}
        value={params.get('status') ?? ''}
        onChange={e => update('status', e.target.value)}>
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className="form-input" style={{ width: 'auto', minWidth: 120 }}
        value={params.get('advisor') ?? ''}
        onChange={e => update('advisor', e.target.value)}>
        <option value="">全部顾问</option>
        {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>

      <select className="form-input" style={{ width: 'auto', minWidth: 110 }}
        value={params.get('urgency') ?? ''}
        onChange={e => update('urgency', e.target.value)}>
        {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
