import { Link, useNavigate, useParams } from 'react-router-dom'
import { parseComponents } from '../api/client'
import { useApi } from '../api/hooks'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n/locale'
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
  if (loading && !order) return <p className="muted">{t('orders.loading')}</p>
  if (!order) return <p className="muted">{error ?? t('orders.missing')}</p>

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
            {t('orders.openCase')}
          </button>
        )}
      </PageHeader>

      <div className="grid-2">
        <article className="card">
          <h2>{t('orders.summary')}</h2>
          <p>{t('orders.date')}: {formatDateTime(order.date)}</p>
          <p>{t('orders.itemsLabel')}: {order.items}</p>
          <p>{t('orders.grossLabel')}: {formatBRL(order.grossAmount)}</p>
          <p>{t('orders.expectedNet')}: {formatBRL(order.expectedNet)}</p>
          <p>{t('orders.actualNet')}: {order.actualNet === null ? '—' : formatBRL(order.actualNet)}</p>
          <p>
            Status: <StatusBadge kind="plain" value={order.status} />{' '}
            <StatusBadge kind="recon" value={order.reconciliation} />
          </p>
        </article>
        <article className="card">
          <h2>{t('orders.timeline')}</h2>
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-rail"><div className="tl-dot" /></div>
              <div className="tl-body">
                <strong>{t('orders.created')}</strong>
                <p>{formatDateTime(order.date)}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${payment ? 'success' : 'warning'}`} /></div>
              <div className="tl-body">
                <strong>{payment ? t('orders.paid') : t('orders.unpaid')}</strong>
                <p>{payment ? <Link className="linkish" to="/pagamentos">{payment.id}</Link> : t('status.pendente_dados')}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${settlement ? 'success' : 'warning'}`} /></div>
              <div className="tl-body">
                <strong>{settlement ? t('orders.settled') : t('orders.awaitingSettlement')}</strong>
                <p>{settlement ? `${settlement.id} · ${t('orders.expectedShort')} ${formatBRL(settlement.expectedNet)}` : t('orders.settlementHint')}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${payout ? 'success' : 'danger'}`} /></div>
              <div className="tl-body">
                <strong>{payout ? t('orders.payoutFound') : t('orders.payoutMissing')}</strong>
                <p>{payout ? `${payout.id} · ${formatBRL(payout.netAmount)}` : t('orders.payoutHint')}</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-rail"><div className={`tl-dot ${invoice ? 'success' : 'warning'}`} /></div>
              <div className="tl-body">
                <strong>{invoice ? `${invoice.type} ${invoice.status}` : t('orders.invoiceMissing')}</strong>
                <p>{invoice ? invoice.key : t('orders.invoiceHint')}</p>
              </div>
            </div>
          </div>
        </article>
      </div>

      {snapshot && (
        <article className="card mt-12">
          <h2>{t('orders.snapshot', { version: snapshot.version })}</h2>
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
