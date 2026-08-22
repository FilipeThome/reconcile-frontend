import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { downloadCsv } from '../lib/format'

const reports = [
  { id: 'fin', title: 'Resumo financeiro', desc: 'Bruto, líquido esperado, recebido e diferença por marketplace.' },
  { id: 'div', title: 'Divergências em aberto', desc: 'Fila operacional com causa, impacto e responsável.' },
  { id: 'fee', title: 'Tarifas e custos', desc: 'Decomposição de comissão, frete, pagamento e retenções.' },
  { id: 'pay', title: 'Repasses do período', desc: 'Lotes de payout com pedidos vinculados.' },
  { id: 'clo', title: 'Fechamento mensal', desc: 'Snapshot OPEN/CLOSED para o contador.' },
  { id: 'fis', title: 'Fiscal', desc: 'Documentos, chaves, CBS/IBS e pendências de emissão.' },
]

export function Reports() {
  const [tab, setTab] = useState('relatorios')
  const { showToast } = useAppState()

  return (
    <section>
      <PageHeader title="Relatórios" subtitle="Exportação inicial em CSV padronizado para o escritório contábil." />
      <div className="tabs">
        {['relatorios', 'agendamentos', 'historico'].map((item) => (
          <button key={item} type="button" className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'relatorios' && (
        <div className="report-grid">
          {reports.map((item) => (
            <article className="report-card" key={item.id}>
              <h3>{item.title}</h3>
              <p className="muted">{item.desc}</p>
              <button
                type="button"
                className="btn-primary btn"
                style={{ marginTop: 12 }}
                onClick={() => {
                  downloadCsv(`${item.id}.csv`, [
                    ['relatorio', 'periodo', 'status'],
                    [item.title, '2026-05', 'prototipo'],
                  ])
                  showToast('CSV gerado localmente. Sem fila de reporting ainda.')
                }}
              >
                Gerar
              </button>
            </article>
          ))}
        </div>
      )}
      {tab === 'agendamentos' && (
        <article className="card">
          <p>Todo dia 2, enviar fechamento do mês anterior para carla@contabilparceiro.com.br.</p>
          <p className="muted">Agendamento é visual neste protótipo.</p>
        </article>
      )}
      {tab === 'historico' && (
        <article className="card">
          <p>03/05/2026 · fechamento-2026-04.csv · gerado por Ana Dantas</p>
          <p>21/05/2026 · divergencias-abertas.csv · gerado por Fernando Soller</p>
        </article>
      )}
    </section>
  )
}
