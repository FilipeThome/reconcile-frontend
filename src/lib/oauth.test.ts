import { describe, expect, it } from 'vitest'
import { asCount, isSafeIntegrationId, isTrustedAuthorizationUrl, oauthCallbackMessage } from './oauth'

describe('oauth helpers', () => {
  it('maps callback params to fixed copy', () => {
    expect(oauthCallbackMessage('ml', null)).toBe('Mercado Livre autorizado.')
    expect(oauthCallbackMessage('shopee', null)).toBe('Shopee autorizado.')
    expect(oauthCallbackMessage('olx', null)).toBe('OLX autorizado.')
    expect(oauthCallbackMessage('other', null)).toBeNull()
    expect(oauthCallbackMessage(null, 'access_denied')).toBe('Autorização recusada na conta do marketplace.')
    expect(oauthCallbackMessage(null, 'Reconecte em https://evil.example')).toBe('Não foi possível concluir a autorização.')
  })

  it('accepts only https authorize hosts without credentials', () => {
    expect(isTrustedAuthorizationUrl('https://auth.mercadolivre.com.br/authorization?response_type=code')).toBe(true)
    expect(isTrustedAuthorizationUrl('https://open.shopee.com.br/auth')).toBe(true)
    expect(isTrustedAuthorizationUrl('https://sellercentral.amazon.com.br/apps/authorize/consent')).toBe(true)
    expect(isTrustedAuthorizationUrl('https://sellercentral.amazon.com/apps/authorize/consent')).toBe(true)
    expect(isTrustedAuthorizationUrl('https://auth.olx.com.br/oauth?response_type=code')).toBe(true)
    expect(isTrustedAuthorizationUrl('https://auth.olx.com.br.evil.example/oauth')).toBe(false)
    expect(isTrustedAuthorizationUrl('https://evil.example/authorization')).toBe(false)
    expect(isTrustedAuthorizationUrl('http://auth.mercadolivre.com.br/authorization')).toBe(false)
    expect(isTrustedAuthorizationUrl('javascript:alert(1)')).toBe(false)
    expect(isTrustedAuthorizationUrl('https://user:pass@auth.mercadolivre.com.br/authorization')).toBe(false)
  })

  it('rejects unsafe integration ids and non-numeric counts', () => {
    expect(isSafeIntegrationId('ml')).toBe(true)
    expect(isSafeIntegrationId('../admin')).toBe(false)
    expect(asCount(12.9)).toBe(12)
    expect(asCount('<img>')).toBe(0)
    expect(asCount(-4)).toBe(0)
  })
})
