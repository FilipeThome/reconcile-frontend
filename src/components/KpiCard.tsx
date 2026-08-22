import { formatPct } from '../lib/format'

type Props = {
  label: string
  value: string
  delta?: number
  hint?: string
  tone?: 'default' | 'danger' | 'warning'
}

export function KpiCard({ label, value, delta, hint, tone = 'default' }: Props) {
  return (
    <article className={`kpi ${tone === 'default' ? '' : tone}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta !== undefined && (
        <div className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
          {formatPct(delta)} vs período anterior
        </div>
      )}
      {hint && <div className="muted">{hint}</div>}
    </article>
  )
}
