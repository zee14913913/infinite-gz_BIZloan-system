'use client'

interface ProgressBarProps {
  pct: number
  label?: string
  showLabel?: boolean
}

export function ProgressBar({ pct, label, showLabel = true }: ProgressBarProps) {
  const cls = pct >= 100 ? 'complete' : pct < 30 ? 'conflict' : ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-bar-wrap" style={{ flex: 1, minWidth: 60 }}>
        <div className={`progress-bar-fill ${cls}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      {showLabel && (
        <span className="completeness-pct" style={{ minWidth: 36, textAlign: 'right' }}>
          {label ?? `${pct}%`}
        </span>
      )}
    </div>
  )
}
