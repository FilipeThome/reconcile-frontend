import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { QueryStatus } from '../api/hooks'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import type { MessageKey } from '../i18n/locale'

const LIMIT = 20

type StockLocation = {
  type: string
  quantity: number
  storeId: string | null
  networkNodeId: string | null
  editable: boolean
}

type StockVariation = {
  id: number
  label: string
  sku: string | null
  availableQuantity: number
  userProductId: string | null
}

type StockItem = {
  id: string
  title: string
  sku: string | null
  status: string
  availableQuantity: number
  soldQuantity: number
  permalink: string | null
  userProductId: string | null
  editable: boolean
  variations: StockVariation[]
  locations: StockLocation[]
  stockAvailable?: boolean
}

type StockPage = {
  total: number
  offset: number
  limit: number
  items: StockItem[]
}

type Editor = {
  key: string
  label: string
  quantity: number
  variationId?: number
  storeId?: string
  networkNodeId?: string
}

export function editorsOf(item: StockItem): Editor[] {
  if (item.variations.length > 0) {
    return item.variations.map((variation) => ({
      key: `${item.id}:v:${variation.id}`,
      label: variation.label,
      quantity: variation.availableQuantity,
      variationId: variation.id,
    }))
  }
  const warehouses = item.locations.filter((location) => location.type === 'seller_warehouse')
  if (warehouses.length > 0) {
    return warehouses.map((location) => ({
      key: `${item.id}:s:${location.storeId ?? ''}:${location.networkNodeId ?? ''}`,
      label: location.storeId ?? location.type,
      quantity: location.quantity,
      storeId: location.storeId ?? undefined,
      networkNodeId: location.networkNodeId ?? undefined,
    }))
  }
  return [{ key: item.id, label: item.sku ?? item.id, quantity: item.availableQuantity }]
}

function locationName(type: string, translate: (key: MessageKey) => string) {
  if (type === 'meli_facility') return translate('stock.full')
  if (type === 'selling_address') return translate('stock.flex')
  if (type === 'seller_warehouse') return translate('stock.warehouse')
  return type
}

function statusLabel(status: string, translate: (key: MessageKey) => string) {
  if (status === 'active') return translate('stock.active')
  if (status === 'paused') return translate('stock.paused')
  if (status === 'closed') return translate('stock.closed')
  return status
}

