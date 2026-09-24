import { useMemo } from 'react'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { t } from '../i18n/locale'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Fee } from '../types'

export function Fees() {
  const { filters } = useFilters()
  const { error, fees, loading, orders } = useAppState()
  const rows = useMemo(() => {
    const marketplaceByOrder = new Map(orders.map((item) => [item.id, item.marketplace]))
    return fees.filter(
      (item) => inPeriod(item.date, filters) && (!filters.marketplace || marketplaceByOrder.get(item.orderId) === filters.marketplace),
    )
  }, [fees, filters, orders])

  return (
    <section>
      <PageHeader title={t('fee.title')} subtitle={t('fee.subtitle')} />
      <QueryStatus loading={loading} error={error} />
      <article className="card">
        <DataTable<Fee>
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'id', header: t('common.id'), render: (row) => row.id },
            { key: 'order', header: t('common.order'), render: (row) => row.orderId },
            { key: 'type', header: t('fee.type'), render: (row) => row.type },
            { key: 'exp', header: t('fee.expected'), render: (row) => formatBRL(row.expected) },
            { key: 'act', header: t('fee.actual'), render: (row) => formatBRL(row.actual) },
            { key: 'src', header: t('fee.source'), render: (row) => row.source },
            { key: 'date', header: t('common.date'), render: (row) => formatDateTime(row.date) },
          ]}
        />
      </article>
    </section>
  )
}
