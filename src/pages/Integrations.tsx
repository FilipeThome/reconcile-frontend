import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { formatDateTime } from '../lib/format'

export function Integrations() {
  const { integrations, toggleIntegration, backfillIntegration } = useAppState()
  return (
    <section>
      <PageHeader
        title="Integrações"
        subtitle="Piloto: Mercado Livre + Mercado Pago + CSV. Shopee entra com dados de junho para o filtro."
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
            <div className="row-actions mt-12">
              <button type="button" className="btn-primary btn" onClick={() => toggleIntegration(item.id)}>
                {item.status === 'ativa' ? 'Desconectar' : 'Conectar'}
              </button>
              <button type="button" className="btn" onClick={() => backfillIntegration(item.id)}>
                Backfill
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
