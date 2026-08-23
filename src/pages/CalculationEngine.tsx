import { useState } from 'react'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { formatBRL } from '../lib/format'

export function CalculationEngine() {
  const [tab, setTab] = useState('calculos')
  const { engine, settings, snapshots } = useAppState()
  const example = engine?.example ?? snapshots[0]
  const components = engine?.components ?? []
  const tolerances = engine?.tolerances ?? settings?.tolerances

  return (
    <section>
      <PageHeader
        title="Motor de cálculo"
        subtitle="Determinístico, versionado e explicável. Cada reconciliação guarda um snapshot reproduzível."
      />
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard label="Cálculos no período" value={(engine?.calculations ?? snapshots.length).toLocaleString('pt-BR')} />
        <KpiCard label="Ajustes identificados" value={String(components.length)} />
        <KpiCard label="Versão ativa" value={engine?.version ?? 'sce-v1.4'} />
        <KpiCard label="Tolerância de centavos" value={formatBRL(Number(tolerances?.cents ?? 0.05))} />
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
            {example ? (
              <>
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
                <p className="muted">A decomposição acima vem do snapshot persistido no backend.</p>
              </>
            ) : (
              <>
                <h2>Exemplo operacional</h2>
                <p className="muted">Nenhum snapshot disponível neste workspace.</p>
              </>
            )}
          </article>
          <article className="card">
            <h2>Camadas de matching</h2>
            <ol className="list-plain">
              {(engine?.layers ?? ['ORDER_PAYMENT', 'PAYMENT_SETTLEMENT', 'SETTLEMENT_PAYOUT', 'ORDER_INVOICE', 'CASE_CONSISTENCY']).map(
                (layer) => (
                  <li key={layer}>{layer.replaceAll('_', ' ')}</li>
                ),
              )}
            </ol>
            <p className="muted">Match determinístico primeiro. Score probabilístico só apoia revisão manual.</p>
          </article>
        </div>
      )}
      {tab === 'componentes' && (
        <article className="card">
          <h2>Componentes do período</h2>
          <div className="bars">
            {components.map((item) => (
              <div className="bar-row" key={item.label}>
                <span>{item.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${item.pct}%` }} />
                </div>
                <strong>{formatBRL(item.amount)}</strong>
              </div>
            ))}
            {components.length === 0 && <p className="muted">Nenhum componente de tarifa no recorte.</p>}
          </div>
        </article>
      )}
      {tab === 'config' && (
        <article className="card">
          <h2>Parâmetros do MVP</h2>
          <p>Janela de liquidação padrão: {tolerances?.settlementDeadlineDays ?? 14} dias</p>
          <p>Tolerância financeira: {formatBRL(Number(tolerances?.cents ?? 0.05))}</p>
          <p>Tolerância de data: {tolerances?.dateDays ?? 2} dias</p>
          <p>Frete e arredondamento: não ocultam diferença material</p>
          <p className="muted">IA pode classificar e resumir, mas não decide reconciliação financeira.</p>
        </article>
      )}
    </section>
  )
}
