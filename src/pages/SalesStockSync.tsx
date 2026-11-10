import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { QueryStatus, useApi } from '../api/hooks'
import { StatusBadge } from '../components/StatusBadge'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { formatDateTime } from '../lib/format'
import { SALES_PATH, SALES_REFRESH_MS, saleProviderName } from '../lib/sales'
import type { SaleAlert, SaleTarget } from '../types'

function targetResult(target: SaleTarget, fallback: string) {
  if (!target.ok) return target.message ?? fallback
  return `${target.before ?? '—'} → ${target.after ?? '—'}`
}

export function SalesStockSync({ refreshMs = SALES_REFRESH_MS }: { refreshMs?: number }) {
  const { t } = useLocale()
  const { showToast } = useAppState()
  const { session } = useAuth()
  const role = session?.role?.toLowerCase()
  const canEdit = role === 'admin' || role === 'operador'
  const { data, loading, error, reload } = useApi<SaleAlert[]>(SALES_PATH)
  const [sku, setSku] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(reload, refreshMs)
    return () => window.clearInterval(timer)
  }, [refreshMs, reload])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextSku = sku.trim()
    const rawQuantity = quantity.trim()
    if (!nextSku || !/^\d+$/.test(rawQuantity) || Number(rawQuantity) < 1) {
      showToast(t('sales.invalid'))
      return
    }
    setSaving(true)
    try {
      await api<SaleAlert[]>(SALES_PATH, {
        method: 'POST',
        body: JSON.stringify({ sku: nextSku, quantity: Number(rawQuantity), reference: reference.trim() || undefined }),
      })
      setSku('')
      setQuantity('1')
      setReference('')
      showToast(t('sales.registered'))
      reload()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('sales.failed'))
    } finally {
      setSaving(false)
    }
  }

  const alerts = data ?? []

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>{t('sales.title')}</h1>
          <p>{t('sales.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={reload}>
            {t('sales.refresh')}
          </button>
          <Link className="btn" to="/integracoes">
            {t('stock.back')}
          </Link>
        </div>
      </header>

      {canEdit && (
        <form className="toolbar" aria-label={t('sales.formTitle')} onSubmit={(event) => void submit(event)}>
          <strong>{t('sales.formTitle')}</strong>
          <input
            className="field"
            aria-label={t('stock.sku')}
            placeholder={t('stock.sku')}
            value={sku}
            onChange={(event) => setSku(event.target.value)}
          />
          <input
            className="field qty-field"
            inputMode="numeric"
            aria-label={t('stock.quantity')}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <input
            className="field"
            aria-label={t('sales.reference')}
            placeholder={t('sales.reference')}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
          <button type="submit" className="btn-primary btn" disabled={saving}>
            {t('sales.submit')}
          </button>
        </form>
      )}

      <QueryStatus loading={loading && !data} error={error} />
      {data && alerts.length === 0 && <p className="muted">{t('sales.empty')}</p>}

      {alerts.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('sales.when')}</th>
                <th>{t('sales.origin')}</th>
                <th>{t('stock.sku')}</th>
                <th>{t('sales.product')}</th>
                <th>{t('stock.quantity')}</th>
                <th>{t('common.status')}</th>
                <th>{t('sales.targets')}</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{formatDateTime(alert.occurredAt)}</td>
                  <td>{saleProviderName(alert.provider)}</td>
                  <td>{alert.sku}</td>
                  <td>{alert.title}</td>
                  <td>{alert.quantity}</td>
                  <td>
                    <StatusBadge kind="plain" value={alert.status} />
                  </td>
                  <td>
                    {alert.targets.length === 0 && <span className="muted">{t('sales.noTargets')}</span>}
                    {alert.targets.map((target) => (
                      <div key={`${target.provider}:${target.itemId}:${target.variationId ?? ''}`}>
                        {saleProviderName(target.provider)} · {target.title}:{' '}
                        <span className={target.ok ? undefined : 'muted'}>{targetResult(target, t('sales.targetFailed'))}</span>
                        {target.restored && <span className="muted"> · {t('sales.restored')}</span>}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
