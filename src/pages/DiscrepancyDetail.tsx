import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { parseComponents } from '../api/client'
import { useApi } from '../api/hooks'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
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

  if (loading && !item) return <p className="muted">Carregando caso…</p>
  if (!item) return <p className="muted">{error ?? 'Caso não encontrado.'}</p>

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
          Marcar em análise
        </button>
        <button type="button" className="btn-primary btn" onClick={() => updateCaseStatus(item.id, 'resolvida')}>
          Resolver
        </button>
        <button type="button" className="btn-danger btn" onClick={() => updateCaseStatus(item.id, 'ignorada')}>
          Ignorar
        </button>
      </PageHeader>

      <div className="grid-2">
        <article className="card">
          <h2>Resumo</h2>
          <p>Aberta em {formatDateTime(item.openedAt)}</p>
          <p>
            Status: <StatusBadge kind="case" value={item.status} /> · Impacto:{' '}
            <StatusBadge kind="impact" value={item.impact} />
          </p>
          <p>Responsável: {item.owner}</p>
          <p>Confiança do matching: {(Number(item.confidence) * 100).toFixed(0)}%</p>
          <p className="muted">{item.description}</p>
        </article>
        <article className="card">
          <h2>Evidências vinculadas</h2>
          <p>
            Pedido:{' '}
            <Link className="linkish" to={`/pedidos/${item.orderId}`}>
              {item.orderId}
            </Link>
          </p>
          <p>Pagamento: {item.paymentId ?? '—'}</p>
          <p>Settlement: {item.settlementId ?? '—'}</p>
          <p>Payout: {item.payoutId ?? '—'}</p>
          <p>Documento fiscal: {item.invoiceId ?? 'ausente'}</p>
        </article>
      </div>

      <article className="card" style={{ marginTop: 12 }}>
        <div className="tabs">
          {['resumo', 'calculo', 'timeline', 'comentarios'].map((name) => (
            <button key={name} type="button" className={`tab${tab === name ? ' active' : ''}`} onClick={() => setTab(name)}>
              {name === 'calculo' ? 'Cálculo' : name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'resumo' && (
          <div>
            <div className="compare">
              <div className="compare-box">
                <span className="muted">Valor esperado</span>
                <strong>{formatBRL(snapshot?.expected ?? item.amount)}</strong>
              </div>
              <div className="compare-box">
                <span className="muted">Valor recebido</span>
                <strong>{formatBRL(snapshot?.actual ?? 0)}</strong>
                <div className="diff">Diferença {formatBRL(snapshot?.difference ?? item.amount)}</div>
              </div>
            </div>
            <div className="alert danger" style={{ marginTop: 12 }}>
              Análise do motor: {item.description}
            </div>
            <p style={{ marginTop: 12 }}>
              <strong>Ação sugerida:</strong> {item.suggestedAction}
            </p>
            <ul className="list-plain">
              <li>Conferir evidências de pedido, payment, settlement e payout.</li>
              <li>Não tratar ausência temporária de payout como perda antes do deadline.</li>
              <li>IA pode resumir, mas não decide a reconciliação financeira.</li>
            </ul>
          </div>
        )}

        {tab === 'calculo' && (
          <div>
            {snapshot ? (
              <>
                <p>Snapshot {snapshot.version} — reproduzível.</p>
                <p>Gross {formatBRL(snapshot.gross)}</p>
                {snapshot.components.map((row) => (
                  <p key={row.label}>
                    {row.label}: {formatBRL(row.amount)}
                  </p>
                ))}
                <p>
                  Expected {formatBRL(snapshot.expected)} · Recebido {formatBRL(snapshot.actual)} · Diferença{' '}
                  <strong>{formatBRL(snapshot.difference)}</strong>
                </p>
              </>
            ) : (
              <p className="muted">Este caso ainda não possui snapshot financeiro (pendência fiscal ou consistência).</p>
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
            {timeline.length === 0 && <p className="muted">Ainda não há eventos de timeline para este caso.</p>}
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
            <div className="toolbar" style={{ marginTop: 16 }}>
              <input className="field" placeholder="Adicionar comentário interno" value={text} onChange={(e) => setText(e.target.value)} />
              <button
                type="button"
                className="btn-primary btn"
                onClick={() => {
                  if (!text.trim()) return
                  addComment(item.id, text.trim())
                  setText('')
                }}
              >
                Comentar
              </button>
              <button type="button" className="btn" onClick={() => reprocessCase(item.id)}>
                Reprocessar caso
              </button>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
