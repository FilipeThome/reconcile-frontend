import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { kpis, orders } from '../data/mock'
import { downloadCsv, formatBRL, formatDateTime } from '../lib/format'
import type { Order } from '../types'

export function Orders() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todos')

  const rows = useMemo(
    () =>
      orders.filter((order) => {
        const matchQuery = `${order.id} ${order.buyer}`.toLowerCase().includes(query.toLowerCase())
        const matchStatus = status === 'todos' || order.reconciliation === status
        return matchQuery && matchStatus
      }),
    [query, status],
  )

  return (
    <section>
      <PageHeader title="Pedidos" subtitle="Origem canônica do ciclo: pedido → pagamento → settlement → payout → nota.">
        <button
          type="button"
          className="btn"
          onClick={() =>
            downloadCsv('pedidos.csv', [
              ['id', 'data', 'comprador', 'marketplace', 'bruto', 'status'],
              ...rows.map((order) => [
                order.id,
                order.date,
                order.buyer,
                order.marketplace,
                String(order.grossAmount),
                order.reconciliation,
              ]),
            ])
          }
        >
          Exportar CSV
        </button>
      </PageHeader>

      <div className="summary-bar">
        <span>
          Pedidos <strong>{kpis.orders.toLocaleString('pt-BR')}</strong>
        </span>
        <span>
          Vendas brutas <strong>{formatBRL(kpis.gross)}</strong>
        </span>
        <span>
          Ticket médio <strong>{formatBRL(kpis.avgTicket)}</strong>
        </span>
        <span>
          Itens <strong>{kpis.itemsSold.toLocaleString('pt-BR')}</strong>
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
