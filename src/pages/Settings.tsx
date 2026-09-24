import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitch, useLocale } from '../context/LocaleContext'
import { displayRole, formatBRL } from '../lib/format'

export function Settings() {
  const { session } = useAuth()
  const { t } = useLocale()
  const { settings } = useAppState()
  const tenantView = settings?.tenant
  const userList = settings?.users ?? []
  const tolerances = settings?.tolerances ?? {
    cents: 0.05,
    dateDays: 2,
    settlementDeadlineDays: 14,
    rawEventRetentionDays: 180,
  }
  const me = settings?.currentUser?.name ?? session?.name ?? '—'
  const email = settings?.currentUser?.email ?? userList.find((item) => item.name === session?.name)?.email ?? '—'

  return (
    <section>
      <PageHeader title={t('set.title')} subtitle={t('set.subtitle')} showPeriod={false} />
      <article className="card mb-16">
        <h2>{t('set.language')}</h2>
        <p className="muted">{t('set.languageHint')}</p>
        <LanguageSwitch />
      </article>
      <div className="grid-2">
        <article className="card">
          <h2>{t('nav.tenant')}</h2>
          <p>{tenantView?.name ?? '—'}</p>
          <p>ID: {tenantView?.id ?? session?.tenantId ?? '—'}</p>
          <p>{t('set.seller')}: {tenantView?.sellerId ?? '—'}</p>
          <p>
            {t('set.current')}: {me} ({email})
          </p>
        </article>
        <article className="card">
          <h2>{t('set.tolerances')}</h2>
          <p>{t('set.cents')}: {formatBRL(Number(tolerances.cents))}</p>
          <p>{t('set.dateWindow')}: {tolerances.dateDays} {t('set.days')}</p>
          <p>{t('set.deadline')}: {tolerances.settlementDeadlineDays} {t('set.days')}</p>
          <p>{t('set.retention')}: {tolerances.rawEventRetentionDays} {t('set.days')}</p>
        </article>
      </div>
      <article className="card mt-12">
        <h2>{t('set.users')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('set.name')}</th>
              <th>{t('set.email')}</th>
              <th>{t('set.role')}</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user) => (
              <tr key={user.email}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <StatusBadge kind="plain" value={user.role === 'admin' ? 'ativa' : 'disponivel'} /> {displayRole(user.role)}
                </td>
              </tr>
            ))}
            {userList.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  {t('set.noUsers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </article>
    </section>
  )
}
