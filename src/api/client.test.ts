import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  api,
  clearSession,
  loadSession,
  parseComponents,
  saveSession,
  SESSION_EXPIRED_EVENT,
} from './client'
import { mockFetch } from '../test/mockApi'
import { testSession } from '../test/session'

describe('session storage', () => {
  afterEach(() => {
    clearSession()
  })

  it('returns null for missing or corrupt sessions', () => {
    expect(loadSession()).toBeNull()
    sessionStorage.setItem('reconcile.session', '{bad')
    expect(loadSession()).toBeNull()
    sessionStorage.setItem('reconcile.session', JSON.stringify({ name: 'Ana' }))
    expect(loadSession()).toBeNull()
  })

  it('migrates a valid session from localStorage', () => {
    localStorage.setItem('reconcile.session', JSON.stringify(testSession))
    expect(loadSession()).toEqual(testSession)
    expect(sessionStorage.getItem('reconcile.session')).toBeTruthy()
    expect(localStorage.getItem('reconcile.session')).toBeNull()
  })

  it('saves and clears the session', () => {
    saveSession(testSession)
    expect(loadSession()).toEqual(testSession)
    clearSession()
    expect(loadSession()).toBeNull()
  })
})

describe('api', () => {
  afterEach(() => {
    clearSession()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('wraps network failures', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    await expect(api('/health')).rejects.toMatchObject({ code: 'NETWORK', status: 0 })
  })

  it('clears the session and notifies on 401', async () => {
    saveSession(testSession)
    const expired = vi.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, expired)
    vi.stubGlobal(
      'fetch',
      () => Promise.resolve(new Response('nope', { status: 401, headers: { 'Content-Type': 'text/plain' } })),
    )
    await expect(api('/cases')).rejects.toBeInstanceOf(ApiError)
    expect(loadSession()).toBeNull()
    expect(expired).toHaveBeenCalled()
    window.removeEventListener(SESSION_EXPIRED_EVENT, expired)
  })

  it('returns undefined for 204 and parses csv', async () => {
    vi.stubGlobal(
      'fetch',
      () => Promise.resolve(new Response(null, { status: 204 })),
    )
    await expect(api('/noop')).resolves.toBeUndefined()

    vi.stubGlobal(
      'fetch',
      () => Promise.resolve(new Response('a;b', { status: 200, headers: { 'Content-Type': 'text/csv' } })),
    )
    await expect(api<string>('/export')).resolves.toBe('a;b')
  })

  it('rejects invalid json and maps error payloads', async () => {
    vi.stubGlobal(
      'fetch',
      () =>
        Promise.resolve(
          new Response('not-json', { status: 200, headers: { 'Content-Type': 'application/json' } }),
        ),
    )
    await expect(api('/broken')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })

    vi.stubGlobal(
      'fetch',
      () =>
        Promise.resolve(
          new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'sumiu' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    )
    await expect(api('/missing')).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'sumiu' })

    vi.stubGlobal(
      'fetch',
      () => Promise.resolve(new Response('falhou', { status: 500, headers: { 'Content-Type': 'text/plain' } })),
    )
    await expect(api('/plain')).rejects.toMatchObject({ message: 'falhou' })
  })

  it('sends auth headers when a session exists', async () => {
    saveSession(testSession)
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
    )
    vi.stubGlobal('fetch', fetchMock)
    await api('/settings', { body: '{}' })
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')
    expect(headers.get('X-Tenant-Id')).toBe('ten_8f2c1a')
    expect(headers.get('Content-Type')).toBe('application/json')
  })
})

describe('parseComponents', () => {
  it('accepts arrays, json strings and ignores junk', () => {
    expect(parseComponents([{ label: 'Frete', amount: -2 }, { label: 'x' }, null])).toEqual([{ label: 'Frete', amount: -2 }])
    expect(parseComponents('[{"label":"Taxa","amount":"1.5"}]')).toEqual([{ label: 'Taxa', amount: 1.5 }])
    expect(parseComponents('{bad')).toEqual([])
    expect(parseComponents('{"label":"x"}')).toEqual([])
    expect(parseComponents('')).toEqual([])
  })
})
