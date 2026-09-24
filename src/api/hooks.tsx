import { useCallback, useEffect, useState } from 'react'
import { t } from '../i18n/locale'
import { api } from './client'

export function useApi<T>(path: string | null, refreshKey = 0) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(Boolean(path))
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!path) {
      setData(null)
      setLoading(false)
      return
    }
    let live = true
    setLoading(true)
    api<T>(path)
      .then((result) => {
        if (!live) return
        setData(result)
        setError(null)
      })
      .catch((err: Error) => {
        if (!live) return
        setError(err.message)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [path, tick, refreshKey])

  return {
    data,
    loading,
    error,
    reload: useCallback(() => setTick((value) => value + 1), []),
  }
}

export function QueryStatus({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <p className="muted">{t('query.loading')}</p>
  if (error) return <p className="muted">{t('query.failed', { error })}</p>
  return null
}
