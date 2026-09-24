import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { orderMatches } from '../lib/filters'
import { t } from '../i18n/locale'
import { downloadCsv, formatBRL, formatCount, formatDateTime, reconLabel } from '../lib/format'
import type { Order } from '../types'

export function Orders() {
  const navigate = useNavigate()
  const { filters } = useFilters()
  const { error, loading, orders, payments } = useAppState()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todos')

  const scoped = useMemo(() => {
    const paymentByOrder = new Map(payments.map((item) => [item.orderId, item]))
    return orders.filter((order) => orderMatches(order, filters, paymentByOrder.get(order.id)))
  }, [filters, orders, payments])

  const rows = useMemo(
    () =>
      scoped.filter((order) => {
        const matchQuery = `${order.id} ${order.buyer}`.toLowerCase().includes(query.toLowerCase())
        const matchStatus = status === 'todos' || order.reconciliation === status
        return matchQuery && matchStatus
      }),
    [query, scoped, status],
  )

  const gross = rows.reduce((sum, item) => sum + item.grossAmount, 0)
  const items = rows.reduce((sum, item) => sum + item.items, 0)

  return (
    <section>
      <PageHeader title={t('orders.title')} subtitle={t('orders.subtitle')}>
        <button
          type="button"
          className="btn"
          onClick={() =>
            downloadCsv('pedidos.csv', [
              ['id', 'data', 'comprador', 'marketplace', 'bruto', 'status'],
              ...rows.map((order) => [order.id, order.date, order.buyer, order.marketplace, String(order.grossAmount), order.reconciliation]),
            ])
          }
        >
          {t('orders.export')}
        </button>
      </PageHeader>
      <QueryStatus loading={loading} error={error} />

      <div className="summary-bar">
        <span>
          {t('orders.count')} <strong>{formatCount(rows.length)}</strong>
        </span>
        <span>
          {t('orders.gross')} <strong>{formatBRL(gross)}</strong>
        </span>
        <span>
          {t('orders.ticket')} <strong>{formatBRL(rows.length ? gross / rows.length : 0)}</strong>
        </span>
        <span>
          {t('orders.items')} <strong>{formatCount(items)}</strong>
        </span>
      </div>

      <div className="toolbar">
        <input className="field" placeholder={t('orders.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="todos">{t('orders.allStatus')}</option>
          <option value="reconciliado">{reconLabel('reconciliado')}</option>
          <option value="divergente">{reconLabel('divergente')}</option>
          <option value="pendente_liquidacao">{reconLabel('pendente_liquidacao')}</option>
          <option value="pendente_dados">{reconLabel('pendente_dados')}</option>
          <option value="reconciliado_alerta">{t('orders.alert')}</option>
        </select>
      </div>

      <article className="card">
        <DataTable<Order>
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.id}`)}
          columns={[
            { key: 'id', header: t('orders.order'), render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'date', header: t('orders.date'), render: (row) => formatDateTime(row.date) },
            { key: 'buyer', header: t('orders.buyer'), render: (row) => row.buyer },
            { key: 'mp', header: t('common.marketplace'), render: (row) => row.marketplace },
            { key: 'total', header: t('orders.total'), render: (row) => formatBRL(row.grossAmount) },
            { key: 'status', header: t('common.status'), render: (row) => <StatusBadge kind="plain" value={row.status} /> },
            { key: 'sit', header: t('orders.situation'), render: (row) => <StatusBadge kind="recon" value={row.reconciliation} /> },
          ]}
        />
      </article>
    </section>
  )
}
