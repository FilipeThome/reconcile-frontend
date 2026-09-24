import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { t } from '../i18n/locale'

export function Rules() {
  const { rules, toggleRule } = useAppState()
  return (
    <section>
      <PageHeader title={t('rules.title')} subtitle={t('rules.subtitle')} />
      <article className="card">
        <table>
          <thead>
            <tr>
              <th>{t('rules.rule')}</th>
              <th>{t('rules.description')}</th>
              <th>{t('rules.type')}</th>
              <th>{t('common.status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td className="cell-wrap">{rule.description}</td>
                <td>{rule.type}</td>
                <td>
                  <StatusBadge kind="plain" value={rule.active ? 'ativa' : 'disponivel'} />
                </td>
                <td>
                  <button type="button" className={`switch${rule.active ? ' on' : ''}`} onClick={() => toggleRule(rule.id)}>
                    <i />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  )
}
