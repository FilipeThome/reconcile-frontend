import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { orderMatches } from '../lib/filters'
import { downloadCsv, formatBRL, formatDateTime } from '../lib/format'
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
      <PageHeader title="Pedidos" subtitle="Origem canônica do ciclo: pedido → pagamento → settlement → payout → nota.">
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
          Exportar CSV
        </button>
      </PageHeader>
      <QueryStatus loading={loading} error={error} />

      <div className="summary-bar">
        <span>
          Pedidos <strong>{rows.length.toLocaleString('pt-BR')}</strong>
        </span>
        <span>
          Vendas brutas <strong>{formatBRL(gross)}</strong>
        </span>
        <span>
          Ticket médio <strong>{formatBRL(rows.length ? gross / rows.length : 0)}</strong>
        </span>
        <span>
          Itens <strong>{items.toLocaleString('pt-BR')}</strong>
        </span>
      </div>

      <div className="toolbar">
        <input className="field" placeholder="Buscar pedido ou comprador" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="todos">Todas as situações</option>
          <option value="reconciliado">Reconciliado</option>
          <option value="divergente">Divergente</option>
          <option value="pendente_liquidacao">Pendente de liquidação</option>
          <option value="pendente_dados">Pendente de dados</option>
          <option value="reconciliado_alerta">Com alerta</option>
        </select>
      </div>

      <article className="card">
        <DataTable<Order>
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.id}`)}
          columns={[
            { key: 'id', header: 'Pedido', render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'date', header: 'Data', render: (row) => formatDateTime(row.date) },
            { key: 'buyer', header: 'Comprador', render: (row) => row.buyer },
            { key: 'mp', header: 'Marketplace', render: (row) => row.marketplace },
            { key: 'total', header: 'Total', render: (row) => formatBRL(row.grossAmount) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge kind="plain" value={row.status} /> },
            { key: 'sit', header: 'Situação', render: (row) => <StatusBadge kind="recon" value={row.reconciliation} /> },
          ]}
        />
      </article>
    </section>
  )
}
