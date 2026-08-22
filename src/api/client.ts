export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'
const SESSION_KEY = 'reconcile.session'

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

export function loadSession(): Session | null {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as Session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, raw)
      localStorage.removeItem(SESSION_KEY)
    }
    return session
  } catch {
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
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`)
  if (session?.tenantId) headers.set('X-Tenant-Id', session.tenantId)

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (response.status === 401) {
    clearSession()
    throw new ApiError(401, 'UNAUTHORIZED', 'Sessão expirada. Entre novamente.')
  }
  if (response.status === 204) return undefined as T
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/csv')) {
    return (await response.text()) as T
  }
  const body = contentType.includes('json') ? await response.json() : await response.text()
  if (!response.ok) {
    const code = typeof body === 'object' && body ? String(body.code ?? 'ERROR') : 'ERROR'
    const message = typeof body === 'object' && body ? String(body.message ?? 'Falha na API') : String(body)
    throw new ApiError(response.status, code, message)
  }
  return body as T
}

export function parseComponents(raw: unknown): { label: string; amount: number }[] {
  if (Array.isArray(raw)) return raw as { label: string; amount: number }[]
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as { label: string; amount: number }[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}
