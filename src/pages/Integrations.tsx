import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { formatDateTime } from '../lib/format'

export function Integrations() {
  const { integrations, toggleIntegration, showToast } = useAppState()
  return (
    <section>
      <PageHeader
        title="Integrações"
        subtitle="Piloto: Mercado Livre + Mercado Pago + CSV. Shopee e fiscal entram como expansão."
      />
      <div className="integration-grid">
        {integrations.map((item) => (
          <article className="integration-card" key={item.id}>
            <div className="card-head">
              <h3>{item.name}</h3>
              <StatusBadge kind="plain" value={item.status} />
            </div>
            <p className="muted">{item.detail}</p>
            <p className="muted">Última sync: {item.lastSync ? formatDateTime(item.lastSync) : 'nunca'}</p>
            <div className="row-actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn-primary btn" onClick={() => toggleIntegration(item.id)}>
                {item.status === 'ativa' ? 'Desconectar' : 'Conectar'}
              </button>
              <button type="button" className="btn" onClick={() => showToast('Backfill de 90 dias simulado.')}>
                Backfill
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
