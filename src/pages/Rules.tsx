import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'

export function Rules() {
  const { rules, toggleRule } = useAppState()
  return (
    <section>
      <PageHeader title="Regras de reconciliação" subtitle="As cinco regras prioritárias do piloto Mercado Livre + Mercado Pago + CSV." />
      <article className="card">
        <table>
          <thead>
            <tr>
              <th>Regra</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td style={{ whiteSpace: 'normal', maxWidth: 480 }}>{rule.description}</td>
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
