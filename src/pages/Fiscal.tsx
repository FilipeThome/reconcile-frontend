import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { invoices, orders } from '../data/mock'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Invoice } from '../types'

export function Fiscal() {
  const navigate = useNavigate()
  const pendingOrders = orders.filter((item) => !item.invoiceId)
  return (
    <section>
      <PageHeader
        title="Fiscal"
        subtitle="Adapter de provedor. Sem motor tributário próprio. Campos CBS/IBS já visíveis no modelo."
      />
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard label="Documentos no recorte" value={String(invoices.length)} />
        <KpiCard label="Autorizadas" value={String(invoices.filter((item) => item.status === 'autorizada').length)} />
        <KpiCard label="Pedidos sem nota" value={String(pendingOrders.length)} tone="warning" />
        <KpiCard label="Divergência de valor" value="1" tone="danger" />
      </div>
      <article className="card">
        <h2>Documentos</h2>
        <DataTable<Invoice>
          rows={invoices}
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
      <article className="card" style={{ marginTop: 12 }}>
        <h2>Pendências fiscais</h2>
        {pendingOrders.map((item) => (
          <p key={item.id}>
            {item.id} sem documento vinculado.{' '}
            <button type="button" className="btn" onClick={() => navigate(`/pedidos/${item.id}`)}>
              Ver pedido
            </button>
          </p>
        ))}
      </article>
    </section>
  )
}
