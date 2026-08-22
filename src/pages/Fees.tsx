import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { fees } from '../data/mock'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Fee } from '../types'

export function Fees() {
  return (
    <section>
      <PageHeader title="Tarifas" subtitle="Componentes conhecidos alimentam o Settlement Calculation Engine." />
      <article className="card">
        <DataTable<Fee>
          rows={fees}
          rowKey={(row) => row.id}
          columns={[
            { key: 'id', header: 'ID', render: (row) => row.id },
            { key: 'order', header: 'Pedido', render: (row) => row.orderId },
            { key: 'type', header: 'Tipo', render: (row) => row.type },
            { key: 'exp', header: 'Esperado', render: (row) => formatBRL(row.expected) },
            { key: 'act', header: 'Efetivo', render: (row) => formatBRL(row.actual) },
            { key: 'src', header: 'Origem', render: (row) => row.source },
            { key: 'date', header: 'Data', render: (row) => formatDateTime(row.date) },
          ]}
        />
      </article>
    </section>
  )
}
