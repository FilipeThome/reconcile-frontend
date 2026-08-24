import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod, orderMatches } from '../lib/filters'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Invoice } from '../types'

export function Fiscal() {
  const navigate = useNavigate()
  const { filters } = useFilters()
  const { error, invoices, loading, orders } = useAppState()
  const documents = useMemo(() => invoices.filter((item) => inPeriod(item.issuedAt, filters)), [filters, invoices])
  const pendingOrders = useMemo(
    () => orders.filter((item) => orderMatches(item, filters) && !item.invoiceId).map((item) => item.id),
    [filters, orders],
  )
  const mismatches = documents.filter((item) => {
    const order = orders.find((row) => row.id === item.orderId)
    return order != null && Math.abs(order.grossAmount - item.total) > 0.05
  }).length

  return (
    <section>
      <PageHeader
        title="Fiscal"
        subtitle="Adapter de provedor. Sem motor tributário próprio. Campos CBS/IBS já visíveis no modelo."
      />
      <QueryStatus loading={loading} error={error} />
      <div className="grid-4 mb-16">
        <KpiCard label="Documentos no recorte" value={String(documents.length)} />
        <KpiCard label="Autorizadas" value={String(documents.filter((item) => item.status === 'autorizada').length)} />
        <KpiCard label="Pedidos sem nota" value={String(pendingOrders.length)} tone="warning" />
        <KpiCard label="Divergência de valor" value={String(mismatches)} tone="danger" />
      </div>
      <article className="card">
        <h2>Documentos</h2>
        <DataTable<Invoice>
          rows={documents}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.orderId}`)}
          columns={[
            { key: 'id', header: 'Documento', render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'type', header: 'Tipo', render: (row) => row.type },
            { key: 'order', header: 'Pedido', render: (row) => row.orderId },
            { key: 'num', header: 'Número', render: (row) => row.number },
            { key: 'total', header: 'Total', render: (row) => formatBRL(row.total) },
            { key: 'cbs', header: 'CBS', render: (row) => (row.cbs === null ? '—' : formatBRL(row.cbs)) },
            { key: 'ibs', header: 'IBS', render: (row) => (row.ibs === null ? '—' : formatBRL(row.ibs)) },
            { key: 'st', header: 'Status', render: (row) => <StatusBadge kind="invoice" value={row.status} /> },
            { key: 'at', header: 'Emissão', render: (row) => (row.issuedAt ? formatDateTime(row.issuedAt) : '—') },
          ]}
        />
      </article>
      <article className="card mt-12">
        <h2>Pendências fiscais</h2>
        {pendingOrders.map((id) => (
          <p key={id}>
            {id} sem documento vinculado.{' '}
            <button type="button" className="btn" onClick={() => navigate(`/pedidos/${id}`)}>
              Ver pedido
            </button>
          </p>
        ))}
        {pendingOrders.length === 0 && <p className="muted">Nenhuma pendência fiscal neste recorte.</p>}
      </article>
    </section>
  )
}
