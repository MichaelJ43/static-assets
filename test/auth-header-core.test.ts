import { describe, expect, it } from 'vitest'
import {
  buildSignInUrl,
  normalizeBaseUrl,
  DEFAULT_API_BASE,
  DEFAULT_AUTH_ORIGIN,
  DEFAULT_HOME_URL,
  initialFromEmail,
  shouldShowHomeLink,
} from '../src/auth-header-core'

describe('normalizeBaseUrl', () => {
  it('strips trailing slash', () => {
    expect(normalizeBaseUrl('https://api.michaelj43.dev/', DEFAULT_API_BASE)).toBe('https://api.michaelj43.dev')
  })

  it('uses fallback for empty', () => {
    expect(normalizeBaseUrl('', DEFAULT_API_BASE)).toBe(DEFAULT_API_BASE)
  })
})

describe('buildSignInUrl', () => {
  it('appends returnUrl for current page (auth SPA + shared-api-platform)', () => {
    const u = buildSignInUrl('https://auth.michaelj43.dev', 'https://static.michaelj43.dev/v1/m43-shell.css')
    expect(u).toBe(
      'https://auth.michaelj43.dev/?returnUrl=' +
        encodeURIComponent('https://static.michaelj43.dev/v1/m43-shell.css'),
    )
  })

  it('defaults auth origin to DEFAULT_AUTH_ORIGIN', () => {
    const u = buildSignInUrl('', 'https://cardgame.michaelj43.dev/foo')
    expect(u.startsWith(`${DEFAULT_AUTH_ORIGIN}/?returnUrl=`)).toBe(true)
    expect(u).toContain(encodeURIComponent('https://cardgame.michaelj43.dev/foo'))
  })
})

describe('DEFAULT_AUTH_ORIGIN', () => {
  it('matches shared-api-platform dashboard / auth default', () => {
    expect(DEFAULT_AUTH_ORIGIN).toBe('https://auth.michaelj43.dev')
  })
})

describe('DEFAULT_API_BASE', () => {
  it('matches shared API default', () => {
    expect(DEFAULT_API_BASE).toBe('https://api.michaelj43.dev')
  })
})

describe('DEFAULT_HOME_URL', () => {
  it('is the portfolio apex root', () => {
    expect(DEFAULT_HOME_URL).toBe('https://michaelj43.dev/')
  })
})

describe('shouldShowHomeLink', () => {
  const home = 'https://michaelj43.dev/'

  it('hides on apex root', () => {
    expect(shouldShowHomeLink('https://michaelj43.dev/', home)).toBe(false)
    expect(shouldShowHomeLink('https://michaelj43.dev', home)).toBe(false)
  })

  it('hides on /index.html at apex', () => {
    expect(shouldShowHomeLink('https://michaelj43.dev/index.html', home)).toBe(false)
  })

  it('shows on inner paths at apex', () => {
    expect(shouldShowHomeLink('https://michaelj43.dev/projects', home)).toBe(true)
  })

  it('shows on other subdomains', () => {
    expect(shouldShowHomeLink('https://static.michaelj43.dev/', home)).toBe(true)
    expect(shouldShowHomeLink('https://static.michaelj43.dev/v1/', home)).toBe(true)
  })
})

describe('initialFromEmail', () => {
  it('uses first alphanumeric of local part', () => {
    expect(initialFromEmail('foo@example.com')).toBe('F')
    expect(initialFromEmail('Michael@example.com')).toBe('M')
  })

  it('falls back to ? when no suitable character', () => {
    expect(initialFromEmail('@example.com')).toBe('?')
    expect(initialFromEmail('')).toBe('?')
  })
})
