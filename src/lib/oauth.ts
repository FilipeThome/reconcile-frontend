import { t, type MessageKey } from '../i18n/locale'

export const OAUTH_PROVIDERS = {
  ml: 'Mercado Livre',
  shopee: 'Shopee',
  amazon: 'Amazon',
} as const

export type OauthProviderId = keyof typeof OAUTH_PROVIDERS

export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Autorização recusada na conta do marketplace.',
  blocked: 'A autorização foi bloqueada pelo marketplace.',
  invalid_state: 'Sessão de autorização expirada. Tente conectar de novo.',
  missing_code: 'O marketplace não devolveu o código de autorização.',
  not_configured: 'Credenciais OAuth ausentes no servidor.',
  exchange_failed: 'Não foi possível concluir a autorização.',
}

const OAUTH_AUTHORIZE_HOSTS = new Set([
  'auth.mercadolivre.com.br',
  'auth.mercadolibre.com',
  'open.shopee.com.br',
  'partner.shopeemobile.com',
  'sellercentral.amazon.com',
  'sellercentral.amazon.com.br',
])

export function isOauthProviderId(value: string | null | undefined): value is OauthProviderId {
  return Boolean(value && value in OAUTH_PROVIDERS)
}

export function isSafeIntegrationId(id: string) {
  return /^[a-z0-9_-]{1,32}$/i.test(id)
}

export function oauthCallbackMessage(connected: string | null, error: string | null): string | null {
  if (isOauthProviderId(connected)) {
    return t(`oauth.${connected}`)
  }
  if (error) {
    const code = error.trim().toLowerCase()
    const key = `oauth.${code}` as MessageKey
    return key in OAUTH_ERROR_KEYS ? t(key) : t('oauth.exchange_failed')
  }
  return null
}

const OAUTH_ERROR_KEYS = {
  'oauth.access_denied': true,
  'oauth.blocked': true,
  'oauth.invalid_state': true,
  'oauth.missing_code': true,
  'oauth.not_configured': true,
  'oauth.exchange_failed': true,
} as const satisfies Record<string, true>

export function isTrustedAuthorizationUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return false
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && !url.username && !url.password && OAUTH_AUTHORIZE_HOSTS.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function asCount(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(Math.trunc(n), 1_000_000)
}
