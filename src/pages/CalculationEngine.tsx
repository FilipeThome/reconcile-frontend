import { useState } from 'react'
import { BarFill } from '../components/BarFill'
import { KpiCard } from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../context/AppState'
import { t } from '../i18n/locale'
import { formatBRL, formatCount } from '../lib/format'

export function CalculationEngine() {
  const [tab, setTab] = useState('calculos')
  const { engine, settings, snapshots } = useAppState()
  const example = engine?.example ?? snapshots[0]
  const components = engine?.components ?? []
  const tolerances = engine?.tolerances ?? settings?.tolerances

  return (
    <section>
      <PageHeader
        title={t('engine.title')}
        subtitle={t('engine.subtitle')}
      />
      <div className="grid-4 mb-16">
        <KpiCard label={t('engine.calcs')} value={formatCount(engine?.calculations ?? snapshots.length)} />
        <KpiCard label={t('engine.adjustments')} value={String(components.length)} />
        <KpiCard label={t('engine.version')} value={engine?.version ?? 'sce-v1.4'} />
        <KpiCard label={t('engine.tolerance')} value={formatBRL(Number(tolerances?.cents ?? 0.05))} />
      </div>
      <div className="tabs">
        {['calculos', 'componentes', 'config'].map((item) => (
          <button key={item} type="button" className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
            {item === 'calculos' ? t('engine.tab.calculos') : item === 'componentes' ? t('engine.tab.componentes') : t('engine.tab.config')}
          </button>
        ))}
      </div>
      {tab === 'calculos' && (
        <div className="grid-2">
          <article className="card">
            {example ? (
              <>
                <h2>{t('engine.example', { id: example.orderId })}</h2>
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
                <p className="muted">{t('engine.fromSnapshot')}</p>
              </>
            ) : (
              <>
                <h2>{t('engine.exampleEmpty')}</h2>
                <p className="muted">{t('engine.noSnapshot')}</p>
              </>
            )}
          </article>
          <article className="card">
            <h2>{t('engine.layers')}</h2>
            <ol className="list-plain">
              {(engine?.layers ?? ['ORDER_PAYMENT', 'PAYMENT_SETTLEMENT', 'SETTLEMENT_PAYOUT', 'ORDER_INVOICE', 'CASE_CONSISTENCY']).map(
                (layer) => (
                  <li key={layer}>{layer.replaceAll('_', ' ')}</li>
                ),
              )}
            </ol>
            <p className="muted">{t('engine.layersHint')}</p>
          </article>
        </div>
      )}
      {tab === 'componentes' && (
        <article className="card">
          <h2>{t('engine.components')}</h2>
          <div className="bars">
            {components.map((item) => (
              <div className="bar-row" key={item.label}>
                <span>{item.label}</span>
                <div className="bar-track">
                  <BarFill pct={item.pct} />
                </div>
                <strong>{formatBRL(item.amount)}</strong>
              </div>
            ))}
            {components.length === 0 && <p className="muted">{t('engine.noComponents')}</p>}
          </div>
        </article>
      )}
      {tab === 'config' && (
        <article className="card">
          <h2>{t('engine.params')}</h2>
          <p>{t('engine.window', { days: tolerances?.settlementDeadlineDays ?? 14 })}</p>
          <p>{t('engine.moneyTolerance', { value: formatBRL(Number(tolerances?.cents ?? 0.05)) })}</p>
          <p>{t('engine.dateTolerance', { days: tolerances?.dateDays ?? 2 })}</p>
          <p>{t('engine.freight')}</p>
          <p className="muted">{t('engine.ai')}</p>
        </article>
      )}
    </section>
  )
}
