import { CalendarRange, RefreshCw, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useAppState } from '../context/AppState'
import { useFilters } from '../context/FilterContext'
import { useLocale } from '../context/LocaleContext'
import { countActiveFilters, GATEWAYS, MARKETPLACES, PERIOD_PRESETS } from '../lib/filters'
import type { MessageKey } from '../i18n/locale'

type Props = {
  title: string
  subtitle?: string
  children?: ReactNode
  showPeriod?: boolean
}

export function PageHeader({ title, subtitle, children, showPeriod = true }: Props) {
  const { showToast } = useAppState()
  const { t } = useLocale()
  const { filters, draft, periodLabel, panelOpen, setDraft, applyDraft, resetFilters, openPanel, closePanel, refresh } =
    useFilters()
  const extra = countActiveFilters(filters)

  useEffect(() => {
    if (!panelOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closePanel, panelOpen])

  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        {showPeriod && (
          <div className="filter-anchor">
            <button
              type="button"
              className={`chip chip-button${panelOpen ? ' btn-active' : ''}`}
              onClick={panelOpen ? closePanel : openPanel}
              aria-expanded={panelOpen}
              aria-haspopup="dialog"
            >
              <CalendarRange size={14} />
              {periodLabel}
              {extra > 0 && <span className="chip-count">{extra}</span>}
            </button>
            {panelOpen && (
              <>
                <button type="button" className="filter-backdrop" aria-label={t('filter.close')} onClick={closePanel} />
                <div className="filter-panel" role="dialog" aria-label={t('filter.title')}>
                  <div className="card-head">
                    <h3>{t('filter.title')}</h3>
                    <button type="button" className="btn-ghost btn" onClick={closePanel} aria-label={t('filter.dismiss')}>
                      <X size={14} />
                    </button>
                  </div>
                <label className="filter-field">
                  <span>{t('filter.period')}</span>
                  <select
                    className="select"
                    aria-label={t('filter.period')}
                    value={PERIOD_PRESETS.find((item) => item.from === draft.from && item.to === draft.to)?.id ?? 'custom'}
                    onChange={(event) => {
                      const preset = PERIOD_PRESETS.find((item) => item.id === event.target.value)
                      if (!preset) return
                      setDraft((current) => ({ ...current, from: preset.from, to: preset.to }))
                    }}
                  >
                    {PERIOD_PRESETS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {t(`period.${item.id}` as MessageKey)}
                      </option>
                    ))}
                    <option value="custom">{t('filter.custom')}</option>
                  </select>
                </label>
                <div className="filter-dates">
                  <label className="filter-field">
                    <span>{t('filter.from')}</span>
                    <input
                      className="field"
                      type="date"
                      value={draft.from}
                      onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
                    />
                  </label>
                  <label className="filter-field">
                    <span>{t('filter.to')}</span>
                    <input
                      className="field"
                      type="date"
                      value={draft.to}
                      onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
                    />
                  </label>
                </div>
                <label className="filter-field">
                  <span>{t('filter.marketplace')}</span>
                  <select
                    className="select"
                    aria-label={t('filter.marketplace')}
                    value={draft.marketplace}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, marketplace: event.target.value as typeof current.marketplace }))
                    }
                  >
                    <option value="">{t('filter.all')}</option>
                    {MARKETPLACES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="filter-field">
                  <span>{t('filter.gateway')}</span>
                  <select
                    className="select"
                    aria-label={t('filter.gateway')}
                    value={draft.gateway}
                    onChange={(event) => setDraft((current) => ({ ...current, gateway: event.target.value as typeof current.gateway }))}
                  >
                    <option value="">{t('filter.all')}</option>
                    {GATEWAYS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="row-actions">
                  <button type="button" className="btn-primary btn" onClick={applyDraft}>
                    {t('filter.apply')}
                  </button>
                  <button type="button" className="btn" onClick={resetFilters}>
                    {t('filter.clear')}
                  </button>
                </div>
                </div>
              </>
            )}
          </div>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => {
            refresh()
            showToast(t('filter.refreshed'))
          }}
        >
          <RefreshCw size={14} />
          {t('filter.refresh')}
        </button>
        {children}
      </div>
    </header>
  )
}
