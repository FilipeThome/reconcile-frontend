import { Link, useNavigate, useParams } from 'react-router-dom'
import { parseComponents } from '../api/client'
import { useApi } from '../api/hooks'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { formatBRL, formatDateTime } from '../lib/format'
import type { CalculationSnapshot, Invoice, Order, Payment, Payout, Settlement } from '../types'

type OrderDetailPayload = Order & {
  snapshot?: (CalculationSnapshot & { components?: unknown }) | null
  payment?: Payment | null
  settlement?: Settlement | null
  payout?: Payout | null
  invoice?: Invoice | null
}

export function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { invoices, orders, payments, payouts, settlements, snapshots } = useAppState()
  const { data, error, loading } = useApi<OrderDetailPayload>(session && id ? `/orders/${id}` : null)
  const order = data ?? orders.find((item) => item.id === id)
  if (loading && !order) return <p className="muted">Carregando pedido…</p>
  if (!order) return <p className="muted">{error ?? 'Pedido não encontrado.'}</p>

  const payment = data?.payment ?? payments.find((item) => item.id === order.paymentId || item.orderId === order.id)
  const settlement = data?.settlement ?? settlements.find((item) => item.id === order.settlementId)
  const payout = data?.payout ?? payouts.find((item) => item.id === order.payoutId)
  const invoice = data?.invoice ?? invoices.find((item) => item.id === order.invoiceId)
  const snapshot = data?.snapshot
    ? { ...data.snapshot, components: parseComponents(data.snapshot.components) }
    : snapshots.find((item) => item.orderId === order.id)

  return (
    <section>
      <PageHeader title={order.id} subtitle={`${order.buyer} · ${order.marketplace}`} showPeriod={false}>
        {order.caseId && (
          <button type="button" className="btn-primary btn" onClick={() => navigate(`/divergencias/${order.caseId}`)}>
            Abrir caso
          </button>
        )}
      </PageHeader>

      <div className="grid-2">
        <article className="card">
          <h2>Resumo do pedido</h2>
          <p>Data: {formatDateTime(order.date)}</p>
          <p>Itens: {order.items}</p>
          <p>Bruto: {formatBRL(order.grossAmount)}</p>
          <p>Líquido esperado: {formatBRL(order.expectedNet)}</p>
          <p>Líquido recebido: {order.actualNet === null ? '—' : formatBRL(order.actualNet)}</p>
          <p>
            Status: <StatusBadge kind="plain" value={order.status} />{' '}
            <StatusBadge kind="recon" value={order.reconciliation} />
          </p>
        </article>
        <article className="card">
          <h2>Linha do tempo financeira</h2>
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-rail"><div className="tl-dot" /></div>
              <div className="tl-body">
                <strong>Pedido criado</strong>
                <p>{formatDateTime(order.date)}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${payment ? 'success' : 'warning'}`} /></div>
              <div className="tl-body">
                <strong>{payment ? 'Pagamento aprovado' : 'Pagamento não localizado'}</strong>
                <p>{payment ? <Link className="linkish" to="/pagamentos">{payment.id}</Link> : 'Pendente de dados'}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${settlement ? 'success' : 'warning'}`} /></div>
              <div className="tl-body">
                <strong>{settlement ? 'Settlement calculado' : 'Aguardando settlement'}</strong>
                <p>{settlement ? `${settlement.id} · esperado ${formatBRL(settlement.expectedNet)}` : 'Antes do deadline o estado permanece pendente de liquidação.'}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${payout ? 'success' : 'danger'}`} /></div>
              <div className="tl-body">
                <strong>{payout ? 'Repasse identificado' : 'Repasse não identificado'}</strong>
                <p>{payout ? `${payout.id} · ${formatBRL(payout.netAmount)}` : 'Ausência temporária de payout não é perda automática.'}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${invoice ? 'success' : 'warning'}`} /></div>
              <div className="tl-body">
                <strong>{invoice ? `${invoice.type} ${invoice.status}` : 'Documento fiscal ausente'}</strong>
                <p>{invoice ? invoice.key : 'Obrigação fiscal vem de configuração, não de inferência do produto.'}</p>
              </div>
            </div>
          </div>
        </article>
      </div>

      {snapshot && (
        <article className="card mt-12">
          <h2>Snapshot do cálculo ({snapshot.version})</h2>
          <p>Gross {formatBRL(snapshot.gross)}</p>
          {snapshot.components.map((item) => (
            <p key={item.label}>
              {item.label}: {formatBRL(item.amount)}
            </p>
          ))}
          <p>
            Expected settlement: <strong>{formatBRL(snapshot.expected)}</strong>
          </p>
        </article>
      )}
    </section>
  )
}
