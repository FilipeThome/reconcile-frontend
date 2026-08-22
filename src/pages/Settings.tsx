import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { currentUser, tenant, users } from '../data/mock'

export function Settings() {
  return (
    <section>
      <PageHeader title="Configurações" subtitle="RBAC básico, tenant único do piloto e tolerâncias do motor." showPeriod={false} />
      <div className="grid-2">
        <article className="card">
          <h2>Tenant</h2>
          <p>{tenant.name}</p>
          <p>ID: {tenant.id}</p>
          <p>Seller Mercado Livre: {tenant.sellerId}</p>
          <p>Usuário atual: {currentUser.name} ({currentUser.email})</p>
        </article>
        <article className="card">
          <h2>Tolerâncias</h2>
          <p>Centavos: R$ 0,05</p>
          <p>Janela de data: 2 dias</p>
          <p>Settlement deadline: 14 dias</p>
          <p>Retenção de raw events: 180 dias</p>
        </article>
      </div>
      <article className="card" style={{ marginTop: 12 }}>
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
            {users.map((user) => (
              <tr key={user.email}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <StatusBadge kind="plain" value={user.role === 'admin' ? 'ativa' : 'disponivel'} /> {user.role}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  )
}
