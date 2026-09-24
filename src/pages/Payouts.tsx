import { useMemo } from 'react'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod } from '../lib/filters'
import { t } from '../i18n/locale'
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
      <PageHeader title={t('out.title')} subtitle={t('out.subtitle')} />
      <QueryStatus loading={loading} error={error} />
      <article className="card">
        <DataTable<Payout>
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'id', header: t('out.payout'), render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'gw', header: t('common.gateway'), render: (row) => row.gateway },
            { key: 'date', header: t('common.date'), render: (row) => formatDateTime(row.date) },
            { key: 'gross', header: t('pay.gross'), render: (row) => formatBRL(row.grossAmount) },
            { key: 'fees', header: t('out.fees'), render: (row) => formatBRL(row.fees) },
            { key: 'net', header: t('out.net'), render: (row) => formatBRL(row.netAmount) },
            { key: 'orders', header: t('out.orders'), render: (row) => row.orderIds.join(', ') },
            { key: 'st', header: t('common.status'), render: (row) => <StatusBadge kind="plain" value={row.status} /> },
            { key: 'rec', header: t('common.situation'), render: (row) => <StatusBadge kind="recon" value={row.reconciliation} /> },
          ]}
        />
      </article>
    </section>
  )
}
