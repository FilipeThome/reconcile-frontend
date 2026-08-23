import { useState } from 'react'
import { api } from '../api/client'
import { useApi } from '../api/hooks'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { downloadCsv } from '../lib/format'

const reports = [
  { id: 'fin', title: 'Resumo financeiro', desc: 'Bruto, líquido esperado, recebido e diferença por marketplace.' },
  { id: 'div', title: 'Divergências em aberto', desc: 'Fila operacional com causa, impacto e responsável.' },
  { id: 'fee', title: 'Tarifas e custos', desc: 'Decomposição de comissão, frete, pagamento e retenções.' },
  { id: 'pay', title: 'Repasses do período', desc: 'Lotes de payout com pedidos vinculados.' },
  { id: 'clo', title: 'Fechamento mensal', desc: 'Snapshot OPEN/CLOSED para o contador.' },
  { id: 'fis', title: 'Fiscal', desc: 'Documentos, chaves, CBS/IBS e pendências de emissão.' },
]

type ReportHistory = { type: string; filename: string; createdBy: string; createdAt: string }

export function Reports() {
  const [tab, setTab] = useState('relatorios')
  const { showToast } = useAppState()
  const { session } = useAuth()
  const { data: history } = useApi<ReportHistory[]>(session ? '/reports' : null)

  const generate = async (item: (typeof reports)[number]) => {
    try {
      const csv = await api<string>(`/reports/${item.id}/export`, { method: 'POST' })
      downloadCsv(`${item.id}.csv`, csv.split('\n').map((line) => line.split(';')))
      showToast(`Relatório ${item.title} gerado pelo backend.`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao exportar')
    }
  }

  return (
    <section>
      <PageHeader title="Relatórios" subtitle="Exportação em CSV para o recorte selecionado no filtro global." />
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
              <button type="button" className="btn-primary btn" style={{ marginTop: 12 }} onClick={() => void generate(item)}>
                Gerar
              </button>
            </article>
          ))}
        </div>
      )}
      {tab === 'agendamentos' && (
        <article className="card">
          <p>Todo dia 2, enviar fechamento do mês anterior para carla@contabilparceiro.com.br.</p>
          <p className="muted">O agendamento continua visual; a geração usa o recorte atual do filtro.</p>
        </article>
      )}
      {tab === 'historico' && (
        <article className="card">
          {(history ?? []).map((item) => (
            <p key={`${item.filename}-${item.createdAt}`}>
              {item.createdAt.slice(0, 10)} · {item.filename} · gerado por {item.createdBy}
            </p>
          ))}
          {!history?.length && <p className="muted">Nenhum relatório gerado ainda.</p>}
        </article>
      )}
    </section>
  )
}
