import { useParams } from 'react-router-dom'
import { useApi } from '../api/hooks'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { useFilters } from '../context/FilterContext'
import { downloadCsv, formatBRL, formatDateTime } from '../lib/format'
import type { Closing } from '../types'

export function ClosingDetail() {
  const { id } = useParams()
  const { closings, closePeriod } = useAppState()
  const { session } = useAuth()
  const { filters } = useFilters()
  const { data, error, loading } = useApi<Closing>(session && id ? `/closings/${id}` : null)
  const item = data ?? closings.find((row) => row.id === id)
  if (loading && !item) return <p className="muted">Carregando fechamento…</p>
  if (!item) return <p className="muted">{error ?? 'Período não encontrado.'}</p>
  const deltas = item.deltas ?? []
  const causes = item.causes ?? []

  return (
    <section>
      <PageHeader title={`Fechamento ${item.label}`} subtitle="Snapshot consolidado para o escritório contábil." showPeriod={false}>
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
          Exportar CSV
        </button>
        {item.status === 'open' && (
          <button type="button" className="btn-primary btn" onClick={() => closePeriod(item.id)}>
            Fechar período
          </button>
        )}
      </PageHeader>

      <div className="kpi-grid">
        <KpiCard label="Bruto" value={formatBRL(item.gross)} />
        <KpiCard label="Esperado" value={formatBRL(item.expected)} />
        <KpiCard label="Recebido" value={formatBRL(item.received)} />
        <KpiCard label="Diferenças abertas" value={formatBRL(item.openDiff)} tone="warning" />
        <KpiCard label="Notas pendentes" value={String(item.pendingInvoices)} tone="warning" />
      </div>

      <div className="grid-2">
        <article className="card">
          <h2>Composição</h2>
          <p>Tarifas e comissões: {formatBRL(item.fees)}</p>
          <p>Estornos: {formatBRL(item.refunds)}</p>
          <p>Fechado em: {item.closedAt ? formatDateTime(item.closedAt) : 'ainda aberto'}</p>
          <div className="alert info" style={{ marginTop: 12 }}>
            Após CLOSED, um payout tardio não altera silenciosamente este período. Ele gera ajuste/delta e, se necessário, reabertura explícita.
          </div>
          {deltas.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3>Deltas tardios</h3>
              {deltas.map((delta) => (
                <p key={`${delta.createdAt}-${delta.reason}`}>
                  {formatDateTime(delta.createdAt)} · {delta.reason} · {formatBRL(delta.amount)}
                </p>
              ))}
            </div>
          )}
        </article>
        <article className="card">
          <h2>Principais motivos em aberto</h2>
          {causes.map((row) => (
            <p key={row.cause}>
              {row.cause}: {formatBRL(row.value)}
            </p>
          ))}
          {causes.length === 0 && <p className="muted">Nenhuma causa aberta neste fechamento.</p>}
          <p className="muted">Recorte operacional atual: {filters.from} a {filters.to}.</p>
        </article>
      </div>
    </section>
  )
}
