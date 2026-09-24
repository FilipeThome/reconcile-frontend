import { Link } from 'react-router-dom'
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { QueryStatus } from '../api/hooks'
import { BarFill } from '../components/BarFill'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { buildDashboard } from '../lib/dashboard'
import { t } from '../i18n/locale'
import { formatBRL, formatCount } from '../lib/format'

export function Dashboard() {
  const { cases, dashboard, error, invoices, loading, orders, payments, payouts } = useAppState()
  const { filters } = useFilters()
  const view =
    dashboard ??
    buildDashboard({ orders, cases, payments, payouts, invoices, filters })
  const pieData = [
    { name: t('dash.reconciled'), value: view.kpis.reconciledPct, color: '#16a34a' },
    { name: t('dash.divergence'), value: view.kpis.divergentPct, color: '#f59e0b' },
    { name: t('dash.pending'), value: view.kpis.pendingPct, color: '#94a3b8' },
  ]

  return (
    <section>
      <PageHeader
        title={t('dash.title')}
        subtitle={t('dash.subtitle', { period: view.periodLabel })}
      />
      <QueryStatus loading={loading} error={error} />

      <div className="kpi-grid">
        <KpiCard label={t('dash.gross')} value={formatBRL(view.kpis.gross)} delta={view.kpis.vsGross} />
        <KpiCard label={t('dash.expected')} value={formatBRL(view.kpis.expected)} delta={view.kpis.vsExpected} />
        <KpiCard label={t('dash.received')} value={formatBRL(view.kpis.received)} delta={view.kpis.vsReceived} />
        <KpiCard label={t('dash.divergence')} value={formatBRL(view.kpis.divergence)} delta={view.kpis.vsDivergence} tone="warning" />
        <KpiCard label={t('dash.loss')} value={formatBRL(view.kpis.confirmedLoss)} delta={view.kpis.vsLoss} tone="danger" />
      </div>

      <div className="grid-2">
        <article className="card">
          <h2>{t('dash.daily')}</h2>
          {view.dailySeries.length === 0 ? (
            <p className="muted">{t('dash.emptyOrders')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={view.dailySeries}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatBRL(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="esperado" name={t('dash.expectedSeries')} stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="recebido" name={t('dash.receivedSeries')} stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="divergencia" name={t('dash.divergenceSeries')} stroke="#dc2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </article>
        <article className="card">
          <h2>{t('dash.reconStatus')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90}>
                {pieData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="muted text-center">
            {t('dash.ordersInPeriod', { count: formatCount(view.kpis.orders) })}
          </p>
        </article>
      </div>

      <div className="grid-2 mt-12">
        <article className="card">
          <div className="card-head">
            <h2>{t('dash.queue')}</h2>
            <Link className="linkish" to="/divergencias">
              {t('dash.seeAll')}
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('dash.case')}</th>
                  <th>{t('dash.cause')}</th>
                  <th>{t('dash.amount')}</th>
                  <th>{t('dash.status')}</th>
                </tr>
              </thead>
              <tbody>
                {view.actionQueue.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link className="linkish" to={`/divergencias/${item.id}`}>
                        {item.id}
                      </Link>
                    </td>
                    <td>{item.description.slice(0, 48)}…</td>
                    <td>{formatBRL(item.amount)}</td>
                    <td>
                      <StatusBadge kind="case" value={item.status} />
                    </td>
                  </tr>
                ))}
                {view.actionQueue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      {t('dash.noOpen')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
        <div className="stack">
          <article className="card">
            <h2>{t('dash.exposure')}</h2>
            <p>
              {t('dash.recoverable')} <strong>{formatBRL(view.recoverable)}</strong>
            </p>
            <p>
              {t('dash.confirmedLoss')} <strong>{formatBRL(view.confirmedLoss)}</strong>
            </p>
            <p>
              {t('dash.awaiting')} <strong>{formatBRL(view.kpis.pendingSettlement)}</strong>
            </p>
            <p className="muted">{t('dash.pendingInvoices', { count: view.kpis.pendingInvoices })}</p>
          </article>
          <article className="card">
            <h2>{t('dash.topCauses')}</h2>
            <div className="bars">
              {view.causes.map((item) => (
                <div className="bar-row" key={item.cause}>
                  <span>{item.cause}</span>
                  <div className="bar-track">
                    <BarFill pct={item.pct} />
                  </div>
                  <strong>{formatBRL(item.value)}</strong>
                </div>
              ))}
              {view.causes.length === 0 && <p className="muted">{t('dash.noCauses')}</p>}
            </div>
          </article>
          <article className="card">
            <h2>{t('dash.upcoming')}</h2>
            {view.upcomingPayouts.map((item) => (
              <p key={item.id}>
                {item.id} · {formatBRL(item.netAmount)}
              </p>
            ))}
            {view.upcomingPayouts.length === 0 && <p className="muted">{t('dash.noPayouts')}</p>}
          </article>
        </div>
      </div>
    </section>
  )
}
