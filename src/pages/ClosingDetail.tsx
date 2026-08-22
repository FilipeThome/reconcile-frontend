import { useParams } from 'react-router-dom'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { causeBreakdown } from '../data/mock'
import { downloadCsv, formatBRL, formatDateTime } from '../lib/format'

export function ClosingDetail() {
  const { id } = useParams()
  const { closings, closePeriod } = useAppState()
  const item = closings.find((row) => row.id === id)
  if (!item) return <p>Período não encontrado.</p>

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
        </article>
        <article className="card">
          <h2>Principais motivos em aberto</h2>
          {causeBreakdown.map((row) => (
            <p key={row.cause}>
              {row.cause}: {formatBRL(row.value)}
            </p>
          ))}
        </article>
      </div>
    </section>
  )
}
