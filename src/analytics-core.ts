/**
 * Core logic for m43 browser analytics (no side effects on import).
 */

const SESSION_KEY = 'm43_analytics_session_v1'
export const DEFAULT_API_BASE = 'https://api.michaelj43.dev'

export type M43IngestEvent = {
  appId: string
  sessionId: string
  eventType: string
  path: string
  clientTimestamp: number
  context?: Record<string, unknown>
}

export function newSessionId(): string {
  try {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID()
    }
  } catch {
    /* ignore */
  }
  return `m43_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`
}

export function getOrCreateSessionId(storage: Storage): string {
  let id: string | null = null
  try {
    id = storage.getItem(SESSION_KEY)
  } catch {
    return newSessionId()
  }
  if (id && id.length >= 1 && id.length <= 128) {
    return id
  }
  id = newSessionId()
  try {
    storage.setItem(SESSION_KEY, id)
  } catch {
    /* private mode, quota */
  }
  return id
}

export function pathFromLocation(loc: { pathname: string; search: string }): string {
  const p = loc.pathname + loc.search
  if (p.length === 0) {
    return '/'
  }
  if (p.length > 2048) {
    return p.slice(0, 2048)
  }
  return p
}

function isDebugEnabled(): boolean {
  try {
    return typeof location !== 'undefined' && /(?:[?&])m43debug=1(?:&|$)/.test(location.search)
  } catch {
    return false
  }
}

function dlog(msg: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.debug(`[m43-analytics] ${msg}`, ...args)
  }
}

export function parseScriptConfig(
  el: HTMLScriptElement | null,
): { appId: string; apiBase: string; spa: boolean } {
  if (!el?.dataset) {
    return { appId: '', apiBase: DEFAULT_API_BASE, spa: false }
  }
  const d = el.dataset
  const appId = (d.m43App ?? '').trim()
  const raw = (d.m43Api ?? DEFAULT_API_BASE).trim() || DEFAULT_API_BASE
  const apiBase = raw.replace(/\/$/, '') || DEFAULT_API_BASE
  const s = d.m43Spa ?? d.m43spa
  const spa = s === '1' || s === 'true' || s === 'yes'
  return { appId, apiBase, spa }
}

export function buildSingleEventBody(event: M43IngestEvent): string {
  return JSON.stringify({ event })
}

function postIngest(
  apiBase: string,
  appId: string,
  sessionId: string,
  path: string,
  eventType: string,
  context?: Record<string, unknown>,
) {
  const event: M43IngestEvent = {
    appId,
    sessionId,
    eventType,
    path,
    clientTimestamp: Date.now(),
  }
  if (context && Object.keys(context).length > 0) {
    event.context = context
  }
  const body = buildSingleEventBody(event)
  const url = `${apiBase}/analytics/events?v=1`
  dlog('post', { url, path: event.path })

  if (typeof fetch === 'function') {
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      mode: 'cors',
    })
      .then((r) => {
        if (!r.ok) {
          dlog('non-ok', r.status, r.statusText)
        }
      })
      .catch((e: unknown) => dlog('fetch error', e))
    return
  }

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const ok = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    dlog('sendBeacon', ok)
  }
}

function getLoaderScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') {
    return null
  }
  return document.querySelector<HTMLScriptElement>('script[data-m43-app]')
}

let lastPathSent = ''
let lastSentAt = 0

function sendPageviewIfNeeded(
  apiBase: string,
  appId: string,
  session: string,
  path: string,
  baseContext?: Record<string, unknown>,
) {
  const now = Date.now()
  if (path === lastPathSent && now - lastSentAt < 60) {
    dlog('dedupe', path)
    return
  }
  lastPathSent = path
  lastSentAt = now
  postIngest(apiBase, appId, session, path, 'pageview', baseContext)
}

export const M43Analytics = {
  trackPageview(partial?: { path?: string; eventType?: string; context?: Record<string, unknown> }) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }
    const el = getLoaderScript()
    const { appId, apiBase } = parseScriptConfig(el)
    if (!appId) {
      dlog('trackPageview: missing data-m43-app')
      return
    }
    const session = getOrCreateSessionId(window.sessionStorage)
    const path =
      partial?.path ??
      pathFromLocation({ pathname: window.location.pathname, search: window.location.search })
    const eventType = partial?.eventType ?? 'pageview'
    postIngest(apiBase, appId, session, path, eventType, partial?.context)
  },

  getSessionId(): string | null {
    if (typeof window === 'undefined') {
      return null
    }
    try {
      return getOrCreateSessionId(window.sessionStorage)
    } catch {
      return null
    }
  },
}

export function initM43Analytics(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof location === 'undefined') {
    return
  }

  const el = getLoaderScript()
  const { appId, apiBase, spa } = parseScriptConfig(el)
  if (!appId) {
    dlog('init skipped: add data-m43-app to the script tag')
    return
  }

  const session = getOrCreateSessionId(window.sessionStorage)
  let context: Record<string, unknown> | undefined
  try {
    if (document.referrer) {
      context = { referrer: document.referrer.slice(0, 512) }
    }
  } catch {
    /* empty */
  }

  const onReady = () => {
    const path = pathFromLocation({ pathname: location.pathname, search: location.search })
    sendPageviewIfNeeded(apiBase, appId, session, path, context)
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    queueMicrotask(onReady)
  } else {
    document.addEventListener('DOMContentLoaded', onReady, { once: true })
  }

  if (spa) {
    const { pushState, replaceState } = history
    history.pushState = function (this: History, data: unknown, title: string, url?: string | URL | null) {
      const ret = pushState.call(this, data, title, url)
      const path = pathFromLocation({ pathname: location.pathname, search: location.search })
      sendPageviewIfNeeded(apiBase, appId, session, path, context)
      return ret
    }
    history.replaceState = function (this: History, data: unknown, title: string, url?: string | URL | null) {
      const ret = replaceState.call(this, data, title, url)
      const path = pathFromLocation({ pathname: location.pathname, search: location.search })
      sendPageviewIfNeeded(apiBase, appId, session, path, context)
      return ret
    }
    window.addEventListener('popstate', () => {
      const path = pathFromLocation({ pathname: location.pathname, search: location.search })
      sendPageviewIfNeeded(apiBase, appId, session, path, context)
    })
  }
}

export function installGlobalM43(): void {
  ;(globalThis as unknown as { M43Analytics: typeof M43Analytics }).M43Analytics = M43Analytics
}
