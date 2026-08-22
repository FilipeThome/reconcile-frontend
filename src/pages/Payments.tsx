import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { payments } from '../data/mock'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Payment } from '../types'

export function Payments() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const rows = useMemo(
    () => payments.filter((item) => `${item.id} ${item.orderId}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
    <section>
      <PageHeader title="Pagamentos" subtitle="Payment é distinto de settlement e de payout. Eventos podem chegar fora de ordem." />
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
