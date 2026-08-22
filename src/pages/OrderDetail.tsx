import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { invoices, orders, payments, payouts, settlements, snapshots } from '../data/mock'
import { formatBRL, formatDateTime } from '../lib/format'

export function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const order = orders.find((item) => item.id === id)
  if (!order) return <p>Pedido não encontrado neste protótipo.</p>

  const payment = payments.find((item) => item.id === order.paymentId)
  const settlement = settlements.find((item) => item.id === order.settlementId)
  const payout = payouts.find((item) => item.id === order.payoutId)
  const invoice = invoices.find((item) => item.id === order.invoiceId)
  const snapshot = snapshots.find((item) => item.orderId === order.id)

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
        <article className="card" style={{ marginTop: 12 }}>
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
