import { useNavigate } from 'react-router-dom'
import { BarFill } from '../components/BarFill'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { t } from '../i18n/locale'
import { formatBRL, formatCount } from '../lib/format'

export function Closings() {
  const { closings } = useAppState()
  const navigate = useNavigate()
  return (
    <section>
      <PageHeader title={t('clo.title')} subtitle={t('clo.subtitle')} />
      <div className="closing-grid">
        {closings.map((item) => {
          const pct = item.expected === 0 ? 0 : Math.min(100, (item.received / item.expected) * 100)
          return (
            <article key={item.id} className="closing-card" onClick={() => navigate(`/fechamentos/${item.id}`)}>
              <div className="card-head">
                <h3>{item.label}</h3>
                <StatusBadge kind="closing" value={item.status} />
              </div>
              <p className="muted">{t('clo.orders', { count: formatCount(item.orders) })}</p>
              <p>{t('clo.expected')} {formatBRL(item.expected)}</p>
              <p>{t('clo.received')} {formatBRL(item.received)}</p>
              <p>{t('clo.openDiff')} {formatBRL(item.openDiff)}</p>
              <div className="progress">
                <BarFill pct={pct} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
