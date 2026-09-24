import { useParams } from 'react-router-dom'
import { useApi } from '../api/hooks'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { useFilters } from '../context/FilterContext'
import { t } from '../i18n/locale'
import { downloadCsv, formatBRL, formatDateTime } from '../lib/format'
import type { Closing } from '../types'

export function ClosingDetail() {
  const { id } = useParams()
  const { closings, closePeriod } = useAppState()
  const { session } = useAuth()
  const { filters } = useFilters()
  const { data, error, loading } = useApi<Closing>(session && id ? `/closings/${id}` : null)
  const item = data ?? closings.find((row) => row.id === id)
  if (loading && !item) return <p className="muted">{t('clo.loading')}</p>
  if (!item) return <p className="muted">{error ?? t('clo.missing')}</p>
  const deltas = item.deltas ?? []
  const causes = item.causes ?? []

  return (
    <section>
      <PageHeader title={t('clo.detail', { label: item.label })} subtitle={t('clo.detailSubtitle')} showPeriod={false}>
        <StatusBadge kind="closing" value={item.status} />
        <button
          type="button"
          className="btn"
          onClick={() =>
            downloadCsv(`fechamento-${item.period}.csv`, [
              ['periodo', 'bruto', 'esperado', 'recebido', 'tarifas', 'estornos', 'diff', 'notas_pendentes'],
              [
                item.period,
                String(item.gross),
                String(item.expected),
                String(item.received),
                String(item.fees),
                String(item.refunds),
                String(item.openDiff),
                String(item.pendingInvoices),
              ],
            ])
          }
        >
          {t('clo.export')}
        </button>
        {item.status === 'open' && (
          <button type="button" className="btn-primary btn" onClick={() => closePeriod(item.id)}>
            {t('clo.close')}
          </button>
        )}
      </PageHeader>

      <div className="kpi-grid">
        <KpiCard label={t('clo.gross')} value={formatBRL(item.gross)} />
        <KpiCard label={t('clo.expected')} value={formatBRL(item.expected)} />
        <KpiCard label={t('clo.received')} value={formatBRL(item.received)} />
        <KpiCard label={t('clo.openDiffs')} value={formatBRL(item.openDiff)} tone="warning" />
        <KpiCard label={t('clo.pendingNotes')} value={String(item.pendingInvoices)} tone="warning" />
      </div>

      <div className="grid-2">
        <article className="card">
          <h2>{t('clo.composition')}</h2>
          <p>{t('clo.fees')}: {formatBRL(item.fees)}</p>
          <p>{t('clo.refunds')}: {formatBRL(item.refunds)}</p>
          <p>{t('clo.closedAt')}: {item.closedAt ? formatDateTime(item.closedAt) : t('clo.stillOpen')}</p>
          <div className="alert info mt-12">
            {t('clo.closedHint')}
          </div>
          {deltas.length > 0 && (
            <div className="mt-12">
              <h3>{t('clo.deltas')}</h3>
              {deltas.map((delta) => (
                <p key={`${delta.createdAt}-${delta.reason}`}>
                  {formatDateTime(delta.createdAt)} · {delta.reason} · {formatBRL(delta.amount)}
                </p>
              ))}
            </div>
          )}
        </article>
        <article className="card">
          <h2>{t('clo.reasons')}</h2>
          {causes.map((row) => (
            <p key={row.cause}>
              {row.cause}: {formatBRL(row.value)}
            </p>
          ))}
          {causes.length === 0 && <p className="muted">{t('clo.noCauses')}</p>}
          <p className="muted">{t('clo.range', { from: filters.from, to: filters.to })}</p>
        </article>
      </div>
    </section>
  )
}
