import { Link } from 'react-router-dom'
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { QueryStatus } from '../api/hooks'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { buildDashboard } from '../lib/dashboard'
import { formatBRL } from '../lib/format'

export function Dashboard() {
  const { cases, dashboard, error, invoices, loading, orders, payments, payouts } = useAppState()
  const { filters } = useFilters()
  const view =
    dashboard ??
    buildDashboard({ orders, cases, payments, payouts, invoices, filters })
  const pieData = [
    { name: 'Reconciliado', value: view.kpis.reconciledPct, color: '#16a34a' },
    { name: 'Divergência', value: view.kpis.divergentPct, color: '#f59e0b' },
    { name: 'Pendente', value: view.kpis.pendingPct, color: '#94a3b8' },
  ]

  return (
    <section>
      <PageHeader
        title="Visão Geral"
        subtitle={`Quanto está em divergência e o que exige ação no recorte ${view.periodLabel}.`}
      />
      <QueryStatus loading={loading} error={error} />

      <div className="kpi-grid">
        <KpiCard label="Vendas brutas" value={formatBRL(view.kpis.gross)} delta={view.kpis.vsGross} />
        <KpiCard label="Valor esperado (líquido)" value={formatBRL(view.kpis.expected)} delta={view.kpis.vsExpected} />
        <KpiCard label="Valor recebido" value={formatBRL(view.kpis.received)} delta={view.kpis.vsReceived} />
        <KpiCard label="Em divergência" value={formatBRL(view.kpis.divergence)} delta={view.kpis.vsDivergence} tone="warning" />
        <KpiCard label="Perda confirmada" value={formatBRL(view.kpis.confirmedLoss)} delta={view.kpis.vsLoss} tone="danger" />
      </div>

      <div className="grid-2">
        <article className="card">
          <h2>Evolução diária</h2>
          {view.dailySeries.length === 0 ? (
            <p className="muted">Nenhum pedido no recorte selecionado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={view.dailySeries}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatBRL(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="esperado" name="Esperado" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="recebido" name="Recebido" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="divergencia" name="Divergência" stroke="#dc2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </article>
        <article className="card">
          <h2>Status das reconciliações</h2>
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
          <p className="muted" style={{ textAlign: 'center' }}>
            {view.kpis.orders.toLocaleString('pt-BR')} pedidos no período
          </p>
        </article>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <article className="card">
          <div className="card-head">
            <h2>Fila que exige ação hoje</h2>
            <Link className="linkish" to="/divergencias">
              Ver todas
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Caso</th>
                  <th>Causa</th>
                  <th>Valor</th>
                  <th>Status</th>
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
                      Nenhuma divergência aberta neste recorte.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
        <div className="stack">
          <article className="card">
            <h2>Exposição financeira</h2>
            <p>
              Recuperável <strong>{formatBRL(view.recoverable)}</strong>
            </p>
            <p>
              Perda confirmada <strong>{formatBRL(view.confirmedLoss)}</strong>
            </p>
            <p>
              Aguardando liquidação <strong>{formatBRL(view.kpis.pendingSettlement)}</strong>
            </p>
            <p className="muted">{view.kpis.pendingInvoices} notas pendentes no recorte selecionado.</p>
          </article>
          <article className="card">
            <h2>Principais causas</h2>
            <div className="bars">
              {view.causes.map((item) => (
                <div className="bar-row" key={item.cause}>
                  <span>{item.cause}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                  <strong>{formatBRL(item.value)}</strong>
                </div>
              ))}
              {view.causes.length === 0 && <p className="muted">Sem causas no recorte.</p>}
            </div>
          </article>
          <article className="card">
            <h2>Próximos repasses previstos</h2>
            {view.upcomingPayouts.map((item) => (
              <p key={item.id}>
                {item.id} · {formatBRL(item.netAmount)}
              </p>
            ))}
            {view.upcomingPayouts.length === 0 && <p className="muted">Nenhum repasse previsto neste recorte.</p>}
          </article>
        </div>
      </div>
    </section>
  )
}
