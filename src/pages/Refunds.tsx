import { useMemo } from 'react'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { labelOf, t } from '../i18n/locale'
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
        title={t('ref.title')}
        subtitle={t('ref.subtitle')}
      />
      <QueryStatus loading={loading} error={error} />
      <article className="card">
        <DataTable<Refund>
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'id', header: t('common.id'), render: (row) => row.id },
            { key: 'order', header: t('common.order'), render: (row) => row.orderId },
            { key: 'type', header: t('ref.type'), render: (row) => labelOf(row.type) },
            { key: 'date', header: t('common.date'), render: (row) => formatDateTime(row.date) },
            { key: 'amount', header: t('common.amount'), render: (row) => formatBRL(row.amount) },
            { key: 'ref', header: t('ref.reflected'), render: (row) => (row.reflectedInSettlement ? t('ref.yes') : t('ref.no')) },
            { key: 'st', header: t('common.situation'), render: (row) => labelOf(row.status) },
          ]}
        />
      </article>
    </section>
  )
}
