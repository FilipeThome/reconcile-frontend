import { useMemo } from 'react'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Payout } from '../types'

export function Payouts() {
  const { filters } = useFilters()
  const { error, loading, payouts } = useAppState()
  const rows = useMemo(
    () => payouts.filter((item) => inPeriod(item.date, filters) && (!filters.gateway || item.gateway === filters.gateway)),
    [filters, payouts],
  )

  return (
    <section>
      <PageHeader title="Repasses" subtitle="Payout é o lote efetivamente depositado pelo gateway — não é 1:1 com o pedido." />
      <QueryStatus loading={loading} error={error} />
      <article className="card">
        <DataTable<Payout>
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'id', header: 'Repasse', render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'gw', header: 'Gateway', render: (row) => row.gateway },
            { key: 'date', header: 'Data', render: (row) => formatDateTime(row.date) },
            { key: 'gross', header: 'Bruto', render: (row) => formatBRL(row.grossAmount) },
            { key: 'fees', header: 'Tarifas', render: (row) => formatBRL(row.fees) },
            { key: 'net', header: 'Líquido', render: (row) => formatBRL(row.netAmount) },
            { key: 'orders', header: 'Pedidos no lote', render: (row) => row.orderIds.join(', ') },
            { key: 'st', header: 'Status', render: (row) => <StatusBadge kind="plain" value={row.status} /> },
            { key: 'rec', header: 'Situação', render: (row) => <StatusBadge kind="recon" value={row.reconciliation} /> },
          ]}
        />
      </article>
    </section>
  )
}
