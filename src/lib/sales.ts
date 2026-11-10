import { t } from '../i18n/locale'
import { isOauthProviderId, OAUTH_PROVIDERS } from './oauth'

export const SALES_PATH = '/integrations/sales'
export const SALES_REFRESH_MS = 30_000

export function saleProviderName(provider: string) {
  if (isOauthProviderId(provider)) return OAUTH_PROVIDERS[provider]
  if (provider === 'manual') return t('sales.manual')
  return provider
}
