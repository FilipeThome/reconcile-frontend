import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { t } from '../i18n/locale'
import { formatBRL, formatDate } from '../lib/format'
import type { Settlement } from '../types'

export function Settlements() {
  const navigate = useNavigate()
  const { filters } = useFilters()
  const { error, loading, orders, payments, settlements } = useAppState()

  const rows = useMemo(() => {
    const marketplaceByOrder = new Map(orders.map((item) => [item.id, item.marketplace]))
    const gatewayByPayment = new Map(payments.map((item) => [item.id, item.gateway]))
    return settlements.filter(
      (item) =>
        inPeriod(item.date, filters) &&
        (!filters.marketplace || marketplaceByOrder.get(item.orderId) === filters.marketplace) &&
        (!filters.gateway || gatewayByPayment.get(item.paymentId) === filters.gateway),
    )
  }, [filters, orders, payments, settlements])

  return (
    <section>
      <PageHeader
        title={t('stl.title')}
        subtitle={t('stl.subtitle')}
      />
      <QueryStatus loading={loading} error={error} />
      <article className="card">
        <DataTable<Settlement>
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.orderId}`)}
          columns={[
            { key: 'id', header: 'Settlement', render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'order', header: t('common.order'), render: (row) => row.orderId },
            { key: 'pay', header: t('pay.payment'), render: (row) => row.paymentId },
            { key: 'date', header: t('common.date'), render: (row) => formatDate(row.date) },
            { key: 'exp', header: t('stl.expected'), render: (row) => formatBRL(row.expectedNet) },
            { key: 'act', header: t('stl.received'), render: (row) => (row.actualNet === null ? '—' : formatBRL(row.actualNet)) },
            { key: 'snap', header: t('stl.snapshot'), render: (row) => row.snapshotId },
            { key: 'st', header: t('common.situation'), render: (row) => <StatusBadge kind="recon" value={row.status} /> },
          ]}
        />
      </article>
    </section>
  )
}
