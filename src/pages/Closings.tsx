import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { formatBRL } from '../lib/format'

export function Closings() {
  const { closings } = useAppState()
  const navigate = useNavigate()
  return (
    <section>
      <PageHeader title="Fechamentos" subtitle="Ciclo OPEN → CLOSED. Depois de fechado, eventos tardios geram delta auditável." />
      <div className="closing-grid">
        {closings.map((item) => {
          const pct = item.expected === 0 ? 0 : Math.min(100, (item.received / item.expected) * 100)
          return (
            <article key={item.id} className="closing-card" onClick={() => navigate(`/fechamentos/${item.id}`)}>
              <div className="card-head">
                <h3>{item.label}</h3>
                <StatusBadge kind="closing" value={item.status} />
              </div>
              <p className="muted">{item.orders.toLocaleString('pt-BR')} pedidos</p>
              <p>Esperado {formatBRL(item.expected)}</p>
              <p>Recebido {formatBRL(item.received)}</p>
              <p>Diferença aberta {formatBRL(item.openDiff)}</p>
              <div className="progress">
                <span style={{ width: `${pct}%` }} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
