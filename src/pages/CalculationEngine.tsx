import { useState } from 'react'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { engineComponents, snapshots } from '../data/mock'
import { formatBRL } from '../lib/format'

export function CalculationEngine() {
  const [tab, setTab] = useState('calculos')
  const example = snapshots[0]

  return (
    <section>
      <PageHeader
        title="Motor de cálculo"
        subtitle="Determinístico, versionado e explicável. Cada reconciliação guarda um snapshot reproduzível."
      />
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard label="Cálculos no período" value="12.684" />
        <KpiCard label="Ajustes identificados" value="1.024" />
        <KpiCard label="Versão ativa" value="sce-v1.4" />
        <KpiCard label="Tolerância de centavos" value="R$ 0,05" />
      </div>
      <div className="tabs">
        {['calculos', 'componentes', 'config'].map((item) => (
          <button key={item} type="button" className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
            {item === 'calculos' ? 'Cálculos' : item === 'componentes' ? 'Componentes' : 'Configurações'}
          </button>
        ))}
      </div>
      {tab === 'calculos' && (
        <div className="grid-2">
          <article className="card">
            <h2>Exemplo operacional — {example.orderId}</h2>
            <p>Gross {formatBRL(example.gross)}</p>
            {example.components.map((item) => (
              <p key={item.label}>
                {item.label}: {formatBRL(item.amount)}
              </p>
            ))}
            <p>
              Expected settlement: <strong>{formatBRL(example.expected)}</strong>
            </p>
            <p>Recebido: {formatBRL(example.actual)}</p>
            <p className="muted">Se o recebido for R$ 812,31, a divergência seria R$ 30,00 com decomposição visível.</p>
          </article>
          <article className="card">
            <h2>Camadas de matching</h2>
            <ol className="list-plain">
              <li>Order versus Payment</li>
              <li>Payment versus Settlement</li>
              <li>Settlement versus Payout</li>
              <li>Order versus Invoice</li>
              <li>Consistência global do caso</li>
            </ol>
            <p className="muted">Match determinístico primeiro. Score probabilístico só apoia revisão manual.</p>
          </article>
        </div>
      )}
      {tab === 'componentes' && (
        <article className="card">
          <h2>Componentes do período</h2>
          <div className="bars">
            {engineComponents.map((item) => (
              <div className="bar-row" key={item.label}>
                <span>{item.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${item.pct}%` }} />
                </div>
                <strong>{formatBRL(item.amount)}</strong>
              </div>
            ))}
          </div>
        </article>
      )}
      {tab === 'config' && (
        <article className="card">
          <h2>Parâmetros do MVP</h2>
          <p>Janela de liquidação padrão: 14 dias</p>
          <p>Tolerância financeira: R$ 0,05</p>
          <p>Tolerância de data: 2 dias</p>
          <p>Frete e arredondamento: não ocultam diferença material</p>
          <p className="muted">IA pode classificar e resumir, mas não decide reconciliação financeira.</p>
        </article>
      )}
    </section>
  )
}
