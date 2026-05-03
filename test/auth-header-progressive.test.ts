// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runProgressiveAuthHeaderInit } from '../src/auth-header-init'
import {
  DEFAULT_API_BASE,
  DEFAULT_AUTH_ORIGIN,
  DEFAULT_HOME_URL,
  DEFAULT_NAV_DATA_URL,
  DEFAULT_NAV_URL,
  fallbackNavigationItems,
} from '../src/auth-header-core'

describe('runProgressiveAuthHeaderInit (progressive nav)', () => {
  let mount: HTMLElement
  let originalFetch: typeof fetch

  beforeEach(() => {
    mount = document.createElement('div')
    document.body.appendChild(mount)
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    mount.remove()
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('renders fallback nav after /me, then upgrades menu when navigation.json resolves', async () => {
    const navJson = JSON.stringify({
      items: [
        { title: 'Alpha', url: 'https://alpha.example/' },
        { title: 'Beta', url: 'https://beta.example/' },
      ],
    })

    let resolveNavFetch!: (value: Response) => void
    const navResponsePromise = new Promise<Response>((resolve) => {
      resolveNavFetch = resolve
    })

    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (u.includes('/v1/auth/me')) {
        return Promise.resolve(new Response(null, { status: 401 }))
      }
      if (u === DEFAULT_NAV_DATA_URL || u.includes('navigation.json')) {
        return navResponsePromise
      }
      return Promise.reject(new Error(`unexpected fetch: ${u}`))
    })

    const initPromise = runProgressiveAuthHeaderInit({
      mount,
      apiBase: DEFAULT_API_BASE,
      authOrigin: DEFAULT_AUTH_ORIGIN,
      homeUrl: DEFAULT_HOME_URL,
      navUrl: DEFAULT_NAV_URL,
      navDataUrl: DEFAULT_NAV_DATA_URL,
      layout: 'in-flow',
      pageHref: 'https://static.example/page',
    })

    expect(globalThis.fetch).toHaveBeenCalled()
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) =>
      typeof c[0] === 'string' ? c[0] : (c[0] as Request).url,
    )
    expect(calls.some((u) => String(u).includes('navigation'))).toBe(true)
    expect(calls.some((u) => String(u).includes('/v1/auth/me'))).toBe(true)

    await initPromise

    const menu = () => mount.querySelector('ul.m43-nav-menu__menu')
    expect(menu()).not.toBeNull()

    const linksBefore = () => [...(menu()?.querySelectorAll('a') ?? [])]
    expect(linksBefore()).toHaveLength(1)
    expect(linksBefore()[0]?.textContent).toContain('All pages')
    expect(linksBefore()[0]?.getAttribute('href')).toBe(fallbackNavigationItems(DEFAULT_NAV_URL)[0]?.url)

    resolveNavFetch(
      new Response(navJson, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect.poll(() => linksBefore().length).toBe(2)

    const linksAfter = linksBefore()
    expect(linksAfter[0]?.querySelector('.m43-nav-menu__label')?.textContent).toBe('Alpha')
    expect(linksAfter[1]?.querySelector('.m43-nav-menu__label')?.textContent).toBe('Beta')
    expect(linksAfter[0]?.getAttribute('href')).toBe('https://alpha.example/')
    expect(linksAfter[1]?.getAttribute('href')).toBe('https://beta.example/')
  })
})