export function MercadoLivreStock() {
  const { t } = useLocale()
  const { showToast } = useAppState()
  const { session } = useAuth()
  const role = session?.role?.toLowerCase()
  const canEdit = role === 'admin' || role === 'operador'
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('active')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('active')
  const [offset, setOffset] = useState(0)
  const [page, setPage] = useState<StockPage | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async (nextOffset: number, nextQuery: string, nextStatus: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ offset: String(nextOffset), limit: String(LIMIT) })
      if (nextStatus && nextStatus !== 'all') params.set('status', nextStatus)
      if (nextQuery) params.set('q', nextQuery)
      const result = await api<StockPage>(`/integrations/ml/stock?${params}`)
      setPage(result)
      setDrafts(
        Object.fromEntries(
          result.items.flatMap((item) => editorsOf(item).map((editor) => [editor.key, String(editor.quantity)])),
        ),
      )
      setError(null)
    } catch (err) {
      setPage(null)
      setError(err instanceof Error ? err.message : t('stock.failed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load(0, '', 'active')
  }, [load])

  async function save(item: StockItem, editor: Editor) {
    const raw = (drafts[editor.key] ?? '').trim()
    if (!/^\d+$/.test(raw)) {
      showToast(t('stock.invalidQty'))
      return
    }
    const quantity = Number(raw)
    if (quantity > 99999) {
      showToast(t('stock.invalidQty'))
      return
    }
    setSaving(editor.key)
    try {
      const updated = await api<StockItem>(`/integrations/ml/stock/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          availableQuantity: quantity,
          variationId: editor.variationId,
          storeId: editor.storeId,
          networkNodeId: editor.networkNodeId,
        }),
      })
      setPage((current) => {
        if (!current) return current
        return { ...current, items: current.items.map((row) => (row.id === updated.id ? updated : row)) }
      })
      setDrafts((current) => ({ ...current, [editor.key]: String(quantity) }))
      showToast(t('stock.saved'))
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('stock.failed'))
    } finally {
      setSaving(null)
    }
  }

  const items = page?.items ?? []
  const total = page?.total ?? 0

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>{t('stock.title')}</h1>
          <p>{t('stock.subtitle')}</p>
        </div>
        <div className="header-actions">
          <Link className="btn" to="/integracoes">
            {t('stock.back')}
          </Link>
        </div>
      </header>

      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          const nextQuery = query.trim()
          setAppliedQuery(nextQuery)
          setAppliedStatus(status)
          setOffset(0)
          void load(0, nextQuery, status)
        }}
      >
        <input
          className="field"
          placeholder={t('stock.searchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="select" aria-label={t('stock.status')} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="active">{t('stock.active')}</option>
          <option value="paused">{t('stock.paused')}</option>
          <option value="closed">{t('stock.closed')}</option>
          <option value="all">{t('stock.all')}</option>
        </select>
        <button type="submit" className="btn-primary btn">
          {t('stock.search')}
        </button>
      </form>

      <QueryStatus loading={loading} error={error} />
      {!loading && !error && items.length === 0 && <p className="muted">{t('stock.empty')}</p>}
      {!loading && !error && page && (
        <p className="muted">
          {t('stock.range', { from: total === 0 ? 0 : offset + 1, to: Math.min(offset + LIMIT, total), total })}
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('stock.item')}</th>
                <th>{t('stock.sku')}</th>
                <th>{t('common.status')}</th>
                <th>{t('stock.quantity')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.flatMap((item) =>
                editorsOf(item).map((editor, index) => {
                  const sku = editor.variationId ? item.variations.find((variation) => variation.id === editor.variationId)?.sku : item.sku
                  return (
                    <tr key={editor.key}>
                      <td>
                        {index === 0 && item.permalink ? (
                          <a href={item.permalink} target="_blank" rel="noreferrer">
                            {item.title}
                          </a>
                        ) : (
                          item.title
                        )}
                        {(editor.variationId || editor.storeId) && <div className="muted">{editor.label}</div>}
                        {index === 0 && item.locations.length > 0 && (
                          <div className="muted">
                            {item.locations.map((location) => `${locationName(location.type, t)}: ${location.quantity}`).join(' · ')}
                          </div>
                        )}
                        {index === 0 && item.stockAvailable === false && <div className="muted">{t('stock.unavailable')}</div>}
                        {index === 0 && item.stockAvailable !== false && !item.editable && (
                          <div className="muted">{t('stock.readonly')}</div>
                        )}
                      </td>
                      <td>{sku ?? '—'}</td>
                      <td>{index === 0 ? statusLabel(item.status, t) : ''}</td>
                      <td>
                        {canEdit && item.editable ? (
                          <input
                            className="field qty-field"
                            inputMode="numeric"
                            aria-label={`${t('stock.quantity')} ${item.id} ${editor.label}`}
                            value={drafts[editor.key] ?? ''}
                            onChange={(event) => setDrafts((current) => ({ ...current, [editor.key]: event.target.value }))}
                          />
                        ) : (
                          editor.quantity
                        )}
                      </td>
                      <td>
                        {canEdit && item.editable && (
                          <button
                            type="button"
                            className="btn-primary btn"
                            aria-label={`${t('stock.save')} ${item.id} ${editor.label}`}
                            disabled={saving === editor.key}
                            onClick={() => void save(item, editor)}
                          >
                            {t('stock.save')}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
        </div>
      )}

      {page && !error && (
        <div className="row-actions mt-12">
          <button
            type="button"
            className="btn"
            disabled={offset === 0 || loading}
            onClick={() => {
              const next = Math.max(0, offset - LIMIT)
              setOffset(next)
              void load(next, appliedQuery, appliedStatus)
            }}
          >
            {t('stock.prev')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={loading || offset + LIMIT >= total}
            onClick={() => {
              const next = offset + LIMIT
              setOffset(next)
              void load(next, appliedQuery, appliedStatus)
            }}
          >
            {t('stock.next')}
          </button>
        </div>
      )}
    </section>
  )
}
