/**
 * Auth header helpers (shared-api-platform: GET /v1/auth/me, POST /v1/auth/logout,
 * auth SPA reads ?returnUrl= for login). No side effects on import.
 */

export const DEFAULT_API_BASE = 'https://api.michaelj43.dev'
export const DEFAULT_AUTH_ORIGIN = 'https://auth.michaelj43.dev'
/** Portfolio / site root used for the optional “Home” control (hide on that URL). */
export const DEFAULT_HOME_URL = 'https://michaelj43.dev/'
/** Portfolio navigation index opened by the top-bar mark button. */
export const DEFAULT_NAV_URL = 'https://michaelj43.dev/navigation/'

function dlog(msg: string, ...args: unknown[]): void {
  try {
    if (typeof location !== 'undefined' && /(?:[?&])m43debug=1(?:&|$)/.test(location.search)) {
      console.debug(`[m43-auth-header] ${msg}`, ...args)
    }
  } catch {
    /* empty */
  }
}

export function normalizeBaseUrl(raw: string, fallback: string): string {
  const t = raw.trim() || fallback
  return t.replace(/\/$/, '') || fallback
}

export function normalizeNavigationUrl(raw: string | undefined, fallback: string = DEFAULT_NAV_URL): string {
  const t = raw?.trim() || fallback
  try {
    return new URL(t).href
  } catch {
    return fallback
  }
}

/**
 * Auth SPA expects `returnUrl` as a query param; login POST forwards it to the API
 * (see shared-api-platform auth-spa and v1Auth).
 */
export function buildSignInUrl(authOrigin: string, currentPageUrl: string): string {
  const base = normalizeBaseUrl(authOrigin, DEFAULT_AUTH_ORIGIN)
  const u = new URL(base.endsWith('/') ? base : `${base}/`)
  u.searchParams.set('returnUrl', currentPageUrl)
  return u.toString()
}

export type MeResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; reason: 'unauthorized' | 'network' | 'bad_response' }

export async function fetchMe(apiBase: string, fetchImpl: typeof fetch = fetch): Promise<MeResult> {
  const base = normalizeBaseUrl(apiBase, DEFAULT_API_BASE)
  const url = `${base}/v1/auth/me`
  try {
    const r = await fetchImpl(url, { credentials: 'include', method: 'GET' })
    if (r.status === 401) {
      return { ok: false, reason: 'unauthorized' }
    }
    if (!r.ok) {
      dlog('me non-ok', r.status, r.statusText)
      return { ok: false, reason: 'bad_response' }
    }
    const j = (await r.json()) as { user?: { email?: string; id?: string } }
    const email = j.user?.email
    const id = j.user?.id
    if (typeof email !== 'string' || !email || typeof id !== 'string' || !id) {
      return { ok: false, reason: 'bad_response' }
    }
    return { ok: true, email, userId: id }
  } catch (e) {
    dlog('me fetch error', e)
    return { ok: false, reason: 'network' }
  }
}

