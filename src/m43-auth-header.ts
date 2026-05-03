import { runProgressiveAuthHeaderInit } from './auth-header-init'
import {
  DEFAULT_API_BASE,
  DEFAULT_AUTH_ORIGIN,
  DEFAULT_HOME_URL,
  DEFAULT_NAV_URL,
  DEFAULT_NAV_DATA_URL,
  normalizeBaseUrl,
  normalizeNavigationUrl,
} from './auth-header-core'

function getLoaderScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') {
    return null
  }
  return document.querySelector('script[data-m43-auth]')
}

function readTopBarInFlow(el: HTMLScriptElement | null): boolean {
  if (!el) {
    return false
  }
  const v = el.getAttribute('data-m43-auth-in-flow')
  return v === 'true' || v === '1' || v === ''
}

function readConfig(el: HTMLScriptElement | null): {
  apiBase: string
  authOrigin: string
  homeUrl: string
  navUrl: string
  navDataUrl: string
  topBarInFlow: boolean
  mount: HTMLElement | null
} {
  if (!el?.dataset) {
    return {
      apiBase: DEFAULT_API_BASE,
      authOrigin: DEFAULT_AUTH_ORIGIN,
      homeUrl: DEFAULT_HOME_URL,
      navUrl: DEFAULT_NAV_URL,
      navDataUrl: DEFAULT_NAV_DATA_URL,
      topBarInFlow: false,
      mount: null,
    }
  }
  const d = el.dataset
  const apiBase = normalizeBaseUrl(d.m43Api ?? DEFAULT_API_BASE, DEFAULT_API_BASE)
  const authOrigin = (d.m43AuthOrigin ?? DEFAULT_AUTH_ORIGIN).trim() || DEFAULT_AUTH_ORIGIN
  const homeUrl = (d.m43HomeUrl ?? '').trim() || DEFAULT_HOME_URL
  const navUrl = normalizeNavigationUrl(d.m43NavUrl)
  const navDataUrl = normalizeNavigationUrl(d.m43NavDataUrl, DEFAULT_NAV_DATA_URL)
  const topBarInFlow = readTopBarInFlow(el)
  const sel = (d.m43AuthMount ?? '').trim()
  let mount: HTMLElement | null = null
  if (sel) {
    try {
      mount = document.querySelector(sel) as HTMLElement | null
    } catch {
      mount = null
    }
  }
  if (!mount) {
    mount = document.querySelector('[data-m43-auth-header]') as HTMLElement | null
  }
  return { apiBase, authOrigin, homeUrl, navUrl, navDataUrl, topBarInFlow, mount }
}

/**
 * Reserves vertical space under a fixed top bar so in-flow content is not covered.
 */
function attachFixedTopBarInset(bar: HTMLElement): void {
  const root = document.documentElement
  const sync = (): void => {
    const h = Math.ceil(bar.getBoundingClientRect().height)
    root.style.setProperty('--m43-top-bar-inset', `${h}px`)
  }
  sync()
  const ro = new ResizeObserver(sync)
  ro.observe(bar)
}

/**
 * Fetches /v1/auth/me, then renders sign-in (with returnUrl) or user + sign out.
 */
export async function initM43AuthHeader(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof location === 'undefined') {
    return
  }
  const el = getLoaderScript()
  const { apiBase, authOrigin, homeUrl, navUrl, navDataUrl, topBarInFlow, mount } = readConfig(el)
  if (!mount) {
    // eslint-disable-next-line no-console
    console.warn(
      '[m43-auth-header] No mount: add a placeholder element with data-m43-auth-header (or set data-m43-auth-mount).',
    )
    return
  }

  const layout = topBarInFlow ? 'in-flow' : 'fixed'

  await runProgressiveAuthHeaderInit(
    {
      mount,
      apiBase,
      authOrigin,
      homeUrl,
      navUrl,
      navDataUrl,
      layout,
      pageHref: location.href,
    },
    {
      onAfterFirstRender: (bar, lay) => {
        if (lay === 'fixed') {
          attachFixedTopBarInset(bar)
        } else {
          document.documentElement.style.removeProperty('--m43-top-bar-inset')
        }
      },
    },
  )
}

void initM43AuthHeader()
