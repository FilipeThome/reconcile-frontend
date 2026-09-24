import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { inPeriod, orderMatches } from '../lib/filters'
import { t } from '../i18n/locale'
import { formatBRL, formatDateTime } from '../lib/format'
import type { Invoice } from '../types'

export function Fiscal() {
  const navigate = useNavigate()
  const { filters } = useFilters()
  const { error, invoices, loading, orders } = useAppState()
  const documents = useMemo(() => invoices.filter((item) => inPeriod(item.issuedAt, filters)), [filters, invoices])
  const pendingOrders = useMemo(
    () => orders.filter((item) => orderMatches(item, filters) && !item.invoiceId).map((item) => item.id),
    [filters, orders],
  )
  const mismatches = documents.filter((item) => {
    const order = orders.find((row) => row.id === item.orderId)
    return order != null && Math.abs(order.grossAmount - item.total) > 0.05
  }).length

  return (
    <section>
      <PageHeader
        title={t('fiscal.title')}
        subtitle={t('fiscal.subtitle')}
      />
      <QueryStatus loading={loading} error={error} />
      <div className="grid-4 mb-16">
        <KpiCard label={t('fiscal.docs')} value={String(documents.length)} />
        <KpiCard label={t('fiscal.authorized')} value={String(documents.filter((item) => item.status === 'autorizada').length)} />
        <KpiCard label={t('fiscal.missing')} value={String(pendingOrders.length)} tone="warning" />
        <KpiCard label={t('fiscal.mismatch')} value={String(mismatches)} tone="danger" />
      </div>
      <article className="card">
        <h2>{t('fiscal.documents')}</h2>
        <DataTable<Invoice>
          rows={documents}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/pedidos/${row.orderId}`)}
          columns={[
            { key: 'id', header: t('fiscal.document'), render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'type', header: t('fiscal.type'), render: (row) => row.type },
            { key: 'order', header: t('common.order'), render: (row) => row.orderId },
            { key: 'num', header: t('fiscal.number'), render: (row) => row.number },
            { key: 'total', header: t('common.total'), render: (row) => formatBRL(row.total) },
            { key: 'cbs', header: 'CBS', render: (row) => (row.cbs === null ? '—' : formatBRL(row.cbs)) },
            { key: 'ibs', header: 'IBS', render: (row) => (row.ibs === null ? '—' : formatBRL(row.ibs)) },
            { key: 'st', header: t('common.status'), render: (row) => <StatusBadge kind="invoice" value={row.status} /> },
            { key: 'at', header: t('fiscal.issued'), render: (row) => (row.issuedAt ? formatDateTime(row.issuedAt) : '—') },
          ]}
        />
      </article>
      <article className="card mt-12">
        <h2>{t('fiscal.pending')}</h2>
        {pendingOrders.map((id) => (
          <p key={id}>
            {id} {t('fiscal.unlinked')}{' '}
            <button type="button" className="btn" onClick={() => navigate(`/pedidos/${id}`)}>
              {t('fiscal.view')}
            </button>
          </p>
        ))}
        {pendingOrders.length === 0 && <p className="muted">{t('fiscal.none')}</p>}
      </article>
    </section>
  )
}
