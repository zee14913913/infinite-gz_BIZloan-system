'use client'
import type { FieldConfidenceValue } from '@/types/bank.types'
import { CONFIDENCE_BADGE } from '@/types/bank.types'

const LABELS: Record<FieldConfidenceValue, string> = {
  CONFIRMED: 'Confirmed',
  LIKELY:    'Likely',
  ESTIMATED: 'Estimated',
  CONFLICT:  'Conflict',
  MISSING:   'Missing',
}

export function ConfidenceBadge({ value }: { value: FieldConfidenceValue | null | undefined }) {
  if (!value) return <span className="status-badge badge-missing">—</span>
  return (
    <span className={`status-badge ${CONFIDENCE_BADGE[value]}`}>
      {LABELS[value]}
    </span>
  )
}
