import { Link } from 'react-router-dom'
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { causeBreakdown, dailySeries, kpis, payouts } from '../data/mock'
import { formatBRL } from '../lib/format'

const pieData = [
  { name: 'Reconciliado', value: kpis.reconciledPct, color: '#16a34a' },
  { name: 'Divergência', value: kpis.divergentPct, color: '#f59e0b' },
  { name: 'Pendente', value: kpis.pendingPct, color: '#94a3b8' },
]

export function Dashboard() {
  const { cases } = useAppState()
  const openCases = cases.filter((item) => item.status === 'aberta' || item.status === 'em_analise')
  const upcoming = payouts.filter((item) => item.status === 'previsto')

  return (
    <section>
      <PageHeader
        title="Visão Geral"
        subtitle="Quanto está em divergência, o que exige ação hoje e o que impede o fechamento de maio."
      />

      <div className="kpi-grid">
        <KpiCard label="Vendas brutas" value={formatBRL(kpis.gross)} delta={kpis.vsGross} />
        <KpiCard label="Valor esperado (líquido)" value={formatBRL(kpis.expected)} delta={kpis.vsExpected} />
        <KpiCard label="Valor recebido" value={formatBRL(kpis.received)} delta={kpis.vsReceived} />
        <KpiCard label="Em divergência" value={formatBRL(kpis.divergence)} delta={kpis.vsDivergence} tone="warning" />
        <KpiCard label="Perda confirmada" value={formatBRL(kpis.confirmedLoss)} delta={kpis.vsLoss} tone="danger" />
      </div>

      <div className="grid-2">
        <article className="card">
          <h2>Evolução diária</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailySeries}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => formatBRL(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="esperado" name="Esperado" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="recebido" name="Recebido" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="divergencia" name="Divergência" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
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
            {kpis.orders.toLocaleString('pt-BR')} pedidos no período
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
                {openCases.slice(0, 5).map((item) => (
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
              </tbody>
            </table>
          </div>
        </article>
        <div className="stack">
          <article className="card">
            <h2>Exposição financeira</h2>
            <p>
              Recuperável <strong>{formatBRL(kpis.recoverable)}</strong>
            </p>
            <p>
              Perda confirmada <strong>{formatBRL(kpis.confirmedLoss)}</strong>
            </p>
            <p>
              Aguardando liquidação <strong>{formatBRL(kpis.pendingSettlement)}</strong>
            </p>
            <p className="muted">{kpis.pendingInvoices} notas pendentes impedem o fechamento fiscal do mês.</p>
          </article>
          <article className="card">
            <h2>Principais causas</h2>
            <div className="bars">
              {causeBreakdown.map((item) => (
                <div className="bar-row" key={item.cause}>
                  <span>{item.cause}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                  <strong>{formatBRL(item.value)}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="card">
            <h2>Próximos repasses previstos</h2>
            {upcoming.map((item) => (
              <p key={item.id}>
                {item.id} · {formatBRL(item.netAmount)}
              </p>
            ))}
          </article>
        </div>
      </div>
    </section>
  )
}
