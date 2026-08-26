import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { formatDateTime } from '../lib/format'
import { oauthCallbackMessage } from '../lib/oauth'

export function Integrations() {
  const { integrations, toggleIntegration, backfillIntegration, showToast } = useAppState()
  const { refresh } = useFilters()
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const connected = params.get('connected')
    const error = params.get('oauth_error')
    if (!connected && !error) return
    const message = oauthCallbackMessage(connected, error)
    if (message) showToast(message)
    setParams({}, { replace: true })
  }, [params, setParams, showToast])

  return (
    <section>
      <PageHeader
        title="Integrações"
        subtitle="Conectar abre a página oficial de autorização: Mercado Livre (auth.mercadolivre.com.br) e Shopee (open.shopee.com.br/auth)."
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
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void backfillIntegration(item.id).then(() => refresh())
                }}
              >
                Backfill
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
