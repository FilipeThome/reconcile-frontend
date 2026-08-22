import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { refunds } from '../data/mock'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Refund } from '../types'

export function Refunds() {
  return (
    <section>
      <PageHeader
        title="Reembolsos e chargebacks"
        subtitle="Estorno sem reflexo no settlement ou no fechamento abre caso de consistência."
      />
      <article className="card">
        <DataTable<Refund>
          rows={refunds}
          rowKey={(row) => row.id}
          columns={[
            { key: 'id', header: 'ID', render: (row) => row.id },
            { key: 'order', header: 'Pedido', render: (row) => row.orderId },
            { key: 'type', header: 'Tipo', render: (row) => row.type },
            { key: 'date', header: 'Data', render: (row) => formatDateTime(row.date) },
            { key: 'amount', header: 'Valor', render: (row) => formatBRL(row.amount) },
            { key: 'ref', header: 'Refletido no settlement', render: (row) => (row.reflectedInSettlement ? 'Sim' : 'Não') },
            { key: 'st', header: 'Situação', render: (row) => row.status },
          ]}
        />
      </article>
    </section>
  )
}
