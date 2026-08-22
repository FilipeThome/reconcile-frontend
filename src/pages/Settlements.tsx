import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { settlements } from '../data/mock'
import { formatBRL, formatDate } from '../lib/format'
import type { Settlement } from '../types'

export function Settlements() {
  const navigate = useNavigate()
  return (
    <section>
      <PageHeader
        title="Liquidações"
        subtitle="Settlement é o valor esperado liquidável, calculado de forma determinística e versionada."
      />
      <article className="card">
        <DataTable<Settlement>
          rows={settlements}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.orderId}`)}
          columns={[
            { key: 'id', header: 'Settlement', render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'order', header: 'Pedido', render: (row) => row.orderId },
            { key: 'pay', header: 'Pagamento', render: (row) => row.paymentId },
            { key: 'date', header: 'Data', render: (row) => formatDate(row.date) },
            { key: 'exp', header: 'Esperado', render: (row) => formatBRL(row.expectedNet) },
            { key: 'act', header: 'Recebido', render: (row) => (row.actualNet === null ? '—' : formatBRL(row.actualNet)) },
            { key: 'snap', header: 'Snapshot', render: (row) => row.snapshotId },
            { key: 'st', header: 'Situação', render: (row) => <StatusBadge kind="recon" value={row.status} /> },
          ]}
        />
      </article>
    </section>
  )
}
