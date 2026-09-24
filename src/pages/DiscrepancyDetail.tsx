import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { parseComponents } from '../api/client'
import { useApi } from '../api/hooks'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { t, type MessageKey } from '../i18n/locale'
import { causeLabel, formatBRL, formatDateTime } from '../lib/format'
import type { CalculationSnapshot, Comment, ReconciliationCase, TimelineEvent } from '../types'

type CaseDetail = ReconciliationCase & {
  comments?: Comment[]
  timeline?: TimelineEvent[]
  calculation?: CalculationSnapshot & { components?: unknown }
}

export function DiscrepancyDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const { cases, comments, snapshots, timelines, updateCaseStatus, addComment, reprocessCase } = useAppState()
  const { data, error, loading } = useApi<CaseDetail>(session && id ? `/cases/${id}` : null)
  const item = data ?? cases.find((row) => row.id === id)
  const [tab, setTab] = useState('resumo')
  const [text, setText] = useState('')

  if (loading && !item) return <p className="muted">{t('cases.loading')}</p>
  if (!item) return <p className="muted">{error ?? t('cases.missing')}</p>

  const snapshot = data?.calculation
    ? {
        ...data.calculation,
        components: parseComponents(data.calculation.components),
      }
    : snapshots.find((row) => row.orderId === item.orderId)
  const timeline = data?.timeline ?? timelines[item.id] ?? []
  const caseComments = data?.comments ?? comments.filter((row) => row.caseId === item.id)

  return (
    <section>
      <PageHeader title={item.id} subtitle={causeLabel(item.cause)} showPeriod={false}>
        <button type="button" className="btn" onClick={() => updateCaseStatus(item.id, 'em_analise')}>
          {t('cases.mark')}
        </button>
        <button type="button" className="btn-primary btn" onClick={() => updateCaseStatus(item.id, 'resolvida')}>
          {t('cases.resolve')}
        </button>
        <button type="button" className="btn-danger btn" onClick={() => updateCaseStatus(item.id, 'ignorada')}>
          {t('cases.ignore')}
        </button>
      </PageHeader>

      <div className="grid-2">
        <article className="card">
          <h2>{t('cases.summary')}</h2>
          <p>{t('cases.opened')} {formatDateTime(item.openedAt)}</p>
          <p>
            Status: <StatusBadge kind="case" value={item.status} /> · Impacto:{' '}
            <StatusBadge kind="impact" value={item.impact} />
          </p>
          <p>{t('cases.owner')}: {item.owner}</p>
          <p>{t('cases.confidence')}: {(Number(item.confidence) * 100).toFixed(0)}%</p>
          <p className="muted">{item.description}</p>
        </article>
        <article className="card">
          <h2>{t('cases.evidence')}</h2>
          <p>
            {t('cases.order')}:{' '}
            <Link className="linkish" to={`/pedidos/${item.orderId}`}>
              {item.orderId}
            </Link>
          </p>
          <p>{t('cases.payment')}: {item.paymentId ?? '—'}</p>
          <p>Settlement: {item.settlementId ?? '—'}</p>
          <p>{t('cases.payout')}: {item.payoutId ?? '—'}</p>
          <p>{t('cases.invoice')}: {item.invoiceId ?? t('cases.absent')}</p>
        </article>
      </div>

      <article className="card mt-12">
        <div className="tabs">
          {['resumo', 'calculo', 'timeline', 'comentarios'].map((name) => (
            <button key={name} type="button" className={`tab${tab === name ? ' active' : ''}`} onClick={() => setTab(name)}>
              {t(`cases.tab.${name}` as MessageKey)}
            </button>
          ))}
        </div>

        {tab === 'resumo' && (
          <div>
            <div className="compare">
              <div className="compare-box">
                <span className="muted">{t('cases.expected')}</span>
                <strong>{formatBRL(snapshot?.expected ?? item.amount)}</strong>
              </div>
              <div className="compare-box">
                <span className="muted">{t('cases.received')}</span>
                <strong>{formatBRL(snapshot?.actual ?? 0)}</strong>
                <div className="diff">{t('cases.diff')} {formatBRL(snapshot?.difference ?? item.amount)}</div>
              </div>
            </div>
            <div className="alert danger mt-12">
              {t('cases.analysis')}: {item.description}
            </div>
            <p className="mt-12">
              <strong>{t('cases.action')}:</strong> {item.suggestedAction}
            </p>
            <ul className="list-plain">
              <li>{t('cases.hint1')}</li>
              <li>{t('cases.hint2')}</li>
              <li>{t('cases.hint3')}</li>
            </ul>
          </div>
        )}

        {tab === 'calculo' && (
          <div>
            {snapshot ? (
              <>
                <p>{t('cases.reproducible', { version: snapshot.version })}</p>
                <p>Gross {formatBRL(snapshot.gross)}</p>
                {snapshot.components.map((row) => (
                  <p key={row.label}>
                    {row.label}: {formatBRL(row.amount)}
                  </p>
                ))}
                <p>
                  Expected {formatBRL(snapshot.expected)} · {t('cases.receivedShort')} {formatBRL(snapshot.actual)} · {t('cases.diff')}{' '}
                  <strong>{formatBRL(snapshot.difference)}</strong>
                </p>
              </>
            ) : (
              <p className="muted">{t('cases.noSnapshot')}</p>
            )}
          </div>
        )}

        {tab === 'timeline' && (
          <div className="timeline">
            {timeline.map((event) => (
              <div className="tl-item" key={event.id}>
                <div className="tl-rail">
                  <div className={`tl-dot ${event.tone}`} />
                </div>
                <div className="tl-body">
                  <time>{formatDateTime(event.at)}</time>
                  <strong>{event.title}</strong>
                  <p>{event.detail}</p>
                </div>
              </div>
            ))}
            {timeline.length === 0 && <p className="muted">{t('cases.noTimeline')}</p>}
          </div>
        )}

        {tab === 'comentarios' && (
          <div>
            {caseComments.map((comment) => (
              <div className="comment" key={comment.id}>
                <strong>
                  {comment.author} · {formatDateTime(comment.at)}
                </strong>
                <p>{comment.text}</p>
              </div>
            ))}
            <div className="toolbar mt-16">
              <input className="field" placeholder={t('cases.comment')} value={text} onChange={(e) => setText(e.target.value)} />
              <button
                type="button"
                className="btn-primary btn"
                onClick={() => {
                  if (!text.trim()) return
                  addComment(item.id, text.trim())
                  setText('')
                }}
              >
                {t('cases.commentBtn')}
              </button>
              <button type="button" className="btn" onClick={() => reprocessCase(item.id)}>
                {t('cases.reprocess')}
              </button>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
