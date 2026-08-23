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
import { downloadCsv, formatBRL, formatDateTime, causeLabel } from '../lib/format'
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
      <PageHeader title="Divergências" subtitle="Caixa de entrada operacional. Cada caso tem causa, impacto, evidências e ação sugerida.">
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
          Exportar CSV
        </button>
      </PageHeader>
      <QueryStatus loading={loading} error={error} />

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard label="Casos no recorte" value={String(filtered.length)} />
        <KpiCard label="Valor em aberto" value={formatBRL(openAmount)} tone="warning" />
        <KpiCard label="Recuperável" value={formatBRL(recoverable)} />
        <KpiCard label="Perda confirmada" value={formatBRL(loss)} tone="danger" />
      </div>

      <div className="tabs">
        {(['todas', 'aberta', 'em_analise', 'resolvida', 'ignorada'] as const).map((item) => (
          <button key={item} type="button" className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
            {item === 'todas' ? 'Todas' : item.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <input className="field" placeholder="Buscar caso, pedido ou causa" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <article className="card">
        <DataTable<ReconciliationCase>
          rows={filtered}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/divergencias/${row.id}`)}
          columns={[
            { key: 'id', header: 'Caso', render: (row) => <span className="linkish">{row.id}</span> },
            { key: 'date', header: 'Detectada em', render: (row) => formatDateTime(row.openedAt) },
            { key: 'order', header: 'Pedido', render: (row) => row.orderId },
            { key: 'set', header: 'Settlement', render: (row) => row.settlementId ?? '—' },
            { key: 'cause', header: 'Causa', render: (row) => causeLabel(row.cause) },
            { key: 'amount', header: 'Valor', render: (row) => formatBRL(row.amount) },
            { key: 'impact', header: 'Impacto', render: (row) => <StatusBadge kind="impact" value={row.impact} /> },
            { key: 'prio', header: 'Prioridade', render: (row) => <StatusBadge kind="priority" value={row.priority} /> },
            { key: 'st', header: 'Status', render: (row) => <StatusBadge kind="case" value={row.status} /> },
          ]}
        />
      </article>
    </section>
  )
}
