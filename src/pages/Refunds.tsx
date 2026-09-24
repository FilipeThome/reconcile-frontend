import { useMemo } from 'react'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Refund } from '../types'

export function Refunds() {
  const { filters } = useFilters()
  const { error, loading, orders, refunds } = useAppState()
  const rows = useMemo(() => {
    const marketplaceByOrder = new Map(orders.map((item) => [item.id, item.marketplace]))
    return refunds.filter(
      (item) => inPeriod(item.date, filters) && (!filters.marketplace || marketplaceByOrder.get(item.orderId) === filters.marketplace),
    )
  }, [filters, orders, refunds])

  return (
    <section>
      <PageHeader
        title="Reembolsos e chargebacks"
        subtitle="Estorno sem reflexo no settlement ou no fechamento abre caso de consistência."
      />
      <QueryStatus loading={loading} error={error} />
      <article className="card">
        <DataTable<Refund>
          rows={rows}
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