export async function postLogout(apiBase: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const base = normalizeBaseUrl(apiBase, DEFAULT_API_BASE)
  const url = `${base}/v1/auth/logout`
  try {
    const r = await fetchImpl(url, { credentials: 'include', method: 'POST' })
    return r.ok
  } catch (e) {
    dlog('logout error', e)
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Normalizes pathname for comparing “site root” vs inner pages (trailing slashes, /index.html).
 */
function normalizedSitePath(pathname: string): string {
  let p = pathname.replace(/\/+$/, '') || '/'
  if (p.toLowerCase() === '/index.html') {
    p = '/'
  }
  return p
}

/**
 * When `false`, the optional Home link is hidden (same origin+path as `homeHref`).
 * On any other origin (e.g. static.*) or non-root path on the home origin, returns `true`.
 */
export function shouldShowHomeLink(pageHref: string, homeHref: string = DEFAULT_HOME_URL): boolean {
  let page: URL
  let home: URL
  try {
    page = new URL(pageHref)
    home = new URL(homeHref)
  } catch {
    return true
  }
  if (page.origin !== home.origin) {
    return true
  }
  return normalizedSitePath(page.pathname) !== normalizedSitePath(home.pathname)
}

/** First letter of the local part of the email for an avatar initial (ASCII fallback). */
export function initialFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() ?? ''
  const m = local.match(/[a-z0-9]/i)
  if (m) {
    return m[0].toUpperCase()
  }
  const head = email.trim()[0]
  if (head && /[a-z0-9]/i.test(head)) {
    return head.toUpperCase()
  }
  return '?'
}

export type AuthHeaderRenderOptions = {
  /** Defaults to {@link DEFAULT_HOME_URL}. */
  homeUrl?: string
  /** Defaults to {@link DEFAULT_NAV_URL}. */
  navUrl?: string
  /** Current page URL for Home visibility; defaults to `location.href` in the browser. */
  pageHref?: string
  /**
   * `fixed` (default): viewport-pinned bar; host should load `m43-shell.css` and place the mount early in `body`.
   * `in-flow`: legacy scroll-with-page bar inside normal layout.
   */
  layout?: 'fixed' | 'in-flow'
}

/**
 * Renders a full-width top bar (logo, optional Home, shared-api-platform Log In / profile menu).
 * Replaces `mount`’s children; adds `m43-top-bar` on `mount`.
 */
export function renderAuthHeader(
  mount: HTMLElement,
  me: MeResult,
  signInUrl: string,
  onSignOut: () => void,
  options?: AuthHeaderRenderOptions,
): void {
  mount.classList.add('m43-top-bar')
  const layout = options?.layout ?? 'fixed'
  if (layout === 'in-flow') {
    mount.classList.add('m43-top-bar--in-flow')
  } else {
    mount.classList.remove('m43-top-bar--in-flow')
  }
  mount.innerHTML = ''

  const homeUrl = (options?.homeUrl ?? DEFAULT_HOME_URL).trim() || DEFAULT_HOME_URL
  const navUrl = normalizeNavigationUrl(options?.navUrl)
  const pageHref =
    options?.pageHref ??
    (typeof location !== 'undefined' ? location.href : 'https://example.com/sub/page')
  const showHome = shouldShowHomeLink(pageHref, homeUrl)

  const inner = document.createElement('div')
  inner.className = 'm43-top-bar__inner'

  const navButton = document.createElement('button')
  navButton.type = 'button'
  navButton.className = 'm43-top-bar__logo-button'
  navButton.setAttribute('aria-label', 'Open site navigation')
  navButton.title = 'Navigation'
  navButton.addEventListener('click', () => {
    location.href = navUrl
  })

  const logoMark = document.createElement('span')
  logoMark.className = 'm43-top-bar__logo-mark'
  logoMark.setAttribute('aria-hidden', 'true')
  navButton.appendChild(logoMark)
  inner.appendChild(navButton)

  if (showHome) {
    const home = document.createElement('a')
    home.className = 'm43-button m43-top-bar__home'
    try {
      home.href = new URL(homeUrl).href
    } catch {
      home.href = DEFAULT_HOME_URL
    }
    home.textContent = 'Home'
    inner.appendChild(home)
  }

  const spacer = document.createElement('span')
  spacer.className = 'm43-top-bar__spacer'
  spacer.setAttribute('aria-hidden', 'true')
  inner.appendChild(spacer)

  const auth = document.createElement('div')
  auth.className = 'm43-auth-header'

  if (me.ok) {
    auth.classList.remove('m43-auth-header--signed-out')
    auth.classList.add('m43-auth-header--signed-in')
    const initial = escapeHtml(initialFromEmail(me.email))

    const wrap = document.createElement('div')
    wrap.className = 'm43-auth-user'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'm43-auth-user__trigger m43-auth-user__trigger--avatar'
    btn.setAttribute('aria-haspopup', 'true')
    btn.setAttribute('aria-expanded', 'false')
    btn.setAttribute('aria-label', `Account: ${me.email}. Open menu.`)
    btn.innerHTML = `<span class="m43-auth-user__initial">${initial}</span>`

    const menu = document.createElement('ul')
    menu.className = 'm43-auth-user__menu'
    menu.setAttribute('role', 'menu')
    menu.hidden = true

    const li = document.createElement('li')
    li.setAttribute('role', 'none')
    const out = document.createElement('button')
    out.type = 'button'
    out.className = 'm43-auth-user__item'
    out.setAttribute('role', 'menuitem')
    out.textContent = 'Sign out'
    out.addEventListener('click', () => onSignOut())
    li.appendChild(out)
    menu.appendChild(li)

    function closeMenu(): void {
      menu.hidden = true
      btn.setAttribute('aria-expanded', 'false')
    }

    function openMenu(): void {
      menu.hidden = false
      btn.setAttribute('aria-expanded', 'true')
    }

    function toggleMenu(): void {
      if (menu.hidden) {
        openMenu()
      } else {
        closeMenu()
      }
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleMenu()
    })

    const onDocDown = (e: MouseEvent): void => {
      if (wrap.contains(e.target as Node)) {
        return
      }
      closeMenu()
    }
    document.addEventListener('mousedown', onDocDown)

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu()
        btn.focus()
      }
    })

    wrap.appendChild(btn)
    wrap.appendChild(menu)
    auth.appendChild(wrap)
  } else {
    auth.classList.remove('m43-auth-header--signed-in')
    auth.classList.add('m43-auth-header--signed-out')
    const a = document.createElement('a')
    a.className = 'm43-button m43-button--primary m43-auth-signin'
    a.href = signInUrl
    a.textContent = 'Log In'
    auth.appendChild(a)
  }

  inner.appendChild(auth)
  mount.appendChild(inner)
}
