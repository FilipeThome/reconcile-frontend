import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { labelOf, t } from '../i18n/locale'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Payment } from '../types'

export function Payments() {
  const navigate = useNavigate()
  const { filters } = useFilters()
  const { error, loading, orders, payments } = useAppState()
  const [query, setQuery] = useState('')

  const scoped = useMemo(() => {
    const marketplaceByOrder = new Map(orders.map((item) => [item.id, item.marketplace]))
    return payments.filter(
      (item) =>
        inPeriod(item.date, filters) &&
        (!filters.gateway || item.gateway === filters.gateway) &&
        (!filters.marketplace || marketplaceByOrder.get(item.orderId) === filters.marketplace),
    )
  }, [filters, orders, payments])

  const rows = useMemo(
    () => scoped.filter((item) => `${item.id} ${item.orderId}`.toLowerCase().includes(query.toLowerCase())),
    [query, scoped],
  )

  return (
    <section>
      <PageHeader title={t('pay.title')} subtitle={t('pay.subtitle')} />
      <QueryStatus loading={loading} error={error} />
      <div className="toolbar">
        <input className="field" placeholder={t('pay.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <article className="card">
        <DataTable<Payment>
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.orderId}`)}
          columns={[
            { key: 'id', header: t('pay.payment'), render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'order', header: t('common.order'), render: (row) => row.orderId },
            { key: 'date', header: t('common.date'), render: (row) => formatDateTime(row.date) },
            { key: 'gw', header: t('common.gateway'), render: (row) => row.gateway },
            { key: 'method', header: t('pay.method'), render: (row) => labelOf(row.method) },
            { key: 'gross', header: t('pay.gross'), render: (row) => formatBRL(row.grossAmount) },
            { key: 'fees', header: t('pay.fees'), render: (row) => formatBRL(row.fees) },
            { key: 'net', header: t('pay.net'), render: (row) => formatBRL(row.netAmount) },
            { key: 'st', header: t('common.status'), render: (row) => <StatusBadge kind="plain" value={row.status} /> },
            { key: 'rec', header: t('common.situation'), render: (row) => <StatusBadge kind="recon" value={row.reconciliation} /> },
          ]}
        />
      </article>
    </section>
  )
}
