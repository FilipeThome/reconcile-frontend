import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Payment } from '../types'

export function Payments() {
  const navigate = useNavigate()
  const { filters } = useFilters()
  const { error, loading, orders, payments } = useAppState()
  const [query, setQuery] = useState('')

  const scoped = useMemo(() => {
    const marketplaceByOrder = new Map(orders.map((item) => [item.id, item.marketplace]))
    return payments.filter(
      (item) =>
        inPeriod(item.date, filters) &&
        (!filters.gateway || item.gateway === filters.gateway) &&
        (!filters.marketplace || marketplaceByOrder.get(item.orderId) === filters.marketplace),
    )
  }, [filters, orders, payments])

  const rows = useMemo(
    () => scoped.filter((item) => `${item.id} ${item.orderId}`.toLowerCase().includes(query.toLowerCase())),
    [query, scoped],
  )

  return (
    <section>
      <PageHeader title="Pagamentos" subtitle="Payment é distinto de settlement e de payout. Eventos podem chegar fora de ordem." />
      <QueryStatus loading={loading} error={error} />
      <div className="toolbar">
        <input className="field" placeholder="Buscar pagamento ou pedido" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <article className="card">
        <DataTable<Payment>
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.orderId}`)}
          columns={[
            { key: 'id', header: 'Pagamento', render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'order', header: 'Pedido', render: (row) => row.orderId },
            { key: 'date', header: 'Data', render: (row) => formatDateTime(row.date) },
            { key: 'gw', header: 'Gateway', render: (row) => row.gateway },
            { key: 'method', header: 'Método', render: (row) => row.method },
            { key: 'gross', header: 'Bruto', render: (row) => formatBRL(row.grossAmount) },
            { key: 'fees', header: 'Taxas', render: (row) => formatBRL(row.fees) },
            { key: 'net', header: 'Líquido', render: (row) => formatBRL(row.netAmount) },
            { key: 'st', header: 'Status', render: (row) => <StatusBadge kind="plain" value={row.status} /> },
            { key: 'rec', header: 'Situação', render: (row) => <StatusBadge kind="recon" value={row.reconciliation} /> },
          ]}
        />
      </article>
    </section>
  )
}
