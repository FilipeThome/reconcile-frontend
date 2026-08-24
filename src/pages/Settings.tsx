import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { formatBRL } from '../lib/format'

export function Settings() {
  const { session } = useAuth()
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
      <PageHeader title="Configurações" subtitle="RBAC básico, tenant único do piloto e tolerâncias do motor." showPeriod={false} />
      <div className="grid-2">
        <article className="card">
          <h2>Tenant</h2>
          <p>{tenantView?.name ?? '—'}</p>
          <p>ID: {tenantView?.id ?? session?.tenantId ?? '—'}</p>
          <p>Seller Mercado Livre: {tenantView?.sellerId ?? '—'}</p>
          <p>
            Usuário atual: {me} ({email})
          </p>
        </article>
        <article className="card">
          <h2>Tolerâncias</h2>
          <p>Centavos: {formatBRL(Number(tolerances.cents))}</p>
          <p>Janela de data: {tolerances.dateDays} dias</p>
          <p>Settlement deadline: {tolerances.settlementDeadlineDays} dias</p>
          <p>Retenção de raw events: {tolerances.rawEventRetentionDays} dias</p>
        </article>
      </div>
      <article className="card mt-12">
        <h2>Usuários e papéis</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user) => (
              <tr key={user.email}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <StatusBadge kind="plain" value={user.role === 'admin' ? 'ativa' : 'disponivel'} /> {user.role}
                </td>
              </tr>
            ))}
            {userList.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  Nenhum usuário carregado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </article>
    </section>
  )
}
