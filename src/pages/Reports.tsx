import { useState } from 'react'
import { api } from '../api/client'
import { useApi } from '../api/hooks'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { t, type MessageKey } from '../i18n/locale'
import { downloadCsv } from '../lib/format'

const reports = [
  { id: 'fin', title: 'rep.fin', desc: 'rep.finDesc' },
  { id: 'div', title: 'rep.div', desc: 'rep.divDesc' },
  { id: 'fee', title: 'rep.fee', desc: 'rep.feeDesc' },
  { id: 'pay', title: 'rep.pay', desc: 'rep.payDesc' },
  { id: 'clo', title: 'rep.clo', desc: 'rep.cloDesc' },
  { id: 'fis', title: 'rep.fis', desc: 'rep.fisDesc' },
] as const

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
      showToast(t('rep.generated', { title: t(item.title) }))
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('rep.exportFailed'))
    }
  }

  return (
    <section>
      <PageHeader title={t('rep.title')} subtitle={t('rep.subtitle')} />
      <div className="tabs">
        {(['relatorios', 'agendamentos', 'historico'] as const).map((item) => (
          <button key={item} type="button" className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
            {t(`rep.tab.${item}` as MessageKey)}
          </button>
        ))}
      </div>
      {tab === 'relatorios' && (
        <div className="report-grid">
          {reports.map((item) => (
            <article className="report-card" key={item.id}>
              <h3>{t(item.title)}</h3>
              <p className="muted">{t(item.desc)}</p>
              <button type="button" className="btn-primary btn mt-12" onClick={() => void generate(item)}>
                {t('rep.generate')}
              </button>
            </article>
          ))}
        </div>
      )}
      {tab === 'agendamentos' && (
        <article className="card">
          <p>{t('rep.schedule')}</p>
          <p className="muted">{t('rep.scheduleHint')}</p>
        </article>
      )}
      {tab === 'historico' && (
        <article className="card">
          {(history ?? []).map((item) => (
            <p key={`${item.filename}-${item.createdAt}`}>
              {item.createdAt.slice(0, 10)} · {item.filename} · {t('rep.by')} {item.createdBy}
            </p>
          ))}
          {!history?.length && <p className="muted">{t('rep.empty')}</p>}
        </article>
      )}
    </section>
  )
}
