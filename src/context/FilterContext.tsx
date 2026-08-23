import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_FILTERS, normalizeFilters, periodLabel, toQueryString } from '../lib/filters'
import type { Filters } from '../types'

type FilterValue = {
  filters: Filters
  draft: Filters
  queryString: string
  periodLabel: string
  refreshKey: number
  panelOpen: boolean
  setDraft: (next: Filters | ((current: Filters) => Filters)) => void
  applyDraft: () => void
  resetFilters: () => void
  openPanel: () => void
  closePanel: () => void
  refresh: () => void
}

const FilterContext = createContext<FilterValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS)
  const [refreshKey, setRefreshKey] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)

  const applyDraft = useCallback(() => {
    const next = normalizeFilters(draft)
    setDraft(next)
    setFilters(next)
    setPanelOpen(false)
    setRefreshKey((value) => value + 1)
  }, [draft])

  const resetFilters = useCallback(() => {
    setDraft(DEFAULT_FILTERS)
    setFilters(DEFAULT_FILTERS)
    setPanelOpen(false)
    setRefreshKey((value) => value + 1)
  }, [])

  const openPanel = useCallback(() => {
    setDraft(filters)
    setPanelOpen(true)
  }, [filters])

  const value = useMemo<FilterValue>(
    () => ({
      filters,
      draft,
      queryString: toQueryString(filters),
      periodLabel: periodLabel(filters.from, filters.to),
      refreshKey,
      panelOpen,
      setDraft,
      applyDraft,
      resetFilters,
      openPanel,
      closePanel: () => setPanelOpen(false),
      refresh: () => setRefreshKey((value) => value + 1),
    }),
    [applyDraft, draft, filters, openPanel, panelOpen, refreshKey, resetFilters],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) throw new Error('useFilters deve ser usado dentro de FilterProvider')
  return context
}
