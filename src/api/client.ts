export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'
const SESSION_KEY = 'reconcile.session'
export const SESSION_EXPIRED_EVENT = 'reconcile:unauthorized'

export type Session = {
  token: string
  name: string
  role: string
  tenantId: string
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false
  const session = value as Session
  return Boolean(session.token && session.name && session.tenantId && session.role)
}

export function loadSession(): Session | null {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as unknown
    if (!isSession(session)) {
      clearSession()
      return null
    }
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, raw)
      localStorage.removeItem(SESSION_KEY)
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(session: Session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.removeItem(SESSION_KEY)
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = loadSession()
  const isLogin = path === '/auth/login'
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (!isLogin && session?.token) headers.set('Authorization', `Bearer ${session.token}`)
  if (!isLogin && session?.tenantId) headers.set('X-Tenant-Id', session.tenantId)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Não foi possível conectar ao backend.')
  }

  if (response.status === 401 && !isLogin) {
    clearSession()
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    throw new ApiError(401, 'UNAUTHORIZED', 'Sessão expirada. Entre novamente.')
  }
  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/csv')) {
    return (await response.text()) as T
  }

  let body: unknown = ''
  if (contentType.includes('json')) {
    try {
      body = await response.json()
    } catch {
      throw new ApiError(response.status || 502, 'INVALID_RESPONSE', 'Resposta inválida do backend.')
    }
  } else {
    body = await response.text()
  }

  if (!response.ok) {
    const code = typeof body === 'object' && body ? String((body as { code?: string }).code ?? 'ERROR') : 'ERROR'
    const message =
      typeof body === 'object' && body
        ? String((body as { message?: string }).message ?? 'Falha na API')
        : String(body || 'Falha na API')
    throw new ApiError(response.status, code, message)
  }
  return body as T
}

export function parseComponents(raw: unknown): { label: string; amount: number }[] {
  const rows = (() => {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw) as unknown
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  })()
  return rows.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as { label?: unknown; amount?: unknown }
    if (typeof row.label !== 'string' || row.label.trim() === '') return []
    const amount = Number(row.amount)
    if (!Number.isFinite(amount)) return []
    return [{ label: row.label, amount }]
  })
}
