import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryStatus } from '../api/hooks'
import { DataTable } from '../components/DataTable'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { caseMatches, caseSearchText } from '../lib/filters'
import { t } from '../i18n/locale'
import { downloadCsv, formatBRL, formatDateTime, causeLabel, caseStatusLabel } from '../lib/format'
import type { CaseStatus, ReconciliationCase } from '../types'

export function Discrepancies() {
  const navigate = useNavigate()
  const { cases, error, loading, orders, payments } = useAppState()
  const { filters } = useFilters()
  const [tab, setTab] = useState<'todas' | CaseStatus>('todas')
  const [query, setQuery] = useState('')

  const scoped = useMemo(
    () => cases.filter((item) => caseMatches(item, filters, orders, payments)),
    [cases, filters, orders, payments],
  )

  const filtered = useMemo(
    () =>
      scoped.filter((item) => {
        const matchTab = tab === 'todas' || item.status === tab
        const matchQuery = caseSearchText(item).includes(query.toLowerCase())
        return matchTab && matchQuery
      }),
    [query, scoped, tab],
  )

  const openAmount = filtered
    .filter((item) => item.status !== 'resolvida' && item.status !== 'ignorada')
    .reduce((sum, item) => sum + item.amount, 0)
  const recoverable = filtered.reduce((sum, item) => sum + item.recoverable, 0)
  const loss = filtered.reduce((sum, item) => sum + item.confirmedLoss, 0)

  return (
    <section>
      <PageHeader title={t('cases.title')} subtitle={t('cases.subtitle')}>
        <button
          type="button"
          className="btn"
          onClick={() =>
            downloadCsv('divergencias.csv', [
              ['id', 'pedido', 'causa', 'valor', 'status'],
              ...filtered.map((item) => [item.id, item.orderId, item.cause, String(item.amount), item.status]),
            ])
          }
        >
          {t('cases.export')}
        </button>
      </PageHeader>
      <QueryStatus loading={loading} error={error} />

      <div className="grid-4 mb-16">
        <KpiCard label={t('cases.inPeriod')} value={String(filtered.length)} />
        <KpiCard label={t('cases.openAmount')} value={formatBRL(openAmount)} tone="warning" />
        <KpiCard label={t('dash.recoverable')} value={formatBRL(recoverable)} />
        <KpiCard label={t('dash.confirmedLoss')} value={formatBRL(loss)} tone="danger" />
      </div>

      <div className="tabs">
        {(['todas', 'aberta', 'em_analise', 'resolvida', 'ignorada'] as const).map((item) => (
          <button key={item} type="button" className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
            {item === 'todas' ? t('cases.all') : caseStatusLabel(item)}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <input className="field" placeholder={t('cases.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <article className="card">
        <DataTable<ReconciliationCase>
          rows={filtered}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/divergencias/${row.id}`)}
          columns={[
            { key: 'id', header: t('dash.case'), render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'date', header: t('cases.detected'), render: (row) => formatDateTime(row.openedAt) },
            { key: 'order', header: t('common.order'), render: (row) => row.orderId },
            { key: 'set', header: 'Settlement', render: (row) => row.settlementId ?? '—' },
            { key: 'cause', header: t('dash.cause'), render: (row) => causeLabel(row.cause) },
            { key: 'amount', header: t('common.amount'), render: (row) => formatBRL(row.amount) },
            { key: 'impact', header: t('cases.impact'), render: (row) => <StatusBadge kind="impact" value={row.impact} /> },
            { key: 'prio', header: t('cases.priority'), render: (row) => <StatusBadge kind="priority" value={row.priority} /> },
            { key: 'st', header: t('common.status'), render: (row) => <StatusBadge kind="case" value={row.status} /> },
          ]}
        />
      </article>
    </section>
  )
}
