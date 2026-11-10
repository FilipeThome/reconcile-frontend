import { useEffect } from 'react'
import { api } from '../api/client'
import { useAppState } from '../context/AppState'
import { t } from '../i18n/locale'
import { SALES_PATH, SALES_REFRESH_MS, saleProviderName } from '../lib/sales'
import type { SaleAlert } from '../types'

export function SaleNotifier({ intervalMs = SALES_REFRESH_MS }: { intervalMs?: number }) {
  const { showToast } = useAppState()

  useEffect(() => {
    let live = true
    let seen: Set<string> | null = null
    const poll = async () => {
      try {
        const alerts = await api<SaleAlert[]>(SALES_PATH)
        if (!live) return
        if (!seen) {
          seen = new Set(alerts.map((alert) => alert.id))
          return
        }
        for (const alert of [...alerts].reverse()) {
          if (seen.has(alert.id)) continue
          seen.add(alert.id)
          if (alert.status !== 'vendido') continue
          showToast(
            t('sales.toast', { marketplace: saleProviderName(alert.provider), sku: alert.sku, quantity: alert.quantity }),
          )
        }
      } catch {
        // polling is best effort
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), intervalMs)
    return () => {
      live = false
      window.clearInterval(timer)
    }
  }, [intervalMs, showToast])

  return null
}
