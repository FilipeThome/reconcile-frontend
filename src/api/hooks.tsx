import { useCallback, useEffect, useState } from 'react'
import { api } from './client'

export function useApi<T>(path: string | null) {
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
  }, [path, tick])

  return {
    data,
    loading,
    error,
    reload: useCallback(() => setTick((value) => value + 1), []),
  }
}

export function QueryStatus({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <p className="muted">Carregando dados do backend…</p>
  if (error) return <p className="muted">Não foi possível carregar: {error}</p>
  return null
}
